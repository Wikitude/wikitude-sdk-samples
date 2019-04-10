var World = {
    loaded: false,
    modelRegistry: [],
    rotationRegistry: [],
    dinoSettings: {
        diplodocus: {
            walkTime: 1330,
            scale: 0.4
        },
        spinosaurus: {
            walkTime: 1160,
            scale: 0.004
        },
        triceratops: {
            walkTime: 1990,
            scale: 0.4
        },
        tyrannosaurus: {
            walkTime: 1330,
            scale: 0.4
        }
    },

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
        this.targetCollectionResource = new AR.TargetCollectionResource("assets/dinosaurs.wtc", {
            onError: World.onError
        });

        /*
            This resource is then used as parameter to create an AR.ImageTracker. Optional parameters are passed as
            object in the last argument. In this case a callback function for the onTargetsLoaded trigger is set. Once
            the tracker loaded all of its target images this callback function is invoked. We also set the callback
            function for the onError trigger which provides a sting containing a description of the error.

            To enable simultaneous tracking of multiple targets 'maximumNumberOfConcurrentlyTrackableTargets' has
            to be set.
            to be set.
         */
        this.tracker = new AR.ImageTracker(this.targetCollectionResource, {
            maximumNumberOfConcurrentlyTrackableTargets: 5, // a maximum of 5 targets can be tracked simultaneously
            /*
                Disables extended range recognition.
                The reason for this is that extended range recognition requires more processing power and with multiple
                targets the SDK is trying to recognize targets until the maximumNumberOfConcurrentlyTrackableTargets
                is reached and it may slow down the tracking of already recognized targets.
             */
            extendedRangeRecognition: AR.CONST.IMAGE_RECOGNITION_RANGE_EXTENSION.OFF,
            /* The rotation between targets has to be changed by a minimum of 10° before the callback is triggered. */
            onRotationChangedThreshold: 10,
            onTargetsLoaded: World.showInfoBar,
            onError: World.onError
        });

        /* Pre-load models such that they are available in cache to avoid any slowdown upon first recognition. */
        new AR.Model("assets/models/diplodocus.wt3");
        new AR.Model("assets/models/spinosaurus.wt3");
        new AR.Model("assets/models/triceratops.wt3");
        new AR.Model("assets/models/tyrannosaurus.wt3");

        /*
            Note that this time we use "*" as target name. That means that the AR.ImageTrackable will respond to
            any target that is defined in the target collection. You can use wildcards to specify more complex name
            matchings. E.g. 'target_?' to reference 'target_1' through 'target_9' or 'target*' for any targets
            names that start with 'target'.
         */
        this.dinoTrackable = new AR.ImageTrackable(this.tracker, "*", {
            onImageRecognized: function(target) {
                /* Create 3D model based on which target was recognized. */
                var model = new AR.Model("assets/models/" + target.name + ".wt3", {
                    scale: World.dinoSettings[target.name].scale,
                    rotate: {
                        z: 180
                    },
                    onError: World.onError
                });
                /* Create and start idle animation of the created dino model. */
                var idleAnimation = new AR.ModelAnimation(model, "Idle");
                idleAnimation.onFinish = idleAnimation.start;
                idleAnimation.start();

                World.modelRegistry.push({
                    target: target,
                    model: model,
                    alive: true,
                    idleAnimation: idleAnimation
                });

                /* Adds the model as augmentation for the currently recognized target. */
                this.addImageTargetCamDrawables(target, model);

                target.onRotationChanged = function(rotation, destinationTarget) {
                    /*  Rotation ranges from -180° to 180°. */
                    if (rotation.z < 0) {
                        rotation.z += 360;
                    }
                    /* If dinosaurs are facing each other one should attack. */
                    if (rotation.z > 170 && rotation.z < 190 && target.getDistanceTo(destinationTarget) < 150) {

                        /* Check if animations are/were already started and start them if necessary. */
                        if (World.rotationRegistry.filter(function(obj) {
                                return (obj.first === target && obj.second === destinationTarget) ||
                                    (obj.first === destinationTarget && obj.second === target);
                            }).length === 0) {


                            World.modelRegistry.forEach(function(obj) {
                                if (obj.target === destinationTarget && obj.alive) {

                                    World.rotationRegistry.push({
                                        first: target,
                                        second: destinationTarget
                                    });
                                    obj.alive = false;

                                    idleAnimation.onFinish = function() {
                                        World.moveAnimation(model, target, destinationTarget, true, function() {
                                            World.attackAnimation(model, obj.model, obj.idleAnimation, function() {
                                                World.rotateAnimation(model, target, function() {
                                                    World.moveAnimation(model, target, destinationTarget, false,
                                                        function() {
                                                            World.rotateAnimation(model, target, function() {
                                                                idleAnimation.onFinish = idleAnimation.start;
                                                                idleAnimation.start();
                                                            });
                                                        });
                                                });
                                            });
                                        });
                                    };
                                }
                            });
                        }
                    } else {
                        World.rotationRegistry = World.rotationRegistry.filter(function(obj) {
                            return (obj.first !== target && obj.second !== destinationTarget) ||
                                (obj.first !== destinationTarget && obj.second !== target)
                        });
                    }
                };

                World.calculateGrowth(target.name);
                World.hideInfoBar();
            },
            onImageLost: function(target) {
                World.modelRegistry = World.modelRegistry.filter(function(obj) {
                    return obj.target !== target
                });
                World.rotationRegistry = World.rotationRegistry.filter(function(obj) {
                    return obj.first !== target || obj.second !== target;
                });
                World.calculateGrowth(target.name);
            },
            onError: World.onError
        });
    },

    rotateAnimation: function rotateAnimationFn(model, target, onRotateFinish) {
        var walk = new AR.ModelAnimation(model, "Walk");
        var rzAnimation = new AR.PropertyAnimation(
            model,
            "rotate.z",
            model.rotate.z,
            model.rotate.z + 180,
            World.dinoSettings[target.name].walkTime * 2,
            AR.CONST.EASING_CURVE_TYPE.LINEAR, {
                onFinish: function() {
                    onRotateFinish();
                }
            }
        );
        rzAnimation.start();
        walk.start(2);
    },

    moveAnimation: function moveAnimationFn(model, fromTarget, toTarget, forward, onMoveFinish) {
        var translation = fromTarget.getTranslationTo(toTarget);
        var distance = Math.sqrt(translation.x * translation.x + (translation.y - 0.5) *
            (translation.y - 0.5) + translation.z * translation.z);
        var walkCount = Math.round(distance * 3000 / World.dinoSettings[fromTarget.name].walkTime);
        var walkTime = walkCount * World.dinoSettings[fromTarget.name].walkTime;

        var walk = new AR.ModelAnimation(model, "Walk");

        var xStart = forward ? 0 : translation.x;
        var xEnd = forward ? translation.x : 0;
        var yStart = forward ? 0 : translation.y - 0.5;
        var yEnd = forward ? translation.y - 0.5 : 0;

        var txAnimation = new AR.PropertyAnimation(model, "translate.x", xStart, xEnd, walkTime);
        var tyAnimation = new AR.PropertyAnimation(model, "translate.y", yStart, yEnd, walkTime,
            AR.CONST.EASING_CURVE_TYPE.LINEAR, {
                onFinish: function() {
                    onMoveFinish();
                }
            }
        );

        txAnimation.start();
        tyAnimation.start();
        walk.start(walkCount);
    },

    attackAnimation: function attackAnimationFn(modelAttacker, modelDefender, defenderIdleAnimation, onAttackFinish) {
        var jump = new AR.ModelAnimation(modelAttacker, "Jump", {
            onFinish: function() {
                onAttackFinish();
            }
        });
        new AR.ModelAnimation(modelAttacker, "Attack", {
            onFinish: function() {
                defenderIdleAnimation.onFinish = function() {
                    new AR.ModelAnimation(modelDefender, "Death", {
                        onFinish: function() {
                            jump.start(3);
                        }
                    }).start();
                };
            }
        }).start(3);
    },

    calculateGrowth: function calculateGrowthFn(targetName) {
        var filteredRegistries = World.modelRegistry.filter(function(obj) {
            return obj.target.name === targetName
        });
        var growthFactor = filteredRegistries.length;

        filteredRegistries.forEach(function(entry) {
            entry.model.scale = growthFactor * World.dinoSettings[targetName].scale;
        })
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