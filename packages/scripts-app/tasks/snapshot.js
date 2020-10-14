'use strict';
try {
	require('child_process').execSync('npx --yes -p @nti/snapshot snapshot', {stdio: 'inherit'});
} catch {
	/* */
}
