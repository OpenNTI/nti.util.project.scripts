'use strict';
const {agents} = require('caniuse-lite/dist/unpacker/agents');
const browserslist = require('browserslist');
const chalk = require('chalk');
const {isCI} = require('ci-info');

const isWorker = process.argv.some(x => (/thread-loader.*worker/ig).test(x));

const hasValue = x => x && x !== 'null';

// Test queries and coverage here: http://browserl.ist
const { NTI_DEV_BROWSER } = process.env;
const query = module.exports = !isCI && hasValue(NTI_DEV_BROWSER) ? NTI_DEV_BROWSER.split(',') : [
	'> 1% in US',
	'last 2 versions',
	'not dead',
	'IE 11',
];


if (!isWorker && (process.stdout.isTTY || isCI)) {
	const byLocale = (a, b) => a.localeCompare(b);
	const getName = n => (agents[n] || {}).browser || n;
	const getVers = (o, n) => o[n] = (o[n] || []);
	const dedupe = (o, line) => {
		const [n, ver] = line.split(/\s+/);
		getVers(o, getName(n)).push(ver);
		return o;
	};

	const browsers = browserslist(query).reduce(dedupe, {});
	const combine = (key) => [key, browsers[key].join(', ')].join(' ');
	const selected = Object.keys(browsers).map(combine).sort(byLocale).join('\n  ');

	console.log(`
Selected Browser targets:
  ${chalk.bold.blue(selected)}
${hasValue(NTI_DEV_BROWSER) ? `
Dev environemnt variable ${chalk.bold.underline('is set')}:
  ${chalk.bold('NTI_DEV_BROWSER')}="${chalk.bold.blue(NTI_DEV_BROWSER)}"
` : isCI ? '' : `
Default targets are defined in ${chalk.grey('@nti/lib-scripts/config/browserlist')}.
Developers may locally override this using the environment variable:

  ${chalk.bold.blue('NTI_DEV_BROWSER')}="last 1 chrome version"
`}
Test queries and coverage here: ${chalk.bold.blue('http://browserl.ist')}

`);

}
