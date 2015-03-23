angular.module('sanFranshitscoApp').controller('MainController', ['$scope', '$filter', 'SanFranshitscoService', 'SanFranshitscoMapService', 'moment', 'regression',
function ($scope, $filter, sf, sfMap, moment, regression) {
    var format = 'MM/DD/YYYY';

    $scope.sizes = [10, 50, 100, 200, 500, 1000, 1500];
    $scope.views = { heatmap: 'Heatmap', markers: 'Markers' };
    $scope.images = { 'No': false, 'Yes': true };
    $scope.neighborhoods = {};
    $scope.forecast = {
        labels: [],
        data: []
    };
    $scope.all = [];

    $scope.size = 0;
    $scope.view = 'heatmap';
    $scope.neighborhood = null;
    $scope.startDate = null;
    $scope.endDate = null;
    $scope.image = false;

    $scope.dumpLastNRecords = function (n) {
        $scope.size = n;
    };

    $scope.dumpAllRecords = function (n) {
        $scope.size = $scope.all.length;
    };

    $scope.dumpRecordsInNeighborhood = function (neighborhood) {
        $scope.neighborhood = neighborhood;
    };

    $scope.imagesOnly = function (image) {
        $scope.image = image;
    };

    $scope.setView = function (view) {
        $scope.view = view;
    };

    $scope.forecastPoop = function (past, future) {
        var daysAgo = moment().subtract(past, 'days').startOf('day').toDate(),
            records = $scope.all,
            lastNDayRecords,
            lastNDayTally,
            polynomialRegression,
            labels,
            data,
            formula;

        lastNDayRecords = records.filter(function (record) {
            return moment(record.opened).diff(daysAgo) >= 0;
        });
        lastNDayTally = _
            .chain(lastNDayRecords)
            .countBy(function (record) {
                return moment(record.opened).format(format);
            })
            .map(function(value, date) {
                return { date: date, value: value };
            })
            .value()
            .sort(function (a, b) {
                return a.date.localeCompare(b.date);
            });

        labels = lastNDayTally.map(function (r) {
            return r.date;
        });

        data = lastNDayTally.map(function (r) {
            return r.value;
        });

        polynomialRegression = regression('polynomial', lastNDayTally.map(function (r, i) {
            return [i, r.value];
        }), 2);

        forumla = function (x) {
            return polynomialRegression.equation.reduce(function (memo, me, index) {
                return memo + me * Math.pow(x, index);
            }, 0);
        };

        for (var i=0; i<=future; i++) {
            labels.push(moment(daysAgo).add(past + i - 1, 'day').format(format));
            data.push(Math.round(forumla(i+1)));
        }

        return {
            data: [data],
            labels: labels
        };
    };

    $scope.onForecastClick = function (point) {
        var date;
        if (point.length) {
            date = moment(point[0].label, format).toDate();
            $scope.startDate = date;
            $scope.endDate = date;
        }
    };

    $scope.$watchGroup(['size', 'neighborhood', 'startDate', 'endDate', 'image', 'view'], function() {
        var records = $scope.all,
            neighborhood = $scope.neighborhood,
            startDate = moment($scope.startDate).startOf('day').toDate(),
            endDate = moment($scope.endDate).endOf('day').toDate(),
            image = $scope.image,
            view = $scope.view,
            neighborhoods;

        records = records.filter(function (record) {
            return  (neighborhood ? record.neighborhood === neighborhood : true) && 
                    (startDate && !isNaN(startDate.getTime()) ? startDate <= Date.parse(record.opened) : true) &&
                    (endDate && !isNaN(endDate.getTime()) ? Date.parse(record.opened) <= endDate : true) &&
                    (image ? record.media_url : true);
        }).slice(-$scope.size);

        sfMap.setRecords(records);

        if (view === 'heatmap') {
            sfMap.showHeatMap();
        } else {
            sfMap.showMarkers();
        }

        neighborhoods = Object.keys($scope.neighborhoods).reduce(function (memo, me) {
            memo[me] = 0;
            return memo;
        }, {});

        $scope.neighborhoods = angular.extend(neighborhoods, _.countBy(records, function (record) {
            return record.neighborhood;
        }));
    });

    sf.getHumanWaste().then(function (records) {
        var timestamps;

        $scope.all = records.data;

        timestamps = $scope.all.map(function (record) {
            return Date.parse(record.opened);
        });

        $scope.startDate = new Date(_.min(timestamps));
        $scope.endDate = new Date(_.max(timestamps));

        $scope.neighborhoods = _.countBy(records, function (record) {
            return record.neighborhood;
        });

        $scope.forecast = $scope.forecastPoop(7, 3);

        $scope.dumpAllRecords();
    });
}]);
