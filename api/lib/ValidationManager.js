const _ = require(`lodash`);

const { ParameterEmpty, ParameterMissing  } = require(`./errors`);

let debug = () => {};
if (process.env.DEBUG_MODE === `true`) {
	debug = (...args) => {
		console.debug(...args);
	};
}


class BaseValidator {
	constructor(manager) {
		debug(`📌  you are here → BaseValidator.constructor()`);
		this.logger = manager.logger;
		this.manager = manager;
	}

	async validateParameters() {}
	async validateRequest() {}
	async validateResponse() {}
	async validateResponseEntity() {}

}

class ValidationManager {
	constructor(operation) {
		debug(`📌  you are here → ValidationManager.constructor()`);
		this.logger = operation.logger;
		this.operation = operation;

		let OperationValidator;
		let GlobalValidator;

		try {
			OperationValidator = require(`./validators/${operation.metadata.modelName}Validator`);
		} catch (error) {
			console.error(error);
			OperationValidator = BaseValidator;
		}

		try {
			GlobalValidator = require(`./validators/GlobalValidator`);
		} catch (error) {
			console.error(error);
			GlobalValidator = BaseValidator;
		}

		this.operationValidator = new OperationValidator(this);
		this.globalValidator = new GlobalValidator(this);

	}

	async validateRequest() {
		await this.globalValidator.validateRequest();
		await this.operationValidator.validateRequest();
	}

	async validateResponse(...args) {
		await this.globalValidator.validateResponse(...args);
		await this.operationValidator.validateResponse(...args);
	}

	async ensureParametersRequired(params, names = []) {
		if (!_.isArray(names)) {
			throw new Error(`Invalid array of property names.`);
		}
		names.forEach(name => {
			if (_.isEmpty(params[name])) {
				throw new ParameterMissing(name);
			}
		});
	}

	async ensureParametersNotEmpty(params, names = []) {
		if (!_.isArray(names)) {
			throw new Error(`Invalid array of property names.`);
		}
		names.forEach(name => {
			if (!_.isNil(params[name]) && _.isEmpty(_.trim(params[name]))) {
				throw new ParameterEmpty(name);
			}
		});
	}

}

ValidationManager.BaseValidator = BaseValidator;
module.exports = ValidationManager;
