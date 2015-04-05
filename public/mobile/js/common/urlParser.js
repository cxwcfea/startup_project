;(function() {

    var parseURL = function (url){
        var urlStr = url ? url : (window.location.href.match(/(\?[^\?]*)$/) ? window.location.href.match(/(\?[^\?]*)$/)[1] : ""),
            param = {};

        if(urlStr){
            var urlArr = urlStr.split("?");
            if(urlArr[1]) {
                urlArr = urlArr[1].split(/&|#/);

                for (var i = urlArr.length - 1; i >= 0; i--){
                    var tempArr = urlArr[i].split("=");
                    param[tempArr[0]] = tempArr[1];
                }
            }
        }
        return param;
    };
    window.parseURL = parseURL();

})();