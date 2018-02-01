
var gulp = require('gulp');
var clean = require('gulp-clean');
var gutil = require('gulp-util');
var copy = require('gulp-copy');
var Spinner = require('cli-spinner').Spinner;
var runSequence = require('run-sequence');

var util = require('./_modules/util.js');
var sitemapUtil = require('./_modules/sitemap.js');
var pallyAudit = require('./_modules/pallyAudit.js');

gulp.task('generate-files', function (auditFinished) {
  var args = util.getArguments(process.argv);
  var generator, folder, options = {};
  var spinnerMessage = (args.json) ? 'reading config... ' : 'generating sitemap... ';
  var sitemapSpinner = new Spinner(spinnerMessage);

  if (!args.url) {
    throw new gutil.PluginError({
      plugin: 'audit',
      message: 'Must pass a url to audit via --url "{url_name}"'
    });
    auditFinished();
  }

  sitemapSpinner.setSpinnerString('⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏');
  sitemapSpinner.start();

  folder = args.url.replace(/(https?)|\/|:/g, '');
  options.site = args.url;
  if (args.json) options.path = args.json;

  sitemapUtil.getCrawlList(options)
    .then(function (crawlList) {
      sitemapSpinner.stop();
      console.log('starting audit...');
      // start pa11y audit
      return pallyAudit.auditSite(crawlList);
    }).then(function (auditResults) {
      // parse audit/generate counts
      var fullAudit = pallyAudit.parseAudit(auditResults);
      util.stringSource('audit.json', JSON.stringify(fullAudit))
        .pipe(gulp.dest(`./audits/${folder}/`));
    }).fail(function (reason) {
      // there was an error
      sitemapSpinner.stop();
      console.log(' error!');
      console.log(reason);
    }).done(function () {
      // finished, end gulp task
      auditFinished();
    });
});

gulp.task('clean', function () {
  var args = util.getArguments(process.argv);
  var folder = args.url.replace(/(https?)|\/|:/g, '');

  return gulp.src('./temp/**/*', { read: false }).pipe(clean());
});

gulp.task('copy', function () {
  var args = util.getArguments(process.argv);
  var folder = args.url.replace(/(https?)|\/|:/g, '');

  return gulp.src('./temp/*.json')
    .pipe(copy(`./audits/${folder}`, { prefix: 1 }));
});

gulp.task('audit', function () {
  runSequence(['clean', 'generate-files'], () => runSequence('copy'));
});
