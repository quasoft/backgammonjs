var gulp    = require('gulp'),
  gutil    = require('gulp-util'),
  uglify  = require('gulp-uglify'),
  concat  = require('gulp-concat'),
  runSequence = require('run-sequence');

gulp.task('copy', function () {
  return gulp.src('./bower_components/jquery/dist/jquery.js')
    .pipe(gulp.dest('./js'));
});

gulp.task('compress', function () {
  return gulp.src(['./js/*.js', '!./js/all.js'])
    .pipe(uglify())
    .pipe(concat('all.js'))
    .pipe(gulp.dest('./js'));
});

gulp.task('default', function(callback) {
  runSequence('copy',
              'compress',
              callback);
});
