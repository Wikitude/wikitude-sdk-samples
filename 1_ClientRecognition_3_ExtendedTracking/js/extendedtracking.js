var World = {
	loaded: false,

	init: function initFn() {
		this.createOverlays();
	},

	createOverlays: function createOverlaysFn() {
		/*
			First an AR.ClientTracker needs to be created in order to start the recognition engine. It is initialized with a URL specific to the target collection. Optional parameters are passed as object in the last argument. In this case a callback function for the onLoaded trigger is set. Once the tracker is fully loaded the function worldLoaded() is called.

			Important: If you replace the tracker file with your own, make sure to change the target name accordingly.
			Use a specific target name to respond only to a certain target or use a wildcard to respond to any or a certain group of targets.

			Adding multiple targets to a target collection is straightforward. Simply follow our Target Management Tool documentation. Each target in the target collection is identified by its target name. By using this target name, it is possible to create an AR.Trackable2DObject for every target in the target collection.
		*/
		this.tracker = new AR.ClientTracker("assets/stones.wtc", {
			onLoaded: this.worldLoaded
		});


		//@@TODO add model creation code
		var pipes = new AR.Model("assets/pipes.wt3", {
			rotate: {
				roll: 0.0,
			    tilt: 90.0,
			    heading: 0.0
			},
			scale: {
				x: 0.3,
				y: 0.3,
				z: 0.3
			}	
		});

		/*
			This combines everything by creating an AR.Trackable2DObject with the previously created tracker, the name of the image target as defined in the target collection and the drawable that should augment the recognized image.
			Note that this time no specific target name is used
		*/
		var pageOne = new AR.Trackable2DObject(this.tracker, "*", {
			drawables: {
				cam: [pipes]
			}, 			
			enableExtendedTracking: true,
			onExtendedTrackingQualityChanged: function (targetName, oldTrackingQuality, newTrackingQuality) {				
				var backgroundColor;
				var trackingQualityText;
				
				if ( -1 == newTrackingQuality ) {
					backgroundColor = '#FF3420';
					trackingQualityText = 'Bad';
				} else if ( 0 == newTrackingQuality ) {
					backgroundColor = '#FFD900';
					trackingQualityText = 'Average';
				} else {
					backgroundColor = '#6BFF00';
					trackingQualityText = 'Good';
				}
				var cssDivInstructions = " style='display: table-cell;vertical-align: middle; text-align: middle; width: 50%; padding-right: 15px;'";
				var messageBox = document.getElementById('loadingMessage');
				messageBox.style.backgroundColor = backgroundColor;
				messageBox.innerHTML = "<div" + cssDivInstructions + ">Tracking Quality: " + trackingQualityText + "</div>";
				messageBox.style.display = 'block';
			}
		});
	},
	worldLoaded: function worldLoadedFn() {
		var cssDivInstructions = " style='display: table-cell;vertical-align: middle; text-align: right; width: 50%; padding-right: 15px;'";
		var cssDivThumbnail = " style='display: table-cell;vertical-align: middle; text-align: left; padding-right: 15px; width: 38px'";
		document.getElementById('loadingMessage').innerHTML =
			"<div" + cssDivInstructions + ">Scan Target &#35;1 (stones):</div>" +
			"<div" + cssDivThumbnail + "><img src='assets/Stone_Wall_thumb.jpg'></img></div>";

		// Remove Scan target message after 10 sec.
		setTimeout(function() {
			var e = document.getElementById('loadingMessage');
			e.style.display = 'none';
		}, 10000);
	}
};

World.init();
