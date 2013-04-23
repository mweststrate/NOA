
NOA = require("../build/noa.js");

function testIndexes(x, test) {
    for(var i = 0; i < x.cells.length; i++)
        test.equal(x.cells[i].index, i);
}

exports.test1 = function(test) {

	var x = new NOA.List().live();
    x.debugName("x");

	//base set
	x.add(3); 
	x.add(2);  
	x.add(6);
    testIndexes(x, test);

    //mutations
    x.insert(2,7);
    testIndexes(x, test);

    x.remove(1); //super fails if ONLY this is disabled
    testIndexes(x, test);

    x.cell(2).set(1);
    testIndexes(x, test);

    x.move(1,0);
    test.deepEqual(x.toArray(), [7,3,1]);
    testIndexes(x, test);

    x.move(2,0)
    test.deepEqual(x.toArray(), [1,7,3]);
    testIndexes(x, test);
    
    x.move(0,2)
    test.deepEqual(x.toArray(), [7,3,1]);
    testIndexes(x, test);

    x.move(0,1)
    test.deepEqual(x.toArray(), [3,7,1]);
    testIndexes(x, test);

    x.move(2,1)
    test.deepEqual(x.toArray(), [3,1,7]);
    testIndexes(x, test);

    x.die();

	test.equal(NOA.List.count, 0);
	test.equal(NOA.Cell.count, 0);

	test.done();
};

exports.test2 = function(test) {
	var x = new NOA.List().live();//.debugName("x");;

   	var y = x.map("x", function() { 
        //debugger;
		var v = this.variable('x');
		//console.log("DOUBLEMAP: " + v + " * 2 = " + (v * 2));
		return v * 2; 
	}).live();

    y.debugName("y");

	//base set
	x.add(3); 
	x.add(2);  
	x.add(6);

	//mutations
	x.insert(2,7);

	x.remove(1); //super fails if ONLY this is disabled
	x.cell(2).set(1);
	x.move(1,0); //JOIN fails if this is not disabled

	test.deepEqual(x.toArray(), [7,3,1]);
	test.deepEqual(y.toArray(), [14,6,2])

	x.die();
	y.die();

	test.equal(NOA.List.count, 0);
	test.equal(NOA.Cell.count, 0);
	test.equal(NOA.Expression.count, 0);

	test.done();

};

exports.filterlive = function(test) {
    debugger;
    //test.equal(NOA.List.count, 0);
    var x = new NOA.List().live();
    x.debugName("x");
    test.equal(NOA.List.count, 1);

    var z = x.filter("c", function(x) {
        return this.variable("c") < 4;
        //return x < 10;
    }).live();
    z.debugName("z");
    test.equal(NOA.List.count, 3);

    x.die();
    z.die();

    test.equal(NOA.List.count, 0);

    var x = new NOA.List().live();
    test.equal(NOA.List.count, 1);

    var z = x.filter("c", function(x) {
        return this.variable("c") < 4;
        //return x < 10;
    }).live();
    x.add(3);

    test.deepEqual(z.toArray(), [3])

    test.equal(NOA.List.count, 3);
    test.equal(NOA.Cell.count, 3);
    test.equal(NOA.Expression.count,1);

    x.die();
    z.die();

    test.equal(NOA.List.count, 0);
    test.equal(NOA.Cell.count, 0);
    test.equal(NOA.Expression.count,0);

    test.done();
} 

exports.test3filter = function(test) {
    var x = new NOA.List().live();
    x.debugName("x");

    var z = x.filter("c", function(x) {
        return this.variable("c") < 4;
        //return x < 10;
    }).live();
    z.debugName("z");

    x.add(3);
    test.deepEqual( x.toArray(), [3]);
    test.deepEqual( z.toArray(), [3]);

    x.add(2);
    test.deepEqual( x.toArray(), [3,2]);
    test.deepEqual( z.toArray(), [3,2]);
    
    x.add(6);
    test.deepEqual( x.toArray(), [3,2,6]);
    test.deepEqual( z.toArray(), [3,2]);

    //mutations
    x.insert(1,1);
    test.deepEqual( x.toArray(), [3,1,2,6]);
    test.deepEqual( z.toArray(), [3,1,2]);

    x.remove(1);
    test.deepEqual( x.toArray(), [3,2,6]);
    test.deepEqual( z.toArray(), [3,2]);

    x.cell(2).set(1);
    test.deepEqual( x.toArray(), [3,2,1]);
    test.deepEqual( z.toArray(), [3,2,1]);

    x.move(1,0);

    test.deepEqual( x.toArray(), [2,3,1]);
    test.deepEqual( z.toArray(), [2,3,1]);

    x.set(0, 4);
    test.deepEqual( x.toArray(), [4,3,1]);
    test.deepEqual( z.toArray(), [3,1]);

    x.die();
    z.die();

    test.equal(NOA.List.count, 0);
    test.equal(NOA.Cell.count, 0);
    test.equal(NOA.Expression.count, 0);

    test.done();
}

exports.test3 = function(test) {
    var x = new NOA.List().live();
    x.debugName("x");

    var y = x.map("x", function() {
        var v = this.variable('x');
        //console.log("DOUBLEMAP: " + v + " * 2 = " + (v * 2));
        return v * 2;
    }).live();
    y.debugName("y");

    var z = y.filter("c", function(x) {
        return this.variable("c") < 10;
        //return x < 10;
    }).live();
    z.debugName("z");

    x.add(3);
    x.add(2);
    x.add(6);

    //mutations
    x.insert(2,7);

    x.remove(1);
    x.cell(2).set(1);
    x.move(1,0);

    test.deepEqual( x.toArray(), [7,3,1]);
    test.deepEqual( y.toArray(), [14,6,2]);
    test.deepEqual( z.toArray(), [6,2]);

    x.die();
    y.die();
    z.die();

    test.equal(NOA.List.count, 0);
    test.equal(NOA.Cell.count, 0);
    test.equal(NOA.Expression.count, 0);

    test.done();

};

exports.test4 = function(test) {
    var x = new NOA.List().live();
    x.debugName("x");
    x.add(1);
    x.add(2);

    var y = new NOA.List().live();
    y.add(3);
    y.add(4);

    var z = new NOA.List();
    z.add(x).add(y);

    var a = z.join().live();

    test.deepEqual(a.toArray(), [1,2,3,4]);

    a.die(); //should kill z
    //z.live().die();
    x.die();
    y.die();

    test.equal(a.destroyed, true);
    test.equal(z.destroyed, true);
    test.equal(x.destroyed, true);
    test.equal(y.destroyed, true);

    test.equal(NOA.List.count, 0);
    test.equal(NOA.Cell.count, 0);

    test.done();

};

exports.test5 = function(test) {
    var start = (+ new Date);

    var x = new NOA.List().live();
    x.debugName("x");

    console.info(x.toString());


    var y = x.map("x", function() {
        var v = this.variable('x');
        //console.log("DOUBLEMAP: " + v + " * 2 = " + (v * 2));
        return v * 2;
    }).live();
    y.debugName("y")

    var z = y.filter("c", function(x) {
        return this.variable("c") < 10;
        //return x < 10;
    }).live();
    z.debugName("z");

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

    test.deepEqual( x.toArray(), [3,2,7,6]);

    var e = new NOA.List()
        .debugName("e")
        .add(x) //TODO: this line breaks x.remove()
        .add(y)
        .add(x)
        .add(z)
    e.remove(2) //Does not return this but old value, that is, x!
    e.insert(1,a) //x a y z
        .move(2,0) //y x a z
    e= e.join()
        .live();//-> z x y

    x.remove(1); //super fails if ONLY this is disabled
    test.deepEqual( x.toArray(), [3,7,6]);

    x.cell(2).set(1);
    test.deepEqual( x.toArray(), [3,7,1]);
    x.move(1,0); 

    test.deepEqual( x.toArray(), [7,3,1]);
    test.deepEqual( y.toArray(), [14,6,2]);
    test.deepEqual( z.toArray(), [6,2]);
    test.deepEqual( a.toArray(), [3,1]);
    test.deepEqual( b.toArray(), [1,3,7]);
    test.deepEqual( c.toArray(), [7,3,1]);
    test.deepEqual( d.toArray(), [3,7,1]);//Not the best test.., only the contained elements should be the same, not the order..
    test.deepEqual( e.toArray(), [14,6,2,7,3,1,3,1,6,2]);

    x.die();
    y.die();
    z.die();
    a.die();
    b.die();
    c.die();
    d.die();
    e.die();

    test.equal(NOA.Expression.count, 0);
    test.equal(NOA.Cell.count, 0);
    test.equal(NOA.List.count, 0);

    test.done();

};

exports.test6a = function(test) {
    var x = new NOA.List().debugName("x");
    var y = new NOA.List().debugName("x");

    var xy = x.map("xvar", function() {
        var tmp = this.variable("xvar");
        return y.map("yvar", function() {
            var x = this.variable("xvar")
            var y = this.variable("yvar")
            console.log(x + " * " + y + " = " + (x*y))
            return x * y;
        }).debugName("xy-for-x-" + tmp);
    }).debugName("xy");

    var xyj = xy.join().debugName("xyjoin").live();

    test.deepEqual(xyj.toArray(),[]);
    x.add(3);
    test.deepEqual(xyj.toArray(),[]);
    y.add(2)
    test.deepEqual(x.toArray(),[3]);
    test.deepEqual(y.toArray(),[2]);
    test.deepEqual(xyj.toArray(),[6]);
    y.add(4);
    y.add(8);
    test.deepEqual(xyj.toArray(),[6,12,24]);
    x.add(30);
    x.add(300)
    test.deepEqual(xyj.toArray(),[6,12,24,60,120,240,600,1200,2400]);

    xyj.die()
    test.equal(NOA.List.count, 0)
    test.equal(NOA.Cell.count, 0)
    test.equal(NOA.Expression.count, 0)
    test.done();
}

exports.test6b1 = function(test) {
    var x = new NOA.List().debugName("x");
    var y = new NOA.List().debugName("y");

    var z = x.map("x", function() {
        return y.map("y", function() {
            var x = this.variable("x");
            var y = this.variable("y");
            return x * y;
        })
    }).debugName("z");

    var j = z.join().debugName("j").live();

    x.add(1);
    x.add(2);
    y.add(3);
    y.add(4);
    test.deepEqual(j.toArray(), [3, 4, 6, 8])

    y.move(1,0);
    test.deepEqual(j.toArray(), [4, 3, 8, 6])
    
    y.move(0,1);
    test.deepEqual(j.toArray(), [3, 4, 6, 8])

    x.move(0,1);
    test.deepEqual(j.toArray(), [6, 8, 3, 4])

    x.move(1, 0);
    test.deepEqual(j.toArray(), [6, 8, 3, 4])

    j.die();
    test.equal(NOA.List.count, 0);
    test.done();
}

exports.test6b = function(test) {
    var x = new NOA.List().live().debugName("x");;

    console.info(x.toString());

    var xsuper = x.map("x", function(){
        return x.map("y", function() {
            var x = this.variable("x");
            var y = this.variable("y");

            console.log("\n\nSUPERMAP: " + x + " * " + y + ' = ' + (x * y));
            return x * y;
        });        
    }).debugName("xsuper").live();

    var xjoin = xsuper.join().debugName("xjoin").live();

    //base set
    x.add(3);
    x.add(2);
    x.add(6);

    test.deepEqual( x.toArray(), [3,2,6]);
    test.deepEqual(xjoin.toArray(), [9,6,18,6,4,12,18,12,36])

    //mutations
    x.insert(2,7);

    test.deepEqual( x.toArray(), [3,2,7,6]);
    test.deepEqual(xjoin.toArray(), [9,6,21,18, 6,4,14,12, 21,14,49,42, 18,12,42,36])

    x.remove(1); 
    test.deepEqual( x.toArray(), [3,7,6]);
    test.deepEqual(xjoin.toArray(), [9,21,18, 21,49,42, 18,42,36])

    x.cell(2).set(1);
    test.deepEqual( x.toArray(), [3,7,1]);
    test.deepEqual(xjoin.toArray(), [9,21,3, 21,49,7, 3,7,1])

    x.move(1,0); //JOIN fails if this is not disabled

    test.deepEqual( x.toArray(), [7,3,1]);
    // Was:                         [ 9,21,3, 21,49,7, 3,7,1]
    test.deepEqual(xjoin.toArray(), [49,21,7, 21, 9,3, 7,3,1])
    // Is:                          [21, 9,3,  9,21,3, 7,3,1]

    x.die();
    xsuper.die();
    xjoin.die();

    test.equal(NOA.List.count, 0);
    test.equal(NOA.Cell.count, 0);
    test.equal(NOA.Expression.count, 0);

    test.done();

};

//TODO: test exception

exports.test7 = function(test) {
    /*
    var o = new NOA.Record().live();
    o.set("a", 2);
    o.set("b", 2);
    o.set("c", 5);
    o.set("a", 1);
    o.remove("b");

    test.equal(JSON.stringify(o.toObject()), '{"a":1,"c":5}');
    test.deepEqual(o.keys.toArray(), ["a","c"]);

    o.set("b", 2);

    var f = new NOA.Expression(o.cell("c"), function() {
        return this.variable("this").get("a") + this.variable("this").get("b");
    }, null, o).live();

    test.equal(o.get("c"), '3');
    o.set("a", 10);
    o.set("b", 7);
    //TODO: will fail as changin a and b does not fire the application; this is not changed. There should be a NOA.get which is used inside the operation?
    //Probably shoulde be like: Expression(o.cell("c"), ["this", "this.a", "this.b"], function(a, b) { return a + b }, null, o)
    test.equal(o.get("c"), '17');

    f.die();
    o.die();

    test.equal(NOA.List.count, 0);
    test.equal(NOA.Record.count, 0);
    test.equal(NOA.Cell.count, 0);
    test.equal(NOA.Expression.count, 0);
    */
    test.done();

};



if (!module.parent)
    NOA.Util.runtests(exports);