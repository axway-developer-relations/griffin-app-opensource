const _ = require(`lodash`);

const TurboValidator = require(`./TurboValidator`);
const { ParameterInvalidValue }  = require(`../errors`);

let debug = () => {};
if (process.env.DEBUG_MODE === `true`) {
	debug = (...args) => {
		console.debug(...args);
	};
}

class OfficeValidator extends TurboValidator {
	constructor(...args) {
		debug(`📌  you are here → OfficeValidator.constructor()`);
		super(...args);
	}

	async validateRequest() {
		await super.validateParameters();
		await this.validateParameters();
		await super.validateRequest();
	}

	async validateParameters() {
		const { params } = this.manager.operation.request;

		switch (this.manager.operation.metadata.actionName) {

			case `add-one`:

				// These parameters should not be empty
				[ `name`, `timezone` ].forEach(param => {
					if (_.isEmpty(params[param])) {
						throw new ParameterInvalidValue(param);
					}
				});

				// These parameters are required
				this.manager.ensureParametersRequired(params, [ `name`, `timezone` ]);

				// These parameters should not be empty
				this.manager.ensureParametersNotEmpty(params, [ `address`, `address2`, `city`, `state`, `country` ]);

				params.max_capacity = _.toInteger(params.max_capacity);

				break;

			default:
		}
	}


	async validateResponse(response) {
		await super.validateResponse(response);

		// switch (this.manager.operation.metadata.actionName) {

		// 	case 'get-all':

		if (response.success && _.isArray(response.results)) {
			for (const entity of response.results) {
				await this.validateResponseEntity(entity);
			}
		}

		// 		break;

		// 	default:

		// }
	}

	async validateResponseEntity(entity) {

		await super.validateResponseEntity(entity);
		entity.tags = entity.tags || [];
	}


}

module.exports = OfficeValidator;
