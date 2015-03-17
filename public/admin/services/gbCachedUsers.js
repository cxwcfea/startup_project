angular.module('adminApp').factory('gbCachedUsers', ['gbUser', function(gbUser) {
    var userList = [];

    return {
        getUser: function(uid, callback) {
            var user = _.find(userList, { '_id': uid });
            if (user) {
                callback(user);
            } else {
                gbUser.get({id:uid}, function(u) {
                    userList.push(u);
                    callback(u);
                });
            }
        }
    }
}]);