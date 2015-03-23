angular.module('sanFranshitscoApp').factory('SanFranshitscoService', ['$http', function ($http) {
    var service = {};

    service.getHumanWaste = function (offset) {
        var params = { request_details: "Human Waste", $limit: 50000, $offset: offset || 0 };
        return $http.jsonp("https://data.sfgov.org/resource/vw6y-z8j6.json?$jsonp=JSON_CALLBACK", { params: params });
    };

    return service;
}]);
