
var gulp = require('gulp');
var clean = require('gulp-clean');
var gutil = require('gulp-util');
var copy = require('gulp-copy');
var Spinner = require('cli-spinner').Spinner;
var runSequence = require('run-sequence');
var q = require('q');
var fs = require('fs');

var util = require('./_modules/util.js');
var sitemapUtil = require('./_modules/sitemap.js');
var pallyAudit = require('./_modules/pallyAudit.js');
var SitemapGenerator = require('sitemap-generator');

const SITEMAP_PATH = './temp/sitemap.xml';

function generateSitemap(url) {
  var deferred = q.defer();
  var sitemapSpinner = new Spinner('generating sitemap...');

  generator = SitemapGenerator(url, {
    filepath: SITEMAP_PATH,
    crawlerMaxDepth: 2
  });

  sitemapSpinner.setSpinnerString('⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏');
  sitemapSpinner.start();

  // register event listeners
  generator.on('done', function () {
    fs.readFile(SITEMAP_PATH, function (err, sitemapXml) {
      // generate sitemap
      sitemapUtil.generateJson(sitemapXml)
        .then(function (jsonResults) {
          deferred.resolve(jsonResults.urls);
        }).fail(function (reason) {
          deferred.reject(reason);
        }).done(function () {
          sitemapSpinner.stop();
          console.log(' done!');
        });
    });
  });

  // error happened
  generator.on('error', (reason) => deferred.reject(reason));

  // start the crawler
  generator.start();

  return deferred.promise;
}

function getExistingJson(path) {
  var deferred = q.defer();

  fs.readFile(path, function (err, json) {
    if (json) {
      let config = JSON.parse(json);
      deferred.resolve(config.urls);
    } else {
      deferred.reject(`File not found at ${path}`);
    }
  });

  return deferred.promise;
}

function getCrawlList(options) {
  if (options.path) {
    return getExistingJson(options.path);
  } else if (options.site) {
    return generateSitemap(options.site);
  }

  return q.reject('Must provide either a site to generate a sitemap for or a json config containing a list of URLs to crawl');
}

gulp.task('generate-files', function (auditFinished) {
  var args = util.getArguments(process.argv);
  var generator, folder, options = {};

  if (!args.url) {
    throw new gutil.PluginError({
      plugin: 'audit',
      message: 'Must pass a url to audit via --url "{url_name}"'
    });
    auditFinished();
  }

  folder = args.url.replace(/(https?)|\/|:/g, '');
  options.site = args.url;
  if (args.json) options.path = args.json;

  getCrawlList(options)
    .then(function (crawlList) {
      // start pa11y audit
      return pallyAudit.auditSite(crawlList);
    }).then(function (auditResults) {
      // parse audit/generate counts
      var fullAudit = pallyAudit.parseAudit(auditResults);
      util.stringSource('audit.json', JSON.stringify(fullAudit)).pipe(gulp.dest(`./audits/${folder}/`));
    }).fail(function (reason) {
      // there was an error
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
