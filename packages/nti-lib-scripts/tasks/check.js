'use strict';

const paths = require('../config/paths');
const call = require('./utils/call-cmd');

process.on('unhandledRejection', err => { throw err; });

const args = process.argv.slice(2);

call('eslint', ['--ext', '.js,.jsx', paths.src, ...args]);
