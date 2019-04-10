var World = {
    loaded: false,
    modelRegistry: [],
    dinoSettings: {
        diplodocus: {
            scale: 0.4
        },
        spinosaurus: {
            scale: 0.004
        },
        triceratops: {
            scale: 0.4
        },
        tyrannosaurus: {
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
            /* The distance between targets has to be changed by a minimum of 0 mm before the callback is triggered. */
            onDistanceChangedThreshold: 0,
            /* The physical target image height is required to get the correct distance between targets. */
            physicalTargetImageHeights: {
                diplodocus: 82,
                spinosaurus: 82,
                triceratops: 82,
                tyrannosaurus: 82
            },
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
                World.modelRegistry.push({
                    target: target,
                    model: model
                });

                /* Create and start idle animation of the created dino model. */
                var idleAnimation = new AR.ModelAnimation(model, "Idle");
                idleAnimation.onFinish = idleAnimation.start;
                idleAnimation.start();

                /* Adds the model as augmentation for the currently recognized target. */
                this.addImageTargetCamDrawables(target, model);

                var jumpAnimation = new AR.ModelAnimation(model, "Jump");
                jumpAnimation.onFinish = jumpAnimation.start;

                /*
                    Enable callback whenever the distance between the currently recognized target and another
                    target change by more than the threshold defined in the AR.ImageTracker.
                 */
                target.onDistanceChanged = function(distance) {
                    /*
                        When the distance between targets gets lower than 150 mm the jump animation will start,
                        if the distance is getting higher than 150 mm the idle animation will play again.
                     */
                    if (distance < 150) {
                        jumpAnimation.onFinish = jumpAnimation.start;
                        idleAnimation.onFinish = function() {
                            jumpAnimation.start();
                        };
                    } else if (distance > 150) {
                        jumpAnimation.onFinish = function() {
                            idleAnimation.start();
                        };
                        idleAnimation.onFinish = idleAnimation.start;
                    }
                };

                World.calculateGrowth(target.name);
                World.hideInfoBar();
            },
            onImageLost: function(target) {
                World.modelRegistry = World.modelRegistry.filter(function(obj) {
                    return obj.target !== target
                });
                World.calculateGrowth(target.name);
            },
            onError: World.onError
        });
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