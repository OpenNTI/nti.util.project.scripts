import { promises as fs } from 'fs';

export const not = fn => x => !fn(x);

export const write = (...x) => console.log(...x);

export const readJSON = async file => JSON.parse(await fs.readFile(file));
