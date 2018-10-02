//update
const GeoOccluders = {};
GeoOccluders.receivedLocation = false;

GeoOccluders.setupScene = function(lat, lon, alt) {
  GeoOccluders.createMarker(lat, lon);
};

const model = new AR.Model("assets/14.wt3", {
  scale: {
    x: 0,002257,
    y: 0,002257,
    z: 0,002257
  },
  translate: {
    x: 0.0,
    y: 0.0,
    z: 0.0
  },
});

GeoOccluders.createMarker = function(lat, lon, name) {
  const loc = new AR.GeoLocation(lat, lon);
  GeoOccluders.geoObj = new AR.GeoObject(loc, {
    drawables: {
      cam: model,
    },
    enabled: false,
  });
};

AR.context.onLocationChanged = function(latitude, longitude, altitude, accuracy) {
  AR.context.onLocationChanged = null;
  GeoOccluders.receivedLocation = true;
  GeoOccluders.setupScene(latitude, longitude, altitude);
};
