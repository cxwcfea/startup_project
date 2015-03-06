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
                    'public/js.min/niujinwang-home.min.js': ['public/app/controllers/ApplyController.js', 'public/js/main.js'],
                    'public/js.min/niujinwang-angular.min.js': ['public/app/app.js']
                }
            }
        },
        cssmin: {
            combine: {
                files: {
                    'public/css/niujinwang.css': ['public/css/site.css',
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
                    'public/js.min/niujinwang-angular.min.js',
                    'public/js.min/niujinwang-home.min.js',
                    'public/js.min/niujinwang.min.js',
                    'public/css/niujinwang.min.css'
                ],
                dest: [
                    'views/layouts/*.handlebars',
                    'views/user/index.handlebars'
                ]
            }
        }
    });

    //grunt.loadNpmTasks('grunt-nodemon');
    grunt.registerTask('default', ['nodemon']);
    grunt.registerTask('static', ['cssmin', 'uglify', 'hashres']);
};