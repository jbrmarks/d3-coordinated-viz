// Authored by Joe Marks, 2019
/*eslint-env browser*/

//begin script when window loads
window.onload = setMap();

// Set up choropleth map
function setMap() {
    
    // Map frame dimensions
    var width = 960, 
        height = 460;
    
    // Create new svg container for the map
    var map = d3.select("body")
        .append("svg")
        .attr("class", "map")
        .attr("width", width)
        .attr("height", height);
    
    // Create Albers equal area conic projection centered on Chicago, IL
    var projection = d3.geoAlbers()
        .center([0, -87.6298])
        .rotate([41.8781, 0])
        .parallels([41.583333, 42.133333])
        .scale(50000)
        .translate([width / 2, height / 2]);
    
    var path = d3.geoPath()
        .projection(projection);
    
    
    
    // Use Promise.all to parallelize asynchronous data loading
    var promises = [];
    promises.push(d3.csv("data/Chicago_500_cities_data.csv")); // Load attributes from csv
    promises.push(d3.json("data/Background_Tracts_WGS84.topojson")); // Load background spatial data
    promises.push(d3.json("data/Chicago_Census_Tracts_WGS84.topojson")); // Load census tract data
    
    Promise.all(promises).then(callback);
    
    function callback(data){
        csvData = data[0];
        baseMap = data[1]; 
        chicagoTracts = data[2]; 

        console.log("csvData: ");
        console.log(csvData);
        console.log("baseMap: ");
        console.log(baseMap);
        console.log("chicagoTracts: ");
        console.log(chicagoTracts);
        
        
        // Translate census tracts TopoJSON
        var baseMapGeoJson = topojson.feature(baseMap, baseMap.objects.Background_Tracts_WGS84), chicagoTractsGeoJsonFeatures = topojson.feature(chicagoTracts, chicagoTracts.objects.Chicago_Census_Tracts_WGS84).features;
        
        console.log("baseMapGeoJson: ");
        console.log(baseMapGeoJson);
        console.log("chicagoTractsGeoJsonFeatures: ");
        console.log(chicagoTractsGeoJsonFeatures);
        
        // Add countries to the map
        var baseMapPath = map.append("path")
            .datum(baseMapGeoJson)
            .attr("class", "baseMap")
            .attr("d", path);
        
        // Add Chicago census tracts to map
        var chicagoTractsPath = map.selectAll(".chicagoTractsPath")
            .data(chicagoTractsGeoJsonFeatures)
            .enter()
            .append("path")
            .attr("class", function(d){
                return "chicagoTractsPath " + d.properties.plctract10
            })
            .attr("d", path);
        
        
        console.log("baseMapPath: ");
        console.log(baseMapPath);
        console.log("chicagoTractsPath: ");
        console.log(chicagoTractsPath);
    }
}