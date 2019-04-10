// Authored by Joe Marks, 2019
/*eslint-env browser*/

//First line of main.js...wrap everything in a self-executing anonymous function to move to local scope
(function(){

    //pseudo-global variables
    var attrArray = ["Population2010","Lack of Health Insurance","Arthritis","Binge Drinking","High Blood Pressure","People Taking Medicine for High Blood Pressure","Cancer (Excluding Skin Cancer)","Asthma","Coronary Heart Disease","Visits to Doctor for Routine Checkup within the Past Year","Cholesterol Screening","Colon Screening","Chronic Obstructive Pulmonary Disease","Men >= 65 Years up to Date on Core Set of Clinical Preventive Services","Women >= 65 Years up to Date on Core Set of Clinical Preventive Services","Smoking","Visits to Dentist","Diabetes","High Cholesterol","Chronic Kidney Disease","No Leisure-Time Physical Activity","Mammography Use among Women aged 50-74 years","Mental Health Not Good","Obesity","Papanicolaou Smear Use Among Adult Women Aged 21-65 Years","Physical Health Not Good","Sleeping Less Than 7 Hours","Stroke","Teeth Lost Among Adults Aged >= 65 Years"];
    //list of attributes
    var expressed = attrArray[3]; //initial attribute; 29 attributes

    // chart frame dimensions
    var chartWidth = window.innerWidth * 0.425,
        chartHeight = 860,
        leftPadding = 25,
        rightPadding = 2,
        topBottomPadding = 5,
        chartInnerWidth = chartWidth - leftPadding - rightPadding,
        chartInnerHeight = chartHeight - topBottomPadding * 2,
        translate = "translate(" + leftPadding + ", " + topBottomPadding + ")";
    
    // Create a scale to size bars proportionally to frame
    var yScale = d3.scaleLinear()
        .range([850, 0])
        .domain([0,100]);

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
            //setGraticule(map, path);
            

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
            
            // Add dropdown menu
            createDropdown(csvData);
            
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
            var csvKey = csvRegion.tract2010 // The CSV primary key

            // Loop through geojson regions to find correct region
            for(var j = 0; j < greenBayTractsGeoJsonFeatures.length; j++){

                // Current region geojson properties
                var geojsonProps = greenBayTractsGeoJsonFeatures[j].properties;
                // Geojson primary key
                var geojsonKey = geojsonProps.tract2010;

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
                return "greenBayTractsPath gb-" + d.properties.tract2010
            })
            .attr("d", path)
            .style("fill", function(d){
                return choropleth(d.properties, colorScale);
            })
            // Add event listeners for mouse to highlight
            .on("mouseover", function(d){
                highlight(d.properties);
            })
            .on("mouseout", function(d){
                dehighlight(d.properties);
            })
            .on("mousemove", moveLabel);
        var desc = greenBayTractsPath.append("desc")
            .text('{"stroke": "#000", "stroke-width": "0.5px"}');
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
        
        // Build array of all values of the expressed attribute
        var domainArray = [];
        for (var i = 0; i < csvData.length; i++){
            var val = parseFloat(csvData[i][expressed]);
            domainArray.push(val);
        };
        
        // Set bars for each tract
        var bars = chart.selectAll(".bars")
            .data(csvData)
            .enter()
            .append("rect")
            .sort(function(a,b){
                return a[expressed]-b[expressed]
            })
            .attr("class", function(d){
                return "bars gb-" + d.tract2010
            })
            .attr("width", chartInnerWidth/csvData.length - 1)
            // Add mouse event listeners for highlight
            .on("mouseover", highlight)
            .on("mouseout", dehighlight)
            .on("mousemove", moveLabel);
        // Add style descripter to each path
        var desc = bars.append("desc")
            .text('{"stroke": "none", "stroke-width": "0px"}');
        
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
                return "numbers " + d.plctract10
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
        // Note, the population attribute requires a different header
        if (expressed == "Population2010"){
             var chartTitle = chart.append("text")
            .attr("x", 40)
            .attr("y", 40)
            .attr("class", "chartTitle")
            .text("Population in 2010 for Each Census Tract");
        }else{
            var chartTitle = chart.append("text")
            .attr("x", 40)
            .attr("y", 40)
            .attr("class", "chartTitle")
            .text("Prevalence of " + expressed + " in Each Census Tract");
        }
        
        
        
        
        
        // Create frame for chart border
        var chartFrame = chart.append("rect")
            .attr("class", "chartFrame")
            .attr("width", chartInnerWidth)
            .attr("height", chartInnerHeight)
            .attr("transform", translate);
        
        // Set axis, bar positions, heights, and colors
        updateChart(bars, csvData.length, colorScale);
    };
    
    // Function to create a dropdown menuy for attribute selection
    function createDropdown(csvData){
        // Add Select element
        var dropdown = d3.select("body")
            .append("select")
            .attr("class", "dropdown")
            .on("change", function(){
                //console.log('change attribute');
                changeAttribute(this.value, csvData)
            });
        
        // Add initial option
        var titleOption = dropdown.append("option")
            .attr("class", "titleOption")
            .attr("disabled", "true")
            .text("Select Attribute");
        
        // Add attribute name options
        var attrOptions = dropdown.selectAll("attrOptions")
            .data(attrArray)
            .enter()
            .append("option")
            .attr("vlaue", function(d){ return d })
            .text(function(d){ return d });
    };
    
    // Dropdown change listener handler
    function changeAttribute(attribute, csvData){
        // Change the expressed attribute
        expressed = attribute;

        // Recreate the color sclae
        var colorScale = createColorScale(csvData);

        // Recolor enumeration units
        var regions = d3.selectAll(".greenBayTractsPath")
            .transition()
            .duration(1000)
            .style("fill", function(d){
                return choropleth(d.properties, colorScale)
            });
        
        // Re-sort, resize, and recolor bars
        var bars = d3.selectAll(".bars")
            // Re-sort bars
            .sort(function(a, b){
                return a[expressed] - b[expressed];
            })
            .transition()
            .delay(function(d, i){
                return i*20;
            })
            .duration(500);

        // Set bar positions, heights, and colors
        updateChart(bars, csvData.length, colorScale);
    };
    
    function updateChart(bars, n, colorScale){
        
        
        // Update yscale
        
        // Build array of all values of the expressed attribute
        var domainArray = [];
        for (var i = 0; i < csvData.length; i++){
            var val = parseFloat(csvData[i][expressed]);
            domainArray.push(val);
        };
        
        // Create a scale to size bars proportionally to frame
        var yScale = d3.scaleLinear()
            .range([850, 0])
            .domain([0, Math.ceil(d3.max(domainArray) / 10) * 10]);
        
        // Create vertical axis generator
        var yAxis = d3.axisLeft()
            .scale(yScale);
        
        // Remove old axis
        d3.selectAll("g").remove();
        
        // Place new axis
        var chart = d3.select(".chart")
        var axis = chart.append("g")
            .attr("class", "axis")
            .attr("transform", translate)
            .call(yAxis);
        
        // Position bars
        bars.attr("x", function(d, i){
                return i * (chartInnerWidth / n) +leftPadding;
            })
            // Size/resize bars
            .attr("height", function(d, i){
                return 850 - yScale(parseFloat(d[expressed]));
            })
            .attr("y", function(d, i){
                return yScale(parseFloat(d[expressed])) + topBottomPadding;
            })
            // Color/recolor bars
            .style("fill", function(d){
                return choropleth(d, colorScale);
            });
        
        if (expressed == "Population2010"){
            var chartTitle = d3.select(".chartTitle")
                .text("Population in 2010 for Each Census Tract");
        }else{
            var chartTitle = d3.select(".chartTitle")
                .text("Prevalence of " + expressed + " in Each Census Tract");
        }
    }; // End of updateChart
    
    // Function to hilghlight enumeration units and bars
    function highlight(props){
        // Change stroke
        var selected = d3.selectAll(".gb-" + props.tract2010)
            .style("stroke", "red")
            .style("stroke-width", "3");
        
        setLabel(props);
    };
    
    // Function to reset the element style on mouseout
    function dehighlight(props){
        var selected = d3.selectAll(".gb-" + props.tract2010)
            .style("stroke", function(){
                   return getStyle(this, "stroke")
            })
            .style("stroke-width", function(){
                return getStyle(this, "stroke-width")
            });
        
        d3.select(".infoLabel")
            .remove();
    };
 
    function getStyle(element, styleName){
        var styleText = d3.select(element)
            .select("desc")
            .text();
        
        var styleObject = JSON.parse(styleText);
    
        return styleObject[styleName];
    };
    
    // Function to create a dynamic label
    function setLabel(props){
        
        // Label content
        var labelAttribute = "";
        
        // Check if props[expressed] has a value
        var val = parseFloat(props[expressed]);
        // If attribute value exists, create standard label; otherwise say No Data
        if (typeof val ==  'number' && !isNaN(val)){
            var labelAttribute = "<h1>" + props[expressed] + "\<h1><b>" + expressed + "\<b>";
        }else{
            var labelAttribute = "<h1>" + "No Data" + "\<h1><b>" + expressed + "\<b>";
        }
        
        // Create info label div
        var infoLabel = d3.select("body")
            .append("div")
            .attr("class", "infoLabel")
            .attr("id", "gb-" + props.tract2010 + "_label")
            .html(labelAttribute);
        
        var regionName = infoLabel.append("div")
            .attr("class", "labelName")
            .html("Tract: " + props.tract2010);
    };
    
    // Function to move info label with mouse
    function moveLabel(){
        
        // Get width of label
        var labelWidth = d3.select(".infoLabel")
            .node()
            .getBoundingClientRect()
            .width;

        // Use coordinates of mousemove event to set label coordinates
        var x1 = d3.event.clientX + 10,
            y1 = d3.event.clientY - 75,
            x2 = d3.event.clientX - labelWidth - 10,
            y2 = d3.event.clientY + 25;
        
        // Horizontal label coordinate, testing for overflow
        var x = d3.event.clientX > window.innerWidth - labelWidth - 20 ? x2 : x1; 
        // Vertical label coordinate, testing for overflow
        var y = d3.event.clientY < 75 ? y2 : y1; 
        
        d3.select(".infoLabel")
            .style("left", x + "px")
            .style("top", y + "px");
    }
    
})() // Last line of main.js