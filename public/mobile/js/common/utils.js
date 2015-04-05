if (!window.JSON) {
    window.JSON = {
        stringify: function (vContent) {
            if (vContent instanceof Object) {
                var sOutput = '';
                if (vContent.constructor === Array) {
                    for (var nId = 0; nId < vContent.length; nId++) {
                        sOutput += this.stringify(vContent[nId]) + ',';
                    }
                    return '[' + sOutput.substr(0, sOutput.length - 1) + ']';
                }
                if (vContent.toString !== Object.prototype.toString) {
                    return '"' + vContent.toString().replace(/"/g, '\\$&') + '"';
                }
                for (var sProp in vContent) {
                    if (vContent[sProp]) {
                        sOutput += '"' + sProp.replace(/"/g, '\\$&') + '":' + this.stringify(vContent[sProp]) + ',';
                    }
                }
                return '{' + sOutput.substr(0, sOutput.length - 1) + '}';
            }
            return typeof vContent === 'string' ? '"' + vContent.replace(/"/g, '\\$&') + '"' : String(vContent);
        }
    };
}

$.extend({
    /*
     * jQuery Cookie plugin
     */
    cookie: function(name, value, options) {
        // name and value given, set cookie
        if (typeof value != 'undefined') {
            options = options || {};
            if (value === null) {
                value = '';
                options.expires = -1;
            }
            var expires = '';
            if (options.expires && (typeof options.expires == 'number' || options.expires.toUTCString)) {
                var date;
                if (typeof options.expires == 'number') {
                    date = new Date();
                    date.setTime(date.getTime() + (options.expires * 24 * 60 * 60 * 1000));
                } else {
                    date = options.expires;
                }
                expires = '; expires=' + date.toUTCString(); // use expires attribute, max-age is not supported by IE
            }
            var path = options.path ? '; path=' + options.path : '';
            var domain = options.domain ? '; domain=' + options.domain : '';
            var secure = options.secure ? '; secure' : '';
            document.cookie = [name, '=', encodeURIComponent(value), expires, path, domain, secure].join('');
        } else { // only name given, get cookie
            var cookieValue = null;
            if (document.cookie && document.cookie != '') {
                var cookies = document.cookie.split(';');
                for (var i = 0; i < cookies.length; i++) {
                    var cookie = $.trim(cookies[i]);
                    // Does this cookie string begin with the name we want?
                    if (cookie.substring(0, name.length + 1) == (name + '=')) {
                        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                        break;
                    }
                }
            }
            return cookieValue;
        }
    }
});

// popup
function showPopup(width, height, content) {
    if ($('.popup-wrapper').size() > 0) {
        $('.popup-wrapper').show();
        $('.popup')
            .empty()
            .css({
                'margin-left': -1*(window.parseInt(width)/2),
                'margin-top': -1*(window.parseInt(height)/2)
            })
            .append(content)
            .show();
    } else {
        $('body').append(tpls.popup);
        $('.popup')
            .css({
                'margin-left': -1*(window.parseInt(width)/2),
                'margin-top': -1*(window.parseInt(height)/2)
            })
            .append(content)
            .show();
    }
}
function hidePopup() {
    $('.popup').hide().empty();
    $('.popup-wrapper').hide();
}