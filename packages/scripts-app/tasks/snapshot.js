'use strict';
try {
	require('child_process').execSync('npx --yes @nti/snapshot', {stdio: 'inherit'});
} catch {
	/* */
}
