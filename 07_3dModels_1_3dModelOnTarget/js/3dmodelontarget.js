var World = {
    loaded: false,
    rotating: false,

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
        this.targetCollectionResource = new AR.TargetCollectionResource("assets/tracker.wtc", {
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
            3D content within Wikitude can only be loaded from Wikitude 3D Format files (.wt3). This is a
            compressed binary format for describing 3D content which is optimized for fast loading and handling of
            3D content on a mobile device. You still can use 3D models from your favorite 3D modeling tools
            (Autodesk® Maya® or Blender) but you'll need to convert them into the wt3 file format. The Wikitude 3D
            Encoder desktop application (Windows and Mac) encodes your 3D source file. You can download it from our
            website. The Encoder can handle Autodesk® FBX® files (.fbx) and the open standard Collada (.dae) file
            formats for encoding to .wt3.

            Create an AR.Model and pass the URL to the actual .wt3 file of the model. Additional options allow for
            scaling, rotating and positioning the model in the scene.

            A function is attached to the onLoaded trigger to receive a notification once the 3D model is fully
            loaded. Depending on the size of the model and where it is stored (locally or remotely) it might take
            some time to completely load and it is recommended to inform the user about the loading time.
        */
        this.modelCar = new AR.Model("assets/car.wt3", {
            onLoaded: World.showInfoBar,
            onError: World.onError,
            scale: {
                x: 0.045,
                y: 0.045,
                z: 0.045
            },
            translate: {
                x: 0.0,
                y: 0.05,
                z: 0.0
            },
            rotate: {
                z: -25
            }
        });

        /*
            The last lines combine everything by creating an AR.ImageTrackable with the previously created tracker,
            the name of the image target and the drawable that should augment the recognized image.

            Important: If you replace the tracker file with your own, make sure to change the target name accordingly.
            Use a specific target name to respond only to a certain target or use a wildcard to respond to any or a
            certain group of targets.

            Similar to 2D content the 3D model is added to the drawables.cam property of an AR.ImageTrackable.
        */
        this.trackable = new AR.ImageTrackable(this.tracker, "*", {
            drawables: {
                cam: [this.modelCar]
            },
            onImageRecognized: World.hideInfoBar,
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