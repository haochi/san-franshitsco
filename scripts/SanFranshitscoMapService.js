angular.module('sanFranshitscoApp').factory('SanFranshitscoMapService', ['doT', function (doT) {
    var service = this,
        template;

    template = doT.template(
        "<div class='info-window'>" +
            "{{? it.media_url }}" +
                "<img src='{{= it.media_url.url }}' />" +
            "{{?}}" +
            "<div><strong>Neighborhood:</strong> {{= it.neighborhood }}</div>" +
            "<div><strong>Address:</strong> {{= it.address }}</div>" +
            "<div><strong>Opened:</strong> {{= it.opened }}</div>" +
            "{{? it.closed }}" +
                "<div><strong>Closed:</strong> {{= it.closed }}</div>" +
            "{{?}}" +
        "</div>")

    service.infoWindow = new google.maps.InfoWindow();
    service.visible = new google.maps.MVCArray();
    service.markers = [];

    service.map = new google.maps.Map(document.getElementById("map-canvas"), {
        zoom: 13,
        center: new google.maps.LatLng(37.7615, -122.4395),
        styles: [{
            stylers: [
                {hue: "#ff8800"},
                {gamma: 0.4}
            ]
        }]
    });

    service.heatmap = new google.maps.visualization.HeatmapLayer({
        data: service.visible,
        map: service.map
    });

    service.showHeatMap = function () {
        service.heatmap.setMap(service.map);
        service.hideMarkers();
    };

    service.hideHeatMap = function () {
        service.heatmap.setMap(null);
    };

    service.setRecords = function (records) {
        service.clear();
        records.forEach(function (record) {
            var lat = parseFloat(record.point.latitude),
                lng = parseFloat(record.point.longitude),
                latlng = new google.maps.LatLng(lat, lng),
                marker = new google.maps.Marker({ position: latlng, icon: 'poop.png' });

            marker.record = record;

            service.visible.push(latlng);
            service.markers.push(marker);

            google.maps.event.addListener(marker, 'click', function() {
                service.infoWindow.setContent(template(marker.record));
                service.infoWindow.open(service.map);
                service.infoWindow.setPosition(marker.getPosition());
            });
        });
    };

    service.setMarkersMap = function (map) {
        service.markers.forEach(function (marker) {
            marker.setMap(map);
        });
    }

    service.hideMarkers = function () {
        service.setMarkersMap(null);
    };

    service.showMarkers = function () {
        service.setMarkersMap(service.map);
        service.hideHeatMap();
    };

    service.clear = function () {
        service.visible.clear();
        service.markers.forEach(function (marker) {
            marker.setMap(null);
            google.maps.event.clearInstanceListeners(marker);
        });
        service.markers.length = 0;
    };

    google.maps.event.addListener(service.map, 'click', function() {
        service.infoWindow.close();
    });

    return service;
}]);
