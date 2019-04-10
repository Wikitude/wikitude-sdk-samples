var World = {

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
            Create a transparent video drawable:
            This bonus example shows you how to add transparent videos on top of a target. Transparent videos
            require some extra preparation work.

            Summarizing the required steps, here is what you need to do in order to use transparent videos in a
            simple list. We are describing each of the steps in more detail.

            1.  Produce a green screen (chroma key) video
            2.  Edit that video using standard video processing software
                and remove the green screen. Export your result into a file format,
                which can handle alpha channel information (e.g. Apple PreRes 4444)
            3.  Convert the video from step 2 using the script in the tools folder
            4.  Add it to a target image

            Producing a transparent video is usually done using a green screen for filming and a technique called
            chroma key to replace the green background with transparency. Extensive information is available on the
            internet that should help you get started on this topic.

            There are different video codecs that support alpha channels for motion picture and most of them will
            work as your raw material. We have extensively tested Apple ProRes 4444 codec for our own development
            and were satisfied with the results.

            The Wikitude SDK can render H.264 encoded videos, which is a codec that in practice does not support an
            alpha channel. The solution here is to include in the alpha channel in a separate (visible) part of the
            video. The video is split vertically consisting of a color and a alpha channel in the final video below
            each other.

            The upper half of the image transports the color information for the final video while the lower half
            includes a grayscale representation of the alpha layer. White areas will be fully opaque and black
            areas will be fully transparent. If you are familiar with Photoshop, think of the lower half as a mask.
            Resulting videos have an height that is exactly twice as big as the input video.

            To convert your raw video to a valid input video for the SDK we need to re-encode the video and
            automatically create the alpha mask. The script below uses ffmpeg to do so and wraps the necessary
            commands. Follow these simple steps:

            MacOS X
            Open the Terminal application
            Input cd <SDK>/tools/video/MacOSX. Replace <SDK> with the path to the SDK folder
            Execute sh convert.sh <input video> <output video>. Replace <input video> with the path to your
            transparent video and <output video> with the path where you want the output video to be stored.

            Windows
            Open the Command Line
            cd <SDK>\tools\video\Windows. Replace <SDK> with the path to the SDK folder
            Execute convert.bat <input video> <output video>. Replace <input video> with the path to your
            transparent video and <output video> with the path where you want the output video to be stored.
            This creates the required video with a vertically split color and alpha channel.

            Adding the transparent H.264 video to a target image is easy and accomplished in the same way as any
            other video is added. Just make sure to set the isTransparent property of the AR.VideoDrawable to true.
        */
        var video = new AR.VideoDrawable("assets/transparentVideo.mp4", 0.7, {
            translate: {
                x: -0.2,
                y: -0.12
            },
            isTransparent: true,
            onError: World.onError
        });

        /* Create a button which opens a website in a browser window after a click. */
        this.imgButton = new AR.ImageResource("assets/wwwButton.jpg", {
            onError: World.onError
        });
        var pageOneButton = this.createWwwButton("https://www.blue-tomato.com/en-US/products/?q=sup", 0.1, {
            translate: {
                x: -0.05,
                y: 0.2
            },
            zOrder: 1
        });
        video.play(-1);
        video.pause();

        /*
            Adding the video to the image target is straight forward and similar like adding any other drawable to
            an image target.
        */
        this.trackable = new AR.ImageTrackable(this.tracker, "pageOne", {
            drawables: {
                cam: [video, pageOneButton]
            },
            onImageRecognized: function onImageRecognizedFn() {
                video.resume();
                World.hideInfoBar();
            },
            onImageLost: function onImageLostFn() {
                video.pause();
            },
            onError: World.onError
        });
    },

    createWwwButton: function createWwwButtonFn(url, size, options) {
        options.onClick = function() {
            /* this call opens a url in a browser window. */
            AR.context.openInBrowser(url);
        };
        return new AR.ImageDrawable(this.imgButton, size, options);
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