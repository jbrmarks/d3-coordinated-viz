// Authored by Joe Marks, 2019
/*eslint-env browser*/

//First line of main.js...wrap everything in a self-executing anonymous function to move to local scope
(function(){

    //pseudo-global variables
    var attrArray = ["Population2010","ACCESS2_CrudePrev","ARTHRITIS_CrudePrev","BINGE_CrudePrev","BPHIGH_CrudePrev","BPMED_CrudePrev","CANCER_CrudePrev","CASTHMA_CrudePrev","CHD_CrudePrev","CHECKUP_CrudePrev","CHOLSCREEN_CrudePrev","COLON_SCREEN_CrudePrev","COPD_CrudePrev","COREM_CrudePrev","COREW_CrudePrev","CSMOKING_CrudePrev","DENTAL_CrudePrev","DIABETES_CrudePrev","HIGHCHOL_CrudePrev","KIDNEY_CrudePrev","LPA_CrudePrev","MAMMOUSE_CrudePrev","MHLTH_CrudePrev","OBESITY_CrudePrev","PAPTEST_CrudePrev","PHLTH_CrudePrev","SLEEP_CrudePrev","STROKE_CrudePrev","TEETHLOST_CrudePrev"];
    //list of attributes
    var expressed = attrArray[1]; //initial attribute; 29 attributes


    //begin script when window loads
    window.onload = setMap();
    
    
    // Set up choropleth map
    function setMap() {

        // Map frame dimensions
        var width = window.innerWidth * 0.5, 
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
            .rotate([87.7298, 0])
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

            // Place graticule on the map
            setGraticule(map, path);
            

            // Translate census tracts TopoJSONs
            //var baseMapGeoJson = topojson.feature(baseMap, baseMap.objects.ne_10m_admin_1_states_provin_WGS84); // (A different possible basemap)
            var baseMapGeoJson = topojson.feature(baseMap, baseMap.objects.Background_Tracts_WGS84);
            var chicagoTractsGeoJsonFeatures = topojson.feature(chicagoTracts, chicagoTracts.objects.Chicago_Census_Tracts_WGS84).features;


            chicagoTractsGeoJsonFeatures = joinData(chicagoTractsGeoJsonFeatures, csvData);
            
            
            // Add countries to the map
            var baseMapPath = map.append("path")
                .datum(baseMapGeoJson)
                .attr("class", "baseMap")
                .attr("d", path);

            // Create the color scale
            var colorScale = createColorScale(csvData);
            
            // Add Chicago census tracts to map
            setEnumerationUnits(chicagoTractsGeoJsonFeatures, map, path, colorScale);

            // Add coordinated visualization to the map
            setChart(csvData, colorScale);
            
        }; // End of callback function
    }; // End of setMap()
    
        function setGraticule(map, path){
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
    }
    
    function joinData(chicagoTractsGeoJsonFeatures, csvData){
        // Loop through csv to assign each set of scv attribute values to geojson region
        for (var i = 0; i < csvData.length; i++){
            var csvRegion = csvData[i]; // The current region
            var csvKey = csvRegion.Place_TractID // The CSV primary key

            // Loop through geojson regions to find correct region
            for(var j = 0; j < chicagoTractsGeoJsonFeatures.length; j++){

                // Current region geojson properties
                var geojsonProps = chicagoTractsGeoJsonFeatures[j].properties;
                // Geojson primary key
                var geojsonKey = geojsonProps.plctract10;

                // Where primary keys match, transfer csv data to geojson properties object
                if(geojsonKey == csvKey){
                    // Assign all attributes and values
                    attrArray.forEach(function(attr){
                        var val = parseFloat(csvRegion[attr]); //get csv attribute value
                        geojsonProps[attr] = val; // Assign attribute and value to geojson properties
                    })
                }
            }
        }
        return chicagoTractsGeoJsonFeatures;
    }
    
    function createColorScale(csvData){
        var colorClasses = [
        "#f1eef6",
            "#bdc9e1",
            "#74a9cf",
            "#2b8cbe",
            "#045a8d"
    ];

        // Create color scale generator
        var colorScale = d3.scaleQuantile()
            .range(colorClasses);
        
        // Build array of all values of the expressed attribute
        var domainArray = [];
        for (var i = 0; i < csvData.length; i++){
            var val = parseFloat(csvData[i][expressed]);
            domainArray.push(val);
        };
        
        // Assign array of expressed values as scale domain
        colorScale.domain(domainArray);
        
        return colorScale;
    };
    
    function setEnumerationUnits(chicagoTractsGeoJsonFeatures, map, path, colorScale){
        // Add Chicago census tracts to map
        var chicagoTractsPath = map.selectAll(".chicagoTractsPath")
            .data(chicagoTractsGeoJsonFeatures)
            .enter()
            .append("path")
            .attr("class", function(d){
                return "chicagoTractsPath " + d.properties.plctract10
            })
            .attr("d", path)
            .style("fill", function(d){
                return choropleth(d.properties, colorScale);
            })
    };
    
    // Fuction to test for data value and return color
    function choropleth(props, colorScale){
        // Make sure attribute value is a number
        var val = parseFloat(props[expressed]);
        // If attribute value exists, assign a color; otherwise assign gray
        if (typeof val ==  'number' && !isNaN(val)){
            return colorScale(val);
        }else{
            return '#CCC';
        }
    };
    
    
    // Function to create coordinated bar chart
    function setChart(csvData, colorScale){
        // chart frame dimensions
        var chartWidth = window.innerWidth * 0.425,
            chartHeight = 860;
        
        // Create a second svg element to hold the var chart
        var chart = d3.select("body")
            .append("svg")
            .attr("width", chartWidth)
            .attr("height", chartHeight)
            .attr("class", "chart");
        
        // Create a scale to size bars proportionally to frame
        var yScale = d3.scaleLinear()
            .range([0, chartHeight])
            .domain([0, 50]);
        
        // Set bars for each tract
        var bars = chart.selectAll(".bars")
            .data(csvData)
            .enter()
            .append("rect")
            .sort(function(a,b){
                return a[expressed]-b[expressed]
            })
            .attr("class", function(d){
                return "bars " + d.Place_TractID
            })
            .attr("width", chartWidth/csvData.length - .75)
            .attr("x", function(d, i){
                return i * (chartWidth/csvData.length);
            })
            .attr("height", function(d){
                return yScale(parseFloat(d[expressed]));
            })
            .attr("y", function(d){
                return chartHeight - yScale(parseFloat(d[expressed]));
            })
            .style("fill", function(d){
                return choropleth(d, colorScale);
            });
    };
})() // Last line of main.js