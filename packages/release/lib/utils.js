import { promises as fs } from 'fs';

import { exec } from './exec.js';

export const not = fn => x => !fn(x);

export const write = (...x) => console.log(...x);

export const readJSON = async file => JSON.parse(await fs.readFile(file));

export async function getTermSize () {
	try {
		const {COLUMNS, LINES} = (await exec('.', 'resize')).split('\n').reduce((o, line, key, value) => ([key, value] = line.split('='), o[key] = parseInt(value, 10), o), {});

		return {
			columns: COLUMNS,
			lines: LINES
		};
	} catch {
		return {};
	}
}
