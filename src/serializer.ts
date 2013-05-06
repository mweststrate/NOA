///<reference path='noa.ts'/>

module NOA{

	export class Serializer {

		static serialize(thing: any) {
			if (thing === null)
				return null;
			if (thing === undefined)
				return undefined;
			switch (Util.type(thing)) {
				case "string":
				case "number":
				case "boolean":
					return thing;
			}

			return (<CellContainer>thing).toAST();
		}

		static serializeFunction(name: string, args: any[]) {
			return {
				type: 'function',
				name: name,
				args: Util.each(args, arg => serialize(arg),'m')
			}
		}

	}

	export class Unserializer {

		resolver : (id : String, cb : (ValueContainer) => void) => void;

		constructor(resolver : (id : String, cb : (ValueContainer) => void) => void) {
			this.resolver = resolver;
		}

		static unserializeItems(ast: Object[]) {
			//TODO; 3 phases: first ids than values than expressions
		}

		/**
			returns either IValue, or a primitive like boolean, string or number
		*/
		//TODO: make async
		unserialize(ast : any, cb : (stuff:any) => void) : any {
			if (!Util.isObject(ast)) {//primitives
				cb(ast);
			}

			else switch (ast.type) {
				case 'List' :
					this.unserializeList(ast, cb);
					break;
				case 'Record' :
					this.unserializeRecord(ast, cb);
					break;
				case 'function' :
					this.unserializeFunction(ast, cb);
					break;
				case 'ref' :
					this.unserializeRef(ast, cb);
					break;
				default:
					throw new Error("cannot unserialize " + JSON.stringify(ast));
			}
		}

		unserializeRecord(ast, cb) {
			var res = new NOA.Record();
			res.noaid = ast.id;

			Util.parallel(ast.values, (ast, key, cb) => {
				this.unserialize(ast, (value) => {
					res.set(key, value);
					cb();
				})
			}, () => cb(res));
		}

		unserializeList(ast, callback) {
			var res = new NOA.List();
			res.noaid = ast.id;

			Util.sequence(ast.values, (ast, index, cb) => {
				this.unserialize(ast, (value) => {
					res.add(value);
					cb();
				})
			}, () => callback(res));
		}

		unserializeRef(ast, cb) {
			this.resolver(ast.id, (value) => {
				if (!value)
					throw new Error("Cannot deserialize " + JSON.stringify(ast) + ": unknown id!");
				cb(value);
			});
		}

		unserializeFunction(ast, outercb) {
			var args = [];
			Util.parallel(ast.args,

				//item handler
				(argast, index, cb) =>
					this.unserialize(argast, (value) => {
						args[index] = value;
						cb()
					}),


				//result handler
				() => {
					var source = args[0];
					var func = source[ast.name];
					if (!func)
						throw new Error("Undefined method '" + ast.name + "' for " + source.toString());

					args.shift();
					outercb(func.apply(source, args));
				}
			);
		}
	}
}