var World = {
	loaded: false,
	hasVideoStarted:false,

	init: function initFn() {
		this.createOverlays();
	},

	createOverlays: function createOverlaysFn() {
		/* Initialize ClientTracker */
		this.targetCollectionResource = new AR.TargetCollectionResource("assets/magazine.wtc", {
            onError: function(errorMessage) {
            	alert(errorMessage);
            }
        });

        this.tracker = new AR.ImageTracker(this.targetCollectionResource, {
            onTargetsLoaded: this.worldLoaded,
            onError: function(errorMessage) {
            	alert(errorMessage);
            }
        });

		/*
			Besides images, text and HTML content you are able to display videos in augmented reality. With the help of AR.VideoDrawables you can add a video on top of any image recognition target (AR.ImageTrackable) or have it displayed at any geo location (AR.GeoObject). Like any other drawable you can position, scale, rotate and change the opacity of the video drawable.

			The video we use for this example is "video.mp4". As with all resources the video can be loaded locally from the application bundle or remotely from any server. In this example the video file is already bundled with the application.

			The URL and the size are required when creating a new AR.VideoDrawable. Optionally the offsetX and offsetY parameters are set to position the video on the target. The values for the offsets are in SDUs. If you want to know more about SDUs look up the code reference.
		*/
		var video = new AR.VideoDrawable("assets/video.mp4", 0.40, {
			translate: {
				y: -0.3
			}
		});

		/*
			Adding the video to the image target is straight forward and similar like adding any other drawable to an image target.

			Note that this time we use "*" as target name. That means that the AR.ImageTrackable will respond to any target that is defined in the target collection. You can use wildcards to specify more complex name matchings. E.g. 'target_?' to reference 'target_1' through 'target_9' or 'target*' for any targets names that start with 'target'.

			To start the video immediately after the target is recognized we call play inside the onImageRecognized trigger. Supplying -1 to play tells the Wikitude SDK to loop the video infinitely. Choose any positive number to re-play it multiple times.

			Once the video has been started for the first time (indicated by this.hasVideoStarted), we call pause every time the target is lost and resume every time the tracker is found again to continue the video where it left off.
		*/
		var pageOne = new AR.ImageTrackable(this.tracker, "*", {
			drawables: {
				cam: [video]
			},
			onImageRecognized: function onImageRecognizedFn() {
				if (this.hasVideoStarted) {
					video.resume();
				}
				else {
					this.hasVideoStarted = true;
					video.play(-1);
				}
				World.removeLoadingBar();				
			},
			onImageLost: function onImageLostFn() {
				video.pause();
			},
            onError: function(errorMessage) {
            	alert(errorMessage);
            }
		});
	},

	removeLoadingBar: function() {
		if (!World.loaded) {
			var e = document.getElementById('loadingMessage');
			e.parentElement.removeChild(e);
			World.loaded = true;
		}
	},

	worldLoaded: function worldLoadedFn() {
		var cssDivInstructions = " style='display: table-cell;vertical-align: middle; text-align: right; width: 50%; padding-right: 15px;'";
		var cssDivSurfer = " style='display: table-cell;vertical-align: middle; text-align: left; padding-right: 15px; width: 38px'";
		var cssDivBiker = " style='display: table-cell;vertical-align: middle; text-align: left; padding-right: 15px;'";
		document.getElementById('loadingMessage').innerHTML =
            "<div" + cssDivInstructions + ">Scan Target &#35;1 (surfer) or &#35;2 (biker):</div>" +
            "<div" + cssDivSurfer + "><img src='assets/surfer.png'></img></div>" +
            "<div" + cssDivBiker + "><img src='assets/bike.png'></img></div>";
	}
};

World.init();
