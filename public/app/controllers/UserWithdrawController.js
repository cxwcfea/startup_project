'use strict';
angular.module('myApp').controller('UserWithdrawController', ['gbIdentity', 'gbNotifier', '$location', 'gbCard', function(gbIdentity, gbNotifier, $location, gbCard) {
    var vm = this;
    vm.user = gbIdentity.currentUser;

    vm.cards = [];
    vm.card = {};

    vm.card.userID = vm.user._id;

    if (vm.user.identity.name) {
        vm.card.userName = vm.user.identity.name;
    }

    gbCard.query({uid:vm.user._id}, function(cards) {
        vm.cards = cards;
    });

    vm.addCard = function() {
        console.log();
        var newCard = new gbCard(vm.card);

        newCard.$save().then(function() {
            gbNotifier.notify('添加成功');
            vm.cards.push(vm.card);
        }, function(response) {
            gbNotifier.error('添加失败 ' + response.data.reason);
        });

        /*
         $http.post('/api/users/' + vm.user._id, {identity:vm.user.identity})
         .then(function(response) {
         if (response.data.success) {
         gbNotifier.notify('实名认证成功');
         $location.path('/user/security');
         } else {
         gbNotifier.error('实名认证失败');
         }
         });
         */
    };
}]);
