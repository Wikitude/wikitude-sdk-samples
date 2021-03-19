var allCurrentModels = [];

var World = {

    platformAssisstedTrackingSupported: false,
    createOverlaysCalled: false,
    canStartTrackingIntervalHandle: null,

    init: function initFn() {
        /*
            When you'd like to make use of the SMART feature, make sure to call this function and await the result
            in the AR.hardware.smart.onPlatformAssistedTrackingAvailabilityChanged callback.
         */
        AR.hardware.smart.isPlatformAssistedTrackingSupported();
    },

    createOverlays: function createOverlaysFn() {
        if (World.createOverlaysCalled) {
            return;
        }

        World.createOverlaysCalled = true;

        var crossHairsRedImage = new AR.ImageResource("assets/crosshairs_red.png", {
            onError: World.onError
        });
        this.crossHairsRedDrawable = new AR.ImageDrawable(crossHairsRedImage, 1.0);

        var crossHairsBlueImage = new AR.ImageResource("assets/crosshairs_blue.png", {
            onError: World.onError
        });
        this.crossHairsBlueDrawable = new AR.ImageDrawable(crossHairsBlueImage, 1.0);

        var crossHairsGreenImage = new AR.ImageResource("assets/crosshairs_green.png", {
            onError: World.onError
        });
        this.crossHairsGreenDrawable = new AR.ImageDrawable(crossHairsGreenImage, 1.0);

        this.tracker = new AR.InstantTracker({
            onChangedState: function onChangedStateFn(state) {
                if (state === AR.InstantTrackerState.INITIALIZING) {
                    document.getElementById("tracking-start-stop-button").src = "assets/buttons/start.png";
                    document.getElementById("slider-container").style.visibility = "visible";
                } else {
                    if (World.platformAssisstedTrackingSupported) {
                        World.showUserInstructions("Running with platform assisted tracking(ARKit or ARCore).");
                    }

                    document.getElementById("tracking-start-stop-button").src = "assets/buttons/stop.png";
                    document.getElementById("slider-container").style.visibility = "hidden";
                }
            },
            /*
                Device height needs to be as accurate as possible to have an accurate scale returned by the Wikitude
                SDK.
             */
            deviceHeight: 1.0,
            onError: World.onError,
            onChangeStateError: World.onError
        });

        this.instantTrackable = new AR.InstantTrackable(this.tracker, {
            drawables: {
                cam: World.crossHairsBlueDrawable,
                initialization: World.crossHairsRedDrawable
            },
            onTrackingStarted: function onTrackingStartedFn() {
                /* Do something when tracking is started (recognized). */
            },
            onTrackingStopped: function onTrackingStoppedFn() {
                World.changeTrackingHeight(this.tracker.deviceHeight);
            },
            onTrackingPlaneClick: function onTrackingPlaneClickFn(xpos, ypos) {
                /*
                    xPos and yPos are the intersection coordinates of the click ray and the instant tracking plane.
                    They can be applied to the transform component directly.
                */
                World.addModel(xpos, ypos);
            },
            onError: World.onError
        });

        World.canStartTrackingIntervalHandle = setInterval(
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
        if (this.tracker.deviceHeight > 2.0) this.tracker.deviceHeight = 2.0;
        if (this.tracker.deviceHeight < 0.1) this.tracker.deviceHeight = 0.1;
        if (this.tracker.state === AR.InstantTrackerState.INITIALIZING) {
            this.tracker.state = AR.InstantTrackerState.TRACKING;
        } else {
            this.tracker.state = AR.InstantTrackerState.INITIALIZING;
        }
    },

    changeTrackingHeight: function changeTrackingHeightFn(height) {
        this.tracker.deviceHeight = parseFloat(height);
        if (height > 2.0) height = 2.0;
        if (height < 0.1) height = 0.1;
        document.getElementById('height-value-text').value = height;
        document.getElementById('tracking-height-slider').value = height;
    },

    addModel: function addModelFn(xpos, ypos) {
        if (this.tracker.state === AR.InstantTrackerState.TRACKING) {
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
                    /* Create with a random rotation to provide visual variety. */
                    z: Math.random() * 360.0
                },
                onError: World.onError
            });

            allCurrentModels.push(model);
            this.instantTrackable.drawables.addCamDrawable(model);
        }
    },

    resetModels: function resetModelsFn() {
        this.instantTrackable.drawables.removeCamDrawable(allCurrentModels);
        allCurrentModels = [];
    },

    onError: function onErrorFn(error) {
        alert(error);

        /* if license check failed, stop repeatedly calling `canStartTracking` */
        if (error.id === 1001 && error.domain === "InstantTracking") {
            clearInterval(World.canStartTrackingIntervalHandle);
        }
    },

    showUserInstructions: function showUserInstructionsFn(message) {
        document.getElementById('loadingMessage').innerHTML = message;
    }
};

AR.hardware.smart.onPlatformAssistedTrackingAvailabilityChanged = function(availability) {
    switch (availability) {
        case AR.hardware.smart.SmartAvailability.INDETERMINATE_QUERY_FAILED:
            /* Query failed for some reason; try again or accept the fact. */
            World.showUserInstructions("Could not determine if platform assisted tracking is supported.<br>" +
                "Running without platform assisted tracking (ARKit or ARCore).");
            World.createOverlays();
            break;
        case AR.hardware.smart.SmartAvailability.CHECKING_QUERY_ONGOING:
            /* Query currently ongoing; be patient and do nothing or inform the user about the ongoing process. */
            break;
        case AR.hardware.smart.SmartAvailability.UNSUPPORTED:
            /* Not supported, create the scene now without platform assisted tracking enabled. */
            World.showUserInstructions("Running without platform assisted tracking (ARKit or ARCore).");
            World.createOverlays();
            break;
        case AR.hardware.smart.SmartAvailability.SUPPORTED_UPDATE_REQUIRED:
        case AR.hardware.smart.SmartAvailability.SUPPORTED:
            /*
                Supported, create the scene now with platform assisted tracking enabled SUPPORTED_UPDATE_REQUIRED
                may be followed by SUPPORTED, make sure not to create the scene twice (see check in createOverlays).
             */
            World.platformAssisstedTrackingSupported = true;
            World.showUserInstructions("Running with platform assisted tracking(ARKit or ARCore). <br> " +
                "Move your phone around until the crosshair turns green, which is when you can start tracking.");
            World.createOverlays();
            break;
    }
};

World.init();