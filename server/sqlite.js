var sqlite3 = require('sqlite3');
var self = {};

exports.openConnection = function(cb) {
	self.db = new sqlite3.Database("data/items.db", function(err) {
		cb(err);
	})
}

exports.setupItemsTable = function(cb) {
	self.db.run(
		"CREATE TABLE IF NOT EXISTS items (id TEXT, key TEXt, pos REAL, type TEXT, v_str TEXT, v_num REAL, meta TEXT)",
		function(err) {
			cb(err);
		}
	);
}

exports.inTransaction = function(func, cb) {
	var commit = false;
	self.db.run("BEGIN TRANSACTION", function(err) {
		if (err) {
			self.db.run("ROLLBACK TRANSACTION")
			cb(err);
		}

		//the real statements
		else 
			func(function(err) {
				if (err) {
					self.db.run("ROLLBACK TRANSACTION")
					cb(err);
				}
				else {
					self.db.run("COMMIT TRANSACTION", cb)
			}

		})
	})
}

exports.select = function(query, args, cb) {
	self.db.all(query, args, cb);
}

exports.update = function(query, args, cb) {
	self.db.run(query, args, cb);
}