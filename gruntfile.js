module.exports = function (grunt) {
    // load plugins
    [
        'grunt-nodemon',
        'grunt-contrib-cssmin',
        'grunt-contrib-uglify',
        'grunt-hashres',
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
                    'public/js.min/niujinwang-admin.min.js': ['public/admin/admin.js', 'public/admin/controllers/*.js', 'public/admin/resources/*.js', 'public/admin/services/*.js', 'public/js/common_module.js']
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
                        'public/mobile/css/pages.css',
                        'public/mobile/css/site.css'
                    ]
                }
            },
            minify: {
                src: 'public/mobile/css/niujinwang-mobile.css',
                dest: 'public/mobile/css/niujinwang-mobile.min.css'
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
                    'public/mobile/css/niujinwang-mobile.min.css'
                ],
                dest: [
                    'views/layouts/*.handlebars',
                    'views/admin/main.handlebars'
                ]
            }
        }
    });

    //grunt.loadNpmTasks('grunt-nodemon');
    grunt.registerTask('default', ['nodemon']);
    grunt.registerTask('static', ['cssmin', 'uglify', 'hashres']);
};