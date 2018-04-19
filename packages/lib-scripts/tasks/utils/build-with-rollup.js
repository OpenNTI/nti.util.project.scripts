'use strict';
const fs = require('fs-extra');
const rollup = require('rollup');

const {outputs, config} = require('../../config/rollup');

module.exports = function buildBundle ({ignoreExisting = false} = {}) {
	return rollup
		.rollup(config)
		.then(bundle =>
			Promise.all(
				outputs.map(o =>
					fs.existsSync(o.file)
						? (ignoreExisting || console.warn('%s exists, skipping.', o.file))
						: bundle.write({
							format: o.format,
							file: o.file,
							sourcemap: true,
							exports: 'named'
						})
				)
			)
		);
};
