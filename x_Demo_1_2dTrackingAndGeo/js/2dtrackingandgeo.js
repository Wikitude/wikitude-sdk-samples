/*
    The Wikitude SDK allows you to combine geobased AR with image recognition to create a seamless experience for users.
*/
IrAndGeo = {};

IrAndGeo.markerNames = ['Union Circle', 'Eastminster', 'Small Ben', 'Silver Gate', 'Uptown', 'Downtown', 'Countryside', 'Outer Circle'];
IrAndGeo.stores = [];
IrAndGeo.markerAnimations = [];
IrAndGeo.error = false;
IrAndGeo.receivedLocation = false;
IrAndGeo.resourcesLoaded = false;

IrAndGeo.res = {};

IrAndGeo.setupScene = function(lat, lon, alt) {
    // create 8 random markers with different marker names
    for (var i = 0; i < 8; i++) {
        var objLat = lat + ((Math.random() - 0.5) / 1000);
        var objLon = lon + ((Math.random() - 0.5) / 1000);
        IrAndGeo.createMarker(objLat, objLon, IrAndGeo.markerNames[i]);
    }

    // create appearing animation
    IrAndGeo.showMarkersAnimation = new AR.AnimationGroup('parallel', IrAndGeo.markerAnimations);
};

IrAndGeo.createMarker = function(lat, lon, name) {
    // create an AR.GeoLocation from the latitude/longitude function parameters
    var loc = new AR.GeoLocation(lat, lon);

    // create an AR.ImageDrawable for the marker
    var imageDrawable = new AR.ImageDrawable(IrAndGeo.res.marker, 2, {
        scale: {
            x: 0.0,
            y: 0.0
        },
        onClick: function() {
            alert("clicked");
        }
    });

    // create marker animations and store it in the markerAnimations-array 
    IrAndGeo.markerAnimations.push(new AR.PropertyAnimation(imageDrawable, 'scale.x', 0.0, 1.0, 1000, {
        type: AR.CONST.EASING_CURVE_TYPE.EASE_OUT_BOUNCE
    }));
    IrAndGeo.markerAnimations.push(new AR.PropertyAnimation(imageDrawable, 'scale.y', 0.0, 1.0, 1000, {
        type: AR.CONST.EASING_CURVE_TYPE.EASE_OUT_BOUNCE
    }));
    // create a AR.GeoObject with the marker, disable it by setting the enabled-flag to 'false' and store it in the stores-array
    IrAndGeo.stores.push(new AR.GeoObject(loc, {
        drawables: {
            cam: imageDrawable
        },
        enabled: false
    }));
};

IrAndGeo.showStores = function() {
    // display all GeoObjects by setting the enabled-flag to 'true'
    IrAndGeo.stores.forEach(function(x, idx) {
        x.enabled = true;
    });

    // nicely animate appearing of markers
    IrAndGeo.showMarkersAnimation.start();

    // set the info-text for the HTML message element and show it
    document.getElementById("messageElement").innerHTML = "Look around for stores nearby!";
    document.getElementById("messageElement").style.display = "block";
};

IrAndGeo.hideStores = function() {
    // disable all GeoObjects and reset to 0 size
    IrAndGeo.stores.forEach(function(obj, idx) {
        obj.enabled = false;
        obj.drawables.cam[0].scale = 0.0;
    });
    // hide the HTML message element
    document.getElementById("messageElement").style.display = "none";
};

IrAndGeo.showDeal = function() {
    IrAndGeo.hideStores();
    IrAndGeo.menuDrawables.forEach(function(obj, idx) {
        obj.enabled = false;
    });
    IrAndGeo.dealDrawable.enabled = true;
};

IrAndGeo.hideDeal = function() {
    IrAndGeo.dealDrawable.enabled = false;
    IrAndGeo.menuDrawables.forEach(function(obj, idx) {
        obj.enabled = true;
    });
};

IrAndGeo.showWeb = function() {
    IrAndGeo.hideStores();

    AR.context.openInBrowser("https://www.wikitude.com");
};

IrAndGeo.loadingStepDone = function() {
    if (!IrAndGeo.error && IrAndGeo.res.buttonStores.isLoaded() && IrAndGeo.res.buttonWeb.isLoaded() && IrAndGeo.res.buttonDeal.isLoaded() && IrAndGeo.res.marker.isLoaded() && IrAndGeo.receivedLocation && IrAndGeo.tracker && IrAndGeo.resourcesLoaded) {
        //everything is loaded
        var cssDivLeft = " style='display: table-cell;vertical-align: middle; text-align: right; width: 50%; padding-right: 15px;'";
        var cssDivRight = " style='display: table-cell;vertical-align: middle; text-align: left;'";
        document.getElementById('messageElement').innerHTML =
            "<div" + cssDivLeft + ">Scan Shop Image Target:</div>" +
            "<div" + cssDivRight + "><img src='assets/ShopAdSmall.png'></img></div>";

        // Remove Scan target message after 10 sec.
        setTimeout(function() {
            document.getElementById("messageElement").style.display = "none";
        }, 10000);
    }
};

// function for displaying a loading error in the HTML message element
IrAndGeo.errorLoading = function() {
    document.getElementById("messageElement").innerHTML = "Unable to load image or tracker!";
    IrAndGeo.error = true;
};

IrAndGeo.initIr = function() {

    this.targetCollectionResource = new AR.TargetCollectionResource("assets/ShopAd.wtc", {
        onLoaded: function () {
            IrAndGeo.resourcesLoaded = true;
            IrAndGeo.loadingStepDone;
        }
    });

    this.tracker = new AR.ImageTracker(this.targetCollectionResource, {
        onTargetsLoaded: IrAndGeo.loadingStepDone,
        onError: IrAndGeo.errorLoading
    });

    // Create drawables to display on the recognized image
    var buttonDeal = new AR.ImageDrawable(IrAndGeo.res.buttonDeal, 0.15, {
        onClick: IrAndGeo.showDeal,
        translate: {
            x: 0.35,
            y: -0.275
        }
    });
    var buttonWeb = new AR.ImageDrawable(IrAndGeo.res.buttonWeb, 0.15, {
        onClick: IrAndGeo.showWeb,
        translate: {
            x: 0.175,
            y: -0.525
        }
    });
    var buttonStores = new AR.ImageDrawable(IrAndGeo.res.buttonStores, 0.15, {
        onClick: IrAndGeo.showStores,
        translate: {
            x: -0.1,
            y: -0.275
        }
    });

    IrAndGeo.menuDrawables = [buttonDeal, buttonWeb, buttonStores];
    IrAndGeo.dealDrawable = new AR.ImageDrawable(IrAndGeo.res.deal, 0.3, {
        enabled: false,
        onClick: IrAndGeo.hideDeal
    });

    // Create the object by defining the tracker, target name and its drawables
    var imageTrackable = new AR.ImageTrackable(IrAndGeo.tracker, "ShopAd", {
        drawables: {
            cam: [buttonDeal, buttonWeb, buttonStores, IrAndGeo.dealDrawable]
        }
    });

};

// this function is called as soon as we receive GPS data 
AR.context.onLocationChanged = function(latitude, longitude, altitude, accuracy) {
    // in order not to receive any further location updates the onLocationChanged trigger is set to null
    AR.context.onLocationChanged = null;
    // flag to store that a location was received
    IrAndGeo.receivedLocation = true;
    // initialize the scene
    IrAndGeo.setupScene(latitude, longitude, altitude);
    IrAndGeo.loadingStepDone();
};

// Create the image resources that are used for the marker and the buttons
IrAndGeo.res.marker = new AR.ImageResource("assets/YourShop_Marker.png", {
    onLoaded: IrAndGeo.loadingStepDone,
    onError: IrAndGeo.errorLoading
});
IrAndGeo.res.buttonWeb = new AR.ImageResource("assets/YourShop_OpenWebsite.png", {
    onLoaded: IrAndGeo.loadingStepDone,
    onError: IrAndGeo.errorLoading
});
IrAndGeo.res.buttonStores = new AR.ImageResource("assets/YourShop_FindShops.png", {
    onLoaded: IrAndGeo.loadingStepDone,
    onError: IrAndGeo.errorLoading
});
IrAndGeo.res.buttonDeal = new AR.ImageResource("assets/YourShop_GetADeal.png", {
    onLoaded: IrAndGeo.loadingStepDone,
    onError: IrAndGeo.errorLoading
});
IrAndGeo.res.deal = new AR.ImageResource("assets/YourShop_Deal.png", {
    onLoaded: IrAndGeo.loadingStepDone,
    onError: IrAndGeo.errorLoading
});

IrAndGeo.initIr();

IrAndGeo.loadingStepDone();
