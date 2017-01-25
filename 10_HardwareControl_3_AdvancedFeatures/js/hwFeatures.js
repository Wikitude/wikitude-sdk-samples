// implementation of AR-Experience (aka "World")
var World = {
	// you may request new data from server periodically, however: in this sample data is only requested once
	isRequestingData: false,

	// true once data was fetched
	initiallyLoadedData: false,

	// different POI-Marker assets
	markerDrawable_idle: null,
	markerDrawable_selected: null,
	markerDrawable_directionIndicator: null,

	// list of AR.GeoObjects that are currently shown in the scene / World
	markerList: [],

	// The last selected marker
	currentMarker: null,

	// called to inject new POI data
	loadPoisFromJsonData: function loadPoisFromJsonDataFn(poiData) {

		// empty list of visible markers
		World.markerList = [];

		// start loading marker assets
		World.markerDrawable_idle = new AR.ImageResource("assets/marker_idle.png");
		World.markerDrawable_selected = new AR.ImageResource("assets/marker_selected.png");
		World.markerDrawable_directionIndicator = new AR.ImageResource("assets/indi.png");

		// loop through POI-information and create an AR.GeoObject (=Marker) per POI
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

	// updates status message shon in small "i"-button aligned bottom center
	updateStatusMessage: function updateStatusMessageFn(message, isWarning) {

		var themeToUse = isWarning ? "e" : "c";
		var iconToUse = isWarning ? "alert" : "info";

		$("#status-message").html(message);
		$("#popupInfoButton").buttonMarkup({
			theme: themeToUse
		});
		$("#popupInfoButton").buttonMarkup({
			icon: iconToUse
		});
	},

	// location updates, fired every time you call architectView.setLocation() in native environment
	locationChanged: function locationChangedFn(lat, lon, alt, acc) {
		// request data if not already present
		if (!World.initiallyLoadedData) {
			World.requestDataFromLocal(lat, lon);
			World.initiallyLoadedData = true;
		}
	},

	// fired when user pressed maker in cam
	onMarkerSelected: function onMarkerSelectedFn(marker) {

		// deselect previous marker
		if (World.currentMarker) {
			if (World.currentMarker.poiData.id == marker.poiData.id) {
				return;
			}
			World.currentMarker.setDeselected(World.currentMarker);
		}

		// highlight current one
		marker.setSelected(marker);
		World.currentMarker = marker;
	},

	// screen was clicked but no geo-object was hit
	onScreenClick: function onScreenClickFn() {
		if (World.currentMarker) {
			World.currentMarker.setDeselected(World.currentMarker);
		}
	},

	// display camera control panel
	showCamControl: function showCamControlFn() {
		if (World.markerList.length > 0) {

			// update labels on every range movement
			$('#panel-zoom-range').change(function() {
				World.updateRangeValues();
			});
        
        	$("input[type='radio']").click(function(){
        		World.updateFocusMode();
        	});

			$('#panel-focus-distance-range').change(function() {
				World.updateFocusRangeValues();
			});

			$('#panel-flashlight').change(function() {
				World.updateFlashlight();
			});
			
			World.updateRangeValues();

            // only display manual focus distance control if it the device supports it
            if (!AR.hardware.camera.manualFocusAvailable) {
                document.getElementById("panel-focus-distance").style.display = "none";
            }
            
			// open panel
			$("#panel-control").trigger("updatelayout");
			$("#panel-control").panel("open", 1234);
		} else {

			// no places are visible, because the are not loaded yet
			World.updateStatusMessage('No places available yet', true);
		}
	},

	// display camera info panel
	showCamInfo: function showCamInfoFn() {
		// update panel values
		var features = AR.hardware.camera.features;
		
		$("#camera-focus-modes").html(features.focusModes.join());
		$("#camera-positions").html(features.positions.join());
		$("#camera-zoom-max").html(Math.round(features.zoomRange.max));

		// show panel
		$("#panel-caminfo").panel("open", 123);
	},

	// udpates values shown in "control panel"
	updateRangeValues: function updateRangeValuesFn() {

		// get current slider value (0..100);
		var slider_value = $("#panel-zoom-range").val();

		// zoom level (1 up to max available)
		var maxRangeValue = (AR.hardware.camera.features.zoomRange.max - 1) * (slider_value / 100) + 1;

		// update UI labels accordingly
		$("#panel-zoom-value").html(maxRangeValue);

		AR.hardware.camera.zoom = maxRangeValue;
	},

	updateFocusRangeValues: function updateFocusRangeValuesFn() {

		// get current slider value (0..100);
		var slider_value = $("#panel-focus-distance-range").val();

		// update UI labels accordingly
		$("#panel-focus-distance-value").html(slider_value);

		AR.hardware.camera.manualFocusDistance = parseInt(slider_value) / 100;
	},
	
	// udpates values shown in "control panel"
	updateFocusMode: function updateFocusModeFn() {
		
		// get current checkbox status
		var radioValue = $("input[name='panel-focus-auto']:checked").val();
		
		if (radioValue == "continuous") {
			AR.hardware.camera.focusMode = AR.CONST.CAMERA_FOCUS_MODE.CONTINUOUS;
		} else if (radioValue == "once") {
			AR.hardware.camera.focusMode = AR.CONST.CAMERA_FOCUS_MODE.ONCE;
		} else {
			AR.hardware.camera.focusMode = AR.CONST.CAMERA_FOCUS_MODE.OFF;
		}
	},

	// udpates values shown in "control panel"
	updateFlashlight: function updateFlashlightFn() {
		
		// get current checkbox status
		var check_value = $("#panel-flashlight").is(":checked");
		AR.hardware.camera.flashlight = check_value;
	},
	
	/*
		In case the data of your ARchitect World is static the content should be stored within the application. 
		Create a JavaScript file (e.g. myJsonData.js) where a globally accessible variable is defined.
		Include the JavaScript in the ARchitect Worlds HTML by adding <script src="js/myJsonData.js"/> to make POI information available anywhere in your JavaScript.
	*/

	// request POI data
	requestDataFromLocal: function requestDataFromLocalFn(lat, lon) {

		var poisNearby = Helper.bringPlacesToUser(myJsonData, lat, lon);
		World.loadPoisFromJsonData(poisNearby);

	}

};

var Helper = {

	/* 
		For demo purpose only, this method takes poi data and a center point (latitude, longitude) to relocate the given places around the user
	*/
	bringPlacesToUser: function bringPlacesToUserFn(poiData, latitude, longitude) {
		for (var i = 0; i < poiData.length; i++) {
			poiData[i].latitude = latitude + parseInt(poiData[i].latitudeOffset) / 100;
			poiData[i].longitude = longitude + parseInt(poiData[i].longitudeOffset) / 100;
			/* 
			Note: setting altitude to '0'
			will cause places being shown below / above user,
			depending on the user 's GPS signal altitude. 
				Using this contant will ignore any altitude information and always show the places on user-level altitude
			*/
			poiData[i].altitude = AR.CONST.UNKNOWN_ALTITUDE;
		}
		return poiData;
	}
}


/* forward locationChanges to custom function */
AR.context.onLocationChanged = World.locationChanged;

/* forward clicks in empty area to World */
AR.context.onScreenClick = World.onScreenClick;