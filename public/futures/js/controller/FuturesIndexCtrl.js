'use strict';
angular.module('futuresApp').controller('FuturesIndexCtrl', ['$scope', '$window', function($scope, $window) {
    $scope.data = {};
    $scope.data.currentUser = $window.bootstrappedUserObject;
    /*
    $scope.data.currentUser = {
        score: 5,
        wechat: {
            wechat_img: 'http://wx.qlogo.cn/mmopen/uchmtWQh7iarnsx58BbzlB1GAOzjI3S8elKicd6t8CiahGE3JSDmkVnTNzicQA44DdRliaLOsI1wLI9o79kynDUIchg/0',
            wechat_name: '程翔',
            profit: 200
        }
    }
    */
}]);