var allCurrentModels = [];

var World = {

    init: function initFn() {
        var message;
        if (AR.hardware.smart.platformAssistedTrackingSupported) {
            message = "Running with platform assisted tracking(ARKit or ARCore). <br> Move your phone around until the crosshair turns green, which is when you can start tracking."
        } else {
            message = "Running without platform assisted tracking (ARKit or ARCore)."
        }

        this.showUserInstructions(message);
        this.createOverlays();
    },

    createOverlays: function createOverlaysFn() {
        var crossHairsRedImage = new AR.ImageResource("assets/crosshairs_red.png");
        this.crossHairsRedDrawable = new AR.ImageDrawable(crossHairsRedImage, 1.0);

        var crossHairsBlueImage = new AR.ImageResource("assets/crosshairs_blue.png");
        this.crossHairsBlueDrawable = new AR.ImageDrawable(crossHairsBlueImage, 1.0);

        var crossHairsGreenImage = new AR.ImageResource("assets/crosshairs_green.png");
        this.crossHairsGreenDrawable = new AR.ImageDrawable(crossHairsGreenImage, 1.0);

        this.tracker = new AR.InstantTracker({
            onChangedState:  function onChangedStateFn(state) {
                if (state === AR.InstantTrackerState.INITIALIZING) {
                    document.getElementById("tracking-start-stop-button").src = "assets/buttons/start.png";
                    document.getElementById("tracking-height-slider-container").style.visibility = "visible";
                } else {
                    if (AR.hardware.smart.platformAssistedTrackingSupported) {
                        World.showUserInstructions("Running with platform assisted tracking(ARKit or ARCore).");
                    }
                    document.getElementById("tracking-start-stop-button").src = "assets/buttons/stop.png";
                    document.getElementById("tracking-height-slider-container").style.visibility = "hidden";
                }
            },
            // device height needs to be as accurate as possible to have an accurate scale
            // returned by the Wikitude SDK
            deviceHeight: 1.0,
            onError: function(errorMessage) {
                alert(errorMessage);
            },
            onChangeStateError: function(e) {
                alert("" + e.id + " " + e.message);
            }
        });

        this.instantTrackable = new AR.InstantTrackable(this.tracker, {
            drawables: {
                cam: World.crossHairsBlueDrawable,
                initialization: World.crossHairsRedDrawable
            },
            onTrackingStarted: function onTrackingStartedFn() {
                // do something when tracking is started (recognized)
            },
            onTrackingStopped: function onTrackingStoppedFn() {
                // do something when tracking is stopped (lost)
            },
            onTrackingPlaneClick: function onTrackingPlaneClickFn(xpos, ypos) {
                // xPos and yPos are the intersection coordinates of the click ray and the
                // instant tracking plane. they can be applied to the transform component
                // directly
                World.addModel(xpos, ypos);
            },
            onError: function(errorMessage) {
                alert(errorMessage);
            }
        });

        setInterval(
            function() {
                if (World.tracker.canStartTracking) {
                    World.instantTrackable.drawables.initialization = [World.crossHairsGreenDrawable];
                } else {
                    World.instantTrackable.drawables.initialization = [World.crossHairsRedDrawable];
                }
            },
            1000
        );
    },

    changeTrackerState: function changeTrackerStateFn() {

        if (this.tracker.state === AR.InstantTrackerState.INITIALIZING) {
            this.tracker.state = AR.InstantTrackerState.TRACKING;
        } else {
            this.tracker.state = AR.InstantTrackerState.INITIALIZING;
        }
    },

    changeTrackingHeight: function changeTrackingHeightFn(height) {
        this.tracker.deviceHeight = parseFloat(height);
    },

    isTracking: function isTrackingFn() {
        return (this.tracker.state === AR.InstantTrackerState.TRACKING);
    },

    addModel: function addModelFn(xpos, ypos) {
        if (World.isTracking()) {
            var model = new AR.Model("assets/models/couch.wt3", {
                scale: {
                    x: 0.045,
                    y: 0.045,
                    z: 0.045
                },
                translate: {
                    x: xpos,
                    y: ypos
                },
                rotate: {
                    // create with a random rotation to provide visual variety
                    z: Math.random() * 360.0
                },
            })

            allCurrentModels.push(model);
            this.instantTrackable.drawables.addCamDrawable(model);
        }
    },

    resetModels: function resetModelsFn() {
        for (var i = 0; i < allCurrentModels.length; i++) {
            this.instantTrackable.drawables.removeCamDrawable(allCurrentModels[i]);
        }
        allCurrentModels = [];
    },

    showUserInstructions: function showUserInstructionsFn(message) {
        document.getElementById('loadingMessage').innerHTML =
            "<div style='display: table-cell; text-align: center; width: 100%;'>" + message + "</div>";
    }
};

World.init();
