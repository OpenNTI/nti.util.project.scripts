/*
LIB = lib

all: node_modules lib

node_modules: package.json
	@rm -rf node_modules
	@npm install
	@touch node_modules

check: node_modules
	@eslint --ext .js,.jsx ./src

test: clean check
	@jest --coverage

clean:
	@rm -rf $(LIB)
	@rm -rf $(REPORTS)

lib: clean
	@rollup -c
 */
