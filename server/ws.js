var io = require('socket.io')
var core = require('./server/core.js')

var clientcount = 0;
var clients = {};



exports.start = function(app) {
	io.listen(app);

	io.sockets.on('connection', onConnect)

}

function onConnect(socket) {
	var socketIdx = ++clientcount;
	var socketData = {	}; //bound to scope of socket

	socket.set('data', socketData, function() {
		clients[socketIdx] = socket;
	
		socket.on('disconnect', function() {
			delete clients[socketIdx]
		}

		io.sockets.on('put', function(data, cb) {
			core.update(data, cb); //cb is received on client!
		})

		io.sockets.on('get', function(id, cb) {
			core.getById(id, cb);
		})
	}
}

function onDisconnect(socket) {
	withSocketData(socket, function(data, socket) {
		delete client[data.idx];
	})
}

