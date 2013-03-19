REPORTER = dot

test-break:
	@NODE_ENV=test ./node_modules/.bin/mocha \
		--debug-brk --reporter $(REPORTER) 

test:
	@NODE_ENV=test ./node_modules/.bin/mocha \
		--reporter $(REPORTER) \

test-w:
	@NODE_ENV=test ./node_modules/.bin/mocha \
		--reporter $(REPORTER) \
		--growl \
		--watch

.PHONY: test test-w test-break
