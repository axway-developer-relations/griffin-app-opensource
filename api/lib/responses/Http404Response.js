const ErrorResponse = require(`./ErrorResponse`);

class Http404Response extends ErrorResponse  {
	constructor({ error = `not_found`, error_description = `Entity not found`, results, meta = {} } = {}) {
		console.debug(`📌  you are here → Http404.constructor()`);
		super({ error, error_description, code: 404, results, meta });
	}
}

module.exports = Http404Response;
