'use strict';
try {
	require('child_process').execSync('npx --yes -p @nti/release release', {stdio: 'inherit'});
} catch {
	/* */
}
