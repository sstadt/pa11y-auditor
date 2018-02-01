
var gutil = require('gulp-util');
var stream = require('stream');
var q = require('q');
var fs = require('fs');

var util = {
  getArguments(argList) {
    let arg = {}, a, opt, thisOpt, curOpt;

    for (a = 0; a < argList.length; a++) {
      thisOpt = argList[a].trim();
      opt = thisOpt.replace(/^\-+/, '');

      if (opt === thisOpt) {
        // argument value
        if (curOpt) arg[curOpt] = opt;
        curOpt = null;
      } else {
        // argument name
        curOpt = opt;
        arg[curOpt] = true;
      }
    }

    return arg;
  },
  stringSource(filename, string) {
    var src = stream.Readable({ objectMode: true });

    src._read = function () {
      this.push(new gutil.File({
        cwd: "",
        base: "",
        path: filename,
        contents: new Buffer(string)
      }));
      this.push(null);
    }

    return src;
  },
  getExistingJson(path) {
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
};

module.exports = util;
