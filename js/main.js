// Authored by Joe Marks, 2019
/*eslint-env browser*/

//begin script when window loads
window.onload = setMap();

// Set up choropleth map
function setMap() {
    
    // Map frame dimensions
    var width = 960, 
        height = 860;
    
    // Create new svg container for the map
    var map = d3.select("body")
        .append("svg")
        .attr("class", "map")
        .attr("width", width)
        .attr("height", height);
    
    // Create Albers equal area conic projection centered on Chicago, IL
    var projection = d3.geoAlbers()
        .center([0, 41.8419])
        .rotate([87.6298, 0])
        .parallels([41.583333, 42.133333])
        .scale(100000)
        .translate([width / 2, height / 2]);
    
    var path = d3.geoPath()
        .projection(projection);
    
    
    
    // Use Promise.all to parallelize asynchronous data loading
    var promises = [];
    promises.push(d3.csv("data/Chicago_500_cities_data.csv")); // Load attributes from csv
    //promises.push(d3.json("data/ne_10m_admin_1_states_provin_WGS84.topojson")); // Load background spatial data (A different possible basemap)
    promises.push(d3.json("data/Background_Tracts_WGS84.topojson")); // Load background spatial data (tract level)
    promises.push(d3.json("data/Chicago_Census_Tracts_WGS84.topojson")); // Load census tract data
    
    Promise.all(promises).then(callback);
    
    function callback(data){
        csvData = data[0];
        baseMap = data[1]; 
        chicagoTracts = data[2]; 
        
        // Create graticule generator
        var graticule = d3.geoGraticule()
            .step([.15, .15]); // Place graticule lines every .15 degree of longitude and latitude
        
        // Create graticule background
        var gratBackground = map.append("path")
            .datum(graticule.outline()) // Bind graticule background
            .attr("class", "gratBackground") // Assign class for styling
            .attr("d", path); // Project graticule
        
        // Create graticule lines
        var gratLines = map.selectAll(".gratLines") // Select graticule elements that will be created
            .data(graticule.lines()) // Bind graticule lines to each element to be created
            .enter() // Create an element for each datum
            .append("path") // Append each element to the svg as a path element
            .attr("class", "gratLines") // Assign class for styling
            .attr("d", path); // Project graticule lines
        
        // Translate census tracts TopoJSON
        //var baseMapGeoJson = topojson.feature(baseMap, baseMap.objects.ne_10m_admin_1_states_provin_WGS84); // (A different possible basemap)
        var baseMapGeoJson = topojson.feature(baseMap, baseMap.objects.Background_Tracts_WGS84);
        var chicagoTractsGeoJsonFeatures = topojson.feature(chicagoTracts, chicagoTracts.objects.Chicago_Census_Tracts_WGS84).features;
        
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
        
        
        
        console.log("gratLines: ");
        console.log(gratLines);
        
    }
}