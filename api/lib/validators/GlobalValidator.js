const _ = require(`lodash`);
const ValidationManager = require(`../ValidationManager`);

let debug = () => {};
if (process.env.DEBUG_MODE === `true`) {
	debug = (...args) => {
		console.debug(...args);
	};
}

class GlobalValidator extends ValidationManager.BaseValidator {
	constructor(...args) {
		debug(`📌  you are here → GlobalValidator.constructor()`);
		super(...args);
	}

	async validateRequest() {
		await this.validateParameters();
	}

	async validateParameters() {
		const { params } = this.manager.operation.request;

		switch (this.manager.operation.metadata.actionName) {

			case `add-one`:

				// These parameters should not be empty
				// [ 'id' ].forEach(param => {
				// 	if (_.isEmpty(params[param])) {
				// 		throw new ParameterInvalidValue(param);
				// 	}
				// });

				// Delete these parameters, if they are empty
				[ `entity_created_at`, `entity_updated_at` ].forEach(param => {
					if (_.isEmpty(params[param])) {
						delete params[param];
					}
				});

				break;

			default:
		}
	}

}

module.exports = GlobalValidator;
