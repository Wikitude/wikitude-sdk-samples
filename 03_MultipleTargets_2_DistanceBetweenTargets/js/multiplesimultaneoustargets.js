var World = {
    loaded: false,
    modelRegistry: [],
    dinoSettings: {
        diplodocus: {scale: 0.4},
        spinosaurus: {scale: 0.004},
        triceratops: {scale: 0.4},
        tyrannosaurus: {scale: 0.4}
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
            onDistanceChangedThreshold: 0, // The distance between targets has to be changed by a minimum of 0 mm before the callback is triggered.
            physicalTargetImageHeights: { // the physical target image height is required to get the correct distance between targets
                diplodocus: 82,
                spinosaurus: 82,
                triceratops: 82,
                tyrannosaurus: 82
            },
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
                World.modelRegistry.push({target: target, model: model});

                /*
                 Create and start idle animation of the created dino model.
                 */
                var idleAnimation = new AR.ModelAnimation(model, "Idle");
                idleAnimation.onFinish = idleAnimation.start;
                idleAnimation.start();

                /*
                 Adds the model as augmentation for the currently recognized target.
                 */
                this.addImageTargetCamDrawables(target, model);

                var jumpAnimation = new AR.ModelAnimation(model, "Jump");
                jumpAnimation.onFinish = jumpAnimation.start;

                /*
                 Enable callback whenever the distance between the currently recognized target and another target change by more than the threshold defined in the AR.ImageTracker.
                 */
                target.onDistanceChanged = function (distance) {
                    /*
                     When the distance between targets gets lower than 150 mm the jump animation will start,
                     if the distance is getting higher than 150 mm the idle animation will play again.
                     */
                    if (distance < 150) {
                        jumpAnimation.onFinish = jumpAnimation.start;
                        idleAnimation.onFinish = function() {
                            jumpAnimation.start();
                        };
                    } else if (distance > 150){
                        jumpAnimation.onFinish = function() {
                            idleAnimation.start();
                        };
                        idleAnimation.onFinish = idleAnimation.start;
                    }
                };

                World.calculateGrowth(target.name);
                World.removeLoadingBar();
            },
            onImageLost: function (target) {
                World.modelRegistry = World.modelRegistry.filter(function (obj) {
                    return obj.target != target
                });
                World.calculateGrowth(target.name);
            },
            onError: function (errorMessage) {
                alert(errorMessage);
            }
        });
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
