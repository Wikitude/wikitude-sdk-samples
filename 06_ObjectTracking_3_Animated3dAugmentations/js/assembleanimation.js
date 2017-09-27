var World = {
	loaded: false,
    occluderCenterZ: -0.12,
    drawables: [],
    lights: [],

    init: function initFn() {
        World.createOccluder();
        World.createCones();
        World.createLights();
        World.createScrewdriver();
        World.createTracker();
    },

    createOccluder: function createOccluderFn() {
        var occluderScale = 0.0057;

        this.firetruckOccluder = new AR.Occluder("assets/firetruck_occluder.wt3", {
            onLoaded: this.loadingStep,
            scale: {
                x: occluderScale,
                y: occluderScale,
                z: occluderScale
            },
            translate: {
                x: -0.25,
                z: -0.3
            },
            rotate: {
                x: 180
            }
        });
        World.drawables.push(this.firetruckOccluder);
    },

    createCones: function createConesFn() {
        var coneDistance = 1.0;

        var frontLeftCone = World.getCone(-coneDistance, 0.0, World.occluderCenterZ + coneDistance);
        World.drawables.push(frontLeftCone);

        var backLeftCone = World.getCone( coneDistance, 0.0, World.occluderCenterZ + coneDistance);
        World.drawables.push(backLeftCone);

        var backRightCone = World.getCone( coneDistance, 0.0, World.occluderCenterZ - coneDistance);
        World.drawables.push(backRightCone);

        var frontRightCone = World.getCone(-coneDistance, 0.0, World.occluderCenterZ - coneDistance);
        World.drawables.push(frontRightCone);
    },

    getCone: function getConeFn(positionX, positionY, positionZ) {
        var coneScale = 0.05;

        return new AR.Model("assets/traffic_cone.wt3", {
            scale: {
                x: coneScale,
                y: coneScale,
                z: coneScale
            },
            translate: {
                x: positionX,
                y: positionY,
                z: positionZ
            },
            rotate: {   
                x: -90
            }
        });
    },

    createLights: function createLightsFn() {
    	var leftLight = World.getLight(-0.6, 0.9, World.occluderCenterZ + 0.2);
        World.addLightAnimation(leftLight);
        World.lights.push(leftLight);
		World.drawables.push(leftLight);

		var rightLight = World.getLight(-0.6, 0.9, World.occluderCenterZ - 0.2);
        World.addLightAnimation(rightLight);
        World.lights.push(rightLight);
		World.drawables.push(rightLight);

        this.sirenSound = new AR.Sound("assets/siren.wav", {
            onError : function(){
                alert(errorMessage);
            },
            onFinishedPlaying : function() {
                World.setLightsEnabled(false);
            }
        });
        this.sirenSound.load();

        this.lightsButton = new AR.Model("assets/marker.wt3", {
            translate: {
                x: -0.6,
                y: 0.9,
                z: World.occluderCenterZ
            },
            rotate: {
                x: -90
            },
            onClick: function() {
                World.setLightsEnabled(true);
            }
        });
        World.addButtonAnimation(this.lightsButton);
        World.drawables.push(this.lightsButton);
    },

    getLight: function getLightFn(positionX, positionY, positionZ) {
        var lightScale = 0.3;
        var lightResource = new AR.ImageResource("assets/emergency_light.png");

        return new AR.ImageDrawable(lightResource, lightScale, {
            translate: {
                x: positionX,
                y: positionY,
                z: positionZ
            },
            rotate: {
                x: 90
            },
            enabled: false
        });
    },

    addLightAnimation: function addLightAnimationFn(light) {
        var animationDuration = 500;
        var lowerOpacity = 0.5;
        var upperOpacity = 1.0;

    	var lightAnimationForward = new AR.PropertyAnimation(light, "opacity", lowerOpacity, upperOpacity, animationDuration/2, {
			type: AR.CONST.EASING_CURVE_TYPE.EASE_IN_OUT_SINE
		});

		var lightAnimationBack = new AR.PropertyAnimation(light, "opacity", upperOpacity, lowerOpacity, animationDuration/2, {
			type: AR.CONST.EASING_CURVE_TYPE.EASE_IN_OUT_SINE
		});

		var lightAnimation = new AR.AnimationGroup(AR.CONST.ANIMATION_GROUP_TYPE.SEQUENTIAL, [lightAnimationForward, lightAnimationBack]);
        lightAnimation.start(-1);
    },

    createScrewdriver: function createScrewdriverFn() {
        var screwdriverScale = 0.04;
        var screwdriverPositionX = -0.52;
        var screwdriverPositionY = 0.24;

        this.screwdriver = new AR.Model("assets/screwdriver.wt3", {
            scale: {
                x: screwdriverScale,
                y: screwdriverScale,
                z: screwdriverScale
            },
            translate: {
                x: screwdriverPositionX,
                y: screwdriverPositionY
            },
            rotate: {
                y: 180
            },
            enabled: false
        });
        World.drawables.push(this.screwdriver);

        var screwScale = screwdriverScale * 0.6;
        this.screw = new AR.Model("assets/screw.wt3", {
            scale: {
                x: screwScale,
                y: screwScale,
                z: screwScale
            },
            translate: {
                x: screwdriverPositionX,
                y: screwdriverPositionY
            },
            enabled: false
        });
        World.drawables.push(this.screw);

        var turningArrowScale = screwdriverScale * 0.2;
        this.turningArrow = new AR.Model("assets/arrow.wt3", {
            scale: {
                x: turningArrowScale,
                y: turningArrowScale,
                z: turningArrowScale
            },
            translate: {
                x: screwdriverPositionX,
                y: screwdriverPositionY,
                z: World.occluderCenterZ + 0.7
            },
            rotate: {
                y: -90
            },
            enabled: false
        });
        World.drawables.push(this.turningArrow);

        this.tireButton = new AR.Model("assets/marker.wt3", {
            translate: {
                x: -0.55,
                y: 0.25,
                z: World.occluderCenterZ + 0.4
            },
            onClick: function() {
                World.runScrewdriverAnimation();
            }
        });
        World.addButtonAnimation(this.tireButton);
        World.drawables.push(this.tireButton);
    },

    addButtonAnimation: function addButtonAnimationFn(button) {
        var smallerScale = 0.03;
        var biggerScale = 0.04;
        var scaleAnimationDuration = 2000;

        // x
        var buttonScaleAnimationXOut = new AR.PropertyAnimation(button, "scale.x", smallerScale, biggerScale, scaleAnimationDuration/2, {
            type: AR.CONST.EASING_CURVE_TYPE.EASE_IN_OUT_SINE
        });
        var buttonScaleAnimationXIn = new AR.PropertyAnimation(button, "scale.x", biggerScale, smallerScale, scaleAnimationDuration/2, {
            type: AR.CONST.EASING_CURVE_TYPE.EASE_IN_OUT_SINE
        });
        var buttonScaleAnimationX = new AR.AnimationGroup(AR.CONST.ANIMATION_GROUP_TYPE.SEQUENTIAL, [buttonScaleAnimationXOut, buttonScaleAnimationXIn]);

        // y
        var buttonScaleAnimationYOut = new AR.PropertyAnimation(button, "scale.y", smallerScale, biggerScale, scaleAnimationDuration/2, {
            type: AR.CONST.EASING_CURVE_TYPE.EASE_IN_OUT_SINE
        });
        var buttonScaleAnimationYIn = new AR.PropertyAnimation(button, "scale.y", biggerScale, smallerScale, scaleAnimationDuration/2, {
            type: AR.CONST.EASING_CURVE_TYPE.EASE_IN_OUT_SINE
        });
        var buttonScaleAnimationY = new AR.AnimationGroup(AR.CONST.ANIMATION_GROUP_TYPE.SEQUENTIAL, [buttonScaleAnimationYOut, buttonScaleAnimationYIn]);

        // z
        var buttonScaleAnimationZOut = new AR.PropertyAnimation(button, "scale.z", smallerScale, biggerScale, scaleAnimationDuration/2, {
            type: AR.CONST.EASING_CURVE_TYPE.EASE_IN_OUT_SINE
        });
        var buttonScaleAnimationZIn = new AR.PropertyAnimation(button, "scale.z", biggerScale, smallerScale, scaleAnimationDuration/2, {
            type: AR.CONST.EASING_CURVE_TYPE.EASE_IN_OUT_SINE
        });
        var buttonScaleAnimationZ = new AR.AnimationGroup(AR.CONST.ANIMATION_GROUP_TYPE.SEQUENTIAL, [buttonScaleAnimationZOut, buttonScaleAnimationZIn]);

        // start all animation groups
        buttonScaleAnimationX.start(-1);
        buttonScaleAnimationY.start(-1);
        buttonScaleAnimationZ.start(-1);
    },

    runScrewdriverAnimation: function runScrewdriverAnimationFn() {
        World.setScrewdriverEnabled(true);

        var animationDuration = 2000;

        var translateDistance = 0.2;
        var screwdriverZOffset = World.occluderCenterZ + 1.0;

        var screwdriverTranslateAnimation = new AR.PropertyAnimation(World.screwdriver, "translate.z", screwdriverZOffset, screwdriverZOffset + translateDistance, animationDuration, {}, {
            onFinish: function() {
                World.setScrewdriverEnabled(false);
            }
        });

        var screwZOffset = screwdriverZOffset - 0.65;
        var screwTranslateAnimation = new AR.PropertyAnimation(World.screw, "translate.z", screwZOffset, screwZOffset + translateDistance, animationDuration);

        var arrowRotationAnimation = new AR.PropertyAnimation(World.turningArrow, "rotate.z", 0, 360, animationDuration);

        var animationGroup = new AR.AnimationGroup(AR.CONST.ANIMATION_GROUP_TYPE.PARALLEL, [screwdriverTranslateAnimation, screwTranslateAnimation, arrowRotationAnimation]);
        animationGroup.start();
    },

    setScrewdriverEnabled: function setScrewdriverEnabledFn(enabled) {
        World.tireButton.enabled = !enabled;

        World.screwdriver.enabled = enabled;
        World.screw.enabled = enabled;
        World.turningArrow.enabled = enabled;
    },

    setLightsEnabled: function setLightsEnabledFn(enabled) {
        World.lightsButton.enabled = !enabled;

        for (var i = 0; i < World.lights.length; i++) {
            World.lights[i].enabled = enabled;
        }

        if (enabled) {
            World.sirenSound.play();
        }
        else {
            World.sirenSound.stop();
        }
    },

    createTracker: function createTrackerFn() {
        this.targetCollectionResource = new AR.TargetCollectionResource("assets/firetruck.wto", {
        });

        this.tracker = new AR.ObjectTracker(this.targetCollectionResource, {
            onError: function(errorMessage) {
                alert(errorMessage);
            }
        });
        
        this.objectTrackable = new AR.ObjectTrackable(this.tracker, "*", {
            drawables: {
                cam: World.drawables
            },
            onObjectRecognized: this.objectRecognized,
            onObjectLost: this.objectLost,
            onError: function(errorMessage) {
                alert(errorMessage);
            }
        });
    },

    objectRecognized: function objectRecognizedFn() {
    	World.removeLoadingBar();
    	World.setAugmentationsEnabled(true);
    },

    objectLost: function objectLostFn() {
    	World.setAugmentationsEnabled(false);
    },

    setAugmentationsEnabled: function setAugmentationsEnabledFn(enabled) {
    	for (var i = 0; i < World.drawables.length; i++) {
    		World.drawables[i].enabled = enabled;
    	}
        World.setLightsEnabled(false);
        World.setScrewdriverEnabled(false);
    },

    removeLoadingBar: function removeLoadingBarFn() {
		if (!World.loaded && World.firetruckOccluder.isLoaded()) {
			var e = document.getElementById('loadingMessage');
			e.parentElement.removeChild(e);
			World.loaded = true;
		}
	},

    loadingStep: function loadingStepFn() {
		if (World.firetruckOccluder.isLoaded()) {
			var cssDivLeft = " style='display: table-cell;vertical-align: middle; text-align: right; width: 50%; padding-right: 15px;'";
			var cssDivRight = " style='display: table-cell;vertical-align: middle; text-align: left;'";
			document.getElementById('loadingMessage').innerHTML =
				"<div" + cssDivLeft + ">Scan Firetruck:</div>" +
				"<div" + cssDivRight + "><img src='assets/firetruck_image.png'></img></div>";
		}
	}
};

World.init();