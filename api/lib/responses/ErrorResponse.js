const _ = require(`lodash`);
class ErrorResponse  {
	constructor({ success = false, code = 500, status, error, error_description, results, meta = {} } = {}) {
		console.debug(`📌  you are here → ErrorResponse.constructor()`);

		this.success = success;
		this.meta = _.defaults({
			code,
			status: status || require(`http`).STATUS_CODES[code],
		}, meta);
		this.error = error;
		this.error_description = error_description;
		this.results = results;
	}
}

module.exports = ErrorResponse;
