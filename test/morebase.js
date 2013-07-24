(function(exports, NOA) {

//TODO tests: first class function, map with first class function, recursive function (using call)
// record with expression, record with function which is called from expression..


exports.citizenfunction1 = function(test) {
    var L = NOA.Lang;
    var res = L.let(
        "fun", L.fun("x", L.mul(L.get("x"), L.get("x"))),
        L.call(L.get("fun"), 2)
    ).live().start();

    test.equal(res.value(), 4);

    res.die();
    test.equal(NOA.Base.count, 0);
    test.done();
}

exports.citizenfunction2 = function(test) {
    var L = NOA.Lang;

    var doubler = L.fun("x", L.mul(L.get("x"), 2));
    var square  = L.fun("x", L.mul(L.get("x"), L.get("x")))
    var c = new NOA.Variable();
    var f = new NOA.Variable(NOA.LangUtils.toValue(3));

    var res = L.let(
        "fun", c,
        L.call(L.get("fun"), f)
    ).live().start();

    test.equal(res.value().is(NOA.ValueType.Error), true);

    c.set(doubler);
    test.equal(res.value(), 6);

    c.set(square);
    test.equal(res.value(), 9);

    f.set(4);
    test.equal(res.value(), 16);


    res.die();
    test.equal(NOA.Base.count, 0);
    test.done();
}


exports.citizenfunctionmap = function(test) {
    var L = NOA.Lang;

    var doubler = L.fun("x", L.mul(L.get("x"), 2));
    var square  = L.fun("x", L.mul(L.get("x"), L.get("x")))
    var c = new NOA.Variable();
    var x = new NOA.List();

    x.add(3);

    var y = x.map(c).live().start();

    test.equal(y.get(0).is(NOA.ValueType.Error), true);

    c.set(doubler);

    test.deepEqual(y.toJSON(), [6]);

    x.add(4);
    x.move(1,0);
    x.add(6);

    test.deepEqual(x.toJSON(), [4,3,6]);
    test.deepEqual(y.toJSON(), [8,6,12]);

    c.set(square);

    test.deepEqual(y.toJSON(), [16,9,36]);

    x.set(2, 5);
    x.remove(1);

    test.deepEqual(x.toJSON(), [4,5])
    test.deepEqual(y.toJSON(), [16, 25]);

    y.die();

    test.equal(NOA.Base.count, 0);
    test.done();
}

exports.recurse0 = function(test) {

    var L = NOA.Lang;
    var v = new NOA.Variable();
    v.set(0);
    var f = new NOA.Variable();
    var func = new NOA.Fun(NOA.LangUtils.toValue("x"), L.if_(
        L.not(L.eq(L.get("x"), 0)),
        L.call(f,0),// L.substract(L.get("x"), 1))
        3
    ));
    f.set(func);
    func.start(); //start fun with empty closure

    test.equal(func.call(NOA.LangUtils.toValue(0)).value(), 3);

    test.equal(func.call(NOA.LangUtils.toValue(5)).value(), 3);

    f.die();

    test.equal(NOA.Base.count, 0);
    test.done();
}

exports.recurse1 = function(test) {

    var L = NOA.Lang;

    var f = new NOA.Variable().live();

    f.set(new NOA.Fun(NOA.LangUtils.toValue("x"), L.if_(
        L.eq(L.get("x"), 0),
        3,
        L.call(f,0)// L.substract(L.get("x"), 1))
    )));

    f.fvalue.start();

    var call = f.fvalue.call(NOA.LangUtils.toValue(0));
    call.live();
    test.equal(call.value(), 3);
    call.die();

    call = f.fvalue.call(NOA.LangUtils.toValue(5));
    call.live();
    test.equal(call.value(), 3);
    call.die();

    f.die();

    test.equal(NOA.Base.count, 0);
    test.done();
}

exports.recurse2 = function(test) {

    var L = NOA.Lang;
    var v = new NOA.Variable();
    v.set(2);

    var res = L.let(
        "product",
        L.fun("x",
            //L.if_(1,2,3)
            L.if_(
                L.eq(L.get("x"), 0),
                0,
                L.mul(
                    L.get("x"),
                    L.call(
                        L.get("product"),
                        L.substract(L.get("x"), 1)
                    )
                )
            )
        ),
        L.call(L.get("product"), v));

    res.live().start();
    test.equal(res.value(), 0);

 /*   v.set(5);
    test.equal(res.value(), 120);

    v.set(1);
    test.equal(res.value(), 1);
*/
    res.die();

    test.equal(NOA.Base.count, 0);
    test.done();
}

exports.record1 = function(test) {

    var o = new NOA.Record().live();
    o.put("a", 2);
    o.put("b", 2);
    o.put("c", 5);
    o.put("a", 1);
    o.remove("b");

    test.equal(JSON.stringify(o.toJSON()), '{"a":1,"c":5}');
    test.deepEqual(o.keys.toJSON(), ["a","c"]);

    o.put("b", 2);
    o.put("a", 10);
    o.put("b", 7);

    o.die();

    test.equal(NOA.List.count, 0);
    test.equal(NOA.Record.count, 0);
    test.equal(NOA.Variable.count, 0);
    test.equal(NOA.Constant.count, 0);

    test.done();

};


exports.record2 = function(test) {

    var o = new NOA.Record().live();
    o.put("a", 2);
    o.put("b", 2);
    o.put("c", 5);
    o.put("a", 1);
    o.remove("b");

    test.equal(JSON.stringify(o.toJSON()), '{"a":1,"c":5}');
    test.deepEqual(o.keys.toJSON(), ["a","c"]);

    o.put("b", 2);
    var Lang = NOA.Lang;
    var f = Lang.let(
        "this",
        o,
        NOA.LangUtils.withValues([], function() { //TODO: what is withValues without values? watchFunction?
            return Lang.dot("this","a") + Lang.dot("this","b");
        })
    );

    o.put("c", f);

    test.equal(o.get("c"), '3');
    o.put("a", 10);
    o.put("b", 7);
    test.equal(o.get("c"), '17');

    o.die();

    test.equal(NOA.List.count, 0);
    test.equal(NOA.Record.count, 0);
    test.equal(NOA.Variable.count, 0);
    test.equal(NOA.Constant.count, 0);

    test.done();
};

    if ((typeof(module) !== "undefined" && !module.parent) || typeof(window) !== "undefined")
        NOA.Util.runtests(exports);

})(typeof(exports) != "undefined" ?exports : (t1 = {}), typeof(require) !== "undefined" ? require("../build/noa.js") : window.NOA);

