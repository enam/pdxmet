var title = "PDX Transportation Monsters";
var tonerUrl = 'http://tile.stamen.com/toner-lite/{z}/{x}/{y}.png';
var toner = new L.TileLayer(tonerUrl, {maxZoom: 18, attribution: tonerAttrib, subdomains: ['a1', 'a2', 'a3']});
var baseMaps = {
	"Toner": toner,
};
var markerGroup = new L.LayerGroup();
var overlayMaps = {
	"Transit Monsters": markerGroup
};

var snakeHappy = L.icon({
    iconUrl: 'img/happySnake.png',
    iconSize:     [53,26], // size of the icon
   	iconAnchor:   [0,26], // point of the icon which will correspond to marker's location
    popupAnchor:  [-0, -17], // point from which the popup should open relative to the iconAnchor
});
var snakeMad = L.icon({
    iconUrl: 'img/angrySnake.png',
    iconSize:     [53,26], // size of the icon
   	iconAnchor:   [0,26], // point of the icon which will correspond to marker's location
    popupAnchor:  [-0, -17] // point from which the popup should open relative to the iconAnchor
});
var bfHappy = L.icon({
    iconUrl: 'img/bfHappy.png',
    iconSize:     [18,23], // size of the icon
   	iconAnchor:   [0,23], // point of the icon which will correspond to marker's location
    popupAnchor:  [-0, -17] // point from which the popup should open relative to the iconAnchor
});
var bfMad = L.icon({
    iconUrl: 'img/bfMad.png',
    iconSize:     [18,23], // size of the icon
   	iconAnchor:   [0,23], // point of the icon which will correspond to marker's location
    popupAnchor:  [-0, -17] // point from which the popup should open relative to the iconAnchor
});
var map = new L.Map('map', {
	center: new L.LatLng(45.518, -122.68),
	zoom: 15,
	layers: [toner,markerGroup],
	attributionControl: false
});
var bounds = [[-90, -180], [90, 180]];

L.rectangle(bounds, {color: "#fff", stroke:false, fillOpacity:0.7}).addTo(map);
L.control.attribution({position: 'bottomright', prefix: '<a href="http://leafletjs.com/">Leaflet</a>, <a href="http://stamen.com">Stamen</a>, <a href="http://openstreetmap.org">OSM</a>, <a href="http://trimet.org/">TRIMET</a>'}).addTo(map);
var layersControl = new L.Control.Layers(baseMaps,overlayMaps);
window.setInterval(getMonsterLocations,2000);
$("body").prepend(headerHTML);
$(".demotitle").text(title);

function getMonsterLocations(){
	var url = "http://developer.trimet.org/beta/v2/vehicles/?appID=3CCD8FB3148C93C38CBE0AE0B";
	$.getJSON(url,function(data) {
		mapResults(data);
	});
}
function mapResults(data){
	var vehicles = data.resultSet.vehicle;
	var newvehicles = [];
	//var markerGroup = new L.LayerGroup().addTo(map);
	markerGroup.eachLayer(function(layer){
		//console.log(layer.id);
		for(var i=0;i<vehicles.length;i++){
			var match = false;
			if(layer.id===vehicles[i].vehicleID){
				match = true;
				var d = vehicles[i];
				
				var ll = new L.LatLng(d.latitude,d.longitude,true);
				var tmp = L.polyline([layer.getLatLng(),layer.getLatLng(),layer.getLatLng(),ll]);
				var lngth = tmp.length_in_meters();
				if(lngth<50){

				}else{
					var icon = bfHappy;
					if (d.delay < 0){
						icon = bfMad;
					}
					if(d.type == "rail"){
						icon = snakeHappy;
						if(d.delay < 0){
							icon = snakeMad;
						}
					}
					angle = d.bearing+90;
					var m = new L.animatedMarker(tmp.getLatLngs(),{
							  icon: icon,
							  distance: lngth,  // meters
							  interval: 1500, 
							   onEnd: function() {
							    makeMarker(d,m);
							  }
							});
					m.setIconAngle(angle);
					markerGroup.addLayer(m);
					markerGroup.removeLayer(layer);
					
				}
			}
			if (match == true){
				vehicles.splice(i,1);
				break;
			}
		}
		if(match===false){
			markerGroup.removeLayer(layer);
		}
	})
	for(var i=0;i<vehicles.length;i++){
		var d = vehicles[i];
		var icon = bfHappy;
		if (d.delay < 0){
			icon = bfMad;
		}
		if(d.type == "rail"){
			icon = snakeHappy;
			if(d.delay < 0){
				icon = snakeMad;
			}
		}
		var ll = new L.LatLng(d.latitude,d.longitude,true);
		var m = new L.Marker(ll,{icon: icon,riseOnHover:true });
		angle = d.bearing+90;
		m.setIconAngle(angle);
		m.title = d.signMessage;
		m.id = d.vehicleID;
		m.on('mouseover', function(evt) {
			showMessage(evt.target.title);
		});
		m.on('mouseout', function(evt) {
			hideMessage();
		});
		markerGroup.addLayer(m);
	}
}
function makeMarker(d,oldm){
	var icon = bfHappy;
		if (d.delay < 0){
			icon = bfMad;
		}
		if(d.type == "rail"){
			icon = snakeHappy;
			if(d.delay < 0){
				icon = snakeMad;
			}
		}
		var ll = new L.LatLng(d.latitude,d.longitude,true);
		var m = new L.Marker(ll,{icon: icon,riseOnHover:true });
		angle = d.bearing+90;
		m.setIconAngle(angle);
		m.title = d.signMessage;
		m.on('mouseover', function(evt) {
			showMessage(evt.target.title);
		});
		m.on('mouseout', function(evt) {
			hideMessage();
		});
		m.on('add', function(evt) {
			markerGroup.removeLayer(oldm);
		});
		m.id = d.vehicleID;
		markerGroup.addLayer(m);
}
function showMessage(m){
	$("#signDiv").show();
	$("#signDiv").text(m);
	console.log(m);
}		
function hideMessage(){
	$("#signDiv").hide();
}
//Great formula found in Leaflet Google Groups for calculating dist of polyine. But I didn't write down the name of the commentor :(
//This is used to get the length of the track for each update so that the speed of animation cna be calculated
L.Polyline.prototype.length_in_meters = function () {
        var metros_totales_ruta = 0;
        var coordenadas_iniciales = null;
        var array_coordenadas_polilinea = this._latlngs;
        for (i = 0; i < array_coordenadas_polilinea.length - 1; i++) {
            coordenadas_iniciales = array_coordenadas_polilinea[i];
            metros_totales_ruta  += coordenadas_iniciales.distanceTo(array_coordenadas_polilinea[i + 1]);

        }
        metros_totales_ruta = metros_totales_ruta.toFixed();
        return metros_totales_ruta;
    }
