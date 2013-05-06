
NOA = require("../build/noa.js");

function createTest(name, func, args, result) {
	exports[name] = function(test) {
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
			base.remove(5);

			test.deepEqual(list.toJSON(), result);
			test.deepEqual(copy.toJSON(), result);

			copy.die();
			list.die();

			test.assertEqual(NOA.List.count, 0);
			test.assertEqual(NOA.Cell.count, 0);
			test.assertEqual(NOA.Expression.count, 0);
			test.done();
		});
	}
}

createTest("count", "count", [], 6);

if (!module.parent)
	NOA.Util.runtests(exports);