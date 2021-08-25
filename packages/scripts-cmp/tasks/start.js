'use strict';
const call = require('@nti/lib-scripts/tasks/utils/call-cmd');
call(require.resolve('start-storybook', ['-p', '6006']));
