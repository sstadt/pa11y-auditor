
var pa11y = require('pa11y');
var q = require('q');

var pallyAudit = {
  auditSite(urls) {
    var audit = pa11y();
    var auditResults = [];
    var deferred = q.defer();

    // TODO: this should get pulled out of the site() function once auditResults can be decoupled
    function auditUrl(url) {
      console.log('auditing: ' + url);
      var iDeferred = q.defer();
      var urlResult = {};

      audit.run(url, function (err, results) {
        if (err) {
          console.log(`Error auditing ${url}, moving to next page`);
          iDeferred.resolve(results);
          return;
        }

        urlResult[url] = results;
        auditResults.push(urlResult);

        iDeferred.resolve(results);
      });

      return iDeferred.promise;
    }

    function auditSite(count) {
      if (count < 0) {
        return q.resolve(auditResults.reverse());
      }

      return auditUrl(urls[count]).then(function () {
        return auditSite(count - 1);
      });
    }

    auditSite(urls.length - 1).then(function (results) {
      deferred.resolve(results);
    }).fail(function (reason) {
      deferred.reject(reason);
    });

    return deferred.promise;
  },
  parseAudit(auditData) {
    var fullAudit = {
      errors: {},
      results: []
    };

    auditData.forEach(function (page) {
      page[Object.keys(page)[0]] = page[Object.keys(page)[0]].map(function (error) {
        var errorNumbers = /Guideline(\d)_(\d).\d_\d_(\d)/g.exec(error.code);
        var errorCode = `${errorNumbers[1]}.${errorNumbers[2]}.${errorNumbers[3]}`;

        error.code = errorCode;

        if (fullAudit.errors.hasOwnProperty(errorCode)) {
          fullAudit.errors[errorCode]++;
        } else {
          fullAudit.errors[errorCode] = 1;
        }

        return error;
      });
    });

    fullAudit.results = auditData;

    return fullAudit;
  }
};

module.exports = pallyAudit;
