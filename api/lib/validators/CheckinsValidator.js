const _ = require(`lodash`);
const sugar = require(`sugar`);
const moment = require(`moment`);

const TurboValidator = require(`./TurboValidator`);
const CacheManager = require(`../CacheManager`);

const { ParameterInvalidValue } = require(`../errors`);

let debug = () => {};
if (process.env.DEBUG_MODE === `true`) {
	debug = (...args) => {
		console.debug(...args);
	};
}

class CheckinsValidator extends TurboValidator {
	constructor(...args) {
		debug(`📌  you are here → CheckinsValidator.constructor()`);
		super(...args);

		this.today = _.toInteger(moment().format(`YYYYDDDD`));
	}

	async validateRequest() {
		console.debug(`📌  you are here → CheckinsValidator.validateRequest()`);
		await super.validateParameters();
		await this.validateParameters();
		await super.validateRequest();
	}

	async validateParameters() {

		debug(`📌  you are here → CheckinsValidator.validateParameters()`);

		const { params } = this.manager.operation.request;

		switch (this.manager.operation.metadata.actionName) {

			case `add-one`:


				// These parameters are required
				this.manager.ensureParametersRequired(params, [ `employee_id`, `office_id` ]);


				if (!params.checkin_time) {
					params.checkin_time = new Date().toISOString();
					params.day = moment(params.checkin_time).format(`YYYYDDDD`);
				}


				if (!params.day) {
					params.day = moment(params.checkin_time).format(`YYYYDDDD`);
				}

				params.day = _.toInteger(params.day);
				if (!sugar.Number.range(20201, 2050366).contains(params.day)) {
					throw new ParameterInvalidValue(`day`);
				}

				break;

			default:
		}
	}

}

module.exports = CheckinsValidator;
