'use strict';

var cluster = require('cluster');
var os = require('os');
var debug = require('debug')('sticky:worker');

var sticky = require('../sticky-session');
var Master = sticky.Master;

function listen(server, port, options) {
  if (!options)
    options = {};

  if (cluster.isMaster) {
    // This allows the user to implement a custom worker management logic.
    var workers = options.pool;
    var workerCount = options.workers || os.cpus().length;

    var master = new Master(workerCount, workers);
    master.listen(port);
    master.once('listening', function() {
      server.emit('listening');
    });

    // This allows user to stop the load balancer server (master) gracefully.
    // Not so elegant, but don't know any other way to pass back the server
    // instance to caller without braking backward compatibility.
    options.master = master;

    return false;
  }

  process.on('message', function(msg, socket) {
    if (msg !== 'sticky:balance' || !socket)
      return;

    debug('incoming socket');
    server.emit('connection', socket);
  });
  return true;
}
exports.listen = listen;
