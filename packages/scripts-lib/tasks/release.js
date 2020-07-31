'use strict';
try {
	require('child_process').execSync('npx --ignore-existing @nti/release', {stdio: 'inherit'});
} catch {
	/* */
}
