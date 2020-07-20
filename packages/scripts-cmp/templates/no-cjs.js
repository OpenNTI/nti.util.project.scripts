'use strict';

const fs = require('fs');

const {packageJson, packageMain: main} = require('../config/paths');
const {name} = require(packageJson);

module.exports = function noCjs () {
	if (main) {
		const contents = `throw new Error("The package '${name || 'Unknown name'}' cannot be imported as a CJS module.");`;
		fs.writeFileSync(main, contents);
	}
};
