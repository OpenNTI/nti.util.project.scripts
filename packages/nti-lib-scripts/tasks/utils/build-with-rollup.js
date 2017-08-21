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
					fs.existsSync(o.dest)
						? (ignoreExisting || console.warn('%s exists, skipping.', o.dest))
						: bundle.write({
							format: o.format,
							file: o.dest,
							sourcemap: true,
							exports: 'named'
						})
				)
			)
		);
};
