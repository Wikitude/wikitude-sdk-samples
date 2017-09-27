// information about server communication. This sample webservice is provided by Wikitude and returns random dummy places near given location
var ServerInformation = {
	POIDATA_SERVER: "https://example.wikitude.com/GetSamplePois/",
	POIDATA_SERVER_ARG_LAT: "lat",
	POIDATA_SERVER_ARG_LON: "lon",
	POIDATA_SERVER_ARG_NR_POIS: "nrPois"
};

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

	locationUpdateCounter: 0,
	updatePlacemarkDistancesEveryXLocationUpdates: 10,

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

		// updates distance information of all placemarks
		World.updateDistanceToUserValues();

		World.updateStatusMessage(currentPlaceNr + ' places loaded');
	},

	// sets/updates distances of all makers so they are available way faster than calling (time-consuming) distanceToUser() method all the time
	updateDistanceToUserValues: function updateDistanceToUserValuesFn() {
		for (var i = 0; i < World.markerList.length; i++) {
			World.markerList[i].distanceToUser = World.markerList[i].markerObject.locations[0].distanceToUser();
		}
	},

	// updates status message shown in small "i"-button aligned bottom center
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
			World.requestDataFromServer(lat, lon);
			World.initiallyLoadedData = true;
		} else if (World.locationUpdateCounter === 0) {
			// update placemark distance information frequently, you max also update distances only every 10m with some more effort
			World.updateDistanceToUserValues();
		}

		// helper used to update placemark information every now and then (e.g. every 10 location upadtes fired)
		World.locationUpdateCounter = (++World.locationUpdateCounter % World.updatePlacemarkDistancesEveryXLocationUpdates);
	},

	/*
		POIs usually have a name and sometimes a quite long description. 
		Depending on your content type you may e.g. display a marker with its name and cropped description but allow the user to get more information after selecting it.
	*/

	// fired when user pressed maker in cam
	onMarkerSelected: function onMarkerSelectedFn(marker) {
		World.currentMarker = marker;

		/*
			In this sample a POI detail panel appears when pressing a cam-marker (the blue box with title & description), 
			compare index.html in the sample's directory.
		*/
		// update panel values
		$("#poi-detail-title").html(marker.poiData.title);
		$("#poi-detail-description").html(marker.poiData.description);

		
		// It's ok for AR.Location subclass objects to return a distance of `undefined`. In case such a distance was calculated when all distances were queried in `updateDistanceToUserValues`, we recalculate this specific distance before we update the UI.
		if( undefined == marker.distanceToUser ) {
			marker.distanceToUser = marker.markerObject.locations[0].distanceToUser();
		}

		// distance and altitude are measured in meters by the SDK. You may convert them to miles / feet if required.
		var distanceToUserValue = (marker.distanceToUser > 999) ? ((marker.distanceToUser / 1000).toFixed(2) + " km") : (Math.round(marker.distanceToUser) + " m");

		$("#poi-detail-distance").html(distanceToUserValue);

		// show panel
		$("#panel-poidetail").panel("open", 123);

		$(".ui-panel-dismiss").unbind("mousedown");

		// deselect AR-marker when user exits detail screen div.
		$("#panel-poidetail").on("panelbeforeclose", function(event, ui) {
			World.currentMarker.setDeselected(World.currentMarker);
		});
	},

	// screen was clicked but no geo-object was hit
	onScreenClick: function onScreenClickFn() {
		// you may handle clicks on empty AR space too
	},

	// returns distance in meters of placemark with maxdistance * 1.1
	getMaxDistance: function getMaxDistanceFn() {

		// sort places by distance so the first entry is the one with the maximum distance
		World.markerList.sort(World.sortByDistanceSortingDescending);

		// use distanceToUser to get max-distance
		var maxDistanceMeters = World.markerList[0].distanceToUser;

		// return maximum distance times some factor >1.0 so ther is some room left and small movements of user don't cause places far away to disappear.
		return maxDistanceMeters * 1.1;
	},

	/*
		JQuery provides a number of tools to load data from a remote origin. 	
		It is highly recommended to use the JSON format for POI information. Requesting and parsing is done in a few lines of code.
		Use e.g. 'AR.context.onLocationChanged = World.locationChanged;' to define the method invoked on location updates. 
		In this sample POI information is requested after the very first location update. 

		This sample uses a test-service of Wikitude which randomly delivers geo-location data around the passed latitude/longitude user location.
		You have to update 'ServerInformation' data to use your own own server. Also ensure the JSON format is same as in previous sample's 'myJsonData.js'-file.
	*/

	// request POI data
	requestDataFromServer: function requestDataFromServerFn(lat, lon) {

		// set helper var to avoid requesting places while loading
		World.isRequestingData = true;
		World.updateStatusMessage('Requesting places from web-service');

		// server-url to JSON content provider
		var serverUrl = ServerInformation.POIDATA_SERVER + "?" + ServerInformation.POIDATA_SERVER_ARG_LAT + "=" + lat + "&" + ServerInformation.POIDATA_SERVER_ARG_LON + "=" + lon + "&" + ServerInformation.POIDATA_SERVER_ARG_NR_POIS + "=20";

		var jqxhr = $.getJSON(serverUrl, function(data) {
				World.loadPoisFromJsonData(data);
			})
			.error(function(err) {
				World.updateStatusMessage("Invalid web-service response.", true);
				World.isRequestingData = false;
			})
			.complete(function() {
				World.isRequestingData = false;
			});
	},

	// helper to sort places by distance
	sortByDistanceSorting: function(a, b) {
		return a.distanceToUser - b.distanceToUser;
	},

	// helper to sort places by distance, descending
	sortByDistanceSortingDescending: function(a, b) {
		return b.distanceToUser - a.distanceToUser;
	}

};


/* forward locationChanges to custom function */
AR.context.onLocationChanged = World.locationChanged;

/* forward clicks in empty area to World */
AR.context.onScreenClick = World.onScreenClick;