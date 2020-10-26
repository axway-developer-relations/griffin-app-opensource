// eslint-disable-next-line no-global-assign
Promise = require(`bluebird`);

const dotenv = require(`dotenv`);
const path = require(`path`);
const _ = require(`lodash`);


dotenv.config();


/***********************************
 * Initialize API Builder
 ***********************************/
const APIBuilder = require(`@axway/api-builder-runtime`);
const { app } = APIBuilder.getGlobal();


/***********************************
 * Initialize Logging
 ***********************************/
const filename = __filename.substring(path.join(__dirname, `..`).length);
// eslint-disable-next-line no-underscore-dangle
const _logger = new app.locals.Logger({ filename });
_logger.trace(`module initialization`);

let debug = () => {};
if (process.env.DEBUG_MODE === `true`) {
	debug = (...args) => {
		console.debug(...args);
	};
}

class DatabaseManager {

	constructor({ provider, logger, config = {} }) {
		debug(`📌  you are here → DatabaseManager.constructor({ provider: ${provider}) }`);
		const dbProvider = new DatabaseManager.providers[provider](config);
		this.name = provider;

		const dbProviderPropertyNames = [ `entity_primary_key`, `entity_object_id`, `entity_object_created_at`, `entity_object_updated_at` ];
		for (const name of dbProviderPropertyNames) {
			this[name] = dbProvider[name];
		}

		this.getObjects = params => dbProvider.getObjects(params);
		this.addObject = params => dbProvider.addObject(params);
		this.getByObjectId = params => dbProvider.getByObjectId(params);
		this.getByEntityId = params => dbProvider.getByEntityId(params);
		this.updateByObjectId = params => dbProvider.updateByObjectId(params);
		this.deleteByObjectId = params => dbProvider.deleteByObjectId(params);
		this.deleteByEntityId = params => dbProvider.deleteByEntityId(params);
		this.upsertByEntityId = params => dbProvider.upsertByEntityId(params);

	}
}

DatabaseManager.providers = {};


DatabaseManager.addProvider = (name, provider) => {
	DatabaseManager.providers[name] = provider;
};

module.exports = DatabaseManager;
