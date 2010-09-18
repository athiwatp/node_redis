
/**
 * Module dependencies.
 */

var redis = require('./index')
  , fs = require('fs');

var client = redis.createClient()
  , path = '/tmp/redis-bench'
  , times = 20000
  , curr = {}
  , prev;

function next(){
  queue.shift()();
}

var queue = [
  function(){
    client.flushall(next);
  },
  function(){
    var n = times
      , start = new Date;
    while (n--) client.lpush('list', 'foo');
    client.lpush("list", "bar", function(err, res) {
        curr.lpush = new Date - start;
        next();
    });
  },
  report
];

client.on('connect', function(){
  try {
    prev = JSON.parse(fs.readFileSync(path, 'ascii'));
  } catch (err) {
    prev = {};
  }
  console.log('\n  %d:', times);
  next();
});

function report() {
  for (var label in curr) {
    var p = prev[label] || 0
      , c = curr[label]
      , col = c > p ? 31 : 32;
    console.log('    \x1b[' + col + 'm%s\x1b[0m:', label);
    console.log('      \x1b[33mprev\x1b[0m: %d ms', p);
    console.log('      \x1b[33mcurr\x1b[0m: %d ms', c);
    if (c > p) {
      console.log('      previously was \x1b[33m%d\x1b[0m ms faster', c - p);
    }
  }
  fs.writeFileSync(path, JSON.stringify(curr), 'ascii');
  console.log();
  client.end();
}