// Load the data from csv
d3.csv("data.csv").then(function(data) {
    console.log("Data loaded from data.csv:", data);
    
    // Clean and prepare the data
    const cleanedData = cleanData(data);
    console.log("Cleaned data:", cleanedData);
    
    // Create age groups
    const ageGroupData = createAgeGroups(cleanedData);
    console.log("Age groups:", ageGroupData);
    
    // visualization
    initializeVisualization(ageGroupData, cleanedData);
    
}).catch(function(error) {
    console.error("Error loading data.csv:", error);
    alert("Error loading data.csv. Check console for details.");
});

function cleanData(data) {
    return data.map(d => {
        return {
            age: +d.Age, 
            exercise: d.Exercise,
            calories: +d.Calories,
            benefit: d.Benefit,
            difficulty: d.Difficulty
        };
    });
}

function createAgeGroups(data) {
    // Define age gps
    const ageGroups = {};
    
    data.forEach(d => {
        const ageGroup = Math.floor(d.age / 10) * 10;
        const groupKey = `${ageGroup}-${ageGroup+9}`;
        
        if (!ageGroups[groupKey]) {
            ageGroups[groupKey] = [];
        }
        ageGroups[groupKey].push(d);
    });
    
    if (!ageGroups['0-9']) {
        ageGroups['0-9'] = [];
    }
    
    return ageGroups;
}

function initializeVisualization(ageGroupData, fullData) {
    const container = d3.select("#visualization-container");
    
    container.html("");
    
    // title for the chart
    container.append("h2")
        .text("Number of People Surveyed by Age Group")
        .style("text-align", "center")
        .style("color", "#333");
    
    const svg = container.append("svg")
        .attr("width", 800)
        .attr("height", 550);
    
    // data for the bar chart
    const ageGroupCounts = Object.keys(ageGroupData)
        .map(group => {
            return {
                ageGroup: group,
                count: ageGroupData[group].length,

                sortKey: parseInt(group.split('-')[0])
            };
        })
        .sort((a, b) => a.sortKey - b.sortKey); 
    
    console.log("Sorted age groups:", ageGroupCounts);
    
    // scales
    const xScale = d3.scaleBand()
        .domain(ageGroupCounts.map(d => d.ageGroup)) 
        .range([80, 750]) // Increased left margin
        .padding(0.1);
        
    const yScale = d3.scaleLinear()
        .domain([0, d3.max(ageGroupCounts, d => d.count)])
        .range([450, 50]);
    
    // bars
    svg.selectAll(".age-bar")
        .data(ageGroupCounts)
        .enter()
        .append("rect")
        .attr("class", "age-bar")
        .attr("x", d => xScale(d.ageGroup))
        .attr("y", d => yScale(d.count))
        .attr("width", xScale.bandwidth())
        .attr("height", d => 450 - yScale(d.count))
        .attr("fill", d => d.count === 0 ? "#cccccc" : "#0D6094") // Blue for data, gray for empty
        .attr("stroke", "#296A94")
        .attr("stroke-width", 0)
        .on("click", function(event, d) {
            if (d.count > 0) { 
                showAgeGroupDetails(d.ageGroup, ageGroupData[d.ageGroup]);
            }
        })
        .style("cursor", d => d.count > 0 ? "pointer" : "default")
        .style("opacity", d => d.count > 0 ? 1 : 0.6);
    
    // labels
    svg.selectAll(".bar-label")
        .data(ageGroupCounts)
        .enter()
        .append("text")
        .attr("class", "bar-label")
        .attr("x", d => xScale(d.ageGroup) + xScale.bandwidth() / 2)
        .attr("y", d => yScale(d.count) - 8)
        .attr("text-anchor", "middle")
        .text(d => d.count)
        .style("font-size", "12px")
        .style("font-weight", "bold")
        .style("fill", "#333");
    
    // axes
    svg.append("g")
        .attr("transform", "translate(0,450)")
        .call(d3.axisBottom(xScale))
        .style("color", "#333")
        .selectAll("text")
        .style("fill", "#333");
        
    svg.append("g")
        .attr("transform", "translate(80,0)") // increased left margin
        .call(d3.axisLeft(yScale))
        .style("color", "#333")
        .selectAll("text")
        .style("fill", "#333");
    
    svg.selectAll(".domain, .tick line")
        .style("stroke", "#000000");
    
    // Y-axis label
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 10) 
        .attr("x", -200) 
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .style("font-size", "14px")
        .style("font-weight", "bold")
        .style("fill", "#333")
        .text("Number of People");
        
    // X-axis label
    svg.append("text")
        .attr("y", 500) 
        .attr("x", 400)
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .style("font-size", "14px")
        .style("font-weight", "bold")
        .style("fill", "#333")
        .text("Age Group");
}

function showAgeGroupDetails(ageGroup, data) {
   
    d3.select("#details-container").remove();
    
    const container = d3.select("#visualization-container");
    
    const detailsContainer = container.append("div")
        .attr("id", "details-container");
    
    // back but
    detailsContainer.append("button")
        .text("← Back to Overview")
        .on("click", function() {
            d3.select("#details-container").remove();
        });
    
    // title
    detailsContainer.append("h2")
        .text(`Exercise Details for Age Group: ${ageGroup}`)
        .style("color", "#333");
    
    // Count exercises
    const exerciseCounts = {};
    data.forEach(d => {
        if (!exerciseCounts[d.exercise]) {
            exerciseCounts[d.exercise] = 0;
        }
        exerciseCounts[d.exercise]++;
    });
    
    // sort by popularity
    const sortedExercises = Object.keys(exerciseCounts).map(exercise => {
        return {
            exercise: exercise,
            count: exerciseCounts[exercise],
            calories: data.find(d => d.exercise === exercise).calories,
            benefit: data.find(d => d.exercise === exercise).benefit,
            difficulty: data.find(d => d.exercise === exercise).difficulty
        };
    }).sort((a, b) => b.count - a.count);
    
    // table
    const table = detailsContainer.append("table")
        .attr("class", "exercise-table");
    
    // header
    const header = table.append("thead").append("tr");
    header.append("th").text("Exercise");
    header.append("th").text("Popularity");
    header.append("th").text("Calories Burned (30 min)");
    header.append("th").text("Benefit");
    header.append("th").text("Difficulty");
    
    // rows
    const body = table.append("tbody");
    
    sortedExercises.forEach(exercise => {
        const row = body.append("tr");
        row.append("td").text(exercise.exercise);
        row.append("td").text(exercise.count);
        row.append("td").text(exercise.calories);
        row.append("td").text(exercise.benefit);
        row.append("td").text(exercise.difficulty);
    });
    
    // summary stast
    const totalPeople = data.length;
    const uniqueExercises = sortedExercises.length;
    const avgCalories = d3.mean(data, d => d.calories);
    
    detailsContainer.append("div")
        .attr("class", "summary-stats")
        .style("margin-top", "20px")
        .style("padding", "15px")
        .style("background-color", "#f8f9fa")
        .style("border-radius", "5px")
        .html(`
            <h3>Summary for ${ageGroup}:</h3>
            <p><strong>Total People:</strong> ${totalPeople}</p>
            <p><strong>Unique Exercises:</strong> ${uniqueExercises}</p>
            <p><strong>Average Calories Burned:</strong> ${avgCalories.toFixed(1)} per 30 min</p>
            <p><strong>Most Popular Exercise:</strong> ${sortedExercises[0].exercise} (${sortedExercises[0].count} people)</p>
        `);
}
