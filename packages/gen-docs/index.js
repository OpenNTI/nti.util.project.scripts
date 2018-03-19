#!/usr/bin/env node
'use strict';
const engine = 'jsdoc';
const fs = require('fs-extra');
const run = require(`./engines/${engine}`);

const output = run();


if (process.env.CI) {
	//transfer docs


	//cleanup docs
	fs.removeSync(output);
}
