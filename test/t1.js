var should = require("should");
global . NOA = require('../public/noa/noa.js').NOA.basepath("./../");

describe("NOA test 1", function() {
	it("NOA test 1.1" ,function(done) {

		NOA.require("NOA.core", function() {
			var x = new NOA.List().live().debugName("x");

			//base set
			x.add(3); 
			x.add(2);  
			x.add(6);

			//mutations
			x.insert(2,7);

			x.remove(1); //super fails if ONLY this is disabled
			x.cell(2).set(1);
			x.move(1,0); //JOIN fails if this is not disabled

			should.deepEqual(x.toArray(), [7,3,1]);
		
			x.die();

			should.equal(NOA.List.count, 0);
			should.equal(NOA.core.Cell.count, 0);

			done();
		})

	});

	it("NOA test 1.2", function(done) {
		NOA.require(["NOA.core", "NOA.List"], function() {
			var x = new NOA.List().live().debugName("x");;

		   	var y = x.map("x", function() { 
				var v = this.variable('x');
				//console.log("DOUBLEMAP: " + v + " * 2 = " + (v * 2));
				return v * 2; 
			}).debugName("y").live();

			//base set
			x.add(3); 
			x.add(2);  
			x.add(6);

			//mutations
			x.insert(2,7);

			x.remove(1); //super fails if ONLY this is disabled
			x.cell(2).set(1);
			x.move(1,0); //JOIN fails if this is not disabled

			should.deepEqual(x.toArray(), [7,3,1]);
			should.deepEqual(y.toArray(), [14,6,2])

			x.die();
			y.die();

			should.equal(NOA.List.count, 0);
			should.equal(NOA.core.Cell.count, 0);
			should.equal(NOA.core.Expression.count, 0);

			done();
		});
	});

    it("NOA test 1.3", function(done) {
        NOA.require(["NOA.core", "NOA.List", "NOA.core.Cell", "NOA.core.Expression", "NOA.Record"], function() {
            var x = new NOA.List().live().debugName("x");;

            var y = x.map("x", function() {
                var v = this.variable('x');
                //console.log("DOUBLEMAP: " + v + " * 2 = " + (v * 2));
                return v * 2;
            }).debugName("y").live();

            var z = y.filter("c", function(x) {
                return this.variable("c") < 10;
                //return x < 10;
            }).debugName("z").live();

            x.add(3);
            x.add(2);
            x.add(6);

            //mutations
            x.insert(2,7);

            x.remove(1);
            x.cell(2).set(1);
            x.move(1,0);

            should.deepEqual( x.toArray(), [7,3,1]);
            should.deepEqual( y.toArray(), [14,6,2]);
            should.deepEqual( z.toArray(), [6,2]);

            x.die();
            y.die();
            z.die();

            should.equal(NOA.List.count, 0);
            should.equal(NOA.core.Cell.count, 0);
            should.equal(NOA.core.Expression.count, 0);

            done();
        });
    });

    it("NOA test 1.4", function(done) {
        NOA.require(["NOA.core", "NOA.List"], function() {
            var start = (+ new Date);

            var x = new NOA.List().live().debugName("x");;

            console.info(x.toString());


            var y = x.map("x", function() {
                var v = this.variable('x');
                //console.log("DOUBLEMAP: " + v + " * 2 = " + (v * 2));
                return v * 2;
            }).debugName("y").live();

            var z = y.filter("c", function(x) {
                return this.variable("c") < 10;
                //return x < 10;
            }).debugName("z").live();

            var a = x.subset(1,3).debugName("a").live();
            var b = x.sort().debugName("b").live();
            var c = b.reverse().debugName("c").live();
            var d = x.distinct().debugName("d").live();

            //base set
            x.add(3);
            x.add(2);
            x.add(6);

            //mutations
            x.insert(2,7);

            var e = new NOA.List()
                .debugName("e")
                .add(x)
                .add(y)
                .add(x)
                .add(z)
                .remove(2)
                .insert(1,a) //x a y z
                .move(2,0) //y x a z
                .join()
                .live();//-> z x y

            x.remove(1); //super fails if ONLY this is disabled
            x.cell(2).set(1);
            x.move(1,0); //JOIN fails if this is not disabled

            should.deepEqual( x.toArray(), [7,3,1]);
            should.deepEqual( y.toArray(), [14,6,2]);
            should.deepEqual( z.toArray(), [6,2]);
            should.deepEqual( a.toArray(), [3,1]);
            should.deepEqual( b.toArray(), [1,3,7]);
            should.deepEqual( c.toArray(), [7,3,1]);
            should.deepEqual( d.toArray(), [3,7,1]);//Not the best test.., only the contained elements should be the same, not the order..
            should.deepEqual( e.toArray(), [14,6,2,7,3,1,3,1,6,2]);

            x.die();
            y.die();
            z.die();
            a.die();
            b.die();
            c.die();
            d.die();
            e.die();

            should.equal(NOA.List.count, 0);
            should.equal(NOA.core.Cell.count, 0);
            should.equal(NOA.core.Expression.count, 0);

            done();
        });
    });

    it("NOA test 1.5", function(done) {
        NOA.require(["NOA.core", "NOA.List"], function() {
            var x = new NOA.List().live().debugName("x");;

            console.info(x.toString());

            var xsuper = x.map("x", function(){
                return x.map("y", function() {
                    var x = this.variable("x");
                    var y = this.variable("y");

                    //console.log("SUPERMAP: " + x + " * " + y + ' = ' + (x * y));
                    return x * y;
                });
            }).debugName("xsuper").live();

            var xjoin = xsuper.join().debugName("xjoin").live();

            //base set
            x.add(3);
            x.add(2);
            x.add(6);

            //mutations
            x.insert(2,7);

            x.remove(1); //super fails if ONLY this is disabled
            x.cell(2).set(1);
            x.move(1,0); //JOIN fails if this is not disabled

            should.deepEqual( x.toArray(), [7,3,1]);

            var s = [];
            for(var i = 0; i < xsuper.cells.length;i++)
                for(var j = 0; j < xsuper.cells[i].value.cells.length; j++)
                    s.push(xsuper.cells[i].value.cells[j].value);

            console.log("xsuper is " + s.join(",") + " expected " + "49,21,7,21,9,3,7,3,1");

            should.deepEqual(xjoin.toArray(), [49,21,7,21,9,3,7,3,1])

            x.die();
            xsuper.die();
            xjoin.die();

            should.equal(NOA.List.count, 0);
            should.equal(NOA.core.Cell.count, 0);
            should.equal(NOA.core.Expression.count, 0);

            done();
        });
    });

    it("NOA test 1.6", function(done) {
        NOA.require(["NOA.core", "NOA.List"], function() {
            /*
            var o = new NOA.Record().live();
            o.set("a", 2);
            o.set("b", 2);
            o.set("c", 5);
            o.set("a", 1);
            o.remove("b");

            should.equal(JSON.stringify(o.toObject()), '{"a":1,"c":5}');
            should.deepEqual(o.keys.toArray(), ["a","c"]);

            o.set("b", 2);

            var f = new NOA.core.Expression(o.cell("c"), function() {
                return this.variable("this").get("a") + this.variable("this").get("b");
            }, null, o).live();

            should.equal(o.get("c"), '3');
            o.set("a", 10);
            o.set("b", 7);
            //TODO: will fail as changin a and b does not fire the application; this is not changed. There should be a NOA.get which is used inside the operation?
            should.equal(o.get("c"), '17');

            f.die();
            o.die();

            should.equal(NOA.List.count, 0);
            should.equal(NOA.Record.count, 0);
            should.equal(NOA.core.Cell.count, 0);
            should.equal(NOA.core.Expression.count, 0);
            */
            done();
        });
    });

});