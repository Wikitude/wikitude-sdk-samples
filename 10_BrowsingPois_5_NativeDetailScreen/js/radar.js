var PoiRadar = {

    hide: function hideFn() {
        AR.radar.enabled = false;
    },

    show: function initFn() {

        /* The div defined in the index.htm. */
        AR.radar.container = document.getElementById("radarContainer");

        /* Set the back-ground image for the radar. */
        AR.radar.background = new AR.ImageResource("assets/radar_bg.png", {
            onError: World.onError
        });

        /*
            Set the north-indicator image for the radar (not necessary if you don't want to display a
            north-indicator).
         */
        AR.radar.northIndicator.image = new AR.ImageResource("assets/radar_north.png", {
            onError: World.onError
        });

        /*
            Center of north indicator and radar-points in the radar asset, usually center of radar is in the exact
            middle of the bakground, meaning 50% X and 50% Y axis --> 0.5 for centerX/centerY.
         */
        AR.radar.centerX = 0.5;
        AR.radar.centerY = 0.5;

        AR.radar.radius = 0.3;
        AR.radar.northIndicator.radius = 0.0;

        AR.radar.enabled = true;
    },

    updatePosition: function updatePositionFn() {
        if (AR.radar.enabled) {
            AR.radar.notifyUpdateRadarPosition();
        }
    },

    /* You may define some custom action when user pressed radar, e.g. display distance, custom filtering etc.. */
    clickedRadar: function clickedRadarFn() {
        alert("Radar Clicked");
    },

    setMaxDistance: function setMaxDistanceFn(maxDistanceMeters) {
        AR.radar.maxDistance = maxDistanceMeters;
    }
};