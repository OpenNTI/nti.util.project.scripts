'use strict';
try {
	require('child_process').execSync('npx --ignore-existing @nti/fix', {stdio: 'inherit'});
} catch {
	/* */
}
