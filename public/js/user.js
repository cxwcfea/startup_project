$(function () {
    $("#jq_tableBox tr:even td").css("background","#f5f5f5");//表格隔行换色
    $("#jq_tableBox2 tr:even td").css("background","#f5f5f5");//表格隔行换色
    $("#jq_tableBox3 tr:even td").css("background","#f5f5f5");//表格隔行换色

    $("#tableMenu li").click(function () {
        var index =$(this).index();
        $(this).addClass("select").siblings().removeClass("select");
        $("#tableMain>div").eq(index).show().siblings().hide();
    });
});