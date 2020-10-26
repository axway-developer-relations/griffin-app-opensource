const _ = require(`lodash`);
const crypto = require(`crypto`);
const moment = require(`moment`);
const DatabaseManager = require(`./DatabaseManager`);

let debug = () => {};
if (process.env.DEBUG_MODE === `true`) {
	debug = (...args) => {
		console.debug(...args);
	};
}

const create_new_entity_id = () => crypto.randomBytes(20).toString(`hex`);

class ApiManager {
	constructor() {
		debug(`📌  you are here → ApiManager.constructor()`);

		this.providers = {};
		_.forEach(ApiManager.apis, api => {
			api.entity_prefix = api.entity_prefix || ``;
			this[api.name] = {};

			this.providers[api.name] = this.providers[api.name] = _.isNil(this.providers[api.name])
				?  new DatabaseManager({ provider: api.provider, config: api.config })
				: this.providers[api.name];

			_.forEach(api.entities, entity => {
				this[api.name][entity.name] = {};
				_.forEach(entity.operations, operation => {
					this[api.name][entity.name].provider = this.providers[api.name];
					this[api.name][entity.name][operation] = this.generateOperation({
						provider:  this.providers[api.name],
						classname: api.entity_prefix + entity.name,
						operation,
					});
				});
			});
		});

		_.forEach(_.keys(ApiManager.entities), entityName => {
			this[entityName] = this[ApiManager.entities[entityName]][entityName];
		});
	}

	generateOperation({ classname, operation, provider }) {
		debug(`📌  you are here → ApiManager.generateOperation({ classname: ${classname}, operation: ${operation}, provider: ${provider.name} })`);
		switch (operation) {

			case `query`:
			case `getAll`:
				return ({ limit, skip, order, keys, excludeKeys, include, where } = {}) => {
					// debug('📌  you are here → ApiManager.generateOperation.getAll');
					return provider.getObjects({ classname, limit, skip, order, keys, excludeKeys, include, where });
				};

			case `getByObjectId`:
				return object_id => {
					// debug('📌  you are here → ApiManager.generateOperation.getByObjectId');
					return provider.getByObjectId({ classname,  object_id });
				};

			case `deleteByObjectId`:
				return object_id => {
					// debug('📌  you are here → ApiManager.generateOperation.deleteByObjectId');
					return provider.deleteByObjectId({ classname,  object_id });
				};

			case `deleteByEntityId`:
				return entity_id => {
					// debug('📌  you are here → ApiManager.generateOperation.deleteByEntityId');
					return provider.deleteByEntityId({ classname,  entity_id });
				};

			case `getByEntityId`:
				return (entity_id, { query } = {}) => {
					// debug('📌  you are here → ApiManager.generateOperation.getByEntityId');
					return provider.getByEntityId({ classname,  entity_id, query });
				};

			case `add`:
				return entity => {
					// debug('📌  you are here → ApiManager.generateOperation.add');

					checkNotNil(`entity`, entity);

					_.defaults(entity, {
						// id:                create_new_entity_id(),
						[provider.entity_primary_key]: create_new_entity_id(),
						entity_created_at:             moment(),
						entity_updated_at:             moment(),
					});

					return provider.addObject({ classname, entity });
				};

			case `upsertByEntityId`:
				// return ({ entity, entity_id }) => {
				return (entity, entity_id) => {
					// debug('📌  you are here → ApiManager.generateOperation.upsertByEntityId');

					checkNotNil(`entity`, entity);

					entity[provider.entity_primary_key] = entity_id || entity[provider.entity_primary_key] || create_new_entity_id();

					_.defaults(entity, {
						// id:                entity_id || create_new_entity_id(),
						entity_created_at: moment(),
					});

					entity.entity_updated_at = moment();

					// return provider.upsertByEntityId({ classname, entity, entity_id });
					return provider.upsertByEntityId({ classname, entity });
				};

			default:
				console.error(`🛑  Attempt to generate an invalid operation: ${operation}`);
				throw new Error(`Attempt to generate an invalid operation: ${operation}`);
		}

	}
}

const checkNotNil = (name, arg) => {
	if (_.isNil(arg)) {
		throw new Error(`Argument Null: ${name}`);
	}
};

ApiManager.config = ({ apis, entities } = {}) => {
	ApiManager.apis = apis;
	ApiManager.entities = entities;
};

module.exports = ApiManager;
