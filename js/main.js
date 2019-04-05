// Authored by Joe Marks, 2019
/*eslint-env browser*/

//First line of main.js...wrap everything in a self-executing anonymous function to move to local scope
(function(){

    //pseudo-global variables
    var attrArray = ["Population2010","Lack of Health Insurance","Arthritis,Binge Drinking","High Blood Pressure","People Taking Medicine for High Blood Pressure","Cancer (Excluding Skin Cancer)","Asthma,Coronary Heart Disease","Visits to Doctor for Routine Checkup within the Past Year","Cholesterol Screening","Colon Screening","Chronic Obstructive Pulmonary Disease","Men >= 65 Years up to Date on Core Set of Clinical Preventive Services","Women >= 65 Years up to Date on Core Set of Clinical Preventive Services","Smoking","Visits to Dentist","Diabetes","High Cholesterol","Chronic Kidney Disease","No Leisure-Time Physical Activity","Mammography Use among Women aged 50-74 years","Mental Health Not Good","Obesity","Papanicolaou Smear Use Among Adult Women Aged 21-65 Years","Physical Health Not Good","Sleeping Less Than 7 Hours","Stroke","Teeth Lost Among Adults Aged >= 65 Years"];
    //list of attributes
    var expressed = attrArray[3]; //initial attribute; 29 attributes


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

        // Create Albers equal area conic projection centered on Green Bay, WI
        var projection = d3.geoAlbers()
            .center([0, 44.5133])
            .rotate([88.0000, 0])
            .parallels([44.30, 44.31])
            .scale(220000)
            .translate([width / 2, height / 2]);

        var path = d3.geoPath()
            .projection(projection);



        // Use Promise.all to parallelize asynchronous data loading
        var promises = [];
        
        /* Leftover from when I attempted to do Chicago's census tracts (too many tracts made it difficult to visualize)
        promises.push(d3.csv("data/Chicago_500_cities_data.csv")); // Load attributes from csv
        //promises.push(d3.json("data/ne_10m_admin_1_states_provin_WGS84.topojson")); // Load background spatial data (A different possible basemap)
        promises.push(d3.json("data/Background_Tracts_WGS84.topojson")); // Load background spatial data (tract level)
        promises.push(d3.json("data/Chicago_Census_Tracts_WGS84.topojson")); // Load census tract data*/
        
        promises.push(d3.csv("data/Green Bay 500 Cities Data.csv")); // Load attributes from csv
        promises.push(d3.json("data/Brown_County_Census_Tracts_WGS84.topojson")); // Load background spatial data (tract level)
        promises.push(d3.json("data/Green_Bay_Census_Tracts_WGS84.topojson")); // Load census tract data

        Promise.all(promises).then(callback);

        function callback(data){
            csvData = data[0];
            baseMap = data[1]; 
            greenBayTracts = data[2]; 

            // Place graticule on the map
            setGraticule(map, path);
            

            // Translate census tracts TopoJSONs
            //var baseMapGeoJson = topojson.feature(baseMap, baseMap.objects.ne_10m_admin_1_states_provin_WGS84); // (A different possible basemap)
            var baseMapGeoJson = topojson.feature(baseMap, baseMap.objects.Brown_County_Census_Tracts_WGS84);
            var greenBayTractsGeoJsonFeatures = topojson.feature(greenBayTracts, greenBayTracts.objects.Green_Bay_Census_Tracts_WGS84).features;


            greenBayTractsGeoJsonFeatures = joinData(greenBayTractsGeoJsonFeatures, csvData);
            
            
            // Add countries to the map
            var baseMapPath = map.append("path")
                .datum(baseMapGeoJson)
                .attr("class", "baseMap")
                .attr("d", path);

            // Create the color scale
            var colorScale = createColorScale(csvData);
            
            // Add Green Bay census tracts to map
            setEnumerationUnits(greenBayTractsGeoJsonFeatures, map, path, colorScale);

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
    
    function joinData(greenBayTractsGeoJsonFeatures, csvData){
        // Loop through csv to assign each set of scv attribute values to geojson region
        for (var i = 0; i < csvData.length; i++){
            var csvRegion = csvData[i]; // The current region
            var csvKey = csvRegion.Place_TractID // The CSV primary key

            // Loop through geojson regions to find correct region
            for(var j = 0; j < greenBayTractsGeoJsonFeatures.length; j++){

                // Current region geojson properties
                var geojsonProps = greenBayTractsGeoJsonFeatures[j].properties;
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
        return greenBayTractsGeoJsonFeatures;
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
    
    function setEnumerationUnits(greenBayTractsGeoJsonFeatures, map, path, colorScale){
        // Add Green Bay census tracts to map
        var greenBayTractsPath = map.selectAll(".greenBayTractsPath")
            .data(greenBayTractsGeoJsonFeatures)
            .enter()
            .append("path")
            .attr("class", function(d){
                return "greenBayTractsPath " + d.properties.plctract10
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
            return '#BBB';
        }
    };
    
    
    // Function to create coordinated bar chart
    function setChart(csvData, colorScale){
        // chart frame dimensions
        var chartWidth = window.innerWidth * 0.425,
            chartHeight = 860,
            leftPadding = 25,
            rightPadding = 2,
            topBottomPadding = 5,
            chartInnerWidth = chartWidth - leftPadding - rightPadding,
            chartInnerHeight = chartHeight - topBottomPadding * 2,
            translate = "translate(" + leftPadding + ", " + topBottomPadding + ")";
        
        // Create a second svg element to hold the var chart
        var chart = d3.select("body")
            .append("svg")
            .attr("width", chartWidth)
            .attr("height", chartHeight)
            .attr("class", "chart");
        
        // Create a rectangle for chart background fill
        var chartBackground = chart.append("rect")
            .attr("class", "chartBackground")
            .attr("width", chartInnerWidth)
            .attr("height", chartInnerHeight)
            .attr("transform", translate);
        
        // Create a scale to size bars proportionally to frame
        var yScale = d3.scaleLinear()
            .range([850, 0])
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
            .attr("width", chartInnerWidth/csvData.length - 1)
            .attr("x", function(d, i){
                return i * (chartInnerWidth/csvData.length) + leftPadding;
            })
            .attr("height", function(d){
                return 850 - yScale(parseFloat(d[expressed]));
            })
            .attr("y", function(d){
                return yScale(parseFloat(d[expressed])) + topBottomPadding;
            })
            .style("fill", function(d){
                return choropleth(d, colorScale);
            });
        
        /*
        // Annotate bars with attribute value text
        var numbers = chart.selectAll(".numbers")
            .data(csvData)
            .enter()
            .append("text")
            .sort(function(a, b){
                return a[expressed]-b[expressed];
            })
            .attr("class", function (d){
                return "numbers " + d.Place_TractID
            })
            .attr("text-anchor", "middle")
            .attr("x", function(d, i){
                var fraction = chartWidth / csvData.length;
                return i * fraction + (fraction-1)/2;
            })
            .attr("y", function(d){
                return chartHeight - yScale(parseFloat(d[expressed])) + 15;
            })
            .text(function(d){
                return d[expressed];
            });
        */
        
        // Create a text element for the chart title
        var chartTitle = chart.append("text")
            .attr("x", 40)
            .attr("y", 40)
            .attr("class", "chartTitle")
            .text("Prevalence of " + expressed + " in Each Census Tract");
        
        // Create vertical axis generator
        var yAxis = d3.axisLeft()
            .scale(yScale);
        
        // Place axis
        var axis = chart.append("g")
            .attr("class", "axis")
            .attr("transform", translate)
            .call(yAxis);
        
        // Create frame for chart border
        var chartFrame = chart.append("rect")
            .attr("class", "chartFrame")
            .attr("width", chartInnerWidth)
            .attr("height", chartInnerHeight)
            .attr("transform", translate);
    };
})() // Last line of main.js