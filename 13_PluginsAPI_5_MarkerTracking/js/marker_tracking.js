var World = {

    init: function initFn() {
        this.createOverlays();
    },

    createOverlays: function createOverlaysFn() {
        var carModel = new AR.Model(
            "assets/car.wt3", {
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

        World.positionable = new AR.Positionable("myPositionable", {
            drawables: {
                cam: carModel
            }
        });
    },

    onError: function onErrorFn(error) {
        alert(error)
    },

    showInfoBar: function worldLoadedFn() {
        document.getElementById("infoBox").style.display = "table";
        document.getElementById("loadingMessage").style.display = "none";
    }
};

World.init();