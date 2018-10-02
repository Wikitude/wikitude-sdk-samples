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

        var themeToUse = isWarning ? "e" : "c";
        var iconToUse = isWarning ? "alert" : "info";

        $("#status-message").html(message);
        $("#popupInfoButton").buttonMarkup({
            theme: themeToUse,
            icon: iconToUse
        });
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

    /* Screen was clicked but no geo-object was hit. */
    onScreenClick: function onScreenClickFn(touchLocation) {
        if (World.currentMarker) {
            World.currentMarker.setDeselected(World.currentMarker);
        }
        AR.hardware.camera.setFocusPointOfInterest(touchLocation);
        AR.hardware.camera.setExposurePointOfInterest(touchLocation);
    },

    /* Display camera control panel. */
    showCamControl: function showCamControlFn() {
        if (World.markerList.length > 0) {

            $("#panel-zoom-range").attr({
                "max": AR.hardware.camera.features.zoomRange.max,
                "min": 1
            });
            /* Update labels on every range movement. */
            $('#panel-zoom-range').change(function() {
                World.updateRangeValues();
            });

            $("input[type='radio']").click(function() {
                World.updateFocusMode();
            });

            $('#panel-focus-distance-range').change(function() {
                World.updateFocusRangeValues();
            });

            $('#panel-flashlight').change(function() {
                World.updateFlashlight();
            });

            World.updateRangeValues();

            /* Only display manual focus distance control if it the device supports it. */
            if (!AR.hardware.camera.manualFocusAvailable) {
                document.getElementById("panel-focus-distance").style.display = "none";
            }

            /* Open panel. */
            $("#panel-control").trigger("updatelayout");
            $("#panel-control").panel("open", 1234);
        } else {

            /* No places are visible, because the are not loaded yet. */
            World.updateStatusMessage('No places available yet', true);
        }
    },

    /* Display camera info panel. */
    showCamInfo: function showCamInfoFn() {
        /* Update panel values. */
        var features = AR.hardware.camera.features;

        $("#camera-focus-modes").html(features.focusModes.join());
        $("#camera-positions").html(features.positions.join());
        $("#camera-zoom-max").html(Math.round(features.zoomRange.max));

        /* Show panel. */
        $("#panel-caminfo").panel("open", 123);
    },

    /* Udpates values shown in "control panel". */
    updateRangeValues: function updateRangeValuesFn() {

        /* Get current slider value (0..100);. */
        var zoomValue = $("#panel-zoom-range").val();

        /* Update UI labels accordingly. */
        $("#panel-zoom-value").html(zoomValue);

        AR.hardware.camera.zoom = parseFloat(zoomValue);
    },

    updateFocusRangeValues: function updateFocusRangeValuesFn() {

        /* Get current slider value (0..100);. */
        var slider_value = $("#panel-focus-distance-range").val();

        /* Update UI labels accordingly. */
        $("#panel-focus-distance-value").html(slider_value);

        AR.hardware.camera.manualFocusDistance = parseInt(slider_value) / 100;
    },

    /* Udpates values shown in "control panel". */
    updateFocusMode: function updateFocusModeFn() {

        /* Get current checkbox status. */
        var radioValue = $("input[name='panel-focus-auto']:checked").val();

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
        AR.hardware.camera.flashlight = $("#panel-flashlight").is(":checked");
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