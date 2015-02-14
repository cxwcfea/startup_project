angular.module('myApp').controller('UserMainController', ['$scope', function($scope) {
    $scope.finances = [
        {
            "user": "Mr.Wang",
            "amount": 30,
            "createdAt": 1421965063183,
            "interest": 11.2,
            "cycle": 3,
            "lever": 5,
            "progress": 20,
            "numInvetor": 3
        },
        {
            "user": "Mr.Li",
            "amount": 30,
            "createdAt": 1421965063183,
            "interest": 11.2,
            "cycle": 3,
            "lever": 5,
            "progress": 30,
            "numInvetor": 3
        },
        {
            "user": "Mrs.Liu",
            "amount": 30,
            "createdAt": 1421965063183,
            "interest": 11.2,
            "cycle": 3,
            "lever": 5,
            "progress": 45,
            "numInvetor": 3
        },
        {
            "user": "Mr.Wang",
            "amount": 30,
            "createdAt": 1421965063183,
            "interest": 11.2,
            "cycle": 3,
            "lever": 5,
            "progress": 16,
            "numInvetor": 3
        },
        {
            "user": "Miss.Zhang",
            "amount": 30,
            "createdAt": 1421965063183,
            "interest": 11.2,
            "cycle": 3,
            "lever": 5,
            "progress": 78,
            "numInvetor": 3
        },
        {
            "user": "Mr.Zhao",
            "amount": 30,
            "createdAt": 1421965063183,
            "interest": 11.2,
            "cycle": 3,
            "lever": 5,
            "progress": 99,
            "numInvetor": 3
        },
        {
            "user": "Mrs.Yang",
            "amount": 30,
            "createdAt": 1421965063183,
            "interest": 11.2,
            "cycle": 3,
            "lever": 5,
            "progress": 60,
            "numInvetor": 3
        },
        {
            "user": "Miss.Yu",
            "amount": 30,
            "createdAt": 1421965063183,
            "interest": 11.2,
            "cycle": 3,
            "lever": 5,
            "progress": 23,
            "numInvetor": 3
        }
    ];

    $scope.earnings = [
        {
            "user": "Mr.Wang",
            "rate": 14,
            "amount": 10000,
            "period": 3
        },
        {
            "user": "Mr.Wang",
            "rate": 36,
            "amount": 10000,
            "period": 3
        },
        {
            "user": "Mr.Wang",
            "rate": 8,
            "amount": 10000,
            "period": 3
        },
        {
            "user": "Mr.Wang",
            "rate": -3,
            "amount": 10000,
            "period": 3
        },
        {
            "user": "Mr.Wang",
            "rate": 52,
            "amount": 10000,
            "period": 3
        }
    ];
    $scope.abc = "Hello Angular";
}]);
