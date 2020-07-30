'use strict';
try {
	require('child_process').execSync('npx @nti/fix', {stdio: 'inherit'});
} catch {
	/* */
}
