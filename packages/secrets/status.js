'use strict';
const trunk = (x, y) => x.length >= y ? x.substr(0, y - 4) + '...' : x;
module.exports = x => {
	process.stdout.clearLine();
	process.stdout.cursorTo(0);
	process.stdout.write(trunk(x || '', process.stdout.columns));
};
