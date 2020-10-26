/* eslint-disable no-underscore-dangle */
const _ = require(`lodash`);
const moment = require(`moment`);
const utils = require(`../utils`);
const Please = require(`@titanium/please`);

let debug = () => {};

console.debug(`🦠  process.env.DEBUG_MODE: ${JSON.stringify(process.env.DEBUG_MODE, null, 2)}`);

if ((process.env.DEBUG_MODE === `true`) || (process.env.DEBUG_MODE === true)) {
	console.debug(`📌  you are here → DEBUG_MODE === true`);
	debug = (...args) => {
		console.debug(...args);
	};
}

const DB_PRIMARY_KEY = `id`;
const DB_ENTITY_PRIMARY_KEY = `entity_id`;
const DB_CREATED_AT = `created_at`;
const DB_UPDATED_AT = `updated_at`;

const ENTITY_PRIMARY_KEY = `id`;
const ENTITY_OBJECT_ID = `object_id`;
const ENTITY_OBJECT_CREATED_AT = `object_created_at`;
const ENTITY_OBJECT_UPDATED_AT = `object_updated_at`;

const page_size = 1000;

class ArrowProvider {
	constructor({ server_url, apikey, session_id } = {}) {
		debug(`📌  you are here → ArrowProvider.constructor()`);

		// this.apikey = apikey;
		// this.session_id = session_id;
		server_url = utils.isBoolish(process.env.DEBUG_API_CALLS) && utils.isTrueish(process.env.DEBUG_API_CALLS) && process.env.DEBUG_API_URL ? process.env.DEBUG_API_URL : server_url;

		this.entity_primary_key = ENTITY_PRIMARY_KEY;
		this.entity_object_id = ENTITY_OBJECT_ID;
		this.entity_object_created_at = ENTITY_OBJECT_CREATED_AT;
		this.entity_object_updated_at = ENTITY_OBJECT_UPDATED_AT;

		this.please = new Please({
			baseUrl: server_url,
			timeout: 60000,
			params:  {
				key:         apikey,
				_session_id: session_id,
			},
		});

	}

	async updateByObjectId({ classname, object_id, entity }) {

		debug(`📌  you are here → ArrowProvider.updateByObjectId(${classname})`);

		delete entity[ENTITY_OBJECT_ID];
		delete entity[ENTITY_OBJECT_CREATED_AT];

		const incomingKeyMapping = { [ENTITY_PRIMARY_KEY]: DB_ENTITY_PRIMARY_KEY };

		const translatedEntity =  _.mapKeys(entity, (value, key) => {
			return incomingKeyMapping[key] || key;
		});

		const results = await this.please
			.params({ [DB_PRIMARY_KEY]: object_id })
			.form({ fields: JSON.stringify(translatedEntity) })
			.put(`${classname}/update.json`);

		// DEBUG: results
		// debug(`🦠  updateByObjectId.results: ${JSON.stringify(results, null, 2)}`);

		// return results;

		return this.getByObjectId({ classname, object_id });

	}

	// async upsertByEntityId({ classname, entity_id, entity }) {
	async upsertByEntityId({ classname, entity }) {

		const entity_id = entity[ENTITY_PRIMARY_KEY];
		debug(`📌  you are here → ArrowProvider.upsertByEntityId(${classname}:${entity_id})`);

		// entity_id = entity_id || entity[ENTITY_PRIMARY_KEY];
		const object_id = await this.getObjectIdByEntityId({ classname, entity_id });

		delete entity[ENTITY_OBJECT_ID];

		entity[ENTITY_PRIMARY_KEY] = entity_id;

		// console.debug(`🦠  ${classname}.object_id: ${JSON.stringify(object_id, null, 2)}`);

		// Upsert functionality
		if (_.isNil(object_id)) {
			return this.addObject({ classname, entity });
		}

		delete entity[ENTITY_OBJECT_CREATED_AT];
		return this.updateByObjectId({ classname, object_id, entity });
	}

	async deleteByObjectId({ classname, object_id, meta = {} }) {

		debug(`📌  you are here → ArrowProvider.deleteByObjectId(${classname}:${object_id})`);

		const results = await this.please
			.params({ [DB_PRIMARY_KEY]: object_id })
			.delete(`${classname}/delete.json`);

		// debug(`🦠  deleteByObjectId.results: ${JSON.stringify(results, null, 2)}`);

		if (results.json.meta.code === 400 && results.json.meta.message.startsWith(`One or more invalid object id`)) {
			return {
				meta: {
					code:   404,
					status: `Not found`,
				},
			};
		}

		_.defaults(meta, {
			code:   results.json.meta.code,
			status: results.json.meta.status,
		});

		return { meta };


	}

	async getObjectIdByEntityId({ classname, entity_id }) {
		debug(`📌  you are here → ArrowProvider.getObjectIdByEntityId(${classname}:${entity_id})`);

		const results = await this.please
			.params({ sel: `{"all":["id"]}`,  where: `{ "entity_id": "${entity_id}" }` })
			.get(`${classname}/query.json`);

		// DEBUG: getObjectIdByEntityId.results
		// debug(`🦠  getObjectIdByEntityId.results: ${JSON.stringify(results, null, 2)}`);

		const object_id = _.get(results, [ `json`, `response`, classname, 0, `id` ]);
		return object_id;
	}

	async getObjectByEntityId({ classname, entity_id }) {
		debug(`📌  you are here → ArrowProvider.getObjectByEntityId(${classname})`);

		const results = await this.please
			.params({ where: `{ "entity_id": "${entity_id}" }` })
			.get(`${classname}/query.json`);

		// DEBUG: getObjectByEntityId.results
		// debug(`🦠  getObjectByEntityId.results: ${JSON.stringify(results, null, 2)}`);

		const object = _.get(results, [ `json`, `response`, classname, 0 ]);
		return object;
	}

	async getObjectByObjectId({ classname, object_id }) {
		debug(`📌  you are here → ArrowProvider.getObjectByObjectId(${classname})`);

		const results = await this.please
			.params({ ids: object_id })
			.get(`${classname}/show.json`);

		// DEBUG: getObjectByEntityId.results
		// debug(`🦠  getObjectByObjectId.results: ${JSON.stringify(results, null, 2)}`);

		const object = _.get(results, [ `json`, `response`, classname, 0 ]);
		return object;
	}

	async deleteByEntityId({ classname, entity_id }) {

		debug(`📌  you are here → ArrowProvider.deleteByEntityId(${classname}:${entity_id})`);

		const object_id = await this.getObjectIdByEntityId({ classname, entity_id });

		if (_.isNil(object_id)) {
			return {
				meta: {
					code:   404,
					status: `Not found`,
				},
			};
		}

		const meta = { entity_id };

		return this.deleteByObjectId({ classname, object_id, meta });

	}

	async getObjects({ classname, limit = 2000, skip = 0, order, keys, excludeKeys, include, query, where }) {

		debug(`📌  you are here → ArrowProvider.getObjects(${classname})`);

		let whereQuery;
		if (where) {
			if (_.isString(where)) {
				try {
					where = JSON.parse(where);
				} catch (error) {
					console.error(where);
					console.error(error);
					return {
						meta: {
							code:    400,
							status:  `Not found`,
							message: `Invalid where parameter`,
						},
					};
				}

			}

			const incomingKeyMapping = { [ENTITY_PRIMARY_KEY]: DB_ENTITY_PRIMARY_KEY };

			const translatedWhere =  _.mapKeys(where, (value, key) => {
				return incomingKeyMapping[key] || key;
			});

			// console.debug(`🦠  where: ${JSON.stringify(where, null, 2)}`);

			whereQuery = JSON.stringify(translatedWhere);
			// console.debug(`🦠  whereQuery: ${whereQuery}`);
			debug(`🦠  whereQuery: ${whereQuery}`);

		}

		const total_count = await this._getCount({ classname, where: whereQuery });
		// console.debug(`🦠   total_count: ${JSON.stringify(total_count, null, 2)}`);

		if (! total_count) {

			return {
				success: true,
				meta:    {
					limit,
					skip,
					order,
					total:  0,
					code:   200,
					status: `ok`,
				},
				results: [],
			};
		}

		const keyMapping = {
			[ENTITY_PRIMARY_KEY]:    ENTITY_OBJECT_ID,
			[DB_ENTITY_PRIMARY_KEY]: ENTITY_PRIMARY_KEY,
			[DB_UPDATED_AT]:         ENTITY_OBJECT_UPDATED_AT,
			[DB_CREATED_AT]:         ENTITY_OBJECT_CREATED_AT,
		};

		const convertDateTime = value => {
			return moment(value).toISOString();
		};

		const valueMapping = {
			[DB_CREATED_AT]: convertDateTime,
			[DB_UPDATED_AT]: convertDateTime,
		};

		const total_results = [];
		// const total_limit = (limit < total_count) ? limit : total_count;
		const total_limit = Math.min(total_count, limit);
		const query_count = Math.ceil(total_limit / page_size);
		const query_concurrency_limit = 1;

		await Promise.map(_.range(query_count), async i => {

			const query_skip = skip + (i * page_size);
			const query_limit = Math.min(total_limit - (i * page_size), page_size);

			// console.debug(`🦠  query_skip: ${JSON.stringify(query_skip, null, 2)}`);
			// console.debug(`🦠  query_limit: ${JSON.stringify(query_limit, null, 2)}`);

			const query_response = 	await this.please
				.params({ limit: query_limit, skip: query_skip, order, sel: keys, unsel: excludeKeys, where: whereQuery, count: false })
				.params(query)
				.params({ new_pagination: false })
				.get(`${classname}/query.json`);
			const query_results = _.get(query_response, [ `json`, `response`, classname ], []);
			// console.debug(`🦠  query_results.length: ${JSON.stringify(query_results.length, null, 2)}`);
			total_results.push(...query_results);

		}, { concurrency: query_concurrency_limit });


		// const results = await this.please
		// 	.params({ limit, skip, order, sel: keys, unsel: excludeKeys, where: whereQuery, count: true })
		// 	.params(query)
		// 	.params({ new_pagination: false })
		// 	.get(`${classname}/query.json`);

		// debug(`🦠  getObjects.results: ${JSON.stringify(results.json.response, null, 2)}`);
		// debug(`🦠  getObjects.results.length: ${results.json.response[classname].length}`);
		debug(`🦠  total_results: ${total_results.length}`);

		return {
			success: true,
			meta:    {
				limit,
				skip,
				order,
				total:  total_results.length,
				code:   200,
				status: `ok`,
			},
			results: _.map(total_results, entity => {
				// console.debug(`entity: ${JSON.stringify(entity, null, 2)}`);
				const modified = _.mapValues(entity, (value, key) => {
					return valueMapping[key] ? valueMapping[key](value) : value;
				});

				delete modified.user_id;

				return _.mapKeys(modified, (value, key) => {
					return keyMapping[key] || key;
				});
			}),
		};
	}

	async getObjects_original({ classname, limit = 2000, skip = 0, order, keys, excludeKeys, include, query, where }) {

		debug(`📌  you are here → ArrowProvider.getObjects(${classname})`);

		let whereQuery;
		if (where) {
			if (_.isString(where)) {
				try {
					where = JSON.parse(where);
				} catch (error) {
					console.error(where);
					console.error(error);
					return {
						meta: {
							code:    400,
							status:  `Not found`,
							message: `Invalid where parameter`,
						},
					};
				}

			}

			const incomingKeyMapping = { [ENTITY_PRIMARY_KEY]: DB_ENTITY_PRIMARY_KEY };

			const translatedWhere =  _.mapKeys(where, (value, key) => {
				return incomingKeyMapping[key] || key;
			});

			whereQuery = JSON.stringify(translatedWhere);


			// DEBUG: whereQuery
			debug(`🦠  whereQuery: ${whereQuery}`);

		}


		// if (_.isObject(where)) {
		// 	whereQuery = JSON.stringify(where);
		// } else if (_.isString(where)) {
		// 	whereQuery = where;
		// }

		const results = await this.please
			.params({ limit, skip, order, sel: keys, unsel: excludeKeys, where: whereQuery, count: true })
			.params(query)
			.params({ new_pagination: false })
			.get(`${classname}/query.json`);

		// DEBUG: getObjects.results
		debug(`🦠  getObjects.results: ${JSON.stringify(results.json.response, null, 2)}`);

		// DEBUG: getObjects.results.length
		debug(`🦠  getObjects.results.length: ${results.json.response[classname].length}`);

		const keyMapping = {
			[ENTITY_PRIMARY_KEY]:    ENTITY_OBJECT_ID,
			[DB_ENTITY_PRIMARY_KEY]: ENTITY_PRIMARY_KEY,
			[DB_UPDATED_AT]:         ENTITY_OBJECT_UPDATED_AT,
			[DB_CREATED_AT]:         ENTITY_OBJECT_CREATED_AT,
		};

		const convertDateTime = value => {
			return moment(value).toISOString();
		};

		const valueMapping = {
			[DB_CREATED_AT]: convertDateTime,
			[DB_UPDATED_AT]: convertDateTime,
		};

		return {
			success: true,
			meta:    {
				limit,
				skip,
				order,
				total:  results.json.meta.count,
				code:   results.json.meta.code,
				status: results.json.meta.status,
			},
			results: _.map(results.json.response[classname], entity => {
				// console.debug(`entity: ${JSON.stringify(entity, null, 2)}`);
				const modified = _.mapValues(entity, (value, key) => {
					return valueMapping[key] ? valueMapping[key](value) : value;
				});

				delete modified.user_id;

				return _.mapKeys(modified, (value, key) => {
					return keyMapping[key] || key;
				});
			}),
		};
	}

	async getByObjectId2({ classname, object_id, keys, excludeKeys, include, query }) {
		debug(`📌  you are here → ArrowProvider.getByObjectId2(${classname})`);

		const results = await this.getObjects({ classname, keys, excludeKeys, query, include, where: { objectId: object_id } });

		// DEBUG: results
		debug(`🦠  results: ${JSON.stringify(results, null, 2)}`);

		return results;
	}

	async getByEntityId({ classname, entity_id, keys, excludeKeys, include, query }) {
		debug(`📌  you are here → ArrowProvider.getByEntityId(${classname})`);

		const results = await this.getObjects({ classname, keys, excludeKeys, include, query, where: { entity_id } });

		// DEBUG: getByEntityId.results
		debug(`🦠  getByEntityId.results: ${JSON.stringify(results, null, 2)}`);

		return results;
	}

	async getByObjectId({ classname, object_id, keys, excludeKeys, query }) {
		debug(`📌  you are here → ArrowProvider.getByObjectId(${classname})`);

		const results = await this.please
			.params({ sel: keys, unsel: excludeKeys, ids: object_id })
			.params(query)
			.get(`${classname}/show.json`);

		// DEBUG: results
		debug(`🦠  getByObjectId.results: ${JSON.stringify(results.json.response[classname], null, 2)}`);

		// DEBUG: results.length
		debug(`🦠  getByObjectId.results.length: ${results.json.response[classname].length}`);

		let response = [];
		let results_count = 0;

		if (results.json.meta.code !== 404) {

			const keyMapping = {
				[ENTITY_PRIMARY_KEY]:    ENTITY_OBJECT_ID,
				[DB_ENTITY_PRIMARY_KEY]: ENTITY_PRIMARY_KEY,
				[DB_UPDATED_AT]:         ENTITY_OBJECT_UPDATED_AT,
				[DB_CREATED_AT]:         ENTITY_OBJECT_CREATED_AT,
			};

			const convertDateTime = value => {
				return moment(value).toISOString();
			};

			const valueMapping = {
				[DB_CREATED_AT]: convertDateTime,
				[DB_UPDATED_AT]: convertDateTime,
			};

			response = _.map(results.json.response[classname], entity => {

				// convert any values that need changing
				const modified = _.mapValues(entity, (value, key) => {
					return valueMapping[key] ? valueMapping[key](value) : value;
				});

				delete modified.user_id;

				// convert any keys that need changing
				return _.mapKeys(modified, (value, key) => {
					return keyMapping[key] || key;
				});
			});

			results_count = 1;

		}

		return {
			success: true,
			meta:    {
				code:   results.json.meta.code,
				status: results.json.meta.status,
				total:  results_count,
			},
			results: response,
		};
	}

	async addObject({ classname, entity, query, skip_existing_check = false }) {
		debug(`📌  you are here → ArrowProvider.addObject(${classname})`);

		if (! skip_existing_check) {

			const object_id = await this.getObjectIdByEntityId({ classname, entity_id: entity[ENTITY_PRIMARY_KEY] });

			if (!_.isNil(object_id)) {
				return {
					success: false,
					meta:    {
						code:                 409,
						status:               `Already Exists`,
						[ENTITY_PRIMARY_KEY]: entity[ENTITY_PRIMARY_KEY],
						success:              false,
					},
				};
			}
		}

		const incomingKeyMapping = { [ENTITY_PRIMARY_KEY]: DB_ENTITY_PRIMARY_KEY };

		const translatedEntity =  _.mapKeys(entity, (value, key) => {
			return incomingKeyMapping[key] || key;
		});

		const results = await this.please
			.params(query)
			.form({ fields: JSON.stringify(translatedEntity) })
			// .debug()
			.post(`${classname}/create.json`);

		// DEBUG: addObject.results
		// debug(`🦠  addObject.results: ${JSON.stringify(results, null, 2)}`);

		const new_object_id = _.get(results, [ `json`, `response`, classname, 0, `id` ]);

		if (! new_object_id) {
			throw new Error(`Unknown error when creating entity`);
		}

		const new_object = await this.getObjectByObjectId({ classname, object_id: new_object_id });

		const keyMapping = {
			[ENTITY_PRIMARY_KEY]:    ENTITY_OBJECT_ID,
			[DB_ENTITY_PRIMARY_KEY]: ENTITY_PRIMARY_KEY,
			[DB_UPDATED_AT]:         ENTITY_OBJECT_UPDATED_AT,
			[DB_CREATED_AT]:         ENTITY_OBJECT_CREATED_AT,
		};

		const convertDateTime = value => {
			return moment(value).toISOString();
		};

		const valueMapping = {
			[DB_CREATED_AT]: convertDateTime,
			[DB_UPDATED_AT]: convertDateTime,
		};

		let modified = _.mapValues(new_object, (value, key) => {
			return valueMapping[key] ? valueMapping[key](value) : value;
		});

		modified =  _.mapKeys(modified, (value, key) => {
			return keyMapping[key] || key;
		});

		delete modified.user_id;

		return {
			success: true,
			meta:    {
				code:                 201,
				status:               `Created`,
				[ENTITY_PRIMARY_KEY]: modified[ENTITY_PRIMARY_KEY],
				success:              true,
			},
			results: [ modified ],
		};
	}

	async _getCount({ classname, where }) {
		debug(`📌  you are here → ArrowProvider.getCount(${classname})`);

		const results = await this.please
			.params({ where })
			.get(`${classname}/count.json`);

		// DEBUG: getCount.results
		// debug(`🦠  getCount.results: ${JSON.stringify(results, null, 2)}`);

		const count = _.get(results, [ `json`, `meta`, `count` ]);
		// DEBUG: count
		debug(`🦠  count: ${JSON.stringify(count, null, 2)}`);
		return count;
	}
}

module.exports = ArrowProvider;
