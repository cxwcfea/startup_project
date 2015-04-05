$(function() {
    $.ajax({
        url: $.URL.category.getWithCategory,
        type: 'GET',
        cache: false,
        dataType: 'json',
        success: function(result) {
            template.compile('category', tpls.category);
            var categorydom = template.render("category", result);
            $('#happyyear').append(categorydom);

            $('.topicClassify li').on('click', function() {
                var $this = $(this);
                var $parent = $('#happyyear');
                var index = $this.index();
                $parent.find('.topicClassify li').removeClass('active');
                $this.addClass('active');
                $parent.find('.topicList').hide().eq(index).show();
            });
        }
    });

    var $body = $('body');

    $body.on('mouseenter', '.topicList li', function() {
        var $this = $(this);
        $this.children('.todo').stop().animate({'bottom': 0}, 200);
    }).on('mouseleave', '.topicList li', function() {
        var $this = $(this);
        $this.children('.todo').stop().animate({'bottom': '-40px'}, 200);
    });

    $body.on('click', '.topicList a[number]', function() {
        var $this = $(this);
        var number = $this.attr('number');
        $('#mobilephone').attr('src', window.RESTPATH + '/cardSystemResource/template/' + number + '/');
    });
});