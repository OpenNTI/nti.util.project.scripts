'use strict';
try {
	require('child_process').execSync('npx --yes @nti/fix', {stdio: 'inherit'});
} catch {
	/* */
}
