var World = {
	tracker: null,

	init: function initFn() {
		this.createTracker();
		this.createOverlays();
	},

	/*
		First an AR.CloudTracker needs to be created in order to start the recognition engine. 
		It is initialized with your cloud identification token and the id of one of your target collections. 
		Optional parameters are passed as object in the last argument. In this case callback functions for the onLoaded and onError triggers are set.
		Once the tracker is fully loaded the function worldLoaded() is called, should there be an error initializing the CloudTracker the 
		function trackerError() is called instead.
	*/
	createTracker: function createTrackerFn() {
		World.tracker = new AR.CloudTracker("b277eeadc6183ab57a83b07682b3ceba", "54e4b9fe6134bb74351b2aa3", {
			onLoaded: this.trackerLoaded,
			onError: this.trackerError
		});
	},

	startContinuousRecognition: function startContinuousRecognitionFn(interval) {
		/*
			With this function call the continuous recognition mode is started. It is passed three parameters, the first defines the interval in which
			a new recognition is started. It is set in milliseconds and the minimum value is 500. The second parameter defines a callback function for 
			when a recognition cycle is completed. The third and last paramater defines another callback function. This callback is called by the server
			if the recognition interval was set too high for the current network speed.
		*/
		this.tracker.startContinuousRecognition(interval, this.onRecognition, this.onRecognitionError, this.onInterruption);
	},

	/*
		Callback function to handle CloudTracker initializition errors.
	*/
	trackerError: function trackerErrorFn(errorMessage) {
		alert(errorMessage);
	},

	createOverlays: function createOverlaysFn() {
		/*
			To display a banner containing information about the current target as an augmentation an image resource is created and passed to the 
			AR.ImageDrawable. A drawable is a visual component that can be connected to an IR target (AR.Trackable2DObject) or a geolocated
			object (AR.GeoObject). The AR.ImageDrawable is initialized by the image and its size. Optional parameters allow to position it 
			relative to the recognized target.
		*/
		this.bannerImg = new AR.ImageResource("assets/banner.jpg");
		this.bannerImgOverlay = new AR.ImageDrawable(this.bannerImg, 0.4, {
			offsetX: 0,
			offsetY: -0.6,
		});
	},

	/* 
		The onRecognition callback function defines two parameters. The first parameter is a boolean value which indicates if the server was able 
		to detect the target, it's value will be 0 or 1 depending on the outcome. The second parameter a JSON Object will contain metadata about 
		the recognized target, if no target was recognized the JSON object will be empty. 
	*/
	onRecognition: function onRecognitionFn(recognized, response) {
		if (recognized) {
			/*
				Clean Resources from previous recognitions.
			*/
			if (World.wineLabel !== undefined) {
				World.wineLabel.destroy();
			}

			if (World.wineLabelOverlay !== undefined) {
				World.wineLabelOverlay.destroy();
			}

			/*
				To display the label of the recognized wine on top of the previously created banner, another overlay is defined. From the response 
				object returned from the server the 'targetInfo.name' property is read to load the equally named image file.
				The zOrder property (defaults to 0) is set to 1 to make sure it will be positioned on top of the banner.
			*/
			World.wineLabel = new AR.ImageResource("assets/" + response.targetInfo.name + ".jpg");
			World.wineLabelOverlay = new AR.ImageDrawable(World.wineLabel, 0.27, {
				offsetX: -0.5,
				offsetY: -0.6,
				zOrder: 1
			});

			if (World.wineLabelAugmentation !== undefined) {
				World.wineLabelAugmentation.destroy();
			}

			/*
				The following combines everything by creating an AR.Trackable2DObject using the Cloudtracker, the name of the image target and 
				the drawables that should augment the recognized image.
			*/	
			World.wineLabelAugmentation = new AR.Trackable2DObject(World.tracker, response.targetInfo.name , {
				drawables: {
					cam: [World.bannerImgOverlay, World.wineLabelOverlay]
				}
			});
		}
	},

	onRecognitionError: function onRecognitionErrorFn(errorCode, errorMessage) {
		alert("error code: " + errorCode + " error message: " + JSON.stringify(errorMessage));
	},

	/*
		In case the current network the user is connected to, isn't fast enough for the set interval. The server calls this callback function with
		a new suggested interval. To set the new interval the recognition mode first will be restarted.
	*/
	onInterruption: function onInterruptionFn(suggestedInterval) {
		World.tracker.stopContinuousRecognition();
		World.tracker.startContinuousRecognition(suggestedInterval);
	},

	trackerLoaded: function trackerLoadedFn() {
		World.startContinuousRecognition(750);
		World.showUserInstructions();
	},

	showUserInstructions: function showUserInstructionsFn() {
		var cssDivLeft = " style='display: table-cell;vertical-align: middle; text-align: right; width: 20%; padding-right: 15px;'";
		var cssDivRight = " style='display: table-cell;vertical-align: middle; text-align: center;'";
		var img = "style='margin-right:5px'";

		document.getElementById('messageBox').innerHTML =
			"<div" + cssDivLeft + ">Scan: </div>" +
			"<div" + cssDivRight + ">" +
				"<img " + img + " src='assets/austria.jpg'></img>" +
				"<img " + img + " src='assets/brazil.jpg'></img>" +
				"<img " + img + " src='assets/france.jpg'></img>" +
				"<img " + img + " src='assets/germany.jpg'></img>" +
				"<img " + img + " src='assets/italy.jpg'></img>" +
			"</div>";

		setTimeout(function() {
			var e = document.getElementById('messageBox');
			e.parentElement.removeChild(e);
		}, 10000);			
	}
};

World.init();