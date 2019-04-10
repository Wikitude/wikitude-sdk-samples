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
            The next step is to create the augmentation. In this example an image resource is created and passed to the
            AR.ImageDrawable. A drawable is a visual component that can be connected to a Trackable
            (AR.ImageTrackable, AR.InstantTrackable or AR.ObjectTrackable) or a geolocated object (AR.GeoObject). The
            AR.ImageDrawable is initialized by the image and its size. Optional parameters allow for transformations
            relative to the recognized target.
        */

        /*
            The button is created similar to the overlay feature. An AR.ImageResource defines the look of the button
            and is reused for both buttons.
        */
        this.imgButton = new AR.ImageResource("assets/wwwButton.jpg", {
            onError: World.onError
        });

        /* Create overlay for page one of the magazine. */
        var imgOne = new AR.ImageResource("assets/imageOne.png", {
            onError: World.onError
        });
        var overlayOne = new AR.ImageDrawable(imgOne, 1, {
            translate: {
                x: -0.15
            }
        });

        /*
            For each target an AR.ImageDrawable for the button is created by utilizing the helper function
            createWwwButton(url, options). The returned drawable is then added to the drawables.cam array on
            creation of the AR.ImageTrackable.
        */
        var pageOneButton = this.createWwwButton("https://www.blue-tomato.com/en-US/products/?q=sup", 0.1, {
            translate: {
                x: -0.25,
                y: -0.25
            },
            zOrder: 1
        });

        /*
            This combines everything by creating an AR.ImageTrackable with the previously created tracker,
            the name of the image target and the drawable that should augment the recognized image.

            Important: If you replace the tracker file with your own, make sure to change the target name accordingly.
            Use a specific target name to respond only to a certain target or use a wildcard to respond to any or a
            certain group of targets.
        */
        this.pageOne = new AR.ImageTrackable(this.tracker, "pageOne", {
            drawables: {
                cam: [overlayOne, pageOneButton]
            },
            onImageRecognized: World.hideInfoBar,
            onError: World.onError
        });

        /*
            Similar to the first part, the image resource and the AR.ImageDrawable for the second overlay are created.
        */
        var imgTwo = new AR.ImageResource("assets/imageTwo.png", {
            onError: World.onError
        });
        var overlayTwo = new AR.ImageDrawable(imgTwo, 0.5, {
            translate: {
                x: 0.12,
                y: -0.01
            }
        });

        var pageTwoButton = this.createWwwButton(
            "https://www.maciag-offroad.de/kini-red-bull-downhill-helm-mtb-silber-blau-sid50616.html",
            0.15, {
                translate: {
                    y: -0.25
                },
                zOrder: 1
            }
        );

        /*
            The AR.ImageTrackable for the second page uses the same tracker but with a different target name and the
            second overlay.
        */
        this.pageTwo = new AR.ImageTrackable(this.tracker, "pageTwo", {
            drawables: {
                cam: [overlayTwo, pageTwoButton]
            },
            onImageRecognized: World.hideInfoBar,
            onError: World.onError
        });
    },

    onError: function onErrorFn(error) {
        alert(error);
    },

    createWwwButton: function createWwwButtonFn(url, size, options) {
        /*
            As the button should be clickable the onClick trigger is defined in the options passed to the
            AR.ImageDrawable. In general each drawable can be made clickable by defining its onClick trigger. The
            function assigned to the click trigger calls AR.context.openInBrowser with the specified URL, which
            opens the URL in the browser.

        */
        options.onClick = function() {
            AR.context.openInBrowser(url);
        };
        return new AR.ImageDrawable(this.imgButton, size, options);
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