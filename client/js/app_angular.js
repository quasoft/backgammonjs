(function(angular) {
  'use strict';
  angular.module('MyApp', [])
  .controller('MyCtrl', ['$scope', function($scope) {
    $scope.format = 'M/d/yy h:mm:ss a';
  }]).directive("show2", function() {
    function link(scope, element, attributes) {
      scope.$watch(attributes.show, function(value) {
        element.css('display', value ? '' : 'none');
      });
    }
    return {
      link: link
    };
  });

  angular.module('MyApp', [])
  .controller('MyCtrl', ['$scope', function($scope) {
    $scope.name = "";
    $scope.visible = true;
    $scope.toggle = function() {
      $scope.visible = !$scope.visible;
    };
    $scope.$watch("name", function(newValue, oldValue) {
      if ($scope.name.length > 0) {
        $scope.greeting = "Hello " + $scope.name;
      }
    });
  }]);

})(window.angular);
