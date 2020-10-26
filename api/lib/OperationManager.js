const _ = require(`lodash`);
const LoggingManager = require(`./LoggingManager`);
const ValidationManager = require(`./ValidationManager`);
const pkg = require(`../package.json`);
const url = require(`url`);


let debug = () => {};
if (process.env.DEBUG_MODE === `true`) {
	debug = (...args) => {
		console.debug(...args);
	};
}

class OperationManager {
	constructor({ operationId, metadata, logger, request, response, next, api }) {
		debug(`📌  you are here → ValidationManager.constructor()`);

		this.operationId = operationId;
		this.metadata = metadata;
		this.logger = logger;
		this.request = request;
		this.response = response;
		this.next = next;
		this.api = api;
		this.url = url.parse(request.url, true);

		LoggingManager.handleRequest(logger, request);
		response.response.set(`api-version`, pkg.version);

		this.validator = new ValidationManager(this);

	}

	async validateRequest() {
		debug(`📌  you are here → ValidationManager.validateRequest()`);
		return await this.validator.validateRequest();
	}

	async validateResponse(...args) {
		debug(`📌  you are here → ValidationManager.validateResponse()`);
		return await this.validator.validateResponse(...args);
	}


}

module.exports = OperationManager;
