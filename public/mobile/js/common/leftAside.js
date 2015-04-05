$(function(){
    $.ajax({
        url: $.URL.leftAside.isLogin,
        type: 'GET',
        cache: false,
        dataType: 'json'
    }).done(function(result) {
        if (200 === result.code) {
            template.compile('leftaside', tpls.leftaside);
            var leftasidedom = template.render("leftaside", {
                username: result.msg.username
            });
            $('#leftAside').append(leftasidedom);
        } else {
            window.location.href = 'index.html';
        }
    });
});