
var gulp = require('gulp');
var q = require('q');
var SitemapGenerator = require('sitemap-generator');
var xml2js = require('xml2js');
var fs = require('fs');

var parser = new xml2js.Parser();
var util = require('./util.js');

const SITEMAP_PATH = './temp/sitemap.xml';

var sitemap = {
  generateSitemap: function (url) {
    var deferred = q.defer();

    generator = SitemapGenerator(url, {
      filepath: SITEMAP_PATH,
      crawlerMaxDepth: 2
    });

    // register event listeners
    generator.on('done', function () {
      fs.readFile(SITEMAP_PATH, function (err, sitemapXml) {
        // generate sitemap
        sitemap.generateJson(sitemapXml)
          .then(function (jsonResults) {
            deferred.resolve(jsonResults.urls);
          }).fail(function (reason) {
            deferred.reject(reason);
          });
      });
    });

    // error happened
    generator.on('error', (reason) => deferred.reject(reason));

    // start the crawler
    generator.start();

    return deferred.promise;
  },
  generateJson: function (xml) {
    var deferred = q.defer();

    parser.parseString(xml, function (err, result) {
      let output = { urls: [] };
      let blacklist = /.(pdf|jpg|jpeg|gif|png)/g

      if (err) {
        deferred.reject(err);
      } else {
        for (var i = 0, j = result.urlset.url.length; i < j; i++) {
          if (!result.urlset.url[i].loc[0].match(blacklist)) {
            output.urls.push(result.urlset.url[i].loc[0]);
          }
        }

        util.stringSource('urls.json', JSON.stringify(output))
          .pipe(gulp.dest('temp'));

        deferred.resolve(output);
      }
    });

    return deferred.promise;
  },
  getCrawlList(options) {
    if (options.path) {
      return util.getExistingJson(options.path);
    } else if (options.site) {
      return sitemap.generateSitemap(options.site);
    }

    return q.reject('Must provide either a site to generate a sitemap for or a json config containing a list of URLs to crawl');
  }
};

module.exports = sitemap;
