'use strict';
const fs = require('fs-extra');
const rollup = require('rollup');

const {outputs, config} = require('../../config/rollup');

module.exports = async function buildBundle ({ignoreExisting = false} = {}) {
	const bundle = await rollup.rollup(config);

	const work = outputs.map(async o => {
		const exists = await fs.pathExists(o.file);

		if (!exists) {
			return bundle.write({
				format: o.format,
				file: o.file,
				sourcemap: true,
				exports: 'named'
			});
		}

		if (!ignoreExisting) {
			console.warn('%s exists, skipping.', o.file);
		}
	});

	return Promise.all(work);
};
