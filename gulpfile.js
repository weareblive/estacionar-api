//
//  Created by Trazzar on 01/01/2017
//  Copyright © 2018 Trazzar. All rights reserved.
//
let dotenv = require('dotenv');
let fs = require('fs');
let gulp = require('gulp');
let shell = require('gulp-shell');
let nodemon = require('gulp-nodemon');
let jshint = require('gulp-jshint');
let mocha = require('gulp-spawn-mocha');
let argv = require('yargs').argv;

dotenv.config({silent: true});

gulp.task('default', function() {
});

gulp.task('env:test', (done) => {
  const CI = process.env.CI || '';
  if (CI !== '') return done();

  let env = dotenv.parse(fs.readFileSync('.env.test'));

  for (let key of Object.keys(env)) {
    let value = env[key];
    process.env[key] = value;
  }

  done();
});

gulp.task('start-node', function () {
  return nodemon({
    script: 'application.js',
    ext: 'js html',
    watch: [
      "./",
      "models/",
      "routes/",
      "lib/"
    ],
    env: { 'NODE_ENV': 'development' }
  });
});

gulp.task('mocha', () => {
  return gulp.src(['test/api/**/*.js', 'test/unit/**/*.js'], {read: false}).pipe(mocha());
});

gulp.task('test', gulp.series(['env:test', 'mocha']));

gulp.task('watch', shell.task(['npm run watch']));

gulp.task('lint', function() {
  return gulp.src(['./*.js', './lib/**/*.js', './models/*.js', './routes/*.js', './test/*.js', './bot/*.js' ])
    .pipe(jshint())
    .pipe(jshint.reporter('default', { verbose: true }));
});

gulp.task('start', gulp.parallel('start-node'));

gulp.task('apidoc', shell.task([
  'apidoc -i routes/ -o docs/'
]));
