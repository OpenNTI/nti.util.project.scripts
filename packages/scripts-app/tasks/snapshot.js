'use strict';
try {
	require('child_process').execSync('npx --ignore-existing @nti/snapshot', {stdio: 'inherit'});
} catch {
	/* */
}
