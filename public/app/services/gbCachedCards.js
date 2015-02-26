angular.module('myApp').factory('gbCachedCards', ['gbCard', function(gbCard) {
    var cardList;
    var uid;

    return {
        setUID: function(id) {
            uid = id;
        },

        query: function() {
            if(!cardList) {
                cardList = gbCard.query({uid:uid});
            }

            return cardList;
        }
    }
}]);
