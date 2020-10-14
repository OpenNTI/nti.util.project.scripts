'use strict';
try {
	require('child_process').execSync('npx --yes -p @nti/fix fix', {stdio: 'inherit'});
} catch {
	/* */
}
