var rotationValues = [];
var scaleValues = [];

var oneFingerGestureAllowed = false;

/*
    This global callback can be utilized to react on the transition from and to 2 finger gestures; specifically, we
    disallow the drag gesture in this case to ensure an intuitive experience.
*/
AR.context.on2FingerGestureStarted = function() {
    oneFingerGestureAllowed = false;
};

var World = {

    drawables: [],

    init: function initFn() {
        var message = "Running without platform assisted tracking (ARKit or ARCore).";

        this.showUserInstructions(message);
        this.createOverlays();
    },

    createOverlays: function createOverlaysFn() {
        var crossHairsBlueImage = new AR.ImageResource("assets/crosshairs_blue.png");
        this.crossHairsBlueDrawable = new AR.ImageDrawable(crossHairsBlueImage, 1.0);

        this.tracker = new AR.InstantTracker({
            /*
                Device height needs to be as accurate as possible to have an accurate scale returned by the Wikitude
                SDK.
             */
            deviceHeight: 1.0,
            onError: World.onError,
            smartEnabled: false
        });

        this.instantTrackable = new AR.InstantTrackable(this.tracker, {
            drawables: {
                cam: World.crossHairsBlueDrawable
            },
            onTrackingStarted: function onTrackingStartedFn() {
                /* Do something when tracking is started (recognized). */
            },
            onTrackingStopped: function onTrackingStoppedFn() {
                /* Do something when tracking is stopped (lost). */
            },
            onError: World.onError
        });
    },

    loadExistingInstantTarget: function loadExistingInstantTargetFn() {
        AR.platform.sendJSONObject({
            action: "load_existing_instant_target"
        });
    },

    /* Called from platform specific part of the sample */
    loadExistingInstantTargetFromUrl: function loadExistingInstantTargetFromUrlFn(url, augmentations) {
        var mapResource = new AR.TargetCollectionResource(url);
        this.tracker.loadExistingInstantTarget(mapResource, function() {

            World.instantTrackable.drawables.removeCamDrawable(World.drawables);
            World.drawables.forEach(function(drawable) {
                drawable.destroy();
            });
            World.drawables = [];
            augmentations.forEach(function(model) {
                var modelIndex = rotationValues.length;

                rotationValues[modelIndex] = model.rotate.z;
                scaleValues[modelIndex] = model.scale.x;

                World.drawables.push(new AR.Model(model.uri, {
                    translate: model.translate,
                    rotate: model.rotate,
                    scale: model.scale,
                    onDragBegan: function() {
                        oneFingerGestureAllowed = true;
                    },
                    onDragChanged: function(relativeX, relativeY, intersectionX, intersectionY) {
                        if (oneFingerGestureAllowed) {
                            /*
                                We recommend setting the entire translate property rather than its individual components
                                as the latter would cause several call to native, which can potentially lead to
                                performance issues on older devices. The same applied to the rotate and scale property.
                            */
                            this.translate = {
                                x: intersectionX,
                                y: intersectionY
                            };
                        }
                    },
                    onRotationChanged: function(angleInDegrees) {
                        this.rotate.z = rotationValues[modelIndex] - angleInDegrees;
                    },
                    onRotationEnded: function() {
                        rotationValues[modelIndex] = this.rotate.z
                    },
                    onScaleChanged: function(scale) {
                        var scaleValue = scaleValues[modelIndex] * scale;
                        this.scale = {
                            x: scaleValue,
                            y: scaleValue,
                            z: scaleValue
                        };
                    },
                    onScaleEnded: function() {
                        scaleValues[modelIndex] = this.scale.x;
                    },
                    onError: World.onError
                }))
            });
            World.instantTrackable.drawables.addCamDrawable(World.drawables);
            alert("Loading was successful");
        }, function(error) {
            alert("Loading failed: " + error);
        }, {
            expansionPolicy: AR.CONST.INSTANT_TARGET_EXPANSION_POLICY.ALLOW_EXPANSION
        })
    },

    onError: function onErrorFn(error) {
        /* onError might be called from native platform code and some devices require a delayed scheduling of the alert to get it focused. */
        setTimeout(function() {
            alert(error);
        }, 0);
    },

    showUserInstructions: function showUserInstructionsFn(message) {
        document.getElementById('loadingMessage').innerHTML = message;
    }
};

World.init();