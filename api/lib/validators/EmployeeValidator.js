const _ = require(`lodash`);

const TurboValidator = require(`./TurboValidator`);
const CacheManager = require(`../CacheManager`);

let debug = () => {};
if (process.env.DEBUG_MODE === `true`) {
	debug = (...args) => {
		console.debug(...args);
	};
}

class EmployeeValidator extends TurboValidator {
	constructor(...args) {
		debug(`📌  you are here → EmployeeValidator.constructor()`);
		super(...args);
	}

	async validateRequest() {
		console.debug(`📌  you are here → EmployeeValidator.validateRequest()`);
		await super.validateParameters();
		await this.validateParameters();
		await super.validateRequest();
	}

	async validateParameters() {

		const { params } = this.manager.operation.request;

		switch (this.manager.operation.metadata.actionName) {

			case `add-one`:

				// These parameters are required
				this.manager.ensureParametersRequired(params, [ `first_name`, `last_name`, `email`, `formatted_name` ]);

				// These parameters should not be empty
				this.manager.ensureParametersNotEmpty(params, [ `manager_name`, `jive_id`, `jive_refreshed`, `exchange_refreshed`, `username`, `office_id`, `job_title` ]);

				break;

			default:
		}
	}

	async validateResponseEntity(entity) {

		await super.validateResponseEntity(entity);

		entity.tags = entity.tags || [];
		entity.anonymous =  _.isNil(entity.anonymous) ? true : !!entity.anonymous;

		if (this.manager.operation.url.query.refresh || this.manager.operation.metadata.actionName === `upsert-one`) {

			const user = {
				id:         entity.id,
				name:       entity.formatted_name,
				email:      entity.email,
				// anonymous: !!entity.anonymous,
				anonymous:  entity.anonymous,
				subject_id: entity.subject_id,
			};

			CacheManager.user_emails.set(entity.email, user);
			CacheManager.user_ids.set(entity.id, user);

		}

		[ `manager_name`, `jive_id`, `jive_refreshed`, `exchange_refreshed`, `job_title`, `department` ].forEach(prop => entity[prop] = undefined);

		entity.avatar = `https://resources.axway.dev/avatars/${entity.id}.jpg`;
	}

	async validateResponse(response) {
		await super.validateResponse(response);

		if (response.success && _.isArray(response.results)) {
			for (const entity of response.results) {
				await this.validateResponseEntity(entity);
			}
		}

	}

}

module.exports = EmployeeValidator;
