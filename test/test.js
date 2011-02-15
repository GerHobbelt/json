
/* 'json' test suite
 *
 * Usage:
 *      nodeunit test.js
 *
 * Can limit the tests with the "TEST_ONLY" environment variable: a
 * space-separated lists of dir names to which to limit. E.g.:
 *      TEST_ONLY=hello-server nodeunit test.js
 * Can also prefix with a '-' to *exclude* that test. E.g.: to run all but
 * the "irc" test:
 *      TEST_ONLY="-irc" nodeunit test.js
 */

var path = require('path');
var sys  = require('sys');
var exec = require('child_process').exec;
var fs   = require('fs');
var testCase = require('nodeunit').testCase;


var data = {
  //setUp: function(callback) {
  //  ...
  //}
};

// Process includes and excludes from "TEST_ONLY".
var only = [], excludes = [];
if (process.env.TEST_ONLY) {
  console.warn("Note: Limiting 'test.js' tests by $TEST_ONLY: '"
    + process.env.TEST_ONLY + "'");
  var tokens = process.env.TEST_ONLY.trim().split(/\s+/);
  for (var i=0; i < tokens.length; i++) {
    if (tokens[i][0] === "-") {
      excludes.push(tokens[i].slice(1));
    } else {
      only.push(tokens[i]);
    }
  }
}

// Add a test case for each dir with a "test.sh" script.
var names = fs.readdirSync(__dirname);
for (var i=0; i < names.length; ++i) {
  var name = names[i];
  if (only.length && only.indexOf(name) == -1) {
    continue;
  }
  if (excludes.length && excludes.indexOf(name) != -1) {
    continue;
  }
  var dir = path.join(__dirname, name);
  if (fs.statSync(dir).isDirectory()) {
    try {
      fs.statSync(path.join(dir, "cmd"));
    } catch(e) {
      continue;
    }
    data[name] = (function(dir) {
      return function(test) {
        var numTests = 1;
        var expectedExitCode = null;
        try {
          var p = path.join(dir, "expected.exitCode");
          if (fs.statSync(p)) {
            expectedExitCode = Number(fs.readFileSync(p));
          }
        } catch(e) {}
          
        var expectedStdout = null;
        try {
          var p = path.join(dir, "expected.stdout");
          if (fs.statSync(p)) {
            expectedStdout = fs.readFileSync(p, "utf8");
            numTests += 1;
          }
        } catch(e) {}
        
        test.expect(numTests);
        exec("bash cmd", {"cwd": dir}, function(error, stdout, stderr) {
          var errmsg = "\n-- return value:\n"+error+"\n-- stdout:\n"+stdout+"\n-- stderr:\n"+stderr;
          test.equal(expectedExitCode, error && error.code, errmsg);
          if (expectedStdout !== null) {
            test.equal(stdout, expectedStdout, errmsg);
          }
          test.done();
        });
      }
    })(dir);
  }
}

exports['test'] = testCase(data);