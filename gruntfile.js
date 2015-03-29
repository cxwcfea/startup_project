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
                    'public/js.min/niujinwang-user.min.js': ['public/user/user.js', 'public/user/controllers/*.js', 'public/js/user.js'],
                    'public/js.min/niujinwang-recharge.min.js': ['public/app/controllers/RechargeCtrl.js']
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
                        '!public/css/niujinwang*.css']
                }
            },
            minify: {
                src: 'public/css/niujinwang.css',
                dest: 'public/css/niujinwang.min.css'
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
                    'public/css/niujinwang.min.css'
                ],
                dest: [
                    'views/layouts/*.handlebars'
                ]
            }
        }
    });

    //grunt.loadNpmTasks('grunt-nodemon');
    grunt.registerTask('default', ['nodemon']);
    grunt.registerTask('static', ['cssmin', 'uglify', 'hashres']);
};