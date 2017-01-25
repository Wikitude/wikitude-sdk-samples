var allCurrentModels = [];

var World = {

    init: function initFn() {
        this.createOverlays();
    },

    createOverlays: function createOverlaysFn() {
        var crossHairsRedImage = new AR.ImageResource("assets/crosshairs_red.png");
        var crossHairsRedDrawable = new AR.ImageDrawable(crossHairsRedImage, 1.0);

        var crossHairsBlueImage = new AR.ImageResource("assets/crosshairs_blue.png");
        var crossHairsBlueDrawable = new AR.ImageDrawable(crossHairsBlueImage, 1.0);

        this.tracker = new AR.InstantTracker({
            onChangedState:  function onChangedStateFn(state) {
                // react to a change in tracking state here
            },
            // device height needs to be as accurate as possible to have an accurate scale
            // returned by the Wikitude SDK
            deviceHeight: 1.0
        });
        
        this.instantTrackable = new AR.InstantTrackable(this.tracker, {
            drawables: {
                cam: crossHairsBlueDrawable,
                initialization: crossHairsRedDrawable
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
            }
        });
    },

    changeTrackerState: function changeTrackerStateFn() {
        
        if (this.tracker.state === AR.InstantTrackerState.INITIALIZING) {
            
            document.getElementById("tracking-start-stop-button").src = "assets/buttons/stop.png";
            document.getElementById("tracking-height-slider-container").style.visibility = "hidden";
            
            this.tracker.state = AR.InstantTrackerState.TRACKING;
        } else {

            document.getElementById("tracking-start-stop-button").src = "assets/buttons/start.png";
            document.getElementById("tracking-height-slider-container").style.visibility = "visible";
            
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
    }
};

World.init();
