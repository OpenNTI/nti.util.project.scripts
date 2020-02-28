/* eslint-disable camelcase, import/no-commonjs */
'use strict';
const sodium = require('tweetsodium');
const run = require('./run');
const status = require('./status');

module.exports = async function setSecret (name, value, repo) {
	const resolve = repo == null;
	repo = repo || '{owner}/{repo}';

	status(`Setting secret ${name}${resolve ? '' : ' on ' + repo}`);
	const { key, key_id } = JSON.parse(await run(`hub api repos/${repo}/actions/secrets/public-key`));

	// Convert the message and key to Uint8Array's (Buffer implements that interface)
	const messageBytes = Buffer.from(value);
	const keyBytes = Buffer.from(key, 'base64');

	// Encrypt using LibSodium.
	const encryptedBytes = sodium.seal(messageBytes, keyBytes);

	// Base64 the encrypted secret
	const encrypted = Buffer.from(encryptedBytes).toString('base64');

	await run(`hub api -X PUT --flat /repos/${repo}/actions/secrets/${name} --raw-field 'encrypted_value=${encrypted}' --raw-field 'key_id=${key_id}'`);

	// return { repo, ...JSON.parse(await run(`hub api /repos/${repo}/actions/secrets`)) };
	return {
		repo,
		set: name
	};
};
