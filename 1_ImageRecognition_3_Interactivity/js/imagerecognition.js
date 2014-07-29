var World = {
	loaded: false,

	init: function initFn() {
		/* 
			Disable all sensors in "IR-only" Worlds to save performance. If the property is set to true, any geo-related components (such as GeoObjects and ActionRanges) are active. If the property is set to false, any geo-related components will not be visible on the screen, and triggers will not fire.
		*/
		AR.context.services.sensors = false;
		this.createOverlays();
	},

	createOverlays: function createOverlaysFn() {
		/*
			First an AR.Tracker needs to be created in order to start the recognition engine. It is initialized with a URL specific to the target collection. Optional parameters are passed as object in the last argument. In this case a callback function for the onLoaded trigger is set. Once the tracker is fully loaded the function worldLoaded() is called.

			Important: If you replace the tracker file with your own, make sure to change the target name accordingly.
			Use a specific target name to respond only to a certain target or use a wildcard to respond to any or a certain group of targets.

			Adding multiple targets to a target collection is straightforward. Simply follow our Target Management Tool documentation. Each target in the target collection is identified by its target name. By using this target name, it is possible to create an AR.Trackable2DObject for every target in the target collection.
		*/
		this.tracker = new AR.Tracker("assets/magazine.wtc", {
			onLoaded: this.worldLoaded
		});

		/*
			The button is created similar to the overlay feature. An AR.ImageResource defines the look of the button and is reused for both buttons.
		*/
		this.imgButton = new AR.ImageResource("assets/wwwButton.jpg");

		/*
			The next step is to create the augmentation. In this example an image resource is created and passed to the AR.ImageDrawable. A drawable is a visual component that can be connected to an IR target (AR.Trackable2DObject) or a geolocated object (AR.GeoObject). The AR.ImageDrawable is initialized by the image and its size. Optional parameters allow for position it relative to the recognized target.
		*/
		var imgOne = new AR.ImageResource("assets/imageOne.png");
		var overlayOne = new AR.ImageDrawable(imgOne, 1, {
			offsetX: -0.15,
			offsetY: 0
		});

		/*
			For each target an AR.ImageDrawable for the button is created by utilizing the helper function createWwwButton(url, options). The returned drawable is then added to the drawables.cam array on creation of the AR.Trackable2DObject.
		*/
		var pageOneButton = this.createWwwButton("http://n1sco.com/specifications/", 0.1, {
			offsetX: -0.25,
			offsetY: -0.25,
			zOrder: 1
		});

		/*
			This combines everything by creating an AR.Trackable2DObject with the previously created tracker, the name of the image target as defined in the target collection and the drawable that should augment the recognized image.
			Note that this time a specific target name is used to create a specific augmentation for that exact target.
		*/
		var pageOne = new AR.Trackable2DObject(this.tracker, "pageOne", {
			drawables: {
				cam: [overlayOne, pageOneButton]
			}
		});

		/*
			Similar to the first part, the image resource and the AR.ImageDrawable for the second overlay are created.
		*/
		var imgTwo = new AR.ImageResource("assets/imageTwo.png");
		var overlayTwo = new AR.ImageDrawable(imgTwo, 0.5, {
			offsetX: 0.12,
			offsetY: -0.01
		});
		var pageTwoButton = this.createWwwButton("http://goo.gl/qxck1", 0.15, {
			offsetX: 0,
			offsetY: -0.25,
			zOrder: 1
		});

		/*
			The AR.Trackable2DObject for the second page uses the same tracker but with a different target name and the second overlay.
		*/
		var pageTwo = new AR.Trackable2DObject(this.tracker, "pageTwo", {
			drawables: {
				cam: [overlayTwo, pageTwoButton]
			}
		});
	},

	createWwwButton: function createWwwButtonFn(url, size, options) {
		/*
			As the button should be clickable the onClick trigger is defined in the options passed to the AR.ImageDrawable. In general each drawable can be made clickable by defining its onClick trigger. The function assigned to the click trigger calls AR.context.openInBrowser with the specified URL, which opens the URL in the browser.
		*/
		options.onClick = function() {
			AR.context.openInBrowser(url);
		};
		return new AR.ImageDrawable(this.imgButton, size, options);
	},

	worldLoaded: function worldLoadedFn() {
		var cssDivInstructions = " style='display: table-cell;vertical-align: middle; text-align: right; width: 50%; padding-right: 15px;'";
		var cssDivSurfer = " style='display: table-cell;vertical-align: middle; text-align: left; padding-right: 15px; width: 38px'";
		var cssDivBiker = " style='display: table-cell;vertical-align: middle; text-align: left; padding-right: 15px;'";
		document.getElementById('loadingMessage').innerHTML =
			"<div" + cssDivInstructions + ">Scan Target &#35;1 (surfer) or &#35;2 (biker):</div>" +
			"<div" + cssDivSurfer + "><img src='assets/surfer.png'></img></div>" +
			"<div" + cssDivBiker + "><img src='assets/bike.png'></img></div>";

		// Remove Scan target message after 10 sec.
		setTimeout(function() {
			var e = document.getElementById('loadingMessage');
			e.parentElement.removeChild(e);
		}, 10000);
	}
};

World.init();