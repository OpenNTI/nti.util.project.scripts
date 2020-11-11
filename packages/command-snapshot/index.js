#!/usr/bin/env node
import {dispatchEvent} from '@nti/github-api';

process.exitCode = 1;

dispatchEvent(process.cwd(), 'snapshot')
	.then(res => {
		console.log(res.message);
		process.exitCode = 0;
	})
	.catch(() => {
		console.error('Not in a git repository?');
	});
