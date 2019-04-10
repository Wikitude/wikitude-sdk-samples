var defaultScaleValue = 0.5;

var previousRotationValue = [];
var previousScaleValue = [];

var oneFingerGestureAllowed = false;

AR.context.on2FingerGestureStarted = function() {
    oneFingerGestureAllowed = false;
};

var World = {
    paths: [
        "assets/christmas_hat.png",
        "assets/police_hat.png",
        "assets/glasses.png",
        "assets/mirror_sunglasses.png",
        "assets/beard_01.png",
        "assets/beard_02.png",
        "assets/beard_03.png"
    ],
    imageTrackables: [],
    overlays: [],
    appearingAnimations: [],
    targetAcquired: false,

    init: function initFn() {
        this.createOverlays();
    },

    createOverlays: function createOverlaysFn() {
        /*
            First a AR.TargetCollectionResource is created with the path to the Wikitude Target Collection(.wtc) file.
            This .wtc file can be created from images using the Wikitude Studio. More information on how to create them
            can be found in the documentation in the TargetManagement section.
            Each target in the target collection is identified by its target name. By using this
            target name, it is possible to create an AR.ImageTrackable for every target in the target collection.
         */
        this.targetCollectionResource = new AR.TargetCollectionResource("assets/face.wtc", {
            onError: World.onError
        });

        /*
            This resource is then used as parameter to create an AR.ImageTracker. Optional parameters are passed as
            object in the last argument. In this case a callback function for the onTargetsLoaded trigger is set. Once
            the tracker loaded all of its target images this callback function is invoked. We also set the callback
            function for the onError trigger which provides a sting containing a description of the error.
         */
        this.tracker = new AR.ImageTracker(this.targetCollectionResource, {
            onTargetsLoaded: World.showInfoBar,
            onError: World.onError
        });

        World.initPositionValues();
        for (var i = 0; i < this.paths.length; i++) {
            World.createOverlayWithIndex(i);
        }

        World.setupAppearingAnimations();
    },

    /* Sets up the initial positions of every draggable. */
    initPositionValues: function() {
        var numberOfOverlays = this.paths.length;

        previousRotationValue = World.fillArray(0.0, numberOfOverlays);
        previousScaleValue = World.fillArray(defaultScaleValue, numberOfOverlays);
    },

    /* Returns an array with "len" occurrences of "value" */
    fillArray: function(value, len) {
        var arr = [];
        for (var i = 0; i < len; i++) {
            arr.push(value);
        }
        return arr;
    },

    /*
        Creates a new draggable AR.ImageDrawable and AR.ImageTrackable.
        The AR.ImageDrawable performs all the changes in rotation, scale and position, while we use the
        AR.ImageTrackable to switch the visibility on and off. initially all the images are switched
        off, so we set enabled to false.
    */
    createOverlayWithIndex: function(index) {
        var imageResource = new AR.ImageResource(this.paths[index], {
            onError: World.onError
        });

        var overlay = new AR.ImageDrawable(imageResource, 1, {
            scale: {
                x: defaultScaleValue,
                y: defaultScaleValue
            },
            onDragBegan: function( /*x, y*/ ) {
                oneFingerGestureAllowed = true;

                return true;
            },
            onDragChanged: function(x, y, intersectionX, intersectionY) {
                if (oneFingerGestureAllowed) {
                    this.translate = {
                        x: intersectionX,
                        y: intersectionY
                    };
                }

                return true;
            },
            onDragEnded: function( /*x, y*/ ) {
                return true;
            },
            onRotationBegan: function( /*angleInDegrees*/ ) {
                return true;
            },
            onRotationChanged: function(angleInDegrees) {
                this.rotate.z = previousRotationValue[index] + angleInDegrees;

                return true;
            },
            onRotationEnded: function( /*angleInDegrees*/ ) {
                previousRotationValue[index] = this.rotate.z;

                return true;
            },
            onScaleBegan: function( /*scale*/ ) {
                return true;
            },
            onScaleChanged: function(scale) {
                var scaleValue = previousScaleValue[index] * scale;
                this.scale = {
                    x: scaleValue,
                    y: scaleValue
                };

                return true;
            },
            onScaleEnded: function( /*scale*/ ) {
                previousScaleValue[index] = this.scale.x;

                return true;
            }
        });

        this.overlays.push(overlay);

        var imageTrackable = new AR.ImageTrackable(this.tracker, "*", {
            drawables: {
                cam: [overlay]
            },
            onImageRecognized: World.imageRecognized,
            onImageLost: World.imageLost,
            onError: World.onError
        });
        imageTrackable.enabled = false;

        this.imageTrackables.push(imageTrackable);
    },

    imageRecognized: function() {
        if (!World.targetAcquired) {
            World.targetAcquired = true;
            document.getElementById("overlayPicker").className = "overlayPicker";

            World.hideInfoBar();
        }
    },

    imageLost: function() {
        if (World.targetAcquired) {
            World.targetAcquired = false;
            document.getElementById("overlayPicker").className = "overlayPickerInactive";
        }
    },

    setupAppearingAnimations: function() {
        for (var i = 0; i < this.overlays.length; i++) {
            this.appearingAnimations[i] = World.createAppearingAnimation(this.overlays[i], defaultScaleValue);
        }
    },

    createAppearingAnimation: function createAppearingAnimationFn(overlay, scale) {
        /*
            The animation scales up the overlay once the target is inside the field of vision. Creating an animation on
            a single property of an object is done using an AR.PropertyAnimation. Since the overlays only need to be
            scaled up on two axis, two animations are needed. These animations are grouped together utilizing an
            AR.AnimationGroup that allows them to play them in parallel.

            Each AR.PropertyAnimation targets one of the two axis and scales the model from 0 to the value passed in
            the scale variable. An easing curve is used to create a more dynamic effect of the animation.
        */
        var sx = new AR.PropertyAnimation(overlay, "scale.x", 0, scale, 1500, {
            type: AR.CONST.EASING_CURVE_TYPE.EASE_OUT_ELASTIC
        });
        var sy = new AR.PropertyAnimation(overlay, "scale.y", 0, scale, 1500, {
            type: AR.CONST.EASING_CURVE_TYPE.EASE_OUT_ELASTIC
        });

        return new AR.AnimationGroup(AR.CONST.ANIMATION_GROUP_TYPE.PARALLEL, [sx, sy]);
    },

    /* Makes an overlay visible by enabling its AR.ImageTrackable. */
    showOverlay: function(index) {
        if (World.targetAcquired) {
            if (!this.imageTrackables[index].enabled) {
                this.imageTrackables[index].enabled = true;

                this.appearingAnimations[index].start();
            }
        }
    },

    /* Resets all overlays to their initial values and disables their AR.ImageTrackables so they become invisible. */
    clearOverlays: function() {

        if (World.targetAcquired) {
            for (var i = 0; i < this.overlays.length; i++) {
                World.resetOverlayWithIndex(i);
            }
            for (var u = 0; u < this.imageTrackables.length; u++) {
                this.imageTrackables[u].enabled = false;
            }
            World.initPositionValues();
        }
    },

    /* Resets the parameters of an overlay to its initial values. */
    resetOverlayWithIndex: function(index) {
        var overlay = this.overlays[index];
        overlay.translate.x = 0.0;
        overlay.translate.y = 0.0;
        overlay.rotate.z = 0.0;
        overlay.scale.x = defaultScaleValue;
        overlay.scale.y = defaultScaleValue;
    },

    /* Takes a screenshot. */
    captureScreen: function captureScreenFn() {
        if (World.targetAcquired) {
            AR.platform.sendJSONObject({
                action: "capture_screen"
            });
        }
    },

    onError: function onErrorFn(error) {
        alert(error);
    },

    hideInfoBar: function hideInfoBarFn() {
        document.getElementById("infoBox").style.display = "none";
    },

    showInfoBar: function worldLoadedFn() {
        document.getElementById("infoBox").style.display = "table";
        document.getElementById("loadingMessage").style.display = "none";
    }
};

World.init();