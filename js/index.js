
const locationArr = [];
var newData,map,lat=0, long=0,locationCenter, myLatlng, markers={}, modal,riskData;
//fecth CSV data
$(document).ready(function() {
    $.ajax({
        type: "GET",
        url: "../data/data.txt",
        dataType: "text",
        success: function(data) {processData(data);}
     });
});
//process the raw data
function processData(data) {
  newData = $.csv.toObjects(data, {
    onParseValue: $.csv.hooks.castToScalar
  });
  addList(newData);
  locationCenter = getLocationCenter(newData);
  drawMap(newData,locationCenter)
}
//find the center of multiple co-ordinate
function getLocationCenter(locArr) {
  var len = locArr.length, x=0,y=0,z=0;
  for(i = 0; i < len; i++){
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
function drawMap(newData,locationCenter){
    let lat = locationCenter[0], long = locationCenter[1];
    
    map = new google.maps.Map(document.getElementById('map_canvas'), {
        zoom: 15,
        center: new google.maps.LatLng(lat, long),
        mapTypeId: google.maps.MapTypeId.SATELLITE
      });
  
      var infowindow = new google.maps.InfoWindow();
      var marker, i;
      for (i = 0; i < newData.length; i++) {
        let ttl = newData[i].reference, num = (i+1)+"";
        myLatlng = new google.maps.LatLng(newData[i].latitude, newData[i].longitude);
        marker = new google.maps.Marker({
          position: myLatlng,
          title: ttl,
          map: map
        });
        //google.maps.event.addListener(marker, 'click', hello.bind(null,ttl));
      }
};
//apply the filter
function applyFilter(){
  var checkedArr = [], filteredCords=[];
  document.querySelectorAll('.container').forEach(el=>{
    if(el.children[0].checked){
      checkedArr.push(el.children[1].innerText);
    }
  })
  if (checkedArr.length==0) {
    alert("No asset has been selected!");
    return;
  }
  for (let i = 0; i < checkedArr.length; i++) {
    var el1 = checkedArr[i];
    for (let j = 0; j < newData.length; j++) {
      var el2 = newData[j];
      if (el2.reference==el1) {
        filteredCords.push(el2);
      }
    }
  }
  var data = getRiskData(filteredCords);
  riskData = data[0];
  var minMax = data[1];
  var newCenter = getLocationCenter(filteredCords);
  modal = document.getElementById('myModal').style.display = "none";
  startBounce(filteredCords,newCenter,riskData,minMax);
}
//remove existing filter
function removeFilter(){
  document.querySelectorAll('.container').forEach(el=>{
    if(el.children[0].checked){
      el.children[0].checked = false;
    }
  })
  document.getElementById("input").value = "";
  search();
  modal = document.getElementById('myModal').style.display = "none";
  drawMap(newData,locationCenter);
}
//get risk data
function getRiskData(filteredCords) {
  var riskDataObj = {},minMax = {};
  for (let i = 0; i < filteredCords.length; i++) {
    let allVal =[];
    const element = filteredCords[i];
    var key = element.reference;
    riskDataObj[key] = [];
    for(let value in element){
      if(value != "reference" && value!="latitude" && value != "longitude"){
          allVal.push(element[value])
          var jsonObj = {"label":value,"value":element[value]};
          riskDataObj[key].push(jsonObj);
      }
    }
    let min = Math.min(...allVal);
    let max = Math.max(...allVal);
    let avg = (min+max)/2;
    minMax[key] = {"min": min, "max":max, "avg":avg};
  }
  
  return [riskDataObj,minMax];
}
document.getElementById("apply").addEventListener('click',applyFilter);
document.getElementById("reset").addEventListener('click',removeFilter);
document.getElementById("input").addEventListener("keyup", search);
document.getElementById("find").addEventListener("click", search);
//highlight specic markers
function startBounce(filteredCords,newCenter,riskData,minMax) {
  map = new google.maps.Map(document.getElementById('map_canvas'), {
    zoom: 12,
    center: new google.maps.LatLng(newCenter[0], newCenter[1]),
    mapTypeId: google.maps.MapTypeId.SATELLITE
  });
  for (let i = 0; i < filteredCords.length; i++) {
    var lat = filteredCords[i].latitude;
    var long = filteredCords[i].longitude;
    var title = filteredCords[i].reference;
    marker = new google.maps.Marker({
      animation: google.maps.Animation.BOUNCE,
      position: new google.maps.LatLng(lat, long),
      icon:{url: "./assets/placeholder.png"},
      title: title,
      map: map
    });
    window.google.maps.event.addListener(marker, 'click', openModal.bind(null,riskData,minMax,title));
    }
}
//open modal for rendering chats
function openModal(riskData,minMax,title) {
  modal = document.getElementById('myModal');
  var close = document.getElementById("close");

  for(let key in riskData){
    if(key == title){
      let min = minMax[key].min;
      let max = minMax[key].max;
      let avg = minMax[key].avg;
      renderChart(key,riskData[key],min,max,avg);
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
function renderChart(title,data,min,max,avg){
  var dataSrc = {
    "caption": "Risk data for "+ title,
    "xAxisName": title,
    "yAxisName": "Risk probability",
    "yAxisMinvalue": min,
    "yAxisMaxvalue": max,
    "theme": "fusion",
};
  if(min === max){
    dataSrc.yAxisMinvalue = min - avg;
    dataSrc.yAxisMaxvalue = max + avg;
  }
  else{
    dataSrc.yAxisMinvalue = min;
    dataSrc.yAxisMaxvalue = max;
  }
  var chartInstance = new FusionCharts({
    type: 'bar2d',
    width: "100%", // Width of the chart
    height: "100%", // Height of the chart
    dataFormat: 'json', // Data type
    renderAt:'chart-container', //container where the chart will render
    dataSource: {
        "chart": dataSrc,
        // Chart Data
        "data": data
    }
});
// Render
chartInstance.render();
}

//add list to html
function addList(newData){
  for (let i = 0; i < newData.length; i++) {
    let txt = newData[i].reference;
    let containerDiv = document.createElement("div");
    containerDiv.setAttribute("class","container list-group-item list-group-item-action list-group-item-light col-sm-12");
    let input = document.createElement("input");
    input.setAttribute("type","checkbox");
    input.setAttribute("class","checkbox");
    let label = document.createElement("label");
    label.innerText = txt;
    containerDiv.appendChild(input);
    containerDiv.appendChild(label);
    document.getElementById('list').appendChild(containerDiv);
  }

}

function search() {
  var input, filter, ul, div, label, i, txtValue;
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