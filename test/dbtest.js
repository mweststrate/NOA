var should = require("should");
var request= require("request");

function httpTest(testname, opts, expect) {
	it(testname, function(done){
    
    	opts.json = true;

		request(opts, function(err, res, body){
			if (err)
				return done(err);
			
			res.statusCode.should.equal(expect.status);
			if (expect.body)
				should.deepEqual(body, expect.body);
			done(err);
		})

    })
}


describe("DbTest", function() {

	var URI = 'http://localhost:5000/data/1';


	var testobj = {
		x : 'ERFX@#$@',
		y : 23435.3234,
		z : true,
		r : { _id: '2'},
		a : [ 1, "boe", false, { _id : '3' }],
		_id : '1' //will be ignored as input
	}

	//PUT
	httpTest("put object", {
		url: URI,
		method : "PUT",
		body : testobj
	}, {
		status: 200
	});

	//GET
	httpTest("get object", {
		url: URI
	}, {
		status: 200,
		body : testobj
	})

	//.z = false;
	//testobj.zz = true;
/*
	//POST (updates partial object)
	httpTest("post update", {
		url: URI,
		method : "POST",
		body : {
			z : false,
			zz : true
		}
	}, {
		status : 200
	})


	//GET (should be updated)
	httpTest("verify update", {
		url: URI
	}, {
		status: 200,
		body : testobj
	})


	//DELETE
	httpTest("test delete", {
		url: URI, 
		method : "DELETE"
	}, {
		status : 200
	})

	//GET non existent
	httpTest("verify delete", {
		url: URI
	}, {
		status: 404,
		body : ""
	})

*/

});