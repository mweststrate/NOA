var express = require('express');
var core = require('./core.js')

core.startDB(function (err) {
	if (err)
		console.error("Failed to start DB: " + err)
	else
		startHttp(function(err) {
			if (err)
				console.error("Failed to start HTTP server: " + err)
			else
				console.info("Started HTTP server. Server is ready to rock and roll. ")
		});
});

function startHttp(callback) {

	var app = express();
	    app.set('title', 'vera')


	app.use(express.logger());  /* 'default', 'short', 'tiny', 'dev' */
	//app.use(express.cookieSession())
	//app.use(express.csrf()) CSRF protection
	app.use(express.bodyParser({ keepExtensions: true }));
	//app.use(express.cookieParser());

	app.get('/data/:id', function(req, res) {
		console.log("Lookup for " + req.params.id);
		core.getById(req.params.id, function(err, result) {
			if (err) {
				console.error(err);
				res.send(500)
			}
			else if (res == null)
				res.send(404);
			else {
				res.header({"Content-Type":"application/json"})//TODO: needed?
				res.json(result);
			}
		})
	})
	
	app.put('/data/:id', function(req, res) {
		//TODO: validate req.params.id, content-type
		var data = req.body
		assert(data._id === undefined || data._id == req.params.id)
		data._id = req.params.id
		core.update(data, function(err) {
			if (err) {
				console.error(err);
				res.send(500);
			}
			else
				res.send(200);
		})
	})

	app.use(express.directory('public'))
	app.use(express.static('public'))



	/** start server */
	var port = process.env.PORT || 5000;
	app.listen(port, function() {
	  console.log("Listening on " + port);
	  //console.log("Registered routes: ");
	  //console.dir(app.routes);

	  callback && callback();
	});
}
