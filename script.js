// Load and parse the data from data.csv
d3.csv("data.csv").then(function(data) {
    console.log("Data loaded from data.csv:", data);
    
    // Clean and prepare the data
    const cleanedData = cleanData(data);
    console.log("Cleaned data:", cleanedData);
    
    // Create age groups
    const ageGroupData = createAgeGroups(cleanedData);
    console.log("Age groups:", ageGroupData);
    
    // Initialize the visualization
    initializeVisualization(ageGroupData, cleanedData);
    
}).catch(function(error) {
    console.error("Error loading data.csv:", error);
    alert("Error loading data.csv. Check console for details.");
});

function cleanData(data) {
    return data.map(d => {
        return {
            age: +d.Age, // Convert to number
            exercise: d.Exercise,
            calories: +d.Calories,
            benefit: d.Benefit,
            difficulty: d.Difficulty
        };
    });
}

function createAgeGroups(data) {
    // Define age groups (0-9, 10-19, 20-29, etc.)
    const ageGroups = {};
    
    data.forEach(d => {
        const ageGroup = Math.floor(d.age / 10) * 10;
        const groupKey = `${ageGroup}-${ageGroup+9}`;
        
        if (!ageGroups[groupKey]) {
            ageGroups[groupKey] = [];
        }
        ageGroups[groupKey].push(d);
    });
    
    // Ensure 0-9 age group exists even if empty
    if (!ageGroups['0-9']) {
        ageGroups['0-9'] = [];
    }
    
    return ageGroups;
}

function initializeVisualization(ageGroupData, fullData) {
    const container = d3.select("#visualization-container");
    
    // Clear any existing content
    container.html("");
    
    // Create title for the chart
    container.append("h2")
        .text("Number of People Surveyed by Age Group")
        .style("text-align", "center")
        .style("color", "#333");
    
    // Create SVG for the main chart
    const svg = container.append("svg")
        .attr("width", 800)
        .attr("height", 550); // Increased height to accommodate better spacing
    
    // Prepare data for the bar chart - SORT THE AGE GROUPS NUMERICALLY
    const ageGroupCounts = Object.keys(ageGroupData)
        .map(group => {
            return {
                ageGroup: group,
                count: ageGroupData[group].length,
                // Extract the starting age for sorting (the number before the dash)
                sortKey: parseInt(group.split('-')[0])
            };
        })
        .sort((a, b) => a.sortKey - b.sortKey); // Sort by the starting age
    
    console.log("Sorted age groups:", ageGroupCounts);
    
    // Create scales - use the SORTED age groups
    const xScale = d3.scaleBand()
        .domain(ageGroupCounts.map(d => d.ageGroup)) // Now this is sorted
        .range([80, 750]) // Increased left margin for Y-axis label
        .padding(0.1);
        
    const yScale = d3.scaleLinear()
        .domain([0, d3.max(ageGroupCounts, d => d.count)])
        .range([450, 50]);
    
    // Create bars
    svg.selectAll(".age-bar")
        .data(ageGroupCounts)
        .enter()
        .append("rect")
        .attr("class", "age-bar")
        .attr("x", d => xScale(d.ageGroup))
        .attr("y", d => yScale(d.count))
        .attr("width", xScale.bandwidth())
        .attr("height", d => 450 - yScale(d.count))
        .attr("fill", d => d.count === 0 ? "#cccccc" : "steelblue") // Gray for empty groups
        .on("click", function(event, d) {
            if (d.count > 0) { // Only show details if there's data
                showAgeGroupDetails(d.ageGroup, ageGroupData[d.ageGroup]);
            }
        })
        .style("cursor", d => d.count > 0 ? "pointer" : "default")
        .style("opacity", d => d.count > 0 ? 1 : 0.6);
    
    // Add bar labels for count
    svg.selectAll(".bar-label")
        .data(ageGroupCounts)
        .enter()
        .append("text")
        .attr("class", "bar-label")
        .attr("x", d => xScale(d.ageGroup) + xScale.bandwidth() / 2)
        .attr("y", d => yScale(d.count) - 5)
        .attr("text-anchor", "middle")
        .text(d => d.count)
        .style("font-size", "12px")
        .style("font-weight", "bold")
        .style("fill", d => d.count === 0 ? "#999999" : "black");
    
    // Add axes
    svg.append("g")
        .attr("transform", "translate(0,450)")
        .call(d3.axisBottom(xScale));
        
    svg.append("g")
        .attr("transform", "translate(80,0)") // Adjusted for increased left margin
        .call(d3.axisLeft(yScale));
    
    // Add Y-axis label 
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 10) // Moved further left
        .attr("x", -200) // Centered vertically
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .style("font-size", "14px")
        .style("font-weight", "bold")
        .text("Number of People");
        
    // Add X-axis label
    svg.append("text")
        .attr("y", 500) // Moved further down
        .attr("x", 400)
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .style("font-size", "14px")
        .style("font-weight", "bold")
        .text("Age Group");
    
    // Add note about empty age groups
    if (ageGroupCounts.some(d => d.count === 0)) {
        container.append("p")
            .style("text-align", "center")
            .style("color", "#666")
            .style("font-size", "12px")
            .style("margin-top", "10px")
            .text("Note: Gray bars indicate age groups with no survey data");
    }
}

function showAgeGroupDetails(ageGroup, data) {
    // Clear previous details
    d3.select("#details-container").remove();
    
    const container = d3.select("#visualization-container");
    
    // Create details container
    const detailsContainer = container.append("div")
        .attr("id", "details-container");
    
    // Add back button
    detailsContainer.append("button")
        .text("← Back to Overview")
        .on("click", function() {
            d3.select("#details-container").remove();
        });
    
    // Add title
    detailsContainer.append("h2")
        .text(`Exercise Details for Age Group: ${ageGroup}`);
    
    // Count exercises
    const exerciseCounts = {};
    data.forEach(d => {
        if (!exerciseCounts[d.exercise]) {
            exerciseCounts[d.exercise] = 0;
        }
        exerciseCounts[d.exercise]++;
    });
    
    // Convert to array and sort by popularity
    const sortedExercises = Object.keys(exerciseCounts).map(exercise => {
        return {
            exercise: exercise,
            count: exerciseCounts[exercise],
            calories: data.find(d => d.exercise === exercise).calories,
            benefit: data.find(d => d.exercise === exercise).benefit,
            difficulty: data.find(d => d.exercise === exercise).difficulty
        };
    }).sort((a, b) => b.count - a.count);
    
    // Create table
    const table = detailsContainer.append("table")
        .attr("class", "exercise-table");
    
    // Add header
    const header = table.append("thead").append("tr");
    header.append("th").text("Exercise");
    header.append("th").text("Popularity");
    header.append("th").text("Calories Burned (30 min)");
    header.append("th").text("Benefit");
    header.append("th").text("Difficulty");
    
    // Add rows
    const body = table.append("tbody");
    
    sortedExercises.forEach(exercise => {
        const row = body.append("tr");
        row.append("td").text(exercise.exercise);
        row.append("td").text(exercise.count);
        row.append("td").text(exercise.calories);
        row.append("td").text(exercise.benefit);
        row.append("td").text(exercise.difficulty);
    });
    
    // Add summary statistics
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