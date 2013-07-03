var NOA = typeof(require) !== "undefined" ? require("../build/noa.js") : window.NOA;

function createTest(name, func, args, result) {
	exports[name] = function(test) {
		//Dirty...
		NOA.List.count = 0;
		NOA.Cell.count = 0;
		NOA.Expression.count = 0;

		var base = new NOA.List();

		var resolver = function(id, cb) {
			if (id == base.noaid)
				cb(base);
			else
				cb(null);
		}

		base.add(7);
		base.add(3);

		test.ok(base[func]);
		var list = base[func].apply(base, args).live();

		base.add(3);
		base.add(1);

		var ast = NOA.Serializer.serialize(list);
		console.dir(ast);
		test.ok(ast);

		(new NOA.Unserializer(resolver)).unserialize(ast, function(copy) {

			test.ok(copy);

			copy.live();

			base.add("leet");
			base.add(12);
			base.add("zijn");

			base.set(6, "is");
			base.move(6, 4);
			base.remove(6);
			base.move(3,0);
			base.move(1,3);

			test.deepEqual(base.toJSON(), [1,3,3,7,"is","leet"]);

			var freshlist = base[func].apply(base, args).live();
			test.deepEqual(freshlist.toJSON(), result);
			test.deepEqual(list.toJSON(), result);
			test.deepEqual(copy.toJSON(), result);

			freshlist.die();
			copy.die();
			list.die();

			test.equal(NOA.List.count, 0);
			test.equal(NOA.Cell.count, 0);
			test.equal(NOA.Expression.count, 0);

			test.done();
		});
	}
}

// 1 3 3 7 is leet

createTest("count", "count", [], 6);

createTest("numbercount", "numbercount", [], 4);

createTest("sum", "sum", [], 14);

//TODO: not implemted
createTest("avg", "avg", [], 14 / 4);

createTest("max", "max", [], 7);

createTest("min", "min", [], 1);

createTest("index0", "index", [0], 1);
createTest("index4", "index", [4], "is");
createTest("index4b", "index", [-2], "is");
createTest("index6", "index", [6], undefined);
createTest("index6b", "index", [-6], undefined);

createTest("first", "first", [], 1);

createTest("last", "last", [], "leet");

createTest("distinct", "distinct", [], [1,3,7,"is","leet"]);

createTest("filter", "filter", ["x", "function() { return this.variable('x') == 3; }"], [3,3]);

createTest("join", "join", [], [1,3,3,7,"is","leet"]);

createTest("map", "map", ["x", "function() { return 'foo' + this.variable('x'); }"], ["foo1", "foo3", "foo3", "foo7", "foois", "fooleet"]);

createTest("reverse", "reverse", [], ["leet", "is", 7, 3, 3, 1]);

createTest("sort", "sort", [], [1,3,3,7,"is","leet"]);

createTest("subset1", "subset", [2,4], [3, 7, "is"]);
createTest("subset2", "subset", [2,2], []);
createTest("subset3", "subset", [-1,8], [1,3,3,7,"is","leet"]);

createTest("tail1", "tail", [], [3,3,7,"is","leet"]);
createTest("tail2", "tail", [2], [3,7,"is","leet"]);
createTest("tail3", "tail", [6], []);
createTest("tail4", "tail", [0], [1,3,3,7,"is","leet"]);
createTest("tail5", "tail", [-2], [1,3,3,7,"is","leet"]);

//TODO: unmap tests (probably in t3 or t1)

if (!module.parent)
	NOA.Util.runtests(exports);