// Authored by Joe Marks, 2019
/*eslint-env browser*/

//begin script when window loads
window.onload = setMap();

// Set up choropleth map
function setMap() {
    // Use Promise.all to parallelize asynchronous data loading
    var promises = [];
    promises.push(d3.csv("data/Chicago_500_cities_data.csv")); // Load attributes from csv
    promises.push(d3.json("data/Countries.topojson")); // Load background spatial data
    promises.push(d3.json("data/Chicago_Census_Tracts.topojson")); // Load census tract data
    
    Promise.all(promises).then(callback);
    
    function callback(data){
        csvData = data[0];
        countries = data[1];
        tracts = data[2];
        //TODO: basemap
        console.log(csvData);
        console.log(countries);
        console.log(tracts);
        
        console.log(countries.objects);
        
        // Translate census tracts TopoJSON
        var states = topojson.feature(countries, countries.objects.ne_10m_admin_1_states_provinces), censusTracts = topojson.feature(tracts, tracts.objects.Chicago_Census_Tracts).features;
        
        
        
        console.log(states);
        console.log(censusTracts);
    }
}