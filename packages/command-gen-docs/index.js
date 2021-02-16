#!/usr/bin/env node
'use strict';
const engine = 'jsdoc';
const fs = require('fs-extra');
const { isCI } = require('ci-info');
const run = require(`./engines/${engine}`);

const output = run();

if (isCI) {
	//transfer docs

	//cleanup docs
	fs.removeSync(output);
}
