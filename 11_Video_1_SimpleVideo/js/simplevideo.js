var World = {
    hasVideoStarted: false,

    init: function initFn() {
        this.createOverlays();
    },

    createOverlays: function createOverlaysFn() {
        /*
            First a AR.TargetCollectionResource is created with the path to the Wikitude Target Collection(.wtc) file.
            This .wtc file can be created from images using the Wikitude Studio. More information on how to create them
            can be found in the documentation in the TargetManagement section.
            Each target in the target collection is identified by its target name. By using this
            target name, it is possible to create an AR.ImageTrackable for every target in the target collection.
         */
        this.targetCollectionResource = new AR.TargetCollectionResource("assets/magazine.wtc", {
            onError: World.onError
        });

        /*
            This resource is then used as parameter to create an AR.ImageTracker. Optional parameters are passed as
            object in the last argument. In this case a callback function for the onTargetsLoaded trigger is set. Once
            the tracker loaded all of its target images this callback function is invoked. We also set the callback
            function for the onError trigger which provides a sting containing a description of the error.
         */
        this.tracker = new AR.ImageTracker(this.targetCollectionResource, {
            onTargetsLoaded: World.showInfoBar,
            onError: World.onError
        });

        /*
            Besides images, text and HTML content you are able to display videos in augmented reality. With the
            help of AR.VideoDrawables you can add a video on top of any image, object or instant recognition target
            (AR.ImageTrackable, AR.ObjectTrackable or AR.InstantTrackable) or have it displayed at any geo location
            (AR.GeoObject).
            Like any other drawable you can position, scale, rotate and change the opacity of the video drawable.

            The video we use for this example is "video.mp4". As with all resources the video can be loaded locally
            from the application bundle or remotely from any server. In this example the video file is already
            bundled with the application.

            The URL and the size are required when creating a new AR.VideoDrawable. Optionally translate, rotate and
            scale can be  set to position the video on the target.
        */
        this.video = new AR.VideoDrawable("assets/video.mp4", 0.40, {
            translate: {
                y: -0.3
            },
            onError: World.onError
        });

        /*
            Adding the video to the image target is straight forward and similar like adding any other drawable to
            an image target.

            To start the video immediately after the target is recognized we call play inside the onImageRecognized
            trigger. Supplying -1 to play tells the Wikitude SDK to loop the video infinitely. Choose any positive
            number to re-play it multiple times.

            Once the video has been started for the first time (indicated by this.hasVideoStarted), we call pause
            every time the target is lost and resume every time the tracker is found again to continue the video
            where it left off.
        */
        this.trackable = new AR.ImageTrackable(this.tracker, "pageOne", {
            drawables: {
                cam: [World.video]
            },
            onImageRecognized: function onImageRecognizedFn() {
                if (this.hasVideoStarted) {
                    World.video.resume();
                } else {
                    this.hasVideoStarted = true;
                    World.video.play(-1);
                }
                World.hideInfoBar();
            },
            onImageLost: function onImageLostFn() {
                World.video.pause();
            },
            onError: World.onError
        });
    },

    onError: function onErrorFn(error) {
        alert(error);
    },

    hideInfoBar: function hideInfoBarFn() {
        document.getElementById("infoBox").style.display = "none";
    },

    showInfoBar: function worldLoadedFn() {
        document.getElementById("infoBox").style.display = "table";
        document.getElementById("loadingMessage").style.display = "none";
    }
};

World.init();