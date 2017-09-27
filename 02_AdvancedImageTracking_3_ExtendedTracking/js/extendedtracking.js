/**
 * Use XMLHttpRequest to query data in predefined format from your server and execute callback function with JSON.
 *
 * @param url This argument is ignored. Dummy sensor values are returned instead. Implement request handling here to fetch data from custom origin
 * @param callback called once new values are available. Note that the applications expect them to be in the format defined in SENSOR_AUGMENTATION_META
 * @param errorCallback called in case of an error.
 */
var requestDataFromServer = function (url, callback, errorCallback) {
    // Random sensor values are returned for demo purpose.
    var CURRENT_VALUES = {
        "GROUP_A" : {
            "values": {
                "A1" : Math.round( Math.random() * 100 ),
                "A2" : Math.round( Math.random() * 100 )
            }
        },
        "GROUP_B" : {
            "values": {
                "B1" : Math.round( Math.random() * 100 ),
                "B2" : Math.round( Math.random() * 100 ),
                "B3" : Math.round( Math.random() * 100 )
            }
        },
        "GROUP_C" : {
            "values": {
                "C1" : Math.round( Math.random() * 100 ),
                "C2" : Math.round( Math.random() * 100 ),
                "C3" : Math.round( Math.random() * 100 ),
                "C4" : Math.round( Math.random() * 100 )
            }
        }
    };

    // use e.g. XMLHttpRequest to parse your server response. Let's simulate a server response within 100 milli seconds
    setTimeout ( function() { callback(CURRENT_VALUES); }, 100 );
};

// experience definition
var World = {

    // refresh rate in millis. Will query dummy data every 2s
    REFRESH_RATE_MS : 2000,

    // holds all dynamic AR labels so that one can change their values easily once new sensor data arrives
    AR_LABELS : {},

    // the imageTrackable. Required to easily find out whether visible or not
    imageTrackable : null,

    // dummy url, which is ignored in 'requestDataFromServer' for demo purpose
    SENSOR_SERVICE_URL: "https://yourserver.com/sensorValues",

    // path to the wtc file required for 2D tracking / extended tracking
    WTC_PATH : "assets/iot_tracker.wtc",

    // path to pipes model
    WT3_PATH : "assets/pipes.wt3",

    // sensor augmentation info. used from global variable defined in 'meta.js'
    SENSOR_AUGMENTATION_META : SENSOR_AUGMENTATION_META,

    camDrawables : [],

    /**
     * launches the experience
     */
    init : function() {

        try {
            // create resource to load tracker from
            var targetCollectionResource = new AR.TargetCollectionResource(this.WTC_PATH);

            // create pipes model.
            var pipesModel = new AR.Model(this.WT3_PATH, {
              scale: {
                x: 0.04,
                y: 0.04,
                z: 0.04
              },
              rotate: {
                x: 90,
                y: 90,
                z: 0
              },
              transform: {
                x: -1,
                y: 0,
                z: 0
              }
            });

            // Show pipes model as augmentation. Note: This is usually replaced by a silhouette model or not used at all.
            World.camDrawables.push(pipesModel);

            // define tracker object
            var tracker = new AR.ImageTracker(targetCollectionResource, {
                onTargetsLoaded: function() {
                    try {
                        // add AR.ImageTrackable once tracker is active. Using wild-card as targetname to augment every target in the wtc file the same way
                        World.imageTrackable = new AR.ImageTrackable(tracker, "*", {
                            enableExtendedTracking: true, // activates extended tracking
                            drawables: {
                                cam: World.camDrawables // initially no camDrawables exist, they are added and updated once sensor values arrive
                            },

                            // callback function indicating quality of SLAM tracking.
                            onExtendedTrackingQualityChanged: function (targetName, oldTrackingQuality, newTrackingQuality) {

                                var newBackgroundClass;

                                switch(newTrackingQuality) {
                                    case -1:
                                        newBackgroundClass = 'trackingBad';
                                        break;
                                    case 0:
                                        newBackgroundClass = 'trackingMedium';
                                        break;
                                    default:
                                        newBackgroundClass = 'trackingGood';
                                        break;
                                }

                                var trackingIndicatorDiv = document.getElementById('trackingIndicator');

                                if (this.backgroundClass) {
                                    trackingIndicatorDiv.classList.remove(this.backgroundClass);
                                }

                                this.backgroundClass = newBackgroundClass;

                                // add color indication class to the trackingIndicator div
                                trackingIndicatorDiv.classList.add(this.backgroundClass);
                            },

                            // one of the targets is visible
                            onImageRecognized: function onImageRecognizedFn(targetName) {
                                this.isVisible = true;
                                console.info('onImageRecognized: ' + targetName);
                                World.hideInfoBox();
                            },

                            // when losing the target -> snapToScreen is enabled and the close button appears, so user can dismiss rendering of the video
                            onImageLost: function (targetName) {
                                this.isVisible = false;
                                console.info('onImageLost: ' + targetName);
                            }
                        }
                        );

                        // start polling of service url
                        World.updateSensorValuesFromRemote(World.SENSOR_SERVICE_URL, World.REFRESH_RATE_MS, World.SENSOR_AUGMENTATION_META);
                    } catch (err) {
                        World.onError(err);
                    }
                }
            });
        } catch (err) {
            World.onError(err);
        }
    },

    /**
     * updates augmentations by using the serverResponse JSON and the predefined sensor meta data
     * @param serverResponse JSON of sensor data in same format as expected by META
     * @param META information about grouping and color scheme of the augmentations
     */
    updateAugmentations : function(serverResponse, META) {

        // only update augmentations if target is visible
        if (!World.imageTrackable.isVisible) {
            return;
        }

        var groupIdentifiers = Object.keys(serverResponse);

        for (var i=0; i<groupIdentifiers.length; i++) {
            var groupId = groupIdentifiers[i];

            // solely process groups that are known by this experience
            if (META[groupId]) {

                // prepare data structure for easy access to a group's AR labels where necessary
                if (!World.AR_LABELS[groupId]) {
                    World.AR_LABELS[groupId] = { values: {} };
                }

                // create title of this group
                if (!World.AR_LABELS[groupId].title) {

                    var title = new AR.Label(META[groupId].title, META[groupId].textSize, {
                        translate: META[groupId].translate,
                        zOrder: 1,
                        opacity: META[groupId].textOpacity,
                        style : META[groupId].titleStyle,
                        verticalAnchor : AR.CONST.VERTICAL_ANCHOR.MIDDLE,
                        horizontalAnchor: AR.CONST.HORIZONTAL_ANCHOR.CENTER
                    });

                    // define background as label so that we do not need to load any background image
                    var titleBG = new AR.Label( (new Array(META[groupId].boxWidthChars).join( " " )), META[groupId].textSize, {
                        translate: META[groupId].translate,
                        zOrder: 0,
                        style : META[groupId].titleBGStyle,
                        verticalAnchor : AR.CONST.VERTICAL_ANCHOR.MIDDLE,
                        horizontalAnchor: AR.CONST.HORIZONTAL_ANCHOR.CENTER
                    });

                    World.AR_LABELS[groupId].title = title;
                    World.imageTrackable.drawables.addCamDrawable([title, titleBG]);
                }

                var groupValueIds = Object.keys(serverResponse[groupId].values);

                // sort values by order attribute
                groupValueIds.sort(function (a, b) {
                    return a.order - b.order;
                });

                for (var v=0; v<groupValueIds.length; v++) {
                    var groupValueId = groupValueIds[v];

                    if (!META[groupId].values[groupValueId]) {
                        console.debug('Server returned unknown sensor value. Ignore it');
                        continue;
                    }

                    // the sensor value of passed serverResponse
                    var sensorValue = serverResponse[groupId].values[groupValueId];

                    // label of this particular sensor value. Extracted from "META" information
                    var sensorLabel     = META[groupId].values[groupValueId].title + ": ";
                    var sensorMinValue  = META[groupId].values[groupValueId].minValue;
                    var sensorMaxValue  = META[groupId].values[groupValueId].maxValue;

                    // create AR.Label only once per value and update its text otherwise
                    if (!World.AR_LABELS[groupId].values[groupValueId]) {

                        // name of this sensor value
                        var label = new AR.Label(sensorLabel, META[groupId].textSize, {
                            translate: META[groupId].translate,
                            zOrder: 1,
                            opacity: META[groupId].textOpacity,
                            verticalAnchor : AR.CONST.VERTICAL_ANCHOR.MIDDLE,
                            horizontalAnchor: AR.CONST.HORIZONTAL_ANCHOR.RIGHT
                        });

                        // do not set text during initialization. it is set separately anyhow
                        var value = new AR.Label("", META[groupId].textSize, {
                            translate: META[groupId].translate,
                            zOrder: 1,
                            opacity: META[groupId].textOpacity,
                            verticalAnchor : AR.CONST.VERTICAL_ANCHOR.MIDDLE,
                            horizontalAnchor: AR.CONST.HORIZONTAL_ANCHOR.LEFT
                        });

                        // define background as label so that we do not need to load any background image
                        var rowBG = new AR.Label( (new Array(META[groupId].boxWidthChars).join( " " )), META[groupId].textSize, {
                            translate: META[groupId].translate,
                            zOrder: 0,
                            style : META[groupId].valuesBGStyle,
                            verticalAnchor : AR.CONST.VERTICAL_ANCHOR.MIDDLE,
                            horizontalAnchor: AR.CONST.HORIZONTAL_ANCHOR.CENTER
                        });

                        // place the values below each other
                        var offsetY = (v+1) * META[groupId].textSize;
                        label.translate.y -= offsetY;
                        value.translate.y -= offsetY;
                        rowBG.translate.y -= offsetY;

                        // store label in global data-structure for easy access
                        World.AR_LABELS[groupId].values[groupValueId] = value;

                        // add label, value and background to cam drawables
                        World.imageTrackable.drawables.addCamDrawable([rowBG, label, value]);
                    }

                    // update text or AR Label associated with this sensor
                    var sensorValueLabel = World.AR_LABELS[groupId].values[groupValueId];
                    sensorValueLabel.text = sensorValue;

                    // update style accordingly
                    if (sensorValue >= sensorMinValue && sensorValue <= sensorMaxValue ) {
                        sensorValueLabel.style = META[groupId].valuesStyle;
                    } else {
                        sensorValueLabel.style = META[groupId].valuesStyleOutOfRange;
                    }
                }
            }
        }
    },

    /**
     *
     * @param serviceUrl url to request sensor data from
     * @param intervalMillis milliseconds to wait between updating augmentations and requesting values from serviceurl again
     * @param meta defines how to interpret the sensor values and create augmentations accordingly
     */
    updateSensorValuesFromRemote : function (serviceUrl, intervalMillis, meta) {

        var onServerResponseArrivedFn =  function(serverResponse) {
            // update label augmentations accordingly
            World.updateAugmentations(serverResponse, meta);
            // trigger next update after predefined refresh rate. This way we ensure to first process server response and then triggering the next request
            setTimeout( function() {
                World.updateSensorValuesFromRemote(serviceUrl, intervalMillis, meta)
            }, intervalMillis);
        };

        var onErrorCallback = World.onError;

        requestDataFromServer(serviceUrl, onServerResponseArrivedFn, onErrorCallback);
    },

    // a general error occurred during loading
    onError : function(error) {
        alert("An unexpected error occurred " + error);
    },

    // hides infobox
    hideInfoBox: function() {
        var e = document.getElementById('infoBox');
        e.parentElement.removeChild(e);
    }
};

// launch experience
World.init();