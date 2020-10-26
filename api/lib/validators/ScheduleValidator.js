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

class ScheduleValidator extends TurboValidator {
	constructor(...args) {
		debug(`📌  you are here → ScheduleValidator.constructor()`);
		super(...args);

		this.today = _.toInteger(moment().format(`YYYYDDDD`));
	}

	async validateRequest() {
		console.debug(`📌  you are here → ScheduleValidator.validateRequest()`);
		await super.validateParameters();
		await this.validateParameters();
		await super.validateRequest();
	}


	//TODO:  Create the where clause based on the optional parameters and send that back to make the API more generic

	async validateResponseEntity(entity) {

		await super.validateResponseEntity(entity);
		const user = CacheManager.user_ids.get(entity.employee_id) || {};
		entity.employee_name = user.anonymous ? `Anonymous Employee` : user.name || `Unknown Employee`;
		entity.employee_id = undefined;

	}


	async validateResponse(response) {
		if (response.success && _.isArray(response.results)) {
			for (const entity of response.results) {
				await this.validateResponseEntity(entity);
			}
		}
	}

	async validateParameters() {

		debug(`📌  you are here → ScheduleValidator.validateParameters()`);

		const { params } = this.manager.operation.request;

		switch (this.manager.operation.metadata.actionName) {

			case `get-me`:
			case `get-all`:
				const { start_day = this.today } = this.manager.operation.url.query;

				_.defaults(
					params.where,
					{
						day:
						{ $gte: _.toInteger(start_day) },
					});

				// console.error(`🦠  params.where: ${JSON.stringify(params.where, null, 2)}`);

				break;

			case `add-one`:


				// These parameters are required
				this.manager.ensureParametersRequired(params, [ `employee_id`, `office_id` ]);

				params.day = _.toInteger(params.day);
				if (!sugar.Number.range(20201, 2050366).contains(params.day)) {
					throw new ParameterInvalidValue(`day`);
				}

				// Delete these parameters, if they are empty
				[ `start_time`, `end_time` ].forEach(param => {
					if (_.isEmpty(params[param])) {
						delete params[param];
					}
				});

				const existing = await this.manager.operation.api.schedules.getAll({
					where: {
						day:         params.day,
						employee_id: params.employee_id,
						office_id:   params.office_id,
					},
				});

				const existingCount = _.isArray(existing.results) ? _.get(existing, `results.length`, 0) : 0;

				if (existingCount > 0) {
					throw new ParameterInvalidValue(`day -- Schedule already exists for this user/office/day`);
				}

				break;

			default:
		}
	}

}

module.exports = ScheduleValidator;
