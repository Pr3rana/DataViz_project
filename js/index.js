const locationArr = [];
var newData, map, lat = 0,
    long = 0,
    locationCenter, myLatlng, markers1 = {}, markers2 = {},
    modal;
//fecth CSV data
$(document).ready(function() {
    $.ajax({
        type: "GET",
        url: "../data/data.txt",
        dataType: "text",
        success: function(data) {
            processData(data);
        }
    });
});
//process the raw data
function processData(data) {
    newData = $.csv.toObjects(data, {
        onParseValue: $.csv.hooks.castToScalar
    });
    addList(newData);
    locationCenter = getLocationCenter(newData);
    drawMap(newData, locationCenter);
}

//add list to assets
function addList(newData) {
    for (let i = 0; i < newData.length; i++) {
        let txt = newData[i].reference;
        let containerDiv = document.createElement("div");
        containerDiv.setAttribute("class", "container list-group-item list-group-item-action list-group-item-light col-sm-12");
        containerDiv.addEventListener("click",triggerMarkerClick);
        let input = document.createElement("input");
        input.setAttribute("type", "checkbox");
        input.setAttribute("class", "checkbox");
        let label = document.createElement("label");
        label.innerText = txt;
        containerDiv.appendChild(input);
        containerDiv.appendChild(label);
        document.getElementById('list').appendChild(containerDiv);
    }

}
//find the center of multiple co-ordinate
function getLocationCenter(locArr) {
    var len = locArr.length,
        x = 0,
        y = 0,
        z = 0;
    for (i = 0; i < len; i++) {
        var lat = locArr[i].latitude * Math.PI / 180;
        var lon = locArr[i].longitude * Math.PI / 180;

        var a = Math.cos(lat) * Math.cos(lon);
        var b = Math.cos(lat) * Math.sin(lon);
        var c = Math.sin(lat);

        x += a;
        y += b;
        z += c;
    }
    x /= len;
    y /= len;
    z /= len;

    var lon = Math.atan2(y, x);
    var hyp = Math.sqrt(x * x + y * y);
    var lat = Math.atan2(z, hyp);

    var newX = (lat * 180 / Math.PI);
    var newY = (lon * 180 / Math.PI);

    return [newX, newY];
}
//draw the map
function drawMap(newData, locationCenter) {
    let lat = locationCenter[0],
        long = locationCenter[1];

    map = new google.maps.Map(document.getElementById('map_canvas'), {
        zoom: 15,
        center: new google.maps.LatLng(lat, long),
        mapTypeId: google.maps.MapTypeId.SATELLITE
    });
    var infowindow = new google.maps.InfoWindow();
    let marker, i;
    for (i = 0; i < newData.length; i++) {
        let title = newData[i].reference;
        myLatlng = new google.maps.LatLng(newData[i].latitude, newData[i].longitude);
        marker = new google.maps.Marker({
            position: myLatlng,
            map: map
        });
        markers1[title] = marker;
        google.maps.event.addListener(marker, 'click', showChart.bind(null, title));
        google.maps.event.addListener(marker, 'mouseover', (function (marker, title) {

          return function () {
              infowindow.setContent('<h6>'+title+'</h6>' + '<h7>Click to render map</h7>');
              infowindow.open(map, marker);	
          }
      })(marker, title));
      google.maps.event.addListener(marker, 'dblclick', (function (marker, title) {

        return function () {
            infowindow.setContent(title);
            infowindow.open(map, marker);
            map.setCenter(marker.getPosition());
            map.setZoom(22);
        }
      })(marker, title));
    }
};
//show chart when red marker got clicked
function showChart(title) {
    var clickedMarkerInfo = [];
    for (let i = 0; i < newData.length; i++) {
        var el2 = newData[i];
        if (el2.reference == title) {
            clickedMarkerInfo.push(el2);
        }
    }
    var data = getRiskData(clickedMarkerInfo);
    var riskData = data[0];
    var minMax = data[1];
    openModal(riskData, minMax, title);
}
//get risk data
function getRiskData(filteredCords) {
    var riskDataObj = {},
        minMax = {};
    for (let i = 0; i < filteredCords.length; i++) {
        let allVal = [],
            category = [],
            data = [];
        const element = filteredCords[i];
        var key = element.reference;
        riskDataObj[key] = [];
        for (let value in element) {
            if (value != "reference" && value != "latitude" && value != "longitude") {
                let displayValue = (element[value])
                allVal.push(element[value])
                category.push({
                    "label": value
                });
                data.push({
                    "displayValue": element[value]
                });
            }
        }
        var normData = getNormalizeVal(allVal, category, data);

        riskDataObj[key].push(normData.jsonObj)
        let avg = (normData.normMin + normData.normMax) / 2;
        minMax[key] = {
            "min": normData.normMin,
            "max": normData.normMax,
            "avg": avg
        };
    }

    return [riskDataObj, minMax];
}
//get normalize data
function getNormalizeVal(allVal, category, data) {
    let min = Math.min(...allVal),
        max = Math.max(...allVal),
        allNormVal = [],
        normVal,
        normData = {};
    for (let j = 0; j < data.length; j++) {
        let val = data[j].displayValue;
        if (max == min) {
            normVal = 1 / data.length;
        } else {
            normVal = (val - min) / (max - min);
        }
        allNormVal.push(normVal);
        data[j].value = normVal;
    }
    let normMin = Math.min(...allNormVal);
    let normMax = Math.max(...allNormVal);
    normData.jsonObj = {
        "category": category,
        "data": data
    };
    normData.normMin = normMin;
    normData.normMax = normMax;
    return normData;
};
//highlight filtered markers
function highLight(filteredCords, newCenter, riskData, minMax) {
    map = new google.maps.Map(document.getElementById('map_canvas'), {
        zoom: 12,
        center: new google.maps.LatLng(newCenter[0], newCenter[1]),
        mapTypeId: google.maps.MapTypeId.SATELLITE
    });
    var infowindow = new google.maps.InfoWindow();
    for (let i = 0; i < filteredCords.length; i++) {
        var lat = filteredCords[i].latitude,
         long = filteredCords[i].longitude,
         title = filteredCords[i].reference,
         myLatlng = new google.maps.LatLng(lat, long);
         marker = new google.maps.Marker({
            position: myLatlng,
            icon: {
                url: "./assets/placeholder.png"
            },
            map: map
        });
        markers2[title] = marker;
        window.google.maps.event.addListener(marker, 'click', openModal.bind(null, riskData, minMax, title));
        google.maps.event.addListener(marker, 'mouseover', (function (marker, title) {

          return function () {
              infowindow.setContent('<h6>'+title+'</h6>' + '<h7>Click to render map</h7>');
              infowindow.open(map, marker);	
          }
      })(marker, title));
      google.maps.event.addListener(marker, 'dblclick', (function (marker, title) {

        return function () {
            infowindow.setContent(title);
            infowindow.open(map, marker);
            map.setCenter(marker.getPosition());
            map.setZoom(22);
        }
      })(marker, title));
    }
}
//open modal for rendering chats
function openModal(riskData, minMax, title) {
    modal = document.getElementById('myModal');
    var close = document.getElementById("close");

    for (let key in riskData) {
        if (key == title) {
            let min = minMax[key].min;
            let max = minMax[key].max;
            let avg = minMax[key].avg;
            renderChart(key, riskData[key], min, max, avg);
        }
    }
    modal.style.display = "block";

    close.addEventListener("click", function() {
        modal.style.display = "none";
    })
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }
}
//render the charts
function renderChart(title, riskData, min, max, avg) {
    let newMin = min - avg / 2;
    var dataSrc = {
        "caption": "Risk data for " + title,
        "xAxisName": "Time",
        "yAxisName": "Risk Probability",
        "numVisiblePlot": "12",
        "decimals": "8",
        "yAxisMinvalue": newMin,
        "yAxisMaxvalue": max,
        "plotToolText": "timestamp: $label <br> Risk Value: $displayValue <br> Normalize Value: $dataValue",
        "theme": "fusion",
    };
    if (min == max) {
        dataSrc.yAxisMinvalue = min - avg;
        dataSrc.yAxisMaxvalue = max + avg;
    } else {
        dataSrc.yAxisMinvalue = newMin;
        dataSrc.yAxisMaxvalue = max;
    }
    var chartInstance = new FusionCharts({
        type: 'scrollcolumn2d',
        width: "100%", // Width of the chart
        height: "100%", // Height of the chart
        dataFormat: 'json', // Data type
        renderAt: 'chart-container', //container where the chart will render
        dataSource: {
            "chart": dataSrc,
            "categories": [{
                "category": riskData[0].category,
            }],
            // Chart Data
            "dataset": [{
                "data": riskData[0].data
            }]
        }
    });
    // Render
    chartInstance.render();
}

//apply the filter
function applyFilter() {
  var checkedArr = [],
      filteredCords = [];
      
      console.log(this);
  document.querySelectorAll('.container').forEach(el => {
      if (el.children[0].checked) {
          checkedArr.push(el.children[1].innerText);
      }
  })
  if (checkedArr.length == 0) {
      alert("No asset has been selected!");
      return;
  }
  for (let i = 0; i < checkedArr.length; i++) {
      var el1 = checkedArr[i];
      for (let j = 0; j < newData.length; j++) {
          var el2 = newData[j];
          if (el2.reference == el1) {
              filteredCords.push(el2);
          }
      }
  }
  this.setAttribute("class","active");
  var data = getRiskData(filteredCords);
  var riskData = data[0];
  var minMax = data[1];
  var newCenter = getLocationCenter(filteredCords);
  modal = document.getElementById('myModal').style.display = "none";
  highLight(filteredCords, newCenter, riskData, minMax);
}

//remove existing filter
function removeFilter() {
    document.querySelectorAll('.container').forEach(el => {
        if (el.children[0].checked) {
            el.children[0].checked = false;
        }
    })
    markers1 = {};
    document.getElementById("apply").classList.remove("active");
    document.getElementById("input").value = "";
    search();
    modal = document.getElementById('myModal').style.display = "none";
    drawMap(newData, locationCenter);
}

//Search out required data
function search() {
    var input, filter, ul, div, label, i, txtValue;
    var sadFace = document.getElementById('sadFace');
    input = document.getElementById("input");
    filter = input.value.toUpperCase();
    ul = document.getElementById("list");
    div = ul.getElementsByTagName("div");
    for (i = 0; i < div.length; i++) {
        label = div[i].getElementsByTagName("label")[0];
        txtValue = label.textContent || label.innerText;
        if (txtValue.toUpperCase().indexOf(filter) > -1) {
            div[i].style.display = "";
        } else {
            div[i].style.display = "none";
        }
    }
}
function triggerMarkerClick(e){
  let label, key;
  let checkbox = e.target.getElementsByTagName("input")[0];
  if(e.target.tagName != "INPUT" && checkbox.checked){
    label = e.target.getElementsByTagName("label")[0];
    key = label.textContent || label.innerText;
    google.maps.event.trigger(markers2[key], 'dblclick');
  }
  else if(e.target.tagName != "INPUT" && checkbox.checked == false){
    if(document.querySelectorAll('.active').length > 0){
        removeFilter();
        setTimeout(() => {
            label = e.target.getElementsByTagName("label")[0];
            key = label.textContent || label.innerText;
            google.maps.event.trigger(markers1[key], 'dblclick');
        },0);
    }
    else{
        label = e.target.getElementsByTagName("label")[0];
        key = label.textContent || label.innerText;
        google.maps.event.trigger(markers1[key], 'dblclick');
    }
    
  }
  else{
      console.log("Something went wrong!");
      return;
  }
}
//add listner to required elements
document.getElementById("apply").addEventListener('click', applyFilter);
document.getElementById("reset").addEventListener('click', removeFilter);
document.getElementById("input").addEventListener("keyup", search);
document.getElementById("find").addEventListener("click", search);
  