(function() {
    var avatarSearchApp = angular.module('avatarSearchApp', []);

    avatarSearchApp.controller('AvatarSearchCtrl', ['$scope', '$http', function($scope, $http) {
        $scope.avatarUrl = '';
        $scope.emailQuery = '';
        $scope.errMsg = '';
        $scope.searching = false;

        $scope.canSearch = function() {
            return Boolean($scope.emailQuery) && !$scope.searching;
        };

        $scope.getResultClass = function() {
            if ($scope.avatarUrl) {
                return 'avatar';
            }
            else if ($scope.errMsg) {
                return 'error';
            }
            else {
                return '';
            }
        };

        $scope.search = function() {
            $scope.avatarUrl = '';
            $scope.errMsg = '';
            $scope.searching = true;

            $http({
                method: 'POST',
                data: { email: $scope.emailQuery },
                url: '/query'
            }).then(function(response) {
                $scope.avatarUrl = response.data;
            }, function(err) {
                if (err.status === 404) {
                    $scope.errMsg = "No avatar found";
                }
                else if (err.status === 400) {
                    $scope.errMsg = "Invalid email address";
                }
                else {
                    $scope.errMsg = "Error querying email address";
                }
            }).finally(function() {
                $scope.searching = false;
            });
        };
    }]);
})();
