var World = {

    init: function initFn() {
        AR.plugins.addPluginAvailabilityObserver(function(pluginId) {
            if (pluginId === "com.wikitude.plugins.marker_tracker_demo") {
                World.createOverlays();
            }
        });
    },

    createOverlays: function createOverlaysFn() {

        World.markerTracker = new MarkerTracker();

        var carModel = new AR.Model("assets/car.wt3", {
            onLoaded: World.showInfoBar,
            onError: World.onError,
            scale: {
                x: 0.01,
                y: 0.01,
                z: 0.01
            },
            translate: {
                x: 0.0,
                y: 0.0,
                z: 0.0
            },
            rotate: {
                x: 0,
                y: 0,
                z: 0
            }
        });

        var gingerbreadManModel = new AR.Model("assets/duck.wt3", {
            onLoaded: World.showInfoBar,
            onError: World.onError,
            scale: {
                x: 0.07,
                y: 0.07,
                z: 0.07
            },
            translate: {
                x: 0.0,
                y: 0.0,
                z: 0.0
            },
            rotate: {
                x: 0,
                y: 0,
                z: 0
            }
        });

        World.markerTrackable = new MarkerTrackable(World.markerTracker, 303, {
            drawables: {
                cam: carModel
            }
        });

        World.markerTrackable2 = new MarkerTrackable(World.markerTracker, 2, {
            drawables: {
                cam: gingerbreadManModel
            }
        });
    },

    onError: function onErrorFn(error) {
        alert(error);
    },

    showInfoBar: function worldLoadedFn() {
        document.getElementById("infoBox").style.display = "table";
        document.getElementById("loadingMessage").style.display = "none";
    }
};

World.init();