module.exports = function (grunt) {
    // load plugins
    [
        'grunt-nodemon',
        'grunt-contrib-cssmin',
        'grunt-contrib-uglify',
        'grunt-hashres'
    ].forEach(function(task){
        grunt.loadNpmTasks(task);
    });

    grunt.initConfig({
        nodemon: {
            all: {
                script: 'server.js',
                options: {
                    watchedExtensions: ['js']
                }
            }
        },
        uglify: {
            all: {
                files: {
                    'public/js.min/niujinwang.min.js': ['public/js/**/*.js', 'public/app/**/*.js', '!public/js/legacy/**/*.js', '!public/app/app.js'],
                    'public/js.min/niujinwang-main.min.js': ['public/app/controllers/MainApplyController.js', 'public/app/controllers/RegisterCtrl.js', 'public/js/main.js', 'public/js/common.js', 'public/js/common_module.js'],
                    'public/js.min/niujinwang-user.min.js': ['public/user/user.js', 'public/user/controllers/*.js', 'public/js/user.js', 'public/js/jquery.zclip.min.js'],
                    'public/js.min/niujinwang-recharge.min.js': ['public/app/controllers/RechargeCtrl.js'],
                    'public/js.min/niujinwang-mobile.min.js': ['public/mobile/js/controller/*.js', 'public/js/common_module.js'],
                    'public/js.min/niujinwang-admin.min.js': ['public/admin/admin.js', 'public/admin/controllers/*.js', 'public/admin/resources/*.js', 'public/admin/services/*.js', 'public/js/common_module.js'],
                    'public/js.min/niujinwang-ppj.min.js': [
                        'public/vendor/angular-touch/angular-touch.js',
                        'public/vendor/angular-route/angular-route.js',
                        'public/vendor/angular-resource/angular-resource.js',
                        'public/vendor/angular-bootstrap/ui-bootstrap-tpls.js',
                        'public/vendor/bootstrap/dist/js/bootstrap.js',
                        'public/vendor/toastr/toastr.js',
                        'public/js/highstock.js',
                        'public/futures/js/script.js',
                        'public/futures/js/services/*.js',
                        'public/futures/js/futures.js',
                        'public/futures/js/lib/*.js',
                        'public/futures/js/controller/*.js',
                        'public/js/common_module.js']
                }
            }
        },
        cssmin: {
            combine: {
                files: {
                    'public/css/niujinwang.css': ['public/css/site2.css',
                        'public/css/index.css',
                        'public/css/css.css',
                        'public/css/common.css',
                        'public/vendor/toastr/toastr.css',
                        '!public/css/niujinwang*.css'],
                    'public/mobile/css/niujinwang-mobile.css': ['public/mobile/css/reset.css',
                        'public/mobile/css/base.css',
                        'public/mobile/css/common.css',
                        'public/mobile/css/swiper.css',
                        'public/mobile/css/pages.css',
                        'public/mobile/css/site.css'
                    ],
                    'public/futures/css/niujinwang-ppj.css': ['public/vendor/bootstrap/dist/css/bootstrap.css',
                        'public/futures/css/reset.css',
                        'public/futures/css/base.css',
                        'public/futures/css/common.css',
                        'public/futures/css/pages.css',
                        'public/futures/css/site.css'
                    ]
                }
            },
            minify: {
                src: 'public/futures/css/niujinwang-ppj.css',
                dest: 'public/futures/css/niujinwang-ppj.min.css'
            }
        },
        hashres: {
            options: {
                fileNameFormat: '${name}.${hash}.${ext}'
            },
            all: {
                src: [
                    'public/js.min/niujinwang-main.min.js',
                    'public/js.min/niujinwang-user.min.js',
                    'public/js.min/niujinwang-recharge.min.js',
                    'public/js.min/niujinwang-mobile.min.js',
                    'public/js.min/niujinwang-admin.min.js',
                    'public/js.min/niujinwang-ppj.min.js',
                    'public/futures/css/niujinwang-ppj.min.css'
                ],
                dest: [
                    'views/layouts/*.handlebars',
                    'views/admin/main.handlebars',
                    'views/futures/index.handlebars'
                ]
            }
        }
    });

    //grunt.loadNpmTasks('grunt-nodemon');
    grunt.registerTask('default', ['nodemon']);
    grunt.registerTask('static', ['cssmin', 'uglify', 'hashres']);
};