var World = {
	loaded: false,
	rotating: false,
	trackableVisible: false,
	snapped: false,
	resourcesLoaded: false,
	interactionContainer: 'snapContainer',
	layout: {
		normal: {
			offsetX: 0.35,
			offsetY: 0.45,
			opacity: 0.0,
			carScale: 0.045,
			carTranslateY: 0.05
		},
		snapped: {
			offsetX: 0.45,
			offsetY: 0.45,
			opacity: 0.2,
			carScale: 0.08,
			carTranslateY: 0
		}
	},
	previousDragValue: { x: 0, y: 0 },
	previousScaleValue: 0,
	previousScaleValueButtons: 0,
	previousRotationValue: 0,
	previousTranslateValueRotate: { x: 0, y: 0 },
	previousTranslateValueSnap: { x: 0, y: 0 },
	defaultScale: 0,

	init: function initFn() {
		this.createOverlays();
	},

	createOverlays: function createOverlaysFn() {
		/*
			First an AR.ImageTracker needs to be created in order to start the recognition engine. It is initialized with a AR.TargetCollectionResource specific to the target collection that should be used. Optional parameters are passed as object in the last argument. In this case a callback function for the onTargetsLoaded trigger is set. Once the tracker loaded all its target images, the function worldLoaded() is called.

			Important: If you replace the tracker file with your own, make sure to change the target name accordingly.
			Use a specific target name to respond only to a certain target or use a wildcard to respond to any or a certain group of targets.
		*/
		this.targetCollectionResource = new AR.TargetCollectionResource("assets/tracker.wtc", {
			onLoaded: function () {
				World.resourcesLoaded = true;
				this.loadingStep;
			},
            onError: function(errorMessage) {
            	alert(errorMessage);
            }
		});

		this.tracker = new AR.ImageTracker(this.targetCollectionResource, {
			onTargetsLoaded: this.loadingStep,
            onError: function(errorMessage) {
            	alert(errorMessage);
            }
		});
		
		/*
			3D content within Wikitude can only be loaded from Wikitude 3D Format files (.wt3). This is a compressed binary format for describing 3D content which is optimized for fast loading and handling of 3D content on a mobile device. You still can use 3D models from your favorite 3D modeling tools (Autodesk® Maya® or Blender) but you'll need to convert them into the wt3 file format. The Wikitude 3D Encoder desktop application (Windows and Mac) encodes your 3D source file. You can download it from our website. The Encoder can handle Autodesk® FBX® files (.fbx) and the open standard Collada (.dae) file formats for encoding to .wt3.

			Create an AR.Model and pass the URL to the actual .wt3 file of the model. Additional options allow for scaling, rotating and positioning the model in the scene.

			A function is attached to the onLoaded trigger to receive a notification once the 3D model is fully loaded. Depending on the size of the model and where it is stored (locally or remotely) it might take some time to completely load and it is recommended to inform the user about the loading time.
		*/
		World.modelCar = new AR.Model("assets/car.wt3", {
			onLoaded: this.loadingStep,
			scale: {
				x: 0.0,
				y: 0.0,
				z: 0.0
			},
			translate: {
				x: 0.0,
				y: 0.05,
				z: 0.0
			},
			rotate: {
				z: 335
			},
			onScaleBegan: World.onScaleBegan,
            onScaleChanged: World.onScaleChanged,
            onScaleEnded: function(scale) {
            },
            onDragBegan: function(x, y) {
			},
			onDragChanged: function(x, y) {
				if (World.snapped) {
					var movement = { x:0, y:0 };

					/* Calculate the touch movement between this event and the last one */
					movement.x = World.previousDragValue.x - x;
					movement.y = World.previousDragValue.y - y;

					/* Rotate the car model accordingly to the calculated movement values and the current orientation of the model. */
					this.rotate.y += (Math.cos(this.rotate.z * Math.PI / 180) * movement.x * -1 + Math.sin(this.rotate.z * Math.PI / 180) * movement.y) * 180;
					this.rotate.x += (Math.cos(this.rotate.z * Math.PI / 180) * movement.y + Math.sin(this.rotate.z * Math.PI / 180) * movement.x) * -180;

					World.previousDragValue.x = x;
					World.previousDragValue.y = y;
				}
			},
			onDragEnded: function(x, y) {
				if (World.snapped) {
					World.previousDragValue.x = 0;
					World.previousDragValue.y = 0;
				}
			},
			onRotationBegan: function(angleInDegrees) {
            },
            onRotationChanged: function(angleInDegrees) {
               this.rotate.z = previousRotationValue - angleInDegrees;
            },
            onRotationEnded: function(angleInDegrees) {
               previousRotationValue = this.rotate.z
            }
		});

		/*
			As a next step, an appearing animation is created. For more information have a closer look at the function implementation.
		*/
		this.appearingAnimation = this.createAppearingAnimation(World.modelCar, 0.045);

		/*
			The rotation animation for the 3D model is created by defining an AR.PropertyAnimation for the rotate.roll property.
		*/
		this.rotationAnimation = new AR.PropertyAnimation(World.modelCar, "rotate.z", -25, 335, 10000);
		/*
			Additionally to the 3D model an image that will act as a button is added to the image target. This can be accomplished by loading an AR.ImageResource and creating a drawable from it.
		*/
		var imgRotate = new AR.ImageResource("assets/rotateButton.png");
		World.buttonRotate = new AR.ImageDrawable(imgRotate, 0.2, {
			translate: {
				x: 0.35,
				y: 0.45
			},
			onClick: this.toggleAnimateModel
		});

		var imgSnap = new AR.ImageResource("assets/snapButton.png");
		World.buttonSnap = new AR.ImageDrawable(imgSnap, 0.2, {
			translate: {
				x: -0.35,
				y: -0.45
			},
			onClick: this.toggleSnapping
		});

		/*
			To receive a notification once the image target is inside the field of vision the onImageRecognized trigger of the AR.ImageTrackable is used. In the example the function appear() is attached. Within the appear function the previously created AR.AnimationGroup is started by calling its start() function which plays the animation once.

			To add the AR.ImageDrawable to the image target together with the 3D model both drawables are supplied to the AR.ImageTrackable.
		*/
		this.trackable = new AR.ImageTrackable(this.tracker, "*", {
			drawables: {
				cam: [World.modelCar, World.buttonRotate, World.buttonSnap]
			},
			snapToScreen: {
				snapContainer: document.getElementById('snapContainer')
			},
			onImageRecognized: this.appear,
			onImageLost: this.disappear,
            onError: function(errorMessage) {
            	alert(errorMessage);
            }
		});
	},

	removeLoadingBar: function() {
		if (!World.loaded && World.resourcesLoaded && World.modelCar.isLoaded()) {
			var e = document.getElementById('loadingMessage');
			e.parentElement.removeChild(e);
			World.loaded = true;
		}
	},

	loadingStep: function loadingStepFn() {
		if (World.resourcesLoaded && World.modelCar.isLoaded()) {
			
			if ( World.trackableVisible && !World.appearingAnimation.isRunning() ) {
				World.appearingAnimation.start();
			}
						
			var cssDivLeft = " style='display: table-cell;vertical-align: middle; text-align: right; width: 50%; padding-right: 15px;'";
			var cssDivRight = " style='display: table-cell;vertical-align: middle; text-align: left;'";
			document.getElementById('loadingMessage').innerHTML =
				"<div" + cssDivLeft + ">Scan CarAd ClientTracker Image:</div>" +
				"<div" + cssDivRight + "><img src='assets/car.png'></img></div>";
		}
	},

	createAppearingAnimation: function createAppearingAnimationFn(model, scale) {
		/*
			The animation scales up the 3D model once the target is inside the field of vision. Creating an animation on a single property of an object is done using an AR.PropertyAnimation. Since the car model needs to be scaled up on all three axis, three animations are needed. These animations are grouped together utilizing an AR.AnimationGroup that allows them to play them in parallel.

			Each AR.PropertyAnimation targets one of the three axis and scales the model from 0 to the value passed in the scale variable. An easing curve is used to create a more dynamic effect of the animation.
		*/
		var sx = new AR.PropertyAnimation(model, "scale.x", 0, scale, 1500, {
			type: AR.CONST.EASING_CURVE_TYPE.EASE_OUT_ELASTIC
		});
		var sy = new AR.PropertyAnimation(model, "scale.y", 0, scale, 1500, {
			type: AR.CONST.EASING_CURVE_TYPE.EASE_OUT_ELASTIC
		});
		var sz = new AR.PropertyAnimation(model, "scale.z", 0, scale, 1500, {
			type: AR.CONST.EASING_CURVE_TYPE.EASE_OUT_ELASTIC
		});

		return new AR.AnimationGroup(AR.CONST.ANIMATION_GROUP_TYPE.PARALLEL, [sx, sy, sz]);
	},

	appear: function appearFn() {
		World.removeLoadingBar();
		World.trackableVisible = true;
		if ( World.loaded && !World.snapped ) {
			// Resets the properties to the initial values.
			World.resetModel();
			World.appearingAnimation.start();		
		}
	},
	disappear: function disappearFn() {
		World.trackableVisible = false;
	},

	resetModel: function resetModelFn() {
		World.rotationAnimation.stop();
		World.rotating = false;
		World.modelCar.rotate.x = 0;
		World.modelCar.rotate.y = 0;
		World.modelCar.rotate.z = 335;
	},

	toggleAnimateModel: function toggleAnimateModelFn() {
		if (!World.rotationAnimation.isRunning()) {
			if (!World.rotating) {
				// Starting an animation with .start(-1) will loop it indefinitely.
				World.rotationAnimation.start(-1);
				World.rotating = true;
			} else {
				// Resumes the rotation animation
				World.rotationAnimation.resume();
			}
		} else {
			// Pauses the rotation animation
			World.rotationAnimation.pause();
		}

		return false;
	},

	/*
		This function is used to either snap the trackable onto the screen or to detach it. World.trackable.snapToScreen.enabled is therefore used. Depending on the snap state a new layout for the position and size of certain drawables is set. To allow rotation and scale changes only in the snapped state, event handler are added or removed based on the new snap state.
	*/
	toggleSnapping: function toggleSnappingFn() {

		if (World.appearingAnimation.isRunning()) {
			World.appearingAnimation.stop();	
		}
		World.snapped = !World.snapped;
		World.trackable.snapToScreen.enabled = World.snapped;

		if (World.snapped) {
			World.applyLayout(World.layout.snapped);

		} else {
			World.applyLayout(World.layout.normal);
		}
	},

	/*
		applyLayout is used to define position and scale of certain drawables in the scene for certain states. The different layouts are defined at the top of the World object.
	*/
	applyLayout: function applyLayoutFn(layout) {

		World.buttonRotate.translate.x = layout.offsetX;
		World.buttonRotate.translate.y = layout.offsetY;

		World.buttonSnap.translate.x = -layout.offsetX;
		World.buttonSnap.translate.y = -layout.offsetY;

		World.buttonRotate.scale.x =  1;
		World.buttonRotate.scale.y =  1;
		World.buttonSnap.scale.x =  1;
		World.buttonSnap.scale.y =  1;

		World.modelCar.scale = {
			x: layout.carScale,
			y: layout.carScale,
			z: layout.carScale
		};

		World.defaultScale = layout.carScale;

		World.modelCar.translate = {
			x: 0.0,
			y: layout.carTranslateY,
			z: 0.0
		};
	},
	onScaleBegan: function(scale) {
		if (World.snapped) {
			World.previousScaleValue = World.modelCar.scale.x;
			World.previousScaleValueButtons = World.buttonRotate.scale.x;

			World.previousTranslateValueRotate.x = World.buttonRotate.translate.x;
			World.previousTranslateValueRotate.y = World.buttonRotate.translate.x;

			World.previousTranslateValueSnap.x = World.buttonSnap.translate.x;
			World.previousTranslateValueSnap.y = World.buttonSnap.translate.x;
		}
    },
    onScaleChanged: function(scale) {
    	if (World.snapped) {
           World.modelCar.scale.x = World.previousScaleValue * scale;
           World.modelCar.scale.y = World.modelCar.scale.x;
           World.modelCar.scale.z = World.modelCar.scale.x;

           World.buttonRotate.scale.x =  World.previousScaleValueButtons * scale;
           World.buttonRotate.scale.y =  World.buttonRotate.scale.x;

           World.buttonSnap.scale.x =  World.buttonRotate.scale.x;
           World.buttonSnap.scale.y =  World.buttonRotate.scale.x;

           World.buttonRotate.translate.x = World.previousTranslateValueRotate.x * scale;
           World.buttonRotate.translate.y = World.previousTranslateValueRotate.y * scale;

           World.buttonSnap.translate.x = World.previousTranslateValueSnap.x * scale;
           World.buttonSnap.translate.y = World.previousTranslateValueSnap.y * scale;
   		}
    },
};

World.init();
