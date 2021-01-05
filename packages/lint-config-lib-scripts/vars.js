'use strict';
const IN_ATOM = 'ATOM_HOME' in process.env;
const IN_VSCODE = 'VSCODE_PID' in process.env;

const IN_IDE = IN_ATOM || IN_VSCODE;
const IN_WEBPACK = !!process.env.__IN_WEBPACK;
const PROD = process.env.NODE_ENV === 'production';

// Lint only runs on webpack in dev mode
const DEV = PROD ? false : (IN_IDE || IN_WEBPACK);

Object.assign(exports, {
	DEV,
	IN_IDE,
	IN_WEBPACK,
	PROD,
});
