
var gulp = require('gulp');
var q = require('q');
var SitemapGenerator = require('sitemap-generator');
var xml2js = require('xml2js');

var parser = new xml2js.Parser();
var util = require('./util.js');

var sitemap = {
  // TODO: this gives a 404 error every time I try to move the sitemap generation out of gulpfile
  generate: function (url) {
    var deferred = q.defer();
    var generator = SitemapGenerator(url);
    console.log(url);

    // register event listeners
    generator.on('done', function () { deferred.resolve(); });
    generator.on('error', function (error) { deferred.reject(error); });

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
  }
};

module.exports = sitemap;
