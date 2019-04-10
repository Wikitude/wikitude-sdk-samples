var World = {
    loaded: false,
    drawables: [],
    lights: [],
    firetruckRotation: {
        x: 0,
        y: 0,
        z: 0
    },
    firetruckCenter: {
        x: 0,
        y: -0.14,
        z: 0
    },
    firetruckLength: 0.5,
    firetruckHeight: 0.28,

    init: function initFn() {
        World.createOccluder();
        World.createCones();
        World.createLights();
        World.createTracker();
    },

    createOccluder: function createOccluderFn() {
        var occluderScale = 0.0045 * this.firetruckLength;

        this.firetruckOccluder = new AR.Occluder("assets/firetruck_occluder.wt3", {
            onLoaded: World.showInfoBar,
            scale: {
                x: occluderScale,
                y: occluderScale,
                z: occluderScale
            },
            translate: this.firetruckCenter,
            rotate: {
                x: 180
            },
            onError: World.onError
        });
        World.drawables.push(this.firetruckOccluder);
    },

    createCones: function createConesFn() {
        var coneDistance = this.firetruckLength * 0.8;

        var frontLeftCone = World.getCone(-coneDistance, +coneDistance);
        World.drawables.push(frontLeftCone);

        var backLeftCone = World.getCone(+coneDistance, +coneDistance);
        World.drawables.push(backLeftCone);

        var backRightCone = World.getCone(+coneDistance, -coneDistance);
        World.drawables.push(backRightCone);

        var frontRightCone = World.getCone(-coneDistance, -coneDistance);
        World.drawables.push(frontRightCone);
    },

    getCone: function getConeFn(positionX, positionZ) {
        var coneScale = 0.05 * this.firetruckLength;

        return new AR.Model("assets/traffic_cone.wt3", {
            scale: {
                x: coneScale,
                y: coneScale,
                z: coneScale
            },
            translate: {
                x: positionX,
                y: World.firetruckCenter.y,
                z: positionZ
            },
            rotate: {
                x: -90
            },
            onError: World.onError
        });
    },

    createLights: function createLightsFn() {
        var lightPosX = -this.firetruckLength * 0.45;
        var lightPosY = this.firetruckHeight * 0.7;
        var lightPosZ = this.firetruckLength * 0.15;

        var leftLight = World.getLight(lightPosX, lightPosY, lightPosZ);
        World.addLightAnimation(leftLight);
        World.lights.push(leftLight);
        World.drawables.push(leftLight);

        var rightLight = World.getLight(lightPosX, lightPosY, -lightPosZ);
        World.addLightAnimation(rightLight);
        World.lights.push(rightLight);
        World.drawables.push(rightLight);

        this.sirenSound = new AR.Sound("assets/siren.wav", {
            onFinishedPlaying: function() {
                World.setLightsEnabled(false);
            },
            onError: World.onError
        });
        this.sirenSound.load();

        this.lightsButton = new AR.Model("assets/marker.wt3", {
            translate: {
                x: -this.firetruckLength * 0.45,
                y: this.firetruckHeight * 0.7,
                z: 0
            },
            rotate: {
                x: -90
            },
            onClick: function() {
                World.setLightsEnabled(true);
            },
            onError: World.onError
        });
        World.addButtonAnimation(this.lightsButton);
        World.drawables.push(this.lightsButton);
    },

    getLight: function getLightFn(positionX, positionY, positionZ) {
        var lightScale = 0.3 * this.firetruckLength;
        var lightResource = new AR.ImageResource("assets/emergency_light.png", {
            onError: World.onError
        });

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

        var lightShow = new AR.PropertyAnimation(light, "opacity", lowerOpacity, upperOpacity, animationDuration / 2, {
            type: AR.CONST.EASING_CURVE_TYPE.EASE_IN_OUT_SINE
        });

        var lightHide = new AR.PropertyAnimation(light, "opacity", upperOpacity, lowerOpacity, animationDuration / 2, {
            type: AR.CONST.EASING_CURVE_TYPE.EASE_IN_OUT_SINE
        });

        var lightAnimation = new AR.AnimationGroup(AR.CONST.ANIMATION_GROUP_TYPE.SEQUENTIAL, [lightShow, lightHide]);
        lightAnimation.start(-1);
    },

    addButtonAnimation: function addButtonAnimationFn(button) {
        var scaleS = 0.03 * this.firetruckLength;
        var scaleL = 0.04 * this.firetruckLength;
        var scaleDuration = 2000;

        /* X animations */
        var buttonScaleAnimationXOut = new AR.PropertyAnimation(button, "scale.x", scaleS, scaleL, scaleDuration / 2, {
            type: AR.CONST.EASING_CURVE_TYPE.EASE_IN_OUT_SINE
        });
        var buttonScaleAnimationXIn = new AR.PropertyAnimation(button, "scale.x", scaleL, scaleS, scaleDuration / 2, {
            type: AR.CONST.EASING_CURVE_TYPE.EASE_IN_OUT_SINE
        });
        var buttonScaleAnimationX = new AR.AnimationGroup(
            AR.CONST.ANIMATION_GROUP_TYPE.SEQUENTIAL, [buttonScaleAnimationXOut, buttonScaleAnimationXIn]);

        /* Y animations */
        var buttonScaleAnimationYOut = new AR.PropertyAnimation(button, "scale.y", scaleS, scaleL, scaleDuration / 2, {
            type: AR.CONST.EASING_CURVE_TYPE.EASE_IN_OUT_SINE
        });
        var buttonScaleAnimationYIn = new AR.PropertyAnimation(button, "scale.y", scaleL, scaleS, scaleDuration / 2, {
            type: AR.CONST.EASING_CURVE_TYPE.EASE_IN_OUT_SINE
        });
        var buttonScaleAnimationY = new AR.AnimationGroup(
            AR.CONST.ANIMATION_GROUP_TYPE.SEQUENTIAL, [buttonScaleAnimationYOut, buttonScaleAnimationYIn]);

        /* Z animations */
        var buttonScaleAnimationZOut = new AR.PropertyAnimation(button, "scale.z", scaleS, scaleL, scaleDuration / 2, {
            type: AR.CONST.EASING_CURVE_TYPE.EASE_IN_OUT_SINE
        });
        var buttonScaleAnimationZIn = new AR.PropertyAnimation(button, "scale.z", scaleL, scaleS, scaleDuration / 2, {
            type: AR.CONST.EASING_CURVE_TYPE.EASE_IN_OUT_SINE
        });
        var buttonScaleAnimationZ = new AR.AnimationGroup(
            AR.CONST.ANIMATION_GROUP_TYPE.SEQUENTIAL, [buttonScaleAnimationZOut, buttonScaleAnimationZIn]);

        /* Start all animation groups. */
        buttonScaleAnimationX.start(-1);
        buttonScaleAnimationY.start(-1);
        buttonScaleAnimationZ.start(-1);
    },

    setLightsEnabled: function setLightsEnabledFn(enabled) {
        World.lightsButton.enabled = !enabled;

        for (var i = 0; i < World.lights.length; i++) {
            World.lights[i].enabled = enabled;
        }

        if (enabled) {
            World.sirenSound.play();
        } else {
            World.sirenSound.stop();
        }
    },

    createTracker: function createTrackerFn() {
        this.targetCollectionResource = new AR.TargetCollectionResource("assets/firetruck.wto", {
            onError: World.onError
        });

        this.tracker = new AR.ObjectTracker(this.targetCollectionResource, {
            onError: World.onError
        });

        this.objectTrackable = new AR.ObjectTrackable(this.tracker, "*", {
            drawables: {
                cam: World.drawables
            },
            onObjectRecognized: World.objectRecognized,
            onObjectLost: World.objectLost,
            onError: World.onError
        });
    },

    objectRecognized: function objectRecognizedFn() {
        World.hideInfoBar();
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