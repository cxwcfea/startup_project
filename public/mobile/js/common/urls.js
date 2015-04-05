;(function($){
// 本url路径设置按照特定页面特有接口以及公用接口组成
$.URL = {
    // 公共模块接口 begin---------------------------
    'user': {
        // 用户登录验证地址 GET
        // 'isLogin': window.RESTPATH + 'data/isLogin.json',
        'isLogin': window.RESTPATH + 'card/rs/user/isLogin',

        // 忘记密码
        'prepareRetrievePwd': window.RESTPATH + 'card/rs/user/prepareRetrievePwd',

        // 注册用户
        'add': window.RESTPATH +'card/rs/user/add',

        // 用户登录 post
        'login': window.RESTPATH + 'card/j_spring_security_check',
    },
    'category': {
        // GET
        // 'getWithCategory': window.RESTPATH + 'data/getWithCategory.json',
        'getWithCategory': window.RESTPATH + 'card/rs/template/getWithCategory',
    },
    'leftAside': {
        // 用户登录验证地址 GET
        // 'isLogin': window.RESTPATH + 'data/isLogin.json',
        'isLogin': window.RESTPATH + 'card/rs/user/isLogin',
    },
    // 公共模块接口 end---------------------------



    // 私有页面接口 begin----------------------------
    'index': {

    },
    'me': {
        // 我的发布
        // 'getTaskList': window.RESTPATH + 'data/getTaskList.json',
        'getTaskList': window.RESTPATH + 'card/rs/userTemplate/getByUser',

        // 免费发布
        'publishByNumber': window.RESTPATH + 'card/rs/userTemplate/publishByNumber',
    },
    'make': {
        // 保存
        'add': window.RESTPATH + 'card/rs/userTemplate/add',

        // 手机端发布后的取值 post  number
        'getByNumber': window.RESTPATH + 'card/rs/userTemplate/getByNumber',
    },
    'resetAccount': {
        // 修改密码 post
        'retrievePwd': window.RESTPATH + 'card/rs/user/retrievePwd',
    },
    // 私有页面接口 end----------------------------



    /*
    'power':{
        'add': window.RESTPATH + 'card/rs/power/add',
        'update': window.RESTPATH + 'card/rs/power/update',
        'delete': window.RESTPATH + 'card/rs/power/delete',
        'list': window.RESTPATH + 'card/rs/power/list'
    },
    'user':{
        'add': window.RESTPATH +'card/rs/user/add',
        'update': window.RESTPATH +'card/rs/user/update',
        'delete': window.RESTPATH +'card/rs/user/delete',
        'list': window.RESTPATH +'card/rs/user/list',
        'getId': window.RESTPATH +'card/rs/user/getIdByName',
        'currentUserId': window.RESTPATH + 'card/rs/user/currentUserId',
        'currentUserInfo': window.RESTPATH +'card/rs/user/currentUser',

        // 用户登录验证地址 GET
        'isLogin': window.RESTPATH + 'card/rs/user/isLogin',
        // 'isLogin': window.RESTPATH + 'data/isLogin.json',

        // 忘记密码
        'prepareRetrievePwd': window.RESTPATH + 'card/rs/user/prepareRetrievePwd',

        // 修改密码 post
        'retrievePwd': window.RESTPATH + 'card/rs/user/retrievePwd',

        // 用户登录 post
        'login': window.RESTPATH + 'card/j_spring_security_check',
    },
    'authority':{
        'add': window.RESTPATH + 'card/rs/authority/add',
        'update': window.RESTPATH + 'card/rs/authority/update',
        'delete': window.RESTPATH + 'card/rs/authority/delete',
        'list': window.RESTPATH + 'card/rs/authority/list'
    },
    'userAuthority':{
          'add': window.RESTPATH + 'card/rs/userAuthority/add'
    },
    'category':{
        'add': window.RESTPATH + 'card/rs/category/add',
        'update': window.RESTPATH + 'card/rs/category/update',
        'delete': window.RESTPATH + 'card/rs/category/delete',
        'findByCondition': window.RESTPATH + 'card/rs/category/findByCondition'
    },
    'template':{
        'add': window.RESTPATH + 'card/rs/template/add',
        'update': window.RESTPATH + 'card/rs/template/update',
        'delete': window.RESTPATH + 'card/rs/template/delete',

        'findByCondition': window.RESTPATH + 'card/rs/template/findByCondition',
        // 'findByCondition': window.RESTPATH + 'data/findByCondition.json',

        // GET
        'getWithCategory': window.RESTPATH + 'card/rs/template/getWithCategory',
        // 'getWithCategory': window.RESTPATH + 'data/getWithCategory.json',
    },
    'userTemplate':{
        'add': window.RESTPATH + 'card/rs/userTemplate/add',
        'update': window.RESTPATH + 'card/rs/userTemplate/update',
        'delete': window.RESTPATH + 'card/rs/userTemplate/delete',
        'findByCondition': window.RESTPATH + 'card/rs/userTemplate/findByCondition',

        // 手机端发布后的取值 post  number
        'getByNumber': window.RESTPATH + 'card/rs/userTemplate/getByNumber',

        // 手机端预览的取值 post  number
        'previewByNumber': window.RESTPATH + 'card/rs/userTemplate/previewByNumber',

        // 我的发布
        'getTaskList': window.RESTPATH + 'card/rs/userTemplate/getByUser',
        // 'getTaskList': window.RESTPATH + 'data/getTaskList.json',
    }
    */
}

})(jQuery);