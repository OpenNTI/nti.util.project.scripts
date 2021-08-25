'use strict';
const call = require('@nti/lib-scripts/tasks/utils/call-cmd');

global.runBuild = async function () {
	call(require.resolve('build-storybook'));
};

require('@nti/lib-scripts/tasks/build');
