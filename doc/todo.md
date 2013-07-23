# TODO

## 0.1 release

* scope
* recursion
* currentValue / actualValue / event arguments
* parse
* CLI
* logging
* other transformations
* basic functions
* cli demo / order demo
* clean up code & todo items
* formatted errors (+ replace asserts by errors?)
* typescript 0.9 when ready: http://typescript.codeplex.com/releases/view/108802#ReviewsAnchor

## 0.2 release

* friendly syntax
* template language?
* DB support (mongodb)

## 0.3 release

* search queries
* memoization ? + simple function structural equality check?

## Performance ideas

* Less use of ...args: any[], use arguments instead to avoid building new arrays on each func call
* No try catch in LangUtils.watchFunction
* Memoization
* reduce the amount of LangUtils.toValue calls that are made. Only on exposed calls (separate external and internal api (after parsing)?)