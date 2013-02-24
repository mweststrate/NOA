var usePSQL = false;
var db = usePSQL ? require('./psql.js') : require('./sqlite.js');
var columns = exports.columns = {
	id : 'id',
	key: 'key', 
	pos: 'pos',
	type:'type',
	v_str:'v_str', 
	v_num:'v_num',
	meta:'meta'
}

function recordsToObject(records) {
	console.dir(records);
	if (records.length == 0)
		return null;
	
	var res = {};
	var curarr = null;	

	for(var i = 0; i < records.length; i++) {
		var record = records[i];
		var value;
		switch(record.type) {
			case 'n': 
				value = record.v_num;
				break;
			case 'r': 
				value = { _id : record.v_str };
				break;
			case 'b':
				value = 'true' === record.v_str;
				break;
			case 's':
				value = record.v_str;
				break;
			default: 
				throw "Unsupported type: " + record.type;
		}

		if (record.pos < 0)
			res[record.key] = value;
		else if (record.pos == 0) {
			res[record.key] = curarr = [];
			curarr.push(value);
		}
		else
			curarr.push(value); //not interested in real index.
	}
	return res;
}

function objectToRecords(object) {
	var res = [];
	var id = object._id;

	function writeValue(key, idx, value) {
		var type = typeof(value);
		switch(type) {
			case 'object':
				if (Array.isArray(value)) {
					if (idx != -1)
						throw "Nested arrays are not supported";
					for(var i = 0; i < value.length; i++)
						writeValue(key, i, value[i])
				}

				else { //reference
					if (!value._id)
						throw "Unreferrable object: " + JSON.stringify(value);
					res.push([id, key, idx, 'r', value._id, null, ""])
				}
				break;
			case 'boolean':
				res.push([id, key, idx, 'b', !!value ? "true" : "false", null, ""]);
				break;
			case 'number':
				res.push([id, key, idx, 'n', null, value, ""]);
				break;
			case 'string':
				res.push([id, key, idx, 's', value, null, ""]);
				break;
			default:
				throw "Unsupported type: " + type;
		}
	}

	console.dir(object);

	for(var key in object) 
		writeValue(key, -1, object[key]);
	return res;
}

exports.startDB = function(cb) {
	db.openConnection(function(err) {
		if (err)
			cb(err);
		else
			db.setupItemsTable(function(err) {
				if (err)
					cb(err)
				else
					cb();
			})
	});
}

exports.getById = function(id, cb) {
	db.select("SELECT * FROM items WHERE id = ? ORDER BY key ASC, pos ASC", [id], function(err, result) {
		console.log("Lookup for " + id + " -> " + JSON.stringify(err) + "," +JSON.stringify(result));

		if (err) 
			cb(err, null);
		else
			cb(null, recordsToObject(result));
	})
}


exports.remove = function(id, cb) {
	db.update("DELETE FROM items WHERE id = ?", [id], function(err) {
		cb(err);
	});	
}

exports.update = function(data, cb) { //TODO: rename to put
	db.inTransaction(function(txcb) {
		console.log("started transaction, removign: ");
		console.dir(data)
		exports.remove(data._id, function(err) {
			console.dir("Updating, err " + err)
			if (err) 
				txcb(err)
			else {
				var recs = objectToRecords(data);

				try {
					console.dir(recs);	
					for(var i = 0; i < recs.length; i++) 
					//TODO: see https://github.com/developmentseed/node-sqlite3/blob/master/examples/simple-chaining.js for reusing insert statement
						db.update("INSERT INTO items VALUES (?, ?, ?, ?, ?, ?, ?) ", recs[i])
				}
				catch(e) {
					txcb(e);
					return;
				}
				txcb(null);	
			}
		})

	}, cb);
}

