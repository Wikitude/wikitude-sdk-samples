// collects information about the visual representation of the sensor values
var SENSOR_AUGMENTATION_META = {
    "GROUP_A" : {
        "title": "Machine A",
        "boxWidthChars" : 50,
        "titleStyle": { "textColor": "#000000" },
        "titleBGStyle": { "backgroundColor": "#EEEEEE" },
        "valuesStyle": { "textColor": "#111111" },
        "valuesStyleOutOfRange": { "textColor": "#EE0000" },
        "valuesBGStyle": { "backgroundColor": "#DDDDDD" },
        "textSize": 0.1,
        "textOpacity": 0.9,
        "translate": {
            "x": -0.7,
            "y": 1.5,
            "z": 0
        },
        "values" : {
            "A1" :  { "title" : "Sensor A1", "minValue":  0, "maxValue" : 90, order: 0 },
            "A2" :  { "title" : "Sensor A2", "minValue":  0, "maxValue" : 90, order: 1 }
        }
    },
    "GROUP_B" : {
        "title": "Machine B",
        "boxWidthChars" : 50,
        "titleStyle": { "textColor": "#000000" },
        "titleBGStyle": { "backgroundColor": "#EEEEFF" },
        "valuesStyle": { "textColor": "#111111" },
        "valuesStyleOutOfRange": { "textColor": "#0000FF" },
        "valuesBGStyle": { "backgroundColor": "#DDDDEE" },
        "textSize": 0.1,
        "textOpacity": 0.9,
        "translate": {
            "x":  2.9,
            "y": 2.5,
            "z": -0.2
        },
        "values" : {
            "B1" :  { "title" : "Sensor B1", "minValue":  10, "maxValue" : 80, order: 0 },
            "B2" :  { "title" : "Sensor B2", "minValue":  10, "maxValue" : 80, order: 1 },
            "B3" :  { "title" : "Sensor B3", "minValue":  10, "maxValue" : 80, order: 2 }
        }
    },
    "GROUP_C" : {
        "title": "Machine C",
        "boxWidthChars" : 50,
        "titleStyle": { "textColor": "#000000" },
        "titleBGStyle": { "backgroundColor": "#EEFFEE" },
        "valuesStyle": { "textColor": "#111111" },
        "valuesStyleOutOfRange": { "textColor": "#00FF00" },
        "valuesBGStyle": { "backgroundColor": "#DDEEDD" },
        "textSize": 0.1,
        "textOpacity": 0.9,
        "translate": {
            "x": 0,
            "y": -0.6,
            "z": 0
        },
        "values" : {
            "C1" :  { "title" : "Sensor C1", "minValue":  10, "maxValue" : 50, order: 0 },
            "C2" :  { "title" : "Sensor C2", "minValue":  10, "maxValue" : 50, order: 1 },
            "C3" :  { "title" : "Sensor C3", "minValue":  10, "maxValue" : 50, order: 2 },
            "C4" :  { "title" : "Sensor C4", "minValue":  10, "maxValue" : 50, order: 3 }
        }
    }
};