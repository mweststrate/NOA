(function(exports, NOA) {

//TODO tests: first class function, map with first class function, recursive function (using call)
// record with expression, record with function which is called from expression..


exports.citizenfunction1 = function(test) {
    var L = NOA.Lang;
    var res = L.let(
        "fun", L.fun("x", L.mul(L.get("x"), L.get("x"))),
        L.call(L.get("fun"), 2)
    ).live();

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
    ).live();

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

