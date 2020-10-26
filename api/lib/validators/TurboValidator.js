const _ = require(`lodash`);
const ValidationManager = require(`../ValidationManager`);
const CacheManager = require(`../CacheManager`);
const TokenManager = require(`../TokenManager`);

const { InvalidToken, NotFound } = require(`../errors`);

let debug = () => {};
if (process.env.DEBUG_MODE === `true`) {
	debug = (...args) => {
		console.debug(...args);
	};
}

class TurboValidator extends ValidationManager.BaseValidator {
	constructor(...args) {
		debug(`📌  you are here → TurboValidator.constructor()`);
		super(...args);
	}

	async validateRequest() {
		debug(`📌  you are here → TurboValidator.validateRequest()`);
	}

	async validateResponse() {}

	async validateResponseEntity(entity = {}) {
		entity.object_created_at = undefined;
		entity.object_updated_at = undefined;
		entity.object_id = undefined;

	}

	async validateToken() {
		debug(`📌  you are here → TurboValidator.validateToken()`);

		this.manager.operation.authToken = await TokenManager.validate(this.manager.operation.request);

		console.error(this.manager.operation.authToken);
		const email = _.get(this.manager.operation, `authToken.user.email`);
		const subject_id = _.get(this.manager.operation, `authToken.user.subject_id`);
		if (!email) {
			throw new InvalidToken();
		}

		this.manager.operation.me = CacheManager.user_emails.get(email);

		// console.error(`🦠  this.manager.operation.me: ${JSON.stringify(this.manager.operation.me, null, 2)}`);

		if (!this.manager.operation.me || (this.manager.operation.me.subject_id !== subject_id)) {

			console.warn(`🔻  cache entry not found for user: ${email}`);
			let result = await this.manager.operation.api.employees.getAll({ where: { email } });

			let entity = result.results[0];

			if (_.isNil(entity)) {
				throw new NotFound();
			}

			if (entity.subject_id !== subject_id) {
				entity.subject_id = subject_id;
				result = await this.manager.operation.api.employees.upsertByEntityId(entity);
				[ entity ] = result.results;

				if (_.isNil(entity)) {
					throw new NotFound();
				}
			}

			this.manager.operation.me = {
				id:         entity.id,
				name:       entity.formatted_name,
				email:      entity.email,
				// anonymous: !!entity.anonymous,
				anonymous:  _.isNil(entity.anonymous) ? true : !!entity.anonymous,
				subject_id: entity.subject_id,
			};

			// console.error(`🦠  this.manager.operation.me: ${JSON.stringify(this.manager.operation.me, null, 2)}`);

			CacheManager.user_emails.set(entity.email, this.manager.operation.me);
			CacheManager.user_ids.set(entity.id, this.manager.operation.me);


		}

		console.error(`🦠  this.manager.operation.me: ${JSON.stringify(this.manager.operation.me, null, 2)}`);

	}


	async validateParameters() {
		debug(`📌  you are here → TurboValidator.validateParameters()`);

		const { params } = this.manager.operation.request;
		const { where } = this.manager.operation.url.query;

		// console.error(`🦠  params.where: ${JSON.stringify(params.where, null, 2)}`);

		if (where) {
			if (_.isString(where)) {
				try {
					params.where = JSON.parse(where);
				} catch (error) {
					console.error(where);
					console.error(error);
				}
			}
		} else {
			params.where = {};
		}

		params.limit = +params.limit ? +params.limit : undefined;
		params.skip = +params.skip ? +params.skip : undefined;


		// console.debug(`🦠  this.manager.operation.metadata.actionName: ${JSON.stringify(this.manager.operation.metadata.actionName, null, 2)}`);

		switch (this.manager.operation.metadata.actionName) {

			case `get-me`:
				await this.validateToken();
				break;

			default:

		}

	}

}

module.exports = TurboValidator;
