var gulp = require('gulp');
var browserify = require('browserify');
var watch = require('gulp-watch');
var source = require('vinyl-source-stream');
var uglify = require('gulp-uglify');
var less = require('gulp-less');
var plumber = require('gulp-plumber');
var nano = require('gulp-cssnano');
var babelify = require("babelify");

gulp.task('js', function() {
    process.env.NODE_ENV = 'production';
    var b = browserify({
        debug: false
    });
    b.add('./app.js');
    b.transform(babelify);
    b.bundle().pipe(source('app.js')).pipe(gulp.dest('./build/'));
});

gulp.task('css', function() {
    return gulp.src('less/app.less')
        .pipe(plumber())
        .pipe(less())
        .pipe(plumber())
        .pipe(gulp.dest('./build/'));
});

gulp.task('watch', function() {
    watch([
        'app.js',
        'helper.js',
        'components/**/*',
        'actions/**/*',
        'reducers/**/*'
    ], function() {
        gulp.start('js');
    });

    watch(['less/**/*'], function() {
        gulp.start('css');
    });
});

gulp.task('build', function() {
    gulp.start('js');
    gulp.start('css');
});

gulp.task('min-js', function() {
    gulp.src('./build/app.js')
        .pipe(uglify())
        .pipe(gulp.dest('./build/'));
});

gulp.task('min-css', function() {
    return gulp.src('./build/app.css')
        .pipe(nano())
        .pipe(gulp.dest('./build/'));
});

gulp.task('min', function() {
    gulp.start('min-js');
    gulp.start('min-css');
});