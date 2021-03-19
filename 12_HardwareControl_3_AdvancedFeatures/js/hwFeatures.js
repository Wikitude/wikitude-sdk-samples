/* Implementation of AR-Experience (aka "World"). */
var World = {
    /* You may request new data from server periodically, however: in this sample data is only requested once. */
    isRequestingData: false,

    /* True once data was fetched. */
    initiallyLoadedData: false,

    /* Different POI-Marker assets. */
    markerDrawableIdle: null,
    markerDrawableSelected: null,
    markerDrawableDirectionIndicator: null,

    /* List of AR.GeoObjects that are currently shown in the scene / World. */
    markerList: [],

    /* the last selected marker. */
    currentMarker: null,

    /* Called to inject new POI data. */
    loadPoisFromJsonData: function loadPoisFromJsonDataFn(poiData) {

        /* Empty list of visible markers. */
        World.markerList = [];

        /* Start loading marker assets. */
        World.markerDrawableIdle = new AR.ImageResource("assets/marker_idle.png", {
            onError: World.onError
        });
        World.markerDrawableSelected = new AR.ImageResource("assets/marker_selected.png", {
            onError: World.onError
        });
        World.markerDrawableDirectionIndicator = new AR.ImageResource("assets/indi.png", {
            onError: World.onError
        });

        /* Loop through POI-information and create an AR.GeoObject (=Marker) per POI. */
        for (var currentPlaceNr = 0; currentPlaceNr < poiData.length; currentPlaceNr++) {
            var singlePoi = {
                "id": poiData[currentPlaceNr].id,
                "latitude": parseFloat(poiData[currentPlaceNr].latitude),
                "longitude": parseFloat(poiData[currentPlaceNr].longitude),
                "altitude": parseFloat(poiData[currentPlaceNr].altitude),
                "title": poiData[currentPlaceNr].name,
                "description": poiData[currentPlaceNr].description
            };

            World.markerList.push(new Marker(singlePoi));
        }

        World.updateStatusMessage(currentPlaceNr + ' places loaded');
    },

    /* Updates status message shown in small "i"-button aligned bottom center. */
    updateStatusMessage: function updateStatusMessageFn(message, isWarning) {
        document.getElementById("popupButtonImage").src = isWarning ? "assets/warning_icon.png" : "assets/info_icon.png";
        document.getElementById("popupButtonTooltip").innerHTML = message;
    },

    /* Location updates, fired every time you call architectView.setLocation() in native environment. */
    locationChanged: function locationChangedFn(lat, lon, alt, acc) {
        /* Request data if not already present. */
        if (!World.initiallyLoadedData) {
            World.requestDataFromLocal(lat, lon);
            World.initiallyLoadedData = true;
        }
    },

    /* Fired when user pressed maker in cam. */
    onMarkerSelected: function onMarkerSelectedFn(marker) {

        /* Deselect previous marker. */
        if (World.currentMarker) {
            if (World.currentMarker.poiData.id === marker.poiData.id) {
                return;
            }
            World.currentMarker.setDeselected(World.currentMarker);
        }

        /* Highlight current one. */
        marker.setSelected(marker);
        World.currentMarker = marker;
    },

    closePanel: function closePanel() {
        /* Hide panels. */
        document.getElementById("panelCameraInfo").style.visibility = "hidden";
        document.getElementById("panelCameraControl").style.visibility = "hidden";

        if (World.currentMarker != null) {
            /* Deselect AR-marker when user exits detail screen div. */
            World.currentMarker.setDeselected(World.currentMarker);
        }
    },

    /* Screen was clicked but no geo-object was hit. */
    onScreenClick: function onScreenClickFn(touchLocation) {
        World.closePanel();

        if (World.currentMarker) {
            World.currentMarker.setDeselected(World.currentMarker);
        }
        AR.hardware.camera.setFocusPointOfInterest(touchLocation);
        AR.hardware.camera.setExposurePointOfInterest(touchLocation);
    },

    /* Display camera control panel. */
    showCamControl: function showCamControlFn() {
        World.closePanel();

        document.getElementById("panelCameraControlZoomSlider").max = AR.hardware.camera.features.zoomRange.max;
        document.getElementById("panelCameraControlZoomSlider").min = 1;

        document.getElementById("panelCameraControlDistanceSlider").value = AR.hardware.camera.manualFocusDistance;
        document.getElementById("panelCameraControlDistanceSliderValue").innerHTML = document.getElementById("panelCameraControlDistanceSlider").value;

        World.updateRangeValues();

        /* Only display manual focus distance control if it the device supports it. */
        if (!AR.hardware.camera.manualFocusAvailable) {
            document.getElementById("panelCameraControlDistanceSliderContainer").style.display = "none";
        }

        /* Open panel. */
        document.getElementById("panelCameraControl").style.visibility = "visible";
    },

    /* Display camera info panel. */
    showCamInfo: function showCamInfoFn() {
        World.closePanel();

        /* Update panel values. */
        var features = AR.hardware.camera.features;
        var camera = AR.hardware.camera;

        /* Remove repeated camera position elements */
        var positions = [];
        features.positions.forEach(function(value, index) {
            if (!positions.includes(value)) positions.push(value);
        })

        document.getElementById("cameraPositions").innerHTML = positions.join();
        document.getElementById("cameraZoomMax").innerHTML = Math.round(features.zoomRange.max);
        document.getElementById("cameraFocusModes").innerHTML = features.focusModes.join();
        document.getElementById("manualFocusAvailable").innerHTML = (camera.manualFocusAvailable) ? "Yes" : "No";
        document.getElementById("flashlightAvailable").innerHTML = (camera.flashlightAvailable) ? "Yes" : "No";

        /* Show panel. */
        document.getElementById("panelCameraInfo").style.visibility = "visible";
    },

    /* Udpates values shown in "control panel". */
    updateRangeValues: function updateRangeValuesFn() {

        /* Get current slider value (0..100);. */
        var zoomValue = document.getElementById("panelCameraControlZoomSlider").value;

        /* Update UI labels accordingly. */
        document.getElementById("panelCameraControlZoomSliderValue").innerHTML = zoomValue;

        AR.hardware.camera.zoom = parseFloat(zoomValue);
    },

    updateFocusRangeValues: function updateFocusRangeValuesFn() {

        /* Get current slider value (0..100);. */
        var slider_value = document.getElementById("panelCameraControlDistanceSlider").value;

        /* Update UI labels accordingly. */
        document.getElementById("panelCameraControlDistanceSliderValue").innerHTML = slider_value;

        AR.hardware.camera.manualFocusDistance = parseInt(slider_value) / 100;
    },

    /* Udpates values shown in "control panel". */
    updateFocusMode: function updateFocusModeFn() {

        /* Get current checkbox status. */
        var radioValue = document.querySelector(".panelFocusAuto:checked").value;

        if (radioValue === "continuous") {
            AR.hardware.camera.focusMode = AR.CONST.CAMERA_FOCUS_MODE.CONTINUOUS;
        } else if (radioValue === "once") {
            AR.hardware.camera.focusMode = AR.CONST.CAMERA_FOCUS_MODE.ONCE;
        } else {
            AR.hardware.camera.focusMode = AR.CONST.CAMERA_FOCUS_MODE.OFF;
        }
    },

    /* Udpates values shown in "control panel". */
    updateFlashlight: function updateFlashlightFn() {

        /* Get current checkbox status. */
        AR.hardware.camera.flashlight = document.querySelector("#panelFlashlight").checked
    },

    /*
        In case the data of your ARchitect World is static the content should be stored within the application.
        Create a JavaScript file (e.g. myJsonData.js) where a globally accessible variable is defined.
        Include the JavaScript in the ARchitect Worlds HTML by adding <script src="js/myJsonData.js"/> to make POI
        information available anywhere in your JavaScript.
    */

    /* Request POI data. */
    requestDataFromLocal: function requestDataFromLocalFn(lat, lon) {

        var poisNearby = Helper.bringPlacesToUser(myJsonData, lat, lon);
        World.loadPoisFromJsonData(poisNearby);

    },

    onError: function onErrorFn(error) {
        alert(error);
    }
};

var Helper = {

    /*
        For demo purpose only, this method takes poi data and a center point (latitude, longitude) to relocate the
        given places around the user.
    */
    bringPlacesToUser: function bringPlacesToUserFn(poiData, latitude, longitude) {
        for (var i = 0; i < poiData.length; i++) {
            poiData[i].latitude = latitude + parseInt(poiData[i].latitudeOffset) / 100;
            poiData[i].longitude = longitude + parseInt(poiData[i].longitudeOffset) / 100;
            /*
                Note: setting altitude to '0' will cause places being shown below / above user, depending on the
                user 's GPS signal altitude.
                Using this contant will ignore any altitude information and always show the places on user-level
                altitude.
            */
            poiData[i].altitude = AR.CONST.UNKNOWN_ALTITUDE;
        }
        return poiData;
    }
};


/* Forward locationChanges to custom function. */
AR.context.onLocationChanged = World.locationChanged;

/* Forward clicks in empty area to World. */
AR.context.onScreenClick = World.onScreenClick;