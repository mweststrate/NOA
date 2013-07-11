(function(exports, NOA) {

/**
MWE results on acer aspire one netbook (ubuntu / nodejs):

original:
2-7-13

~5000
~2000

10-7-13 (scope refactoring):
added items in 6519
updated items in 1527

11-7-13 (scope optimizations in Fun)
added items in 4553
updated items in 1647

*/

exports.test1 = function(test) {

    var x = new NOA.List();

    var y = x.map(NOA.Lang.fun("a", NOA.Lang.mul(NOA.Lang.get("a"), 2)));
    y.live();

    var start = +(new Date());

    var size = 1000;
    for(var i = 0; i < size; i++)
        x.add(i);

    for(var i = 0; i < size; i++)
        test.equal(y.get(i), i * 2);

    console.error("added items in " + ((+new Date())-start))

    start = +(new Date());

    for(var i = 0; i < size; i++)
        x.set(i, i*3);

    for(var i = 0; i < size; i++)
        test.equal(y.get(i), i * 6);

    console.error("updated items in " + ((+new Date())-start))

    y.die();

    test.equal(NOA.List.count, 0);
    test.equal(NOA.Variable.count, 0);
    test.equal(NOA.Constant.count, 0);

    test.done();
};

    if ((typeof(module) !== "undefined" && !module.parent) || typeof(window) !== "undefined")
        NOA.Util.runtests(exports);

})(typeof(exports) != "undefined" ?exports : (t1 = {}), typeof(require) !== "undefined" ? require("../build/noa.js") : window.NOA);

