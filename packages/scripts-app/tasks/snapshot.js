'use strict';
const http = require('https');
const childProcess = require('child_process');

const exec = require('@nti/lib-scripts/tasks/utils/call-cmd');
const json = x => {try {return JSON.parse(x);} catch {return x;}};
const call = (cmd, ...args) => exec(cmd, args, {stdio: 'pipe'})?.trim();
const firstLine = x => x?.split?.('\n')?.[0];
const gitStatus = call('git', 'status', '-sb');

const githubPattern = /github.com[/:]([^/]+)\/([^/]+(?!git))(\.git)$/i;
const [,remoteBranch] = firstLine(gitStatus)?.split?.('...') ?? [];
const [remoteName] = remoteBranch?.split('/');
const remoteUrl = call('git', 'remote', 'get-url', remoteName);
const [, owner, repo] = githubPattern.exec(remoteUrl) ?? [];

process.stdout.write(`Requesting snapshot build of ${owner}/${repo} ... `);

try{
	const out = childProcess.execSync('gh api repos/:owner/:repo/dispatches -X POST --field event_type=snapshot', {stdio: 'pipe'}).toString('utf8');
	process.stdout.write('sent\n');
	if (out) {
		console.log(out);
	}
	return;
} catch {
	/* fallback */
}

const url = new URL(`https://api.github.com/repos/${owner}/${repo}/dispatches`);
const body = JSON.stringify({'event_type':'snapshot'});

const options = {
	method: 'POST',
	headers: {
		// 'Authorization': 'token ---',
		'Authorization': 'token ' + process.env.GITHUB_TOKEN,
		'accept': 'application/vnd.github.v3+json',
		'Content-Type': 'application/json',
		'Content-Length': Buffer.byteLength(body),
		'User-Agent': 'NextThought CLI Tools',
	}
};

http.request(url, options, res => {
	process.stdout.write('sent\n');

	let data = '';
	res.on('data', d => { data += d; });
	res.on('end', () => report(res, json(data)));
})
	.on('error', err => console.error(err))
	.end(body);


function report (res, data) {
	const {statusCode, statusMessage} = res;
	const fail = statusCode < 200 || statusCode >= 300;

	if(fail) {
		console.log(statusCode, statusMessage);
	}

	if (data) {
		console.log(data);
	}

	if (fail) {
		console.info('Maybe missing an auth token? GITHUB_TOKEN="%s"', process.env.GITHUB_TOKEN);
		process.exit(1);
	}
}
