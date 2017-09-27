var World = {
    loaded: false,
    modelRegistry: [],
    rotationRegistry: [],
    dinoSettings: {
        diplodocus: {walkTime: 1330, scale: 0.4},
        spinosaurus: {walkTime: 1160, scale: 0.004},
        triceratops: {walkTime: 1990, scale: 0.4},
        tyrannosaurus: {walkTime: 1330, scale: 0.4}
    },

    init: function initFn() {
        this.createOverlays();
    },

    createOverlays: function () {
        /*
         First an AR.ImageTracker needs to be created in order to start the recognition engine. It is initialized with a AR.TargetCollectionResource specific to the target collection that should be used. Optional parameters are passed as object in the last argument. In this case a callback function for the onTargetsLoaded trigger is set. Once the tracker loaded all its target images, the function worldLoaded() is called.

         Important: If you replace the tracker file with your own, make sure to change the target name accordingly.
         Use a specific target name to respond only to a certain target or use a wildcard to respond to any or a certain group of targets.
         */
        var targetCollectionResource = new AR.TargetCollectionResource("assets/dinosaurs.wtc");

        /*
         To enable simultaneous tracking of multiple targets 'maximumNumberOfConcurrentlyTrackableTargets' has to be defined.
         */
        var tracker = new AR.ImageTracker(targetCollectionResource, {
            maximumNumberOfConcurrentlyTrackableTargets: 5, // a maximum of 5 targets can be tracked simultaneously
            /*
             Disables extended range recognition.
             The reason for this is that extended range recognition requires more processing power and with multiple targets
             the SDK is trying to recognize targets until the maximumNumberOfConcurrentlyTrackableTargets is reached and it
             may slow down the tracking of already recognized targets.
             */
            extendedRangeRecognition: AR.CONST.IMAGE_RECOGNITION_RANGE_EXTENSION.OFF,
            onRotationChangedThreshold: 10, // The rotation between targets has to be changed by a minimum of 10° before the callback is triggered.
            onTargetsLoaded: this.worldLoaded,
            onError: function (errorMessage) {
                alert(errorMessage);
            }
        });

        /*
         Pre-load models such that they are available in cache to avoid any
         initial slowdown upon first recognition.
         */
        new AR.Model("assets/models/diplodocus.wt3");
        new AR.Model("assets/models/spinosaurus.wt3");
        new AR.Model("assets/models/triceratops.wt3");
        new AR.Model("assets/models/tyrannosaurus.wt3");

        new AR.ImageTrackable(tracker, "*", {
            onImageRecognized: function (target) {
                /*
                 Create 3D model based on which target was recognized.
                 */
                var model = new AR.Model("assets/models/" + target.name + ".wt3", {
                    scale: World.dinoSettings[target.name].scale,
                    rotate: {
                        z: 180
                    }
                });
                /*
                 Create and start idle animation of the created dino model.
                 */
                var idleAnimation = new AR.ModelAnimation(model, "Idle");
                idleAnimation.onFinish = idleAnimation.start;
                idleAnimation.start();

                World.modelRegistry.push({target: target, model: model, alive: true, idleAnimation: idleAnimation});

                /*
                 Adds the model as augmentation for the currently recognized target.
                 */
                this.addImageTargetCamDrawables(target, model);

                target.onRotationChanged = function (rotation, destinationTarget) {
                    // rotation ranges from -180° to 180°
                    if (rotation.z < 0) {
                        rotation.z += 360;
                    }
                    /*
                     If dinosaurs are facing each other one should attack.
                     */
                    if (rotation.z > 170 && rotation.z < 190 && target.getDistanceTo(destinationTarget) < 150) {

                        /*
                         Check if animations are/were already started and start them if necessary.
                         */
                        if (World.rotationRegistry.filter(function (obj) {
                                return (obj.first == target && obj.second == destinationTarget) ||
                                    (obj.first == destinationTarget && obj.second == target);
                            }).length == 0) {


                            World.modelRegistry.forEach(function (obj) {
                                if (obj.target == destinationTarget && obj.alive) {

                                    World.rotationRegistry.push({first: target, second: destinationTarget});
                                    obj.alive = false;

                                    idleAnimation.onFinish = function () {
                                        World.moveAnimation(model, target, destinationTarget, true, function () {
                                            World.attackAnimation(model, obj.model, obj.idleAnimation, function () {
                                                World.rotateAnimation(model, target, function () {
                                                    World.moveAnimation(model, target, destinationTarget, false, function () {
                                                        World.rotateAnimation(model, target, function () {
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
                        World.rotationRegistry = World.rotationRegistry.filter(function (obj) {
                            return (obj.first != target && obj.second != destinationTarget) ||
                                (obj.first != destinationTarget && obj.second != target)
                        });
                    }
                };

                World.calculateGrowth(target.name);
                World.removeLoadingBar();
            },
            onImageLost: function (target) {
                World.modelRegistry = World.modelRegistry.filter(function (obj) {
                    return obj.target != target
                });
                World.rotationRegistry = World.rotationRegistry.filter(function (obj) {
                    return obj.first != target || obj.second != target;
                });
                World.calculateGrowth(target.name);
            },
            onError: function (errorMessage) {
                alert(errorMessage);
            }
        });
    },

    rotateAnimation: function (model, target, onRotateFinish) {
        var walk = new AR.ModelAnimation(model, "Walk");
        var rzAnimation = new AR.PropertyAnimation(model, "rotate.z", model.rotate.z, model.rotate.z + 180, World.dinoSettings[target.name].walkTime * 2, AR.CONST.EASING_CURVE_TYPE.LINEAR, {
            onFinish: function () {
                onRotateFinish();
            }
        });
        rzAnimation.start();
        walk.start(2);
    },

    moveAnimation: function (model, fromTarget, toTarget, forward, onMoveFinish) {
        var translation = fromTarget.getTranslationTo(toTarget);
        var distance = Math.sqrt(translation.x * translation.x + (translation.y - 0.5) * (translation.y - 0.5) + translation.z * translation.z);
        var walkCount = Math.round(distance * 3000 / World.dinoSettings[fromTarget.name].walkTime);
        var walkTime = walkCount * World.dinoSettings[fromTarget.name].walkTime;

        var walk = new AR.ModelAnimation(model, "Walk");

        var xStart = forward ? 0 : translation.x;
        var xEnd = forward ? translation.x : 0;
        var yStart = forward ? 0 : translation.y - 0.5;
        var yEnd = forward ? translation.y - 0.5 : 0;

        var txAnimation = new AR.PropertyAnimation(model, "translate.x", xStart, xEnd, walkTime);
        var tyAnimation = new AR.PropertyAnimation(model, "translate.y", yStart, yEnd, walkTime, AR.CONST.EASING_CURVE_TYPE.LINEAR, {
            onFinish: function () {
                onMoveFinish();
            }
        });

        txAnimation.start();
        tyAnimation.start();
        walk.start(walkCount);
    },

    attackAnimation: function (modelAttacker, modelDefender, defenderIdleAnimation, onAttackFinish) {
        var jump = new AR.ModelAnimation(modelAttacker, "Jump", {
            onFinish: function () {
                onAttackFinish();
            }
        });
        new AR.ModelAnimation(modelAttacker, "Attack", {
            onFinish: function () {
                defenderIdleAnimation.onFinish = function () {
                    new AR.ModelAnimation(modelDefender, "Death", {
                        onFinish: function () {
                            jump.start(3);
                        }
                    }).start();
                };
            }
        }).start(3);
    },

    calculateGrowth: function (targetName) {
        var filteredRegistries = World.modelRegistry.filter(function (obj) {
            return obj.target.name == targetName
        });
        var growthFactor = filteredRegistries.length;

        filteredRegistries.forEach(function (entry) {
            entry.model.scale = growthFactor * World.dinoSettings[targetName].scale;
        })
    },

    removeLoadingBar: function () {
        if (!World.loaded) {
            var e = document.getElementById('loadingMessage');
            e.parentElement.removeChild(e);
            World.loaded = true;
        }
    },

    worldLoaded: function worldLoadedFn() {
        var cssDivInstructions = " style='display: table-cell;vertical-align: middle; text-align: right; width: 50%; padding-right: 15px;'";
        var cssDivTyrannosaurus = " style='display: table-cell;vertical-align: middle; text-align: left; padding-right: 15px; width: 38px'";
        var cssDivTriceratops = " style='display: table-cell;vertical-align: middle; text-align: left; padding-right: 15px; width: 38px'";
        var cssDivSpinosaurus = " style='display: table-cell;vertical-align: middle; text-align: left; padding-right: 15px; width: 38px'";
        var cssDivDiplodocus = " style='display: table-cell;vertical-align: middle; text-align: left; padding-right: 15px;'";

        document.getElementById('loadingMessage').innerHTML =
            "<div" + cssDivInstructions + ">Scan one of the dinosaur targets:</div>" +
            "<div" + cssDivTyrannosaurus + "><img src='assets/tyrannosaurus.png'></div>" +
            "<div" + cssDivTriceratops + "><img src='assets/triceratops.png'></div>" +
            "<div" + cssDivSpinosaurus + "><img src='assets/spinosaurus.png'></div>" +
            "<div" + cssDivDiplodocus + "><img src='assets/diplodocus.png'></div>";
    }
};

World.init();
