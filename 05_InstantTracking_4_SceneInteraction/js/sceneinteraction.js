var defaultScaleValue = 0.045;
var defaultRotationValue = 0;

var rotationValues = [];
var scaleValues = [];

var allCurrentModels = [];
var allCurrentCircles = [];

var oneFingerGestureAllowed = false;

/*
    This global callback can be utilized to react on the transition from and to 2 finger gestures; specifically, we
    disallow the drag gesture in this case to ensure an intuitive experience.
*/
AR.context.on2FingerGestureStarted = function() {
    oneFingerGestureAllowed = false;
};

var World = {

    platformAssisstedTrackingSupported: false,
    createOverlaysCalled: false,
    canStartTrackingIntervalHandle: null,

    modelPaths: [
        "assets/models/clock.wt3",
        "assets/models/couch.wt3",
        "assets/models/officechair.wt3",
        "assets/models/table.wt3",
        "assets/models/trainer.wt3"
    ],
    /*
        RequestedModel is the index of the next model to be created. This is necessary because we have to wait one
        frame in order to pass the correct initial position to the newly created model. InitialDrag is a boolean
        that serves the purpose of swiping the model into the scene. In the moment that the model is created, the
        drag event has already started and will not be caught by the model, so the motion has to be carried out by
        the tracking plane. LastAddedModel always holds the newest model in allCurrentModels so that the plane knows
         which model to apply the motion to.
    */
    requestedModel: -1,
    initialDrag: false,
    lastAddedModel: null,

    init: function initFn() {
        /*
            When you'd like to make use of the SMART feature, make sure to call this function and await the result
            in the AR.hardware.smart.onPlatformAssistedTrackingAvailabilityChanged callback.
         */
        AR.hardware.smart.isPlatformAssistedTrackingSupported();

        /*
            To perform hit tests with the scene, a running instant tracking session is needed.
            In case the instant tracker is active, it's trackable can be used to convert screen coordinates in
            potential scene coordinates.

            The trackable API to do this requires the scene coordinate for which the hit test should be performed.
            This example uses the onScreenClick callback to retrieve screen coordinates. The other two parameters
            are callbacks that are called in case the screen coordinate could be converted in scene coordinates or not.
            In case the screen coordinate could be converted successfully, a translate information is provided that
            can be used to position any AR.Drawable.
        */
        AR.context.onScreenClick = function(touchLocation) {
            if (World.tracker.state === AR.InstantTrackerState.TRACKING) {
                World.instantTrackable.convertScreenCoordinateToPointCloudCoordinate(
                    touchLocation.x,
                    touchLocation.y,
                    function(x, y, z) {
                        var circle = new AR.Circle(0.1, {
                            translate: {
                                x: x,
                                y: y,
                                z: z
                            },
                            style: {
                                fillColor: '#FF8C0A'
                            }
                        });
                        allCurrentCircles.push(circle);
                        World.instantTrackable.drawables.addCamDrawable(circle);
                    },
                    function() {
                        alert('nothing hit. try selecting another scene location');
                    }
                );
            } else {
                alert('Scene information is only available during tracking. ' +
                    'Please click the start button to start tracking');
            }
        }
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
                var els = [].slice.apply(document.getElementsByClassName("model-button"));
                if (state === AR.InstantTrackerState.INITIALIZING) {
                    els.forEach(function(element) {
                        element.classList.add("image-button-inactive");
                    });

                    document.getElementById("tracking-start-stop-button").src = "assets/buttons/start.png";
                    document.getElementById("slider-container").style.visibility = "visible";
                } else {
                    if (World.platformAssisstedTrackingSupported) {
                        World.showUserInstructions("Running with platform assisted tracking(ARKit or ARCore).");
                    }

                    els.forEach(function(element) {
                        element.classList.remove("image-button-inactive");
                    });

                    document.getElementById("tracking-start-stop-button").src = "assets/buttons/stop.png";
                    document.getElementById("slider-container").style.visibility = "hidden";
                }
            },
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
            onTrackingPlaneClick: function onTrackingPlaneClickFn(xPos, yPos) {
                /* React to a the tracking plane being clicked here. */
            },
            onTrackingPlaneDragBegan: function onTrackingPlaneDragBeganFn(xPos, yPos) {
                oneFingerGestureAllowed = true;
                World.updatePlaneDrag(xPos, yPos);
            },
            onTrackingPlaneDragChanged: function onTrackingPlaneDragChangedFn(xPos, yPos) {
                World.updatePlaneDrag(xPos, yPos);
            },
            onTrackingPlaneDragEnded: function onTrackingPlaneDragEndedFn(xPos, yPos) {
                World.updatePlaneDrag(xPos, yPos);
                World.initialDrag = false;
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

        World.setupEventListeners()
    },

    setupEventListeners: function setupEventListenersFn() {
        document.getElementById("tracking-model-button-clock").addEventListener('touchstart', function( /*ev*/ ) {
            World.requestedModel = 0;
        }, false);
        document.getElementById("tracking-model-button-couch").addEventListener('touchstart', function( /*ev*/ ) {
            World.requestedModel = 1;
        }, false);
        document.getElementById("tracking-model-button-chair").addEventListener('touchstart', function( /*ev*/ ) {
            World.requestedModel = 2;
        }, false);
        document.getElementById("tracking-model-button-table").addEventListener('touchstart', function( /*ev*/ ) {
            World.requestedModel = 3;
        }, false);
        document.getElementById("tracking-model-button-trainer").addEventListener('touchstart', function( /*ev*/ ) {
            World.requestedModel = 4;
        }, false);
    },

    updatePlaneDrag: function updatePlaneDragFn(xPos, yPos) {
        if (World.requestedModel >= 0) {
            World.addModel(World.requestedModel, xPos, yPos);
            World.requestedModel = -1;
            World.initialDrag = true;
        }

        if (World.initialDrag && oneFingerGestureAllowed) {
            World.lastAddedModel.translate = {
                x: xPos,
                y: yPos
            };
        }
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

    addModel: function addModelFn(pathIndex, xpos, ypos) {
        if (World.isTracking()) {
            var modelIndex = rotationValues.length;
            World.addModelValues();

            var model = new AR.Model(World.modelPaths[pathIndex], {
                scale: {
                    x: defaultScaleValue,
                    y: defaultScaleValue,
                    z: defaultScaleValue
                },
                translate: {
                    x: xpos,
                    y: ypos
                },
                /*
                    We recommend only implementing the callbacks actually needed as they will cause calls from
                    native to JavaScript being invoked. Especially for the frequently called changed callbacks this
                    should be avoided. In this sample all callbacks are implemented simply for demonstrative purposes.
                */
                onDragBegan: function( /*x, y*/ ) {
                    oneFingerGestureAllowed = true;
                },
                onDragChanged: function(relativeX, relativeY, intersectionX, intersectionY) {
                    if (oneFingerGestureAllowed) {
                        /*
                            We recommend setting the entire translate property rather than its individual components
                            as the latter would cause several call to native, which can potentially lead to performance
                            issues on older devices. The same applied to the rotate and scale property.
                        */
                        this.translate = {
                            x: intersectionX,
                            y: intersectionY
                        };
                    }
                },
                onDragEnded: function(x, y) {
                    /* React to the drag gesture ending. */
                },
                onRotationBegan: function(angleInDegrees) {
                    /* React to the rotation gesture beginning. */
                },
                onRotationChanged: function(angleInDegrees) {
                    this.rotate.z = rotationValues[modelIndex] - angleInDegrees;
                },
                onRotationEnded: function( /*angleInDegrees*/ ) {
                    rotationValues[modelIndex] = this.rotate.z
                },
                onScaleBegan: function(scale) {
                    /* React to the scale gesture beginning. */
                },
                onScaleChanged: function(scale) {
                    var scaleValue = scaleValues[modelIndex] * scale;
                    this.scale = {
                        x: scaleValue,
                        y: scaleValue,
                        z: scaleValue
                    };
                },
                onScaleEnded: function( /*scale*/ ) {
                    scaleValues[modelIndex] = this.scale.x;
                },
                onError: World.onError
            });

            allCurrentModels.push(model);
            World.lastAddedModel = model;
            this.instantTrackable.drawables.addCamDrawable(model);
        }
    },

    isTracking: function isTrackingFn() {
        return (this.tracker.state === AR.InstantTrackerState.TRACKING);
    },

    addModelValues: function addModelValuesFn() {
        rotationValues.push(defaultRotationValue);
        scaleValues.push(defaultScaleValue);
    },

    resetModels: function resetModelsFn() {
        this.instantTrackable.drawables.removeCamDrawable(allCurrentModels);
        this.instantTrackable.drawables.removeCamDrawable(allCurrentCircles);

        allCurrentModels = [];
        allCurrentCircles = [];
        World.resetAllModelValues();
    },

    resetAllModelValues: function resetAllModelValuesFn() {
        rotationValues = [];
        scaleValues = [];
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