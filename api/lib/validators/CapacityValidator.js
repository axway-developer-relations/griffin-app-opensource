const _ = require(`lodash`);
const sugar = require(`sugar`);

const TurboValidator = require(`./TurboValidator`);
const { ParameterInvalidValue }  = require(`../errors`);

let debug = () => {};
if (process.env.DEBUG_MODE === `true`) {
	debug = (...args) => {
		console.debug(...args);
	};
}

class CapacityValidator extends TurboValidator {
	constructor(...args) {
		debug(`📌  you are here → CapacityValidator.constructor()`);
		super(...args);
	}

	async validateRequest() {
		await super.validateParameters();
		await this.validateParameters();
		await super.validateRequest();
	}

	async validateProperties(entity) {
		debug(`📌  you are here → CapacityValidator.validateProperties()`);

		const entity_id_name = this.manager.operation.api.capacities.provider.entity_primary_key;

		// These parameters are required
		this.manager.ensureParametersRequired(entity, [ `office_id` ]);

		entity.maximum = _.toInteger(entity.maximum);

		entity.start_day = _.toInteger(entity.start_day);
		if (!sugar.Number.range(202001, 2050366).contains(entity.start_day)) {
			throw new ParameterInvalidValue(`start_day`);
		}

		if (!_.isEmpty(entity.end_date)) {
			entity.end_date = _.toInteger(entity.end_date);
			if (! entity.end_date >= entity.start_day) {
				throw new ParameterInvalidValue(`end_date`);
			}
		}


		// Delete these parameters, if they are empty
		[ `start_time`, `end_time` ].forEach(param => {
			if (_.isEmpty(entity[param])) {
				delete entity[param];
			}
		});

		const entity_id = entity.id || `000000000000000000`;

		const existingEntities = await this.manager.operation.api.capacities.getAll({
			where: {
				start_day: { $lt: entity.start_day },
				office_id: entity.office_id,
				$or:       [
					{ end_day: { $exists: false } },
					{ end_day: { $gte: entity.start_day } },
				],
				id: { $ne: entity_id },
			},
		});

		// console.debug(`🦠  existingEntities: ${JSON.stringify(existingEntities, null, 2)}`);

		const existingEntityCount = _.isArray(existingEntities.results) ? _.get(existingEntities, `results.length`, 0) : 0;

		if (existingEntityCount > 0) {
			// throw new ParameterInvalidValue('day -- Capacity already exists for this day');

			const [ existingEntity ] = existingEntities.results;
			existingEntity.end_day = entity.start_day - 1;
			const updateResult = await this.manager.operation.api.capacities.upsertByEntityId(existingEntity);
			// console.warn(`🦠  updateResult: ${JSON.stringify(updateResult, null, 2)}`);

		}

		const future_end_date = entity.end_day || 99999999999;

		const futureEntities = await this.manager.operation.api.capacities.getAll({
			where: {
				office_id: entity.office_id,
				start_day: {
					$gte: entity.start_day,
					$lte: future_end_date,
				},
				// $and:      [
				// 	{ start_day: { $gte: entity.start_day } },
				// 	{ start_day: { $lte: future_end_date } },
				// ],
				$or: [
					{ end_day: { $exists: false } },
					{ end_day: { $lte: future_end_date } },
				],
				id: { $ne: entity_id },
			},
		});

		// console.debug(`🦠  params.start_day: ${JSON.stringify(params.start_day, null, 2)}`);
		// console.debug(`🦠  params.end_day: ${JSON.stringify(params.end_day, null, 2)}`);
		// console.error(`🦠  futureEntities.results: ${JSON.stringify(futureEntities.results, null, 2)}`);

		const futureEntityCount = _.isArray(futureEntities.results) ? _.get(futureEntities, `results.length`, 0) : 0;

		if (futureEntityCount > 0) {

			for (const entity of futureEntities.results) {
				const deleteResult = await this.manager.operation.api.capacities.deleteByEntityId(entity[entity_id_name]);
				// console.warn(`🦠  deleteResult: ${JSON.stringify(deleteResult, null, 2)}`);
			}


		}


	}

	async validateParameters() {
		debug(`📌  you are here → CapacityValidator.validateParameters()`);

		const { params, body } = this.manager.operation.request;

		switch (this.manager.operation.metadata.actionName) {

			case `add-one-or-many`:

				if (_.isArray(body)) {
					for (const entity of body) {
						await this.validateProperties(entity);
					}
				} else {
					await this.validateProperties(params);
				}

				break;

			case `add-many`:

				if (_.isArray(body)) {
					for (const entity of body) {
						await this.validateProperties(entity);
					}
				}

				break;

			case `add-one`:
			case `upsert-one`:

				await this.validateProperties(params);

				break;

			default:

				// // These parameters are required
				// this.manager.ensureParametersRequired(params, [ 'office_id' ]);

				// params.maximum = _.toInteger(params.maximum);

				// params.start_day = _.toInteger(params.start_day);
				// if (!sugar.Number.range(202001, 2050366).contains(params.start_day)) {
				// 	throw new ParameterInvalidValue('start_day');
				// }

				// if (!_.isEmpty(params.end_date)) {
				// 	params.end_date = _.toInteger(params.end_date);
				// 	if (! params.end_date >= params.start_day) {
				// 		throw new ParameterInvalidValue('end_date');
				// 	}
				// }


				// // Delete these parameters, if they are empty
				// [ 'start_time', 'end_time' ].forEach(param => {
				// 	if (_.isEmpty(params[param])) {
				// 		delete params[param];
				// 	}
				// });

				// const entity_id = params.id || '000000000000000000';

				// const existingEntities = await this.manager.operation.api.capacities.getAll({
				// 	where: {
				// 		start_day: { $lt: params.start_day },
				// 		office_id: params.office_id,
				// 		$or:       [
				// 			{ end_day: { $exists: false } },
				// 			{ end_day: { $gte: params.start_day } },
				// 		],
				// 		id: { $ne: entity_id },
				// 	},
				// });

				// // console.debug(`🦠  existingEntities: ${JSON.stringify(existingEntities, null, 2)}`);

				// const existingEntityCount = _.isArray(existingEntities.results) ? _.get(existingEntities, 'results.length', 0) : 0;

				// if (existingEntityCount > 0) {
				// 	// throw new ParameterInvalidValue('day -- Capacity already exists for this day');

				// 	const [ existingEntity ] = existingEntities.results;
				// 	existingEntity.end_day = params.start_day - 1;
				// 	const updateResult = await this.manager.operation.api.capacities.upsertByEntityId(existingEntity);
				// 	// console.warn(`🦠  updateResult: ${JSON.stringify(updateResult, null, 2)}`);

				// }

				// const future_end_date = params.end_day || 99999999999;

				// const futureEntities = await this.manager.operation.api.capacities.getAll({
				// 	where: {
				// 		office_id: params.office_id,
				// 		start_day: {
				// 			$gte: params.start_day,
				// 			$lte: future_end_date,
				// 		},
				// 		// $and:      [
				// 		// 	{ start_day: { $gte: params.start_day } },
				// 		// 	{ start_day: { $lte: future_end_date } },
				// 		// ],
				// 		$or: [
				// 			{ end_day: { $exists: false } },
				// 			{ end_day: { $lte: future_end_date } },
				// 		],
				// 		id: { $ne: entity_id },
				// 	},
				// });

				// // console.debug(`🦠  params.start_day: ${JSON.stringify(params.start_day, null, 2)}`);
				// // console.debug(`🦠  params.end_day: ${JSON.stringify(params.end_day, null, 2)}`);
				// // console.error(`🦠  futureEntities.results: ${JSON.stringify(futureEntities.results, null, 2)}`);

				// const futureEntityCount = _.isArray(futureEntities.results) ? _.get(futureEntities, 'results.length', 0) : 0;

				// if (futureEntityCount > 0) {

				// 	for (const entity of futureEntities.results) {
				// 		// console.debug(`🦠  entity: ${JSON.stringify(entity, null, 2)}`);
				// 		// console.debug(`🦠  entity.id: ${JSON.stringify(entity[entity_id_name], null, 2)}`);
				// 		const deleteResult = await this.manager.operation.api.capacities.deleteByEntityId(entity[entity_id_name]);
				// 		// console.warn(`🦠  deleteResult: ${JSON.stringify(deleteResult, null, 2)}`);
				// 	}


				// }

			// 	break;

			// default:
		}
	}


	async validateResponse(response) {
		await super.validateResponse(response);

		switch (this.manager.operation.metadata.actionName) {

			case `get-all`:

				if (response.success && _.isArray(response.results)) {
					for (const entity of response.results) {
						await this.validateResponseEntity(entity);
					}
				}

				break;

			default:

		}
	}

	async validateResponseEntity(entity) {

		await super.validateResponseEntity(entity);

	}

}

module.exports = CapacityValidator;
