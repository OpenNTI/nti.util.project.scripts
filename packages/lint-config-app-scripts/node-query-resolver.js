'use strict';

const {resolve, interfaceVersion} = require('eslint-import-resolver-node');

module.exports.interfaceVersion = interfaceVersion;

// lops off the query portion and passes through to node resolver
// sample.csv?for-download => sample.csv
module.exports.resolve = (source, file, config) => {
	return resolve(source.replace(/\?.*$/, ''), file, config);
};
