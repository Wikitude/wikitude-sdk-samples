var World = {
	loaded: false,


	init: function initFn() {
		this.createOverlays();
	},

	createOverlays: function createOverlaysFn() {
		// Initialize ClientTracker
		this.tracker = new AR.ClientTracker("assets/magazine.wtc", {
			onLoaded: this.worldLoaded
		});

		// Create play button which is used for starting the video
		var playButtonImg = new AR.ImageResource("assets/playButton.png");
		var playButton = new AR.ImageDrawable(playButtonImg, 0.3, {
			enabled: false,
			clicked: false,
			zOrder: 2,
			onClick: function playButtonClicked() {
				World.video.play(1);
				World.video.playing = true;
				playButton.clicked = true;
			},
			offsetY: -0.3
		});

		/*
			Besides images, text and HTML content you are able to display videos in augmented reality. With the help of AR.VideoDrawables you can add a video on top of any image recognition target (AR.Trackable2DObject) or have it displayed at any geo location (AR.GeoObject). Like any other drawable you can position, scale, rotate and change the opacity of the video drawable.

			The video we use for this example is "video.mp4". As with all resources the video can be loaded locally from the application bundle or remotely from any server. In this example the video file is already bundled with the application.

			The URL and the size are required when creating a new AR.VideoDrawable. Optionally the offsetX and offsetY parameters are set to position the video on the target. The values for the offsets are in SDUs. If you want to know more about SDUs look up the API reference.

			The class AR.VideoDrawable offers functions and triggers to control playback of the video and get notified of playback states. The following implementation makes use of the triggers and states to display an image of a play button on top of the target. Once the user clicks the play button the video starts to play.

			Once the user clicks the button the video is played once: video.play(1). Starting the playback fires the onPlaybackStarted trigger and hides the playButton. When playback finishes the onFinishedPlaying trigger is called that shows the playButton again.

			To give the user the possibility to pause the video the AR.VideoDrawable's click trigger is used. If the video is playing and the user is clicking the function pause() is called which then pauses playback. Clicking the video again resumes playback.
		*/
		this.video = new AR.VideoDrawable("assets/video.mp4", 0.4, {
			offsetY: playButton.offsetY,
			zOrder: 1,
			onLoaded: function videoLoaded() {
				playButton.enabled = true;
			},
			onPlaybackStarted: function videoPlaying() {
				playButton.enabled = false;
				World.video.enabled = true;
			},
			onFinishedPlaying: function videoFinished() {
				playButton.enabled = true;
				World.video.playing = false;
				World.video.enabled = false;
			},
			onClick: function videoClicked() {
				if (playButton.clicked) {
					playButton.clicked = false;
				} else if (World.video.playing) {
					World.video.pause();
					World.video.playing = false;
				} else {
					World.video.resume();
					World.video.playing = true;
				}
			}
		});

		/*
			Adding the video to the image target is straight forward and similar like adding any other drawable to an image target.

			Note that this time we use "*" as target name. That means that the AR.Trackable2DObject will respond to any target that is defined in the specified tracker. You can use wildcards to specify more complex name matchings. E.g. 'target_?' to reference 'target_1' through 'target_9' or 'target*' for any targets names that start with 'target'.

			This time we don't pause/resume the video when target is lost/recognized but instead snap the video to the screen so that the user can still watch it even when the target image is not visible for the camera. To Do so we set the 'snapToScreen.enabledOnExitFieldOfVision' property to true which indicates that the snapping should occur when the onExitFieldOfVision event occurs. Setting the 'snapToScreen.enabled' property to true in the onExitFieldOfVision trigger will not work because the target is already lost then and snap to screen can only activated for Trackable2DObject that are currently in the onEnterFieldOfVision state.
			When the onEnterFieldOfVision event occurs we set 'snapToScreen.enabled' to false which will unsnap the drawables from the cam and augmentation will stick on the target again.

			Of course the video will continue playing back in the meantime so that the user can watch the entire video without any interruption.
		*/
		this.pageOne = new AR.Trackable2DObject(this.tracker, "*", {
			drawables: {
				cam: [this.video, playButton]
			},
			onEnterFieldOfVision: function onEnterFieldOfVisionFn() {
				World.pageOne.snapToScreen.enabled = false;
			},
			snapToScreen: {
				enabledOnExitFieldOfVision: true,
				snapContainer: document.getElementById('snapContainer')
			}
		});
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
