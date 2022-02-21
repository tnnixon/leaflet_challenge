// create the tile layers for the backgrounds of the map
var defaultMap = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
	maxZoom: 17,
	attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
});

//grayscale layer
var greyscale = L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png', {
	maxZoom: 20,
	attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
});

// water color layer
var watercolor = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/watercolor/{z}/{x}/{y}.{ext}', {
	attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
	subdomains: 'abcd',
	minZoom: 1,
	maxZoom: 16,
	ext: 'jpg'
});

// imagery layer
var imagery = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
	attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
});

// make a basemaps object
let baseMaps = {
    Topography: defaultMap,
    GreyScale: greyscale,
    WaterColor: watercolor,
    Imagery: imagery
};

// make a map object
var myMap = L.map("map", {
    center: [36.7783, -119.4179],
    zoom: 4,
    layers: [defaultMap, greyscale, watercolor, imagery]
});

// add the default map to the map
// defaultMap.addTo(myMap);
// greyscale.addTo(myMap)

// get the data for the tectonix plates and draw on the map
//variable to hold the tectonic plates layer
let tectonicPlates = new L.layerGroup();

// call the api to get the info for the tectonic plates
d3.json("https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json")
.then(function(plateData){
    // console log to make sure the data loaded
    // console.log(plateData)

    //load the data using geojson and add to tectonic plates layer group
    L.geoJson(plateData, {
        // add styling to make lines visible
        color: "yellow",
        weight: 1
    }).addTo(tectonicPlates)
});

// add the tectonic plates to the map
tectonicPlates.addTo(myMap);

//variable to hold the tectonic plates layer
let earthquakes = new L.layerGroup();

//get the data for earthquakes and populate layer group
// call the USGS geojson api
d3.json("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson")
.then(
    function(earthquakeData){
        // console log to verify api call success
        // console.log(earthquakeData);

        //plot circles, where radius is dependent on magnitude
        // and color is dependent on depth

        //make a function that chooses the color of the data point
        function dataColor(depth){
            if (depth > 90)
                return "red";
            else if(depth >70)
                return "#fc4903";
            else if (depth > 50)
                return ("#fc8403");
            else if (depth > 30)
                return "#fcad03";
            else if (depth > 10)
                return "cafc03";
            else
                return "green";

        }

        // function that determines the size of the radius
        function radiusSize(mag){
            if (mag == 0)
                return 1; // makes sure that a 0 mag earthquake shows up
            else
                return mag *5; // makes sure that the circle is pronounced on the map
        }

        // add on to the style for each data point
        function dataStyle(feature)
        {
            return {
                opacity: 0.5,
                fillOpacity: 0.5,
                fillColor: dataColor(feature.geometry.coordinates[2]), // use the index 2 for the depth
                color: "#000000", // black outline
                radius: radiusSize(feature.properties.mag), // grabs the magnitudes
                weight: 0.5,
                stroke: true

            }
        }

        // add the geojson data
        L.geoJson(earthquakeData, {
            // make each feature a marker on the map, each marker is a circle
            pointToLayer: function(feature, latLng) {
                return L.circleMarker(latLng);
            },
            // set the style for each marker
            style: dataStyle, // calls the data style function and passes in the earthquake data
            
            // add popups
            onEachFeature: function(feature, layer){
                layer.bindPopup(`Magnitude: <b>${feature.properties.mag}</b><br>
                                Depth: <b>${feature.geometry.coordinates[2]}</b><br>
                                Location: <b>${feature.properties.place}</b>`);
            }

        }).addTo(earthquakes);
    }
);

// add the earthquake layer to the map
earthquakes.addTo(myMap)

//add the overlay for the tectonic plates and earthquakes
let overlays = {
    "Tectonic Plates": tectonicPlates,
    "Earthquake Data": earthquakes 
};

// add the layer control
L.control
    .layers(baseMaps, overlays)
    .addTo(myMap);

// add the legend to the map
let legend = L.control({
    position: "bottomright"
});

// add properties for the legend
legend.onAdd = function() {
    //div for the legend to appear in the page
    let div = L.DomUtil.create("div", "info legend");

    // set up the intervals
    let intervals = [-10, 10, 30, 50, 70, 90];
    
    // set the colors for the intervals
    let colors = [
        "green",
        "#cafc03",
        "#fcad03",
        "#fc8403",
        "#fc4903",
        "red"
    ];

    // loop through the intervals and colors and generate a label
    //with a colored square for each interval
    for(var i = 0; i < intervals.length; i++)
    {
        // inner html that sets the square for each interval and label
        div.innerHTML += "<i style='background: "
        + colors[i]
        + "'></i>"
        + intervals[i]
        + (intervals[i + 1] ? "km - " + intervals[i + 1] + "km<br>" : "+");

    }

    return div;
};

// add the legend to the map
legend.addTo(myMap);