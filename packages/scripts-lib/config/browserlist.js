//#region Imports, constants, utils
'use strict';
const {agents} = require('caniuse-lite/dist/unpacker/agents');
const browserslist = require('browserslist');
const {isCI} = require('ci-info');

const LINTER = /pre-commit|eslint$/i.test(process.argv[1]);
const isWorker = LINTER || process.argv.some(x => (/thread-loader.*worker/ig).test(x)) || process.env.NTI_BROWSER_LIST_PRINTED != null;
const hasValue = x => x && x !== 'null';
const { NTI_DEV_BROWSER } = process.env;
//#endregion

/********************************************
 * This is our main supported browser query *
 ********************************************/
const query = module.exports = !isCI && hasValue(NTI_DEV_BROWSER) ? NTI_DEV_BROWSER.split(',') : [
	// This is the primary set:
	'> 1% and last 2 versions',
	// The last non-chromium Edge (https://www.engadget.com/microsoft-edge-legacy-phase-out-232116614.html)
	// 'Edge 17',
	// We should keep these for good measure.
	'not dead',
	// No IEs, dead or not
	'not IE >= 0',
];

//#region debug logging
if (!isWorker && (process.stdout.isTTY || isCI)) {
	const chalk = require('chalk');
	process.env.NTI_BROWSER_LIST_PRINTED = true;
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
`);

}
//#endregion
