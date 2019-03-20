# DataViz_project

## Overview
Tried to visualize how I analyze a large dataset.

## Project Description
I got a task to visualize a data set of 2100 assets around New York. Data about the assets include an identifier, physical location, metadata, and a hazard (effectively, a failure probability).

As the data contains latitude and longitude so first I plotted all of them on a map and then I filtered out and highlighted the required ones. Clicking on the highlighted marker will showcase the data associated with it in the form of a graph.

## How to run the project?

1) Clone the project using 
#### `git clone`

2) Install all the application dependencies, by traversing into the application directory and running
#### `npm install`

## Available Scripts

In the project directory, you can run:

#### `npm start`

Runs the app in the development mode.<br>
Open [http://localhost:8080/](http://localhost:8080) to view it in the browser.

###Feature Included

##Map
1) Plotted all the given asset locations on a map.
2) Showing the name of the asset on hovering over the desired marker present in the map.
3) The user can filter out data by selecting the required asset from the search panel and clicking apply.
4) The user can focus on specific data by directly clicking on the name of the respective asset present inside the search panel.
5) Clicking on the respective marker will showcase the data associated with it in the form of a chart.

##Chart
1) The chart has been plotted by normalizing the value between 0-1, and on hover over the graph plot will showcase both the original value and normalize value for ease.
2) Here I have used scrolled column chart so that any huge data can get visualize in a better manner.
3) The minimum value of y-axis for the chart is less than 0 so that any plot having value 0 can also get visualize to the user. It's totally optional. 

P.S. There is a #Reset button as well to bring back the application to its original state any time.
