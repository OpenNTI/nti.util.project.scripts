'use strict';
try {
	require('child_process').execSync('npx --yes @nti/release', {stdio: 'inherit'});
} catch {
	/* */
}
