import { promises as fs, readFileSync } from 'fs';

import wrap from 'word-wrap';

import { exec, execSync } from './exec.js';

export const arg = (flag, description) => {
	const known = arg.known = arg.known || {toString () {return printHelp(this);}};
	const flags = flag.split(/,\s*/);

	known[flags.join(', ')] = description;

	return flags.some(x => process.argv.includes(x));
};

export const not = fn => x => !fn(x);

export const write = (...x) => console.log(...x);

export const readJSON = async file => JSON.parse(await fs.readFile(file));
export const readJSONSync = file => JSON.parse(readFileSync(file, { encoding: 'utf8' }));

export async function getTermSize () {
	try {
		return getTermSizeSync(await exec('.', 'resize'));
	} catch {
		return {};
	}
}

export function getTermSizeSync (output) {
	try {
		if (!output) {output = execSync('.', 'resize');}
		const {COLUMNS, LINES} = output.split('\n').reduce((o, line, key, value) => ([key, value] = line.split('='), o[key] = parseInt(value, 10), o), {});

		return {
			columns: COLUMNS,
			lines: LINES
		};
	} catch {
		return {};
	}
}


function printHelp (flags) {
	const {columns = 80} = getTermSizeSync();
	let maxColumn = 0;

	const groups = {};
	const output = [];

	for(let [flag, description] of Object.entries(flags)) {
		if (typeof description !== 'string') {
			continue;
		}
		maxColumn = Math.max(maxColumn,flag.length);
		// eslint-disable-next-line no-unused-vars
		const [_, group = '', text = description] = description.match(/^([a-z]+):(.+)$/) ?? [];


		groups[group] = [...(groups[group] || []), {flag,text}];
	}

	for (const entries of Object.values(groups)) {
		output.push('');
		for (const {flag, text} of entries) {
			const prefix = `  ${flag.padEnd(maxColumn)}   `;
			const pad = prefix.length;
			const max = columns - pad;
			output.push(prefix + wrap(text, {width: max, indent: ''.padStart(pad)}).trim());
		}
		output.push('');
	}

	return output.join('\n');
}
