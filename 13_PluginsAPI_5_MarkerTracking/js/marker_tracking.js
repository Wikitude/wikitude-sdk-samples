var World = {
    _myPositionable: null,

    init: function initFn() {
        this.createOverlays();
    },

    createOverlays: function createOverlaysFn() {
        var myModel = new AR.Model(
            "assets/car.wt3", {
                onLoaded: this.loadingStep,
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
        
        // var myImageResource = new AR.ImageResource("assets/helmet.png");
        
        // var myImageDrawable = new AR.ImageDrawable(myImageResource, 1, {
        //                                      offsetX: 0,
        //                                      offsetY: 0
        //                                      });

        World._myPositionable = new AR.Positionable("myPositionable", {
            drawables: {
                cam: myModel
                //cam: myImageDrawable
            }
        });
    },

    loadingStep: function loadingStepFn() {
  			var cssDivLeft = " style='display: table-cell;vertical-align: middle; text-align: right; width: 50%; padding-right: 15px;'";
  			var cssDivRight = " style='display: table-cell;vertical-align: middle; text-align: left;'";
  			document.getElementById('loadingMessage').innerHTML =
  				"<div" + cssDivLeft + ">Scan ArUco Marker target:</div>" +
  				"<div" + cssDivRight + "><img src='assets/aruco_marker.png'></img></div>";
  	}
};

World.init();
