'use strict';

/** The plugin's identifier */
exports.id = 'turbo';
exports.version = '1.0';

/** The Titanium CLI version that this hook is compatible with */
exports.cliVersion = '>=3.2';

const fs = require('fs');
const path = require('path');

const localTurboPath = path.join('.', 'node_modules', '.bin', 'turbo2');
const localAlloyPath = path.join('.', 'node_modules', '.bin', 'alloy');

if (fs.existsSync(localTurboPath)) {
	console.log(`Found local Turbo path: ${localTurboPath}`);
	process.env.ALLOY_PATH = localTurboPath;
} else if (fs.existsSync(localAlloyPath)) {
	console.log(`Found local Alloy path: ${localAlloyPath}`);
	process.env.ALLOY_PATH = localAlloyPath;
}
