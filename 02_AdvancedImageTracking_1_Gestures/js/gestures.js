var defaultScaleValue = 0.5;

var previousDragValueX = [];
var previousDragValueY = [];
var previousRotationValue = [];
var previousScaleValue = [];

var oneFingerGestureAllowed = false;

AR.context.on2FingerGestureStarted = function() {
    oneFingerGestureAllowed = false;
}

var World = {
	loaded: false,
	paths: ["assets/christmas_hat.png", "assets/police_hat.png", "assets/glasses.png", "assets/mirror_sunglasses.png", "assets/beard_01.png", "assets/beard_02.png", "assets/beard_03.png"],
	imageTrackables: [],
	overlays: [],
	appearingAnimations: [],
	targetAcquired: false,

	init: function initFn() {
		this.createOverlays();
	},

	createOverlays: function createOverlaysFn() {
		/*
		    First an AR.ImageTracker needs to be created in order to start the recognition engine. It is initialized with a AR.TargetCollectionResource specific to the target collection that should be used. Optional parameters are passed as object in the last argument. In this case a callback function for the onTargetsLoaded trigger is set. Once the tracker loaded all its target images, the function worldLoaded() is called.

		    Important: If you replace the tracker file with your own, make sure to change the target name accordingly.
		    Use a specific target name to respond only to a certain target or use a wildcard to respond to any or a certain group of targets.
		*/
		this.targetCollectionResource = new AR.TargetCollectionResource("assets/face.wtc", {
			onLoaded: this.worldLoaded,
            onError: function(errorMessage) {
            	alert(errorMessage);
            }
		});

		this.tracker = new AR.ImageTracker(this.targetCollectionResource, {
		    onTargetsLoaded: this.worldLoaded,
            onError: function(errorMessage) {
            	alert(errorMessage);
            }
		});

        World.initPositionValues();
        for (var i = 0; i < this.paths.length; i++) {
        	World.createOverlayWithIndex(i);
        }

        World.setupAppearingAnimations();
	},

	/*
		sets up the initial positions of every draggable
	*/
    initPositionValues: function () {
    	var numberOfOverlays = this.paths.length;

    	previousDragValueX = World.fillArray(0.0, numberOfOverlays);
    	previousDragValueY = World.fillArray(0.0, numberOfOverlays);
    	previousRotationValue = World.fillArray(0.0, numberOfOverlays);
    	previousScaleValue = World.fillArray(defaultScaleValue, numberOfOverlays);
    },

    /*
    	returns an array with "len" occurrences of "value"
    */
    fillArray: function (value, len) {
    	var arr = [];
    	for (i = 0 ; i < len ; i++) {
    		arr.push(value);
    	}
    	return arr;
    },

    /*
		creates a new draggable and adds its overlay and imageTrackable to their respective arrays.
		the overlay performs all the changes in rotation, scale and position, while we use the
		imageTrackable to switch the visibility on and off. initially all the images are switched
		off, so we set enabled to false.
    */
    createOverlayWithIndex: function (index) {
    	var imageResource = new AR.ImageResource(this.paths[index]);

    	var overlay = new AR.ImageDrawable(imageResource, 1, {
			scale: {
				x: defaultScaleValue,
				y: defaultScaleValue
			},
			onDragBegan: function(x, y) {
				oneFingerGestureAllowed = true;
			
				return true;
			},
			onDragChanged: function(x, y) {
				if (oneFingerGestureAllowed) {
					this.translate = {x:previousDragValueX[index] + x, y:previousDragValueY[index] - y};
				}
				
				return true;
			},
			onDragEnded: function(x, y) {
				previousDragValueX[index] = this.translate.x;
				previousDragValueY[index] = this.translate.y;
				
				return true;
			},
            onRotationBegan: function(angleInDegrees) {
            	return true;
            },
            onRotationChanged: function(angleInDegrees) {
               this.rotate.z = previousRotationValue[index] + angleInDegrees;
               
               return true;
            },
            onRotationEnded: function(angleInDegrees) {
               previousRotationValue[index] = this.rotate.z;
               
               return true;
            },
            onScaleBegan: function(scale) {
            	return true;
            },
            onScaleChanged: function(scale) {
               var scaleValue = previousScaleValue[index] * scale;
               this.scale = {x: scaleValue, y: scaleValue};
               
               return true;
            },
            onScaleEnded: function(scale) {
               previousScaleValue[index] = this.scale.x;
               
               return true;
            }
		});

		this.overlays.push(overlay);

		var imageTrackable = new AR.ImageTrackable(this.tracker, "*", {
			drawables: {
				cam: [overlay]
			},
			onImageRecognized: this.imageRecognized,
			onImageLost: this.imageLost,
            onError: function(errorMessage) {
            	alert(errorMessage);
            }
		});
		imageTrackable.enabled = false;

		this.imageTrackables.push(imageTrackable);
    },

    imageRecognized: function() {
    	if (!World.targetAcquired) {
    		World.targetAcquired = true;
    		document.getElementById("overlayPicker").className = "overlayPicker";

    		World.removeLoadingBar();
    	}
    },

    imageLost: function() {
    	if (World.targetAcquired) {
    		World.targetAcquired = false;
    		document.getElementById("overlayPicker").className = "overlayPickerInactive";
    	}
    },

    removeLoadingBar: function() {
		if (!World.loaded) {
			var e = document.getElementById('loadingMessage');
			e.parentElement.removeChild(e);
			World.loaded = true;
		}
	},

    setupAppearingAnimations: function () {
    	for (var i = 0; i < this.overlays.length; i++) {
    		this.appearingAnimations[i] = World.createAppearingAnimation(this.overlays[i], defaultScaleValue);
    	}
    },

    createAppearingAnimation: function createAppearingAnimationFn(overlay, scale) {
		/*
			The animation scales up the overlay once the target is inside the field of vision. Creating an animation on a single property of an object is done using an AR.PropertyAnimation. Since the overlays only need to be scaled up on two axis, two animations are needed. These animations are grouped together utilizing an AR.AnimationGroup that allows them to play them in parallel.

			Each AR.PropertyAnimation targets one of the two axis and scales the model from 0 to the value passed in the scale variable. An easing curve is used to create a more dynamic effect of the animation.
		*/
		var sx = new AR.PropertyAnimation(overlay, "scale.x", 0, scale, 1500, {
			type: AR.CONST.EASING_CURVE_TYPE.EASE_OUT_ELASTIC
		});
		var sy = new AR.PropertyAnimation(overlay, "scale.y", 0, scale, 1500, {
			type: AR.CONST.EASING_CURVE_TYPE.EASE_OUT_ELASTIC
		});

		return new AR.AnimationGroup(AR.CONST.ANIMATION_GROUP_TYPE.PARALLEL, [sx, sy]);
	},

    /*
    	makes an overlay visible by enabling its imageTrackable
    */
	showOverlay: function (index) {
		if (World.targetAcquired) {
			if (!this.imageTrackables[index].enabled) {
				this.imageTrackables[index].enabled = true;

				this.appearingAnimations[index].start();
			}
		}
	},

	/*
		resets all overlays to their initial values and disables their imageTrackables so they become invisible
	*/
	clearOverlays: function () {

		if (World.targetAcquired) {
			for (var i = 0; i < this.overlays.length; i++) {
			World.resetOverlayWithIndex(i);
			}
			for (var i = 0; i < this.imageTrackables.length; i++) {
				this.imageTrackables[i].enabled = false;
			}
			World.initPositionValues();
		}
	},

	/*
		resets the parameters of an overlay to its initial values
	*/
	resetOverlayWithIndex: function (index) {
		var overlay = this.overlays[index];
		overlay.translate.x = 0.0;
		overlay.translate.y = 0.0;
		overlay.rotate.z = 0.0;
		overlay.scale.x = defaultScaleValue;
		overlay.scale.y = defaultScaleValue;
	},

	/*
		takes a screenshot
	*/
	captureScreen: function captureScreenFn() {
		if (World.loaded && World.targetAcquired) {
			AR.platform.sendJSONObject({
				action: "capture_screen"
			});
		}
	},

	worldLoaded: function worldLoadedFn() {
		var cssDivLeft = " style='display: table-cell;vertical-align: middle; text-align: right; width: 50%; padding-right: 15px;'";
		var cssDivRight = " style='display: table-cell;vertical-align: middle; text-align: left;'";
		document.getElementById('loadingMessage').innerHTML =
			"<div" + cssDivLeft + ">Scan Target &#35;1 (Target images):</div>" +
			"<div" + cssDivRight + ">" +
			"<img src='assets/target.jpg'></img> " +
			"</div>";
	}
};

World.init();
