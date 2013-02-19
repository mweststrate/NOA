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
			default: 
				value = record.v_str;
		}
		res[record.key] = value;
	}
	return res;
}

function objectToRecords(object) {
	var res = [];
	var id = object._id;
	for(var key in object) {

		var type = typeof(object[key]);
		//TODO: array
		var tvalue = type == 'boolean' ? 'b' : type == 'number' ? 'n' : type == 'object' ? 'r' : 's';
		var nvalue = tvalue == 'n' ? object[key] : null;
		var svalue = tvalue == 'r' ? object[key]._id : "" + object[key];

		res.push([id, key, 0, tvalue, svalue, nvalue, ""]);
	}
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
	db.select("SELECT * FROM items WHERE id = ?", [id], function(err, result) {
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

exports.update = function(data, cb) {
	db.inTransaction(function(txcb) {
		console.log("started transaction, removign: ");
		console.dir(data)
		exports.remove(data._id, function(err) {
			console.dir("Updating, err " + err)
			if (err) 
				txcb(err)
			else {
				var recs = objectToRecords(data);
				//TODO:
				console.log("Inserting " + recs);
				for(var i = 0; i < recs.length; i++) {
					//if (!
					db.update("INSERT INTO items VALUES (?, ?, ?, ?, ?, ?, ?) ", recs[i])
					//){
					//	txcb("Failed to update " + recs[i]);
					//	return;
					//}
				}
				txcb(null);	
			}
		})

	}, cb);
}

