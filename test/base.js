(function(exports, NOA) {

function testIndexes(x, test) {
    var x = x.value();
    for(var i = 0; i < x.cells.length; i++)
        test.equal(x.cells[i].getIndex(x), i);
    if (x instanceof NOA.JoinedList) {
        console.log(JSON.stringify(x.lmap))
        var start = 0;
        for(var i = 0; i < x.source.cells.length; i++) {
            test.equal(x.lmap[i][0], start);
            var l = 1;
            if (x.source.get(i) instanceof NOA.List)
                l = x.source.get(i).cells.length;
            test.equal(x.lmap[i][1], l);
            start += l;
        }
    }
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
    test.deepEqual(x.toJSON(), [7,3,1]);
    testIndexes(x, test);

    x.move(2,0)
    test.deepEqual(x.toJSON(), [1,7,3]);
    testIndexes(x, test);

    x.move(0,2)
    test.deepEqual(x.toJSON(), [7,3,1]);
    testIndexes(x, test);

    x.move(0,1)
    test.deepEqual(x.toJSON(), [3,7,1]);
    testIndexes(x, test);

    x.move(2,1)
    test.deepEqual(x.toJSON(), [3,1,7]);
    testIndexes(x, test);
    x.die();

	test.equal(NOA.List.count, 0);
    test.equal(NOA.Constant.count, 0);
    test.equal(NOA.Variable.count, 0);

	test.done();
};

exports.letget = function (test) {
	var a = NOA.Lang.let("x", 3, NOA.Lang.get("x")).live();

	test.equal(a.value(), 3)
	a.die();

	var b = NOA.Lang.let("y", 4, NOA.Lang.let("x", 3, NOA.Lang.mul(NOA.Lang.get("x"), NOA.Lang.get("y")))).live();
	test.equal(b.value(), 12)
	b.die();

	var c = NOA.Lang.let("x", 4, NOA.Lang.mul(NOA.Lang.let("x", 3, NOA.Lang.get("x")), NOA.Lang.get("x"))).live();
	test.equal(b.value(), 12)
	c.die();

	test.equal(NOA.Base.count, 0);

	test.done();
}

exports.funcall = function (test) {
	var d = NOA.Lang.call(NOA.Lang.fun("x", NOA.Lang.get("x")), 3).live();
	test.equal(d.value(), 3);
	d.die();

    test.equal(NOA.Let.count, 0);
    test.equal(NOA.Fun.count, 0);
    test.equal(NOA.Expression.count, 0);
    test.equal(NOA.ErrorValue.count, 0);
    test.equal(NOA.Variable.count, 0);
    test.equal(NOA.Constant.count, 0);
	test.equal(NOA.Base.count, 0);

	test.done();
}


exports.outerscope1 = function (test) {
    var d =
    NOA.Lang.let(
        "y", 4,
        NOA.Lang.call(
            NOA.Lang.fun("x",
                NOA.Lang.mul(NOA.Lang.get("x"),NOA.Lang.get("y"))
            ),
            NOA.Lang.get("y"))
    ).live();
    test.equal(d.value(), 16);
    d.die();

    test.equal(NOA.Base.count, 0);

    test.done();
}

exports.outerscope2 = function (test) {
    var d =
    NOA.Lang.let(
        "y", 4,
        NOA.Lang.let(
            "double", NOA.Lang.fun("z", NOA.Lang.mul(NOA.Lang.get("z"), 2)),
            NOA.Lang.call(
                NOA.Lang.fun("x",
                    NOA.Lang.call(NOA.Lang.get("double"),NOA.Lang.get("x"))
                ),
                NOA.Lang.get("y"))
        )
    ).live();
    test.equal(d.value(), 8);
    d.die();

    test.equal(NOA.Base.count, 0);

    test.done();
}

exports.outerscope3 = function (test) {
    var d =
    NOA.Lang.call(
        NOA.Lang.fun("fun", "x", NOA.Lang.call(NOA.Lang.get("fun"), NOA.Lang.get("x"))),
        NOA.Lang.fun("z", NOA.Lang.mul(NOA.Lang.get("z"), 2)),
        4
    ).live();
    test.equal(d.value(), 8);
    d.die();

    test.equal(NOA.Base.count, 0);

    test.done();
}


exports.outerscope4 = function (test) {
    var $ = NOA.Lang;
    var d =
    $.let("poep", 7,
    $.let("x", 4,
        $.let("fun", $.fun($.get("x")),
            $.let("x", 5,
                $.call($.get("fun"))))));

    d.live();
    test.equal(d.value(), 4);
    d.die();

    test.equal(NOA.Base.count, 0);

    test.done();
}

exports.outerscope5 = function (test) {
    var $ = NOA.Lang;
    var d =
    $.let("x", 4,
        $.let("fun", $.fun("y", $.mul($.get("x"), $.get("y"))),
            $.let("x", 5,
                $.call($.get("fun"),$.get("x")))));

    d.live();
    test.equal(d.value(), 20);
    d.die();

    test.equal(NOA.Base.count, 0);

    test.done();
}

exports.smallmap1 = function(test) {

    var x = new NOA.List();
    x.add(3);
    var y = x.map(NOA.Lang.fun(function(v) {
        return v*2
    })).live();

    x.add(4);

    test.deepEqual(x.toJSON(),[3,4])
    test.deepEqual(y.toJSON(),[6,8])
    y.die();

    test.equal(NOA.List.count, 0);
    test.equal(NOA.Variable.count, 0);
    test.equal(NOA.Constant.count, 0);

    test.done();
}

exports.smallmap0a = function(test) {

    var x = new NOA.List();
    var y = x.map(NOA.Lang.fun("k", NOA.Lang.get("k"))).live();
    y.die();

    test.equal(NOA.List.count, 0);
    test.equal(NOA.Constant.count, 0);
    test.equal(NOA.Variable.count, 0);

    test.done();
}

exports.smallmap0b = function(test) {

    var x = new NOA.List();
    x.add(3);
    var y = x.map(NOA.Lang.fun("k", NOA.Lang.get("k"))).live();
    test.deepEqual(y.toJSON(),[3])
    y.die();

    test.equal(NOA.List.count, 0);
    test.equal(NOA.Constant.count, 0);
    test.equal(NOA.Variable.count, 0);

    test.done();
}

exports.smallmap0c = function(test) {

    var x = new NOA.List();
    x.add(3);
    var y = x.map(NOA.Lang.fun("k", NOA.Lang.get("k"))).live();
    x.add(4);
    x.set(0, 12);

    test.deepEqual(y.toJSON(),[12,4])
    y.die();

    test.equal(NOA.List.count, 0);
    test.equal(NOA.Constant.count, 0);
    test.equal(NOA.Variable.count, 0);

    test.done();
}

exports.smallmap2a = function(test) {

    var x = new NOA.List();
    x.add(3);
    //TODO: far too much calcutions right now, but working.
    //
    //TODO: should improve using sleepless stuff?
    //var y = x.map("k", NOA.Lang.mul(NOA.Lang.get("k"), 2)).live();
    var y = x.map(NOA.Lang.fun("k", NOA.Lang.mul(NOA.Lang.get("k"), 2))).live();

    test.deepEqual(x.toJSON(),[3])
    test.deepEqual(y.toJSON(),[6])

    x.add(4);
    test.deepEqual(x.toJSON(),[3,4])
    test.deepEqual(y.toJSON(),[6,8])

    x.set(0, 12);
    test.deepEqual(x.toJSON(),[12,4])
    test.deepEqual(y.toJSON(),[24,8])

    y.die();

    test.equal(NOA.List.count, 0);
    test.equal(NOA.Variable.count, 0);
    test.equal(NOA.Constant.count, 0);

    test.done();
}

exports.smallmap2b = function(test) {

    var x = new NOA.List().debugName("x").live();

    x.add(3);

    var y =  NOA.Lang.let("x", x, NOA.Lang.map(NOA.Lang.get("x"), NOA.Lang.fun("a",
        NOA.Lang.mul(NOA.Lang.get("a"), 2)//NOA.Lang.get("b"))
    ))).live();

    test.deepEqual(x.toJSON(),[3])
    test.deepEqual(y.toJSON(),[6])

    x.add(4);
    test.deepEqual(x.toJSON(),[3,4])
    test.deepEqual(y.toJSON(),[6,8])

    x.set(0, 12);
    test.deepEqual(x.toJSON(),[12,4])
    test.deepEqual(y.toJSON(),[24,8])

    y.die();
    x.die();

    test.equal(NOA.List.count, 0);
    test.equal(NOA.Variable.count, 0);
    test.equal(NOA.Constant.count, 0);


    test.done();
}



exports.errortest = function(test) {

    var x = new NOA.List();
    x.add(3);

    var y = x.map(NOA.Lang.fun(function(v) {
        if (v == 6)
            throw "should not be six!"
        else
            return v*2;
    })).live();

    x.add(6);
    x.add(9);

    test.equal(y.cell(0).toJSON(),6)
    test.equal(y.cell(1).toJSON().error, "should not be six!");
    test.equal(y.cell(2).toJSON(),18)

    test.ok(!y.is(NOA.ValueType.Error))
    test.ok(!x.is(NOA.ValueType.Error))
    test.ok(y.cell(1).is(NOA.ValueType.Error))
    test.ok(!y.cell(2).is(NOA.ValueType.Error))
    test.ok(!x.cell(1).is(NOA.ValueType.Error))

    y.die();

    test.equal(NOA.List.count, 0);
    test.equal(NOA.Variable.count, 0);
    test.equal(NOA.Constant.count, 0);

    test.done();
}

exports.test2 = function(test) {
	var x = new NOA.List().live();//.debugName("x");;

   	var y = x.map(function(x) {
        return x*2;
    }).live().debugName("y");

   	var z = x.map(function (v) {
   		this(v * 2);
   	}).live().debugName("z");

   	var a = x.map(NOA.Lang.fun("x", NOA.Lang.mul(NOA.Lang.get("x"), 2))).live().debugName("a");

	//base set
	x.add(3);
	x.add(2);
	x.add(6);

	//mutations
	x.insert(2,7);

	x.remove(1); //super fails if ONLY this is disabled
	x.cell(2).set(1);
	x.move(1,0); //JOIN fails if this is not disabled

	test.deepEqual(x.toJSON(), [7,3,1]);
	test.deepEqual(z.toJSON(), [14, 6, 2])
    test.deepEqual(y.toJSON(), [14,6,2])
	test.deepEqual(a.toJSON(), [14, 6, 2])

	x.die();
	y.die();
	z.die();
	a.die();

	test.equal(NOA.List.count, 0);
	test.equal(NOA.Variable.count, 0);
	test.equal(NOA.Expression.count, 0);

	test.done();

};

exports.filterlive = function(test) {
    //test.equal(NOA.List.count, 0);
    var x = new NOA.List().live();
    x.debugName("x");
    test.equal(NOA.List.count, 1);

    var z = x.filter(function(x) {
        return x < 4;
    }).live();
    z.debugName("z");
    test.equal(NOA.List.count, 3);

    x.die();
    z.die();

    test.equal(NOA.List.count, 0);

    var x = new NOA.List().live();
    test.equal(NOA.List.count, 1);

    var z = x.filter(function(x) {
        return x < 4;
    }).live();
    x.add(3);

    test.deepEqual(z.toJSON(), [3])

    test.equal(NOA.List.count, 3);
    //test.equal(NOA.Variable.count== 4 || NOA.Variable.count ==5, true); //MWE: depends on wheter fun calls are optimized

    x.die();
    z.die();

    test.equal(NOA.List.count, 0);
    test.equal(NOA.Variable.count, 0);
    test.equal(NOA.Base.count,0);

    test.done();
}

exports.test3filter = function(test) {
    var x = new NOA.List().live();
    x.debugName("x");

    var z = x.filter(function(x) {
        return x < 4;
    }).live();
    z.debugName("z");

    x.add(3);
    test.deepEqual( x.toJSON(), [3]);
    test.deepEqual( z.toJSON(), [3]);

    x.add(2);
    test.deepEqual( x.toJSON(), [3,2]);
    test.deepEqual( z.toJSON(), [3,2]);

    x.add(6);
    test.deepEqual( x.toJSON(), [3,2,6]);
    test.deepEqual( z.toJSON(), [3,2]);

    //mutations
    x.insert(1,1);
    test.deepEqual( x.toJSON(), [3,1,2,6]);
    test.deepEqual( z.toJSON(), [3,1,2]);

    x.remove(1);
    test.deepEqual( x.toJSON(), [3,2,6]);
    test.deepEqual( z.toJSON(), [3,2]);

    x.cell(2).set(1);
    test.deepEqual( x.toJSON(), [3,2,1]);
    test.deepEqual( z.toJSON(), [3,2,1]);

    x.move(1,0);

    test.deepEqual( x.toJSON(), [2,3,1]);
    test.deepEqual( z.toJSON(), [2,3,1]);

    x.set(0, 4);
    test.deepEqual( x.toJSON(), [4,3,1]);
    test.deepEqual( z.toJSON(), [3,1]);

    x.die();
    z.die();

    test.equal(NOA.List.count, 0);
    test.equal(NOA.Variable.count, 0);
    test.equal(NOA.Base.count, 0);

    test.done();
}

exports.test3 = function(test) {
    var x = new NOA.List().live();
    x.debugName("x");

    var y = x.map(function(v) {
        return v * 2;
    }).live();
    y.debugName("y");

	//TODO: at filter to IList
    var z = y.filter(function(x) {
        return x < 10;
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

    test.deepEqual( x.toJSON(), [7,3,1]);
    test.deepEqual( y.toJSON(), [14,6,2]);
    test.deepEqual( z.toJSON(), [6,2]);

    x.die();
    y.die();
    z.die();

    test.equal(NOA.List.count, 0);
    test.equal(NOA.Variable.count, 0);
    test.equal(NOA.Base.count, 0);

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

    test.deepEqual(a.toJSON(), [1,2,3,4]);

    a.die(); //should kill z
    //z.live().die();
    x.die();
    y.die();

    test.equal(a.destroyed, true);
    test.equal(z.destroyed, true);
    test.equal(x.destroyed, true);
    test.equal(y.destroyed, true);

    test.equal(NOA.List.count, 0);
    test.equal(NOA.Base.count, 0);

    test.done();

};

exports.test5 = function(test) {
    var start = (+ new Date);

    var x = new NOA.List().live();
    x.debugName("x");

    console.info(x.toString());


    var y = x.map(NOA.Lang.fun("x", NOA.Lang.mul(2, NOA.Lang.get("x")))).live();
    y.debugName("y")

    var z = y.filter(function(x) {
        return x < 10;
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

    test.deepEqual( x.toJSON(), [3,2,7,6]);

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
    test.deepEqual( x.toJSON(), [3,7,6]);

    x.cell(2).set(1);
    test.deepEqual( x.toJSON(), [3,7,1]);
    x.move(1,0);

    test.deepEqual( x.toJSON(), [7,3,1]);
    test.deepEqual( y.toJSON(), [14,6,2]);
    test.deepEqual( z.toJSON(), [6,2]);
    test.deepEqual( a.toJSON(), [3,1]);
    test.deepEqual( b.toJSON(), [1,3,7]);
    test.deepEqual( c.toJSON(), [7,3,1]);
    test.deepEqual( d.toJSON(), [3,7,1]);//Not the best test.., only the contained elements should be the same, not the order..
    test.deepEqual( e.toJSON(), [14,6,2,7,3,1,3,1,6,2]);

    x.die();
    y.die();
    z.die();
    a.die();
    b.die();
    c.die();
    d.die();
    e.die();

    test.equal(NOA.Expression.count, 0);
    test.equal(NOA.Base.count, 0);
    test.equal(NOA.List.count, 0);

    test.done();

};

exports.testjoin = function(test) {
    var x = new NOA.List().debugName("x");
    var y = new NOA.List().debugName("y");
    var xy = new NOA.List().debugName("xy");
    xy.add(x);
    xy.add(y);
    x.add(1)
    y.add(3)

    var j = xy.join().live();
    testIndexes(j, test);
    test.deepEqual(j.toJSON(), [1,3]);

    x.add(2);
    testIndexes(j, test);
    test.deepEqual(j.toJSON(), [1,2,3]);

    y.add(4);
    testIndexes(j, test);
    test.deepEqual(j.toJSON(), [1,2,3,4]);

    test.equal(x, xy.get(0));
    test.equal(y, xy.get(1));
    testIndexes(xy, test);
    //test.equal(xy.toJSON, [x,y]);

    test.deepEqual(j.toJSON(), [1,2,3,4]);
    testIndexes(j, test);

    test.equal(x, xy.get(0));
    test.equal(y, xy.get(1));
    testIndexes(xy, test);

    xy.move(1,0);

    test.equal(y, xy.get(0));
    test.equal(x, xy.get(1));
    testIndexes(xy, test);

    test.deepEqual(j.toJSON(), [3,4,1,2]);
    testIndexes(j, test);

    xy.move(0,1);
    test.deepEqual(j.toJSON(), [1,2,3,4]);
    testIndexes(j, test);

    x.live();
    xy.remove(0);
    test.deepEqual(j.toJSON(), [3,4]);
    testIndexes(j, test);

    xy.add(x);
    test.deepEqual(j.toJSON(), [3,4,1,2]);
    testIndexes(j, test);
    x.die(); //see  6 lines up

    y.live();
    xy.set(0, x);
    test.deepEqual(j.toJSON(), [1,2,1,2]);
    testIndexes(j, test);

    xy.insert(1, y);
    test.deepEqual(j.toJSON(), [1,2,3,4,1,2]);
    testIndexes(j, test);
    y.die(); //see 6 lines up

    j.die();
    test.equal(NOA.List.count, 0);
    test.equal(NOA.Base.count, 0);

    test.done();
}

exports.test6a0 = function(test) {
    var x = new NOA.List().debugName("x");
    var y = new NOA.List().debugName("y");

    var xy = x.map(function(x) {
        return y.map(function(y) {
            console.log(x + " * " + y + " = " + (x*y))
            return x * y;
        }).debugName("xy-for-x-" + x);
    }).debugName("xy");

    var xyj = xy.join().debugName("xyjoin").live();

    test.deepEqual(xyj.toJSON(),[]);
    x.add(3);
    test.deepEqual(xyj.toJSON(),[]);
    y.add(2)
    test.deepEqual(x.toJSON(),[3]);
    test.deepEqual(y.toJSON(),[2]);
    test.deepEqual(xyj.toJSON(),[6]);
    y.add(4);
    y.add(8);
    test.deepEqual(xyj.toJSON(),[6,12,24]);
    x.add(30);
    x.add(300)
    test.deepEqual(xyj.toJSON(),[6,12,24,60,120,240,600,1200,2400]);

    xyj.die()
    test.equal(NOA.List.count, 0)
    test.equal(NOA.Variable.count, 0)
    test.equal(NOA.Base.count, 0)
    test.done();
}

exports.test6a1 = function(test) {
    var x = new NOA.List().debugName("x");

    var xy =
    NOA.Lang.let("a", 3,
        NOA.Lang.map(x, NOA.Lang.fun("z", NOA.Lang.get("a"))));

    test.deepEqual(xy.toJSON(),[]);

    x.add(6);
    test.deepEqual(xy.toJSON(),[3]);

    x.add(6);
    test.deepEqual(xy.toJSON(),[3,3]);

    xy.die()
    test.equal(NOA.List.count, 0)
    test.equal(NOA.Variable.count, 0)
    test.equal(NOA.Base.count, 0)
    test.done();
}


exports.test6a2 = function(test) {
    var x = new NOA.List().debugName("x");
    var y = new NOA.List().debugName("y");

    var xy =
    NOA.Lang.let("x", x,
        NOA.Lang.let("y", y,
            NOA.Lang.map(NOA.Lang.get("x"), NOA.Lang.fun("a",
                NOA.Lang.map(NOA.Lang.get("y"), NOA.Lang.fun("b",
                    NOA.Lang.mul(NOA.Lang.get("a"), NOA.Lang.get("b"))
                    //NOA.Lang.get("a")
                ))
            ))
        ));

    var xyj = NOA.Lang.join(xy).debugName("xyjoin").live();

//    console.dir(xyj.toGraph());

    test.deepEqual(xyj.toJSON(),[]);
    x.add(3);
    test.deepEqual(xyj.toJSON(),[]);
    y.add(2)
    console.dir(xyj.toGraph());
    test.deepEqual(x.toJSON(),[3]);
    test.deepEqual(y.toJSON(),[2]);

    test.deepEqual(xyj.toJSON(),[6]);
    y.add(4);
    y.add(8);
    test.deepEqual(xyj.toJSON(),[6,12,24]);
    x.add(30);
    x.add(300)
    test.deepEqual(xyj.toJSON(),[6,12,24,60,120,240,600,1200,2400]);

    xyj.die()
    test.equal(NOA.List.count, 0)
    test.equal(NOA.Variable.count, 0)
    test.equal(NOA.Base.count, 0)
    test.done();
}


exports.test6b1 = function(test) {
    var x = new NOA.List().debugName("x");
    var y = new NOA.List().debugName("y");

    var xy =
    NOA.Lang.let("x", x,
        NOA.Lang.let("y", y,
            NOA.Lang.map(NOA.Lang.get("x"), NOA.Lang.fun("a",
                NOA.Lang.map(NOA.Lang.get("y"), NOA.Lang.fun("b",
                    NOA.Lang.mul(NOA.Lang.get("a"), NOA.Lang.get("b"))
                ))
            ))
        ));

    var xyj = NOA.Lang.join(xy).debugName("xyjoin").live();

    x.add(1);
    x.add(2);
    y.add(3);
    y.add(4);
    test.deepEqual(xyj.toJSON(), [3, 4, 6, 8])

    y.move(1,0);
    test.deepEqual(xyj.toJSON(), [4, 3, 8, 6])

    y.move(0,1);
    test.deepEqual(xyj.toJSON(), [3, 4, 6, 8])

    x.move(0,1);
    test.deepEqual(xyj.toJSON(), [6, 8, 3, 4])

    x.move(1, 0);
    test.deepEqual(xyj.toJSON(), [3, 4, 6, 8])

    xyj.die();
    test.equal(NOA.Base.count, 0);
    test.done();
}

if ((typeof(module) !== "undefined" && !module.parent) || typeof(window) !== "undefined")
    NOA.Util.runtests(exports);

})(typeof(exports) != "undefined" ?exports : (t1 = {}), typeof(require) !== "undefined" ? require("../build/noa.js") : window.NOA);

