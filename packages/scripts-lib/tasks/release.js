'use strict';
try {
	require('child_process').execSync('npx @nti/release', {stdio: 'inherit'});
} catch {
	/* */
}
