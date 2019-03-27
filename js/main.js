// Authored by Joe Marks, 2019
/*eslint-env browser*/

//initialize function called when the script loads
function initialize(){
    cities();
};

//function to create a table with cities and their populations
function cities(){
    //define two arrays for cities and population
    var cityPop = [
        { 
            city: 'Rochester',
            state: 'MN',
            population: 115733
        },
        {
            city: 'Rochester',
            state:'NY',
            population: 208046
        },
        {
            city: 'Chicago',
            state:'IL',
            population: 2716000
        },
        {
            city: 'Minneapolis',
            state:'MN',
            population: 422331
        }
    ];

    //append the table element to the div
    $("#mydiv").append("<table>");

    //append a header row to the table
    $("table").append("<tr>");

    //add the "City" and "Population" columns to the header row
    $("tr").append("<th>City</th><th>State</th><th>Population</th>");

    //loop to add a new row for each city
    for (var i = 0; i < cityPop.length; i++){
        //assign longer html strings to a variable
        var rowHtml = "<tr><td>" + cityPop[i].city + "</td><td>" + cityPop[i].state + "</td><td>" + cityPop[i].population + "</td></tr>";
        //add the row's html string to the table
        $("table").append(rowHtml);
    };
};

//call the initialize function when the document has loaded
$(document).ready(initialize);