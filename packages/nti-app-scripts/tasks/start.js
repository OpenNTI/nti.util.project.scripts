'use strict';
const fs = require('fs-extra');
const path = require('path');
const tmp = require('tmp');
const call = require('nti-lib-scripts/tasks/utils/call-cmd');

const paths = require('../config/paths');

const service = require.resolve('nti-web-service/src/index.js');
const servicePath = path.dirname(service);

const tempConfig = tmp.fileSync();

const config = fs.readJsonSync(paths.baseConfig);
Object.assign(config.development, {
	apps:[{
		package: path.relative(servicePath, paths.serverComponent),
		basepath: paths.servedPath
	}]
});

fs.writeJsonSync(tempConfig.name, config);

call(process.argv[0], [service, '--env', 'development', '--config', tempConfig.name]);
