
const _ = require(`lodash`);

const utils = {};
module.exports = utils;

utils.isTrueish = test => {

	if (_.isNil(test)) {
		return false;
	}

	const yeswords = [
		`yes`,
		`y`,
		`true`,
		`t`,
		`1`,
		`on`,
		`ok`,
	];
	const testword = test.toString().toLowerCase();
	return yeswords.indexOf(testword) !== -1;
};

utils.isBoolish = test => {

	if (_.isNil(test)) {
		return false;
	}

	const words = [
		`yes`,
		`y`,
		`true`,
		`t`,
		`1`,
		`on`,
		`ok`,
		`no`,
		`n`,
		`false`,
		`f`,
		`0`,
		`off`,
	];
	const testword = test.toString().toLowerCase();
	return words.indexOf(testword) !== -1;
};


utils.tryParseInt = (str, defaultValue) => {
	let retValue = parseInt(str);
	if (isNaN(retValue)) {
		retValue = defaultValue;
	}

	return retValue;
};

utils.tryParseFloat = (str, defaultValue) => {
	let retValue = parseFloat(str);
	if (isNaN(retValue)) {
		retValue = defaultValue;
	}

	return retValue;
};

utils.isFloat = n => {
	return Number(n) === n && n % 1 !== 0;
};


utils.decimalPlaces = num => {
	const match = (`${num}`).match(/(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/);
	if (!match) {
		return 0;
	}
	return Math.max(
		0,
		// Number of digits right of decimal point.
		(match[1] ? match[1].length : 0)
		// Adjust for scientific notation.
		-		(match[2] ? +match[2] : 0));
};

// _.assignIn(_, utils);
