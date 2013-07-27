///<reference path='../noa.ts'/>

module NOA {
	export class NOARepl {


		constructor(private domNode?:Element) {
			new Repl({
				evaluator : this.evaluate,
				completer: this.autoComplete,
				welcome: this.welcome,
				scope: this
			}, domNode);

		}

		welcome (repl: Repl) {
			repl
				.text("Welcome to ").color(ReplColor.Magenta).text("NOA ").color().text((<any>NOA).version())
				.newline()
				.newline()
				.text("Use '").color(ReplColor.Yellow).text("\\help").color().text("' for help.")
				.text("Use '").color(ReplColor.Yellow).text("\\list").color().text("' to list all available functions.")
				.text("Use '").color(ReplColor.Yellow).text("\\q").color().text("' to quit.")
			;
		}

		getCommands() : string[] {
			var res = [];
			for(var key in this)
				if (key.indexOf("command") == 0)
					res.push("\\" + key.substring(7).toLowerCase());
			return res;
		}

		autoComplete(line: string) : string[] {
			return this.getCommands();
		}

		evaluate(line: string, repl: Repl) {
			if (line.indexOf("\\") == 0 && this["command" + line.toLowerCase().substring(1)])
				this["command" + line.toLowerCase().substring(1)].call(this, repl);
			else
				repl.color(ReplColor.Red).text("Unknown command. Use '\\help' to list available commands").color();
		}

		commandq(repl: Repl) {
			repl.exit();
		}

		commandhelp(repl: Repl) {
			repl.newline().color(ReplColor.Magenta)
				.text("Available commands:").color().newline()
				.text("===================").newline().newline();

			this.getCommands().sort().forEach(cmd => repl.text(cmd).newline());
		}

		getNoaFunctions() : string[] {
			//TODO: use meta information!
			var res = [];
			for(var key in NOA.Lang)
				res.push(key);
			return res;
		}

		commandlist(repl: Repl) {
			repl.newline().color(ReplColor.Magenta)
				.text("Available functions:").color().newline()
				.text("===================").newline().newline();

			this.getNoaFunctions().sort().forEach(fun => repl.text(fun).newline());
		}
	}
}