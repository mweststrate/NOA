declare var require: Function;
declare var process: any;

module NOA {
	export interface IReplConfig {
		welcome: (repl: Repl) => void;
		evaluator: (line: string, repl: Repl) => void;
		completer: (line: string) => string[];
		scope: Object;
	}

	export class ReplColor {
		static NORMAL = "0";

		//http://en.wikipedia.org/wiki/ANSI_escape_code
		static Black = "0";
		static Red = "1;1"; //";1" indicates 'bright'
		static Green = "2;1";
		static Yellow = "3;1";
		static Blue = "4;1";
		static Magenta = "5;1";
		static Cyan = "6;1";
		static White = "7;1";
	}

	export class Repl {
		private _isTerminal: bool;
		private terminal: any; //TODO: maybe there is a d.ts for this one?

		constructor(private config: IReplConfig, private domNode? : Element) {
			this._isTerminal = !domNode;
			if (this.isTerminal())
				this.setupTerminal();
			else
				throw "Not implemented";
		}

		isTerminal(): bool {
			return this._isTerminal;
		}

		text(text: string): Repl {
			if (this.isTerminal()) 
				this.terminal.output.write(text);

			return this;
		}

		newline(): Repl {
			return this.text("\n");
		}

		color(color: string = ReplColor.NORMAL): Repl {
			if (this.isTerminal()) {
				this.terminal.output.write("\x1b[3" + color + "m");
			}
			return this;
		}

		exit(text: string = "Bye!") {
			this.terminal.close();
		}

		private setupTerminal() {
			//http://nodejs.org/api/readline.html
			var readline = require('readline');
			this.terminal = readline.createInterface({
				input: process.stdin,
				output: process.stdout,

				completer: (line: string) => {
					//obtain
					var completions: string[] = this.config.completer.call(this.config.scope, line.trim())
					//filter
					var res = completions.filter(x => line.indexOf(x) == 0);
					//show all?
					res = res.length == 0 ? completions : res;

					return [<any> res, line]
				}
			});

			this.config.welcome(this);

			this.terminal
				.on('line', (line: string) => {
					this.config.evaluator.call(this.config.scope, line.trim(), this);
					this.newline();
					this.terminal.prompt();
				})
				.on('close', () => {
					process.exit(0);
				})
				.prompt();
		}
	}
}