/* eslint-disable promise/avoid-new */
// const assert = require('assert').strict;

const manager = {};
module.exports = manager;

const ErrorResponse = require(`./responses/ErrorResponse`);
const ScopeMissingError = require(`./errors/ScopeMissing`);
const InvalidTokenError = require(`./errors/InvalidToken`);
const NotFoundError = require(`./errors/NotFound`);

const ParameterMissing = require(`./errors/ParameterMissing`);
const ParameterInvalidValue = require(`./errors/ParameterInvalidValue`);

// const NetworkOfflineError = require('@titanium/errors/NetworkOffline');
// const UnauthorizedError = require('@titanium/errors/Unauthorized');

let debug = () => {};
if (process.env.DEBUG_MODE === `true`) {
	debug = (...args) => {
		console.debug(...args);
	};
}

manager.createErrorResponse = (err, logger = require(`./logger`).instance) => {
	logger.entering(`ErrorManager.createErrorResponse`);
	console.error(err);
	// console.debug(`err: ${JSON.stringify(err, null, 2)}`);

	logger.error({ message: err.message || `error occurred`, error: err });
	let success = false;
	let code;
	let status;
	let error;
	let error_description;
	let results;

	// console.debug(`err.message: ${JSON.stringify(err.message, null, 2)}`);

	// console.debug(`err instanceof UnauthorizedError: ${JSON.stringify(err instanceof UnauthorizedError, null, 2)}`);


	// console.debug(`typeof err: ${JSON.stringify(typeof err, null, 2)}`);

	if (err instanceof InvalidTokenError) {
		code = 401;
		error = `invalid_token`;
		error_description = err.message;
	} else if (err instanceof ParameterMissing) {
		code = 400;
		error = `parameter_missing`;
		error_description = err.message;
	} else if (err instanceof ParameterInvalidValue) {
		code = 400;
		error = `parameter_value_invalid`;
		error_description = err.message;
	} else if (err instanceof ScopeMissingError) {
		code = 403;
		error = `scope_missing`;
		error_description = err.message;
	} else if (err instanceof NotFoundError) {
		code = 404;
		error = `not_found`;
		error_description = `Entity not found`;
	// } else if (err instanceof UnauthorizedError) {
	} else if (err.name === `Unauthorized`) {
		code = 401;
		error = `unauthorized`;
		error_description = err.message;
	} else if (err.message === `Token expired`) {
		code = 401;
		error = `token_expired`;
		error_description = `Bearer token has expired`;
	} else if (err.message === `Signature verification failed`) {
		code = 401;
		error = `invalid_token`;
		error_description = `Bearer token is invalid`;
	} else if (err.reason && /^Invalid.*id$/.test(err.reason)) {
		code = 404;
		error = `not_found`;
		error_description = `Entity not found`;
	} else if (err.message === `Request returned with HTTP status code 400 Invalid CustomObject id or current user hasn't liked it`) {
		code = 201;
		success = true;
		// results = {};
	} else if (err.message === `Request returned with HTTP status code 400 User has already submitted a like for this custom_object`) {
		code = 201;
		success = true;
		// results = {};
	} else {
		code = 500;
		error = `server_error`;
		error_description = `An unknown error occurred while processing request.`;
		console.error(err);
	}

	return new ErrorResponse({ code, status, error, error_description, results });

	// return {
	// 	success,
	// 	status: code,
	// 	error,
	// 	error_description,
	// 	result,
	// };

};

