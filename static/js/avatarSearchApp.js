(function() {
    var avatarSearchApp = angular.module('avatarSearchApp', []);

    // set up the main controller, including $http so we can
    // make an ajax request
    avatarSearchApp.controller('AvatarSearchCtrl', ['$scope', '$http', function($scope, $http) {
        $scope.avatarUrl = '';
        $scope.emailQuery = '';
        $scope.errMsg = '';
        $scope.searching = false;

        // check that the user can search. if the email field
        // is empty or invalid, or we are searching, return false
        $scope.canSearch = function() {
            return Boolean($scope.emailQuery) && !$scope.searching;
        };

        // manipulate the css styling
        $scope.getResultClass = function() {
            // if we got back an avatar url, return 'avatar'
            if ($scope.avatarUrl) {
                return 'avatar';
            }
            // if we got back an error, return 'error'
            else if ($scope.errMsg) {
                return 'error';
            }
            // else we do not have a result
            else {
                return '';
            }
        };

        // run this search method when the user pushes
        // the "Search!" button
        $scope.search = function() {
            // Clear out any results and set
            // searching as true to disable the
            // search button
            $scope.avatarUrl = '';
            $scope.errMsg = '';
            $scope.searching = true;

            // Do a post request to /query with
            // the email address as the data
            $http({
                method: 'POST',
                data: { email: $scope.emailQuery },
                url: '/query'
            }).then(function(response) {
                // Set the image url from the response data
                $scope.avatarUrl = response.data;
            }, function(err) {
                // if the error is 404 we know we did not
                // find an avatar
                if (err.status === 404) {
                    $scope.errMsg = "No avatar found";
                }
                // if the error is 400, we know that the user
                // did not pass in a valid email address
                else if (err.status === 400) {
                    $scope.errMsg = "Invalid email address";
                }
                // for everything else, display a generic error
                // message
                else {
                    $scope.errMsg = "Error querying email address";
                }
            }).finally(function() {
                // we are no longer searching, so re-enable the
                // search button
                $scope.searching = false;
            });
        };
    }]);
})();
