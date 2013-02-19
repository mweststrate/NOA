exports.getById = function(req, res) {
	//TODO: validate req.params.id

	items.findOne({_id : req.params.id}, function(err, result) {
		console.log("Lookup for " + req.params.id + " -> " + JSON.stringify(err) + "," +JSON.stringify(result));
		if (err) {
			console.error(err);
			res.send(500)
		}
		else if (result == null)
			res.send(404);
		else
			res.json(result);
	});
}

exports.updateById = function(req, res) {
	//TODO: validate req.params.id, content-type
	var data = req.body
	data._id = req.params.id
	console.dir(data);

	items.save(data, function(err, result) {
		res.send(err ? 500 : 200);
	});
}