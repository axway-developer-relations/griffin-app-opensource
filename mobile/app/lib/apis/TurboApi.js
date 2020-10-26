const Alloy = require(`/alloy`);
const Please = require(`@titanium/please`);
const Collection = Backbone.Collection.extend({});
const logger = require(`@geek/logger`).createLogger(`app:api`, { meta: { filename: __filename } });

const Cache = require(`@geek/cache`);
const cache = {};
cache.query = new Cache({ name: `api_query`, ttl: Cache.ONE_WEEK, store: `titanium-properties` });
cache.mine = new Cache({ name: `api_mine`, ttl: Cache.ONE_WEEK, store: `titanium-properties` });

_.set(turbo, `app.data.hash`, _.get(turbo, `app.data.hash`, {}));

const module_name = `TurboApi`;

class TurboApi {
	constructor({ baseUrl, apikey, name, classname = name, collection: collectionName = name, ttl = {}, timeout = 60000 } = {}) {
		logger.track(`📌  You are here → ${module_name}.constructor({${name}})`);

		this.name = name;
		this.classname = classname;
		this.collectionName = collectionName;
		this.ttl = ttl;

		this.please = new Please({
			baseUrl,
			timeout,
			headers: { apikey },
			bearer:  () => {
				return _.get(turbo, `authentication.token.access_token`);
			},
		});

		this.collection = Alloy.Collections[collectionName] = Alloy.Collections[collectionName] || new Collection();
		turbo.app.data[name] = [];

	}

	async query({ params = {}, force = false } = {}) {

		logger.track(`📌  you are here → ${module_name}.query(${this.name})`);

		// if not force and item exists in cache, check to see if we already have it
		if (!force && this.ttl.query && await cache.query.has(this.name)) {
			const response =  await cache.query.entry(this.name);
			logger.verbose(`🦠  ${this.name}.query() cached response: ${JSON.stringify(response, null, 2)}`);
			const results = response.value;

			// if the saved item is different, update the collection again
			if (turbo.app.data.hash[this.name] !== response.hash) {
				turbo.app.data.hash[this.name] = response.hash;
				turbo.app.data[this.name] = results;
				this.collection.reset(results);
				this.collection.trigger(`fetch`);
			}
			return results;
		}

		if (force) {
			this.please.header(`Cache-Control`, `no-store, no-cache, must-revalidate, proxy-revalidate`);
			this.please.header(`Pragma`, `no-cache`);
			this.please.header(`Expires`, 0);
			this.please.header(`Surrogate-Control`, `no-store`);
		}

		const response = await this.please
			.debug(turbo.API_VERBOSE_MODE)
			.get(this.classname);

		logger.verbose(`🦠  ${this.name}.query() response: ${JSON.stringify(response, null, 2)}`);

		const { results } = response.json;

		if (this.ttl.query) {
			const hash = await cache.query.set(this.name, results, this.ttl.query);
			// logger.debug(`🦠  turbo.app.data.hash[${this.name}]: ${JSON.stringify(turbo.app.data.hash[this.name], null, 2)}`);
			// logger.debug(`🦠  new hash: ${JSON.stringify(hash, null, 2)}`);
			if (turbo.app.data.hash[this.name] !== hash) {
				turbo.app.data.hash[this.name] = hash;
				turbo.app.data[this.name] = results;
				this.collection.reset(results);
				this.collection.trigger(`fetch`);
			}
		} else {
			turbo.app.data[this.name] = results;
			this.collection.reset(results);
			this.collection.trigger(`fetch`);
		}

		logger.debug(`🦠  ${this.name}.query() count: ${JSON.stringify(results.length, null, 2)}`);
		return results;

	}

	async getById(id) {

		logger.track(`📌  you are here → ${module_name}.getById(${this.name}:${id})`);

		const response = await this.please
			.debug(turbo.API_VERBOSE_MODE)
			.get(`${this.classname}/${id}`);

		logger.verbose(`🦠  ${this.name}.getById() response: ${JSON.stringify(response, null, 2)}`);

		const { results } = response.json;

		logger.debug(`🦠  ${this.name}.getById() count: ${JSON.stringify(results.length, null, 2)}`);
		return results[0];

	}

	async getMe() {

		logger.track(`📌  you are here → ${module_name}.getMe(${this.name}:${turbo.app.data.current_username})`);

		const response = await this.please
			.debug(turbo.API_VERBOSE_MODE)
			.get(`${this.classname}/me`);

		logger.verbose(`🦠  ${this.name}.getMe() response: ${JSON.stringify(response, null, 2)}`);

		const { results } = response.json;

		logger.debug(`🦠  ${this.name}.getMe() count: ${JSON.stringify(results.length, null, 2)}`);
		return results[0];

	}

	async getMine({ force = false } = {}) {

		logger.track(`📌  you are here → ${module_name}.getMine(${this.name}:${turbo.app.data.current_username})`);

		// if not force and item exists in cache, check to see if we already have it
		if (!force && this.ttl.mine && await cache.mine.has(this.name)) {
			const response =  await cache.mine.entry(this.name);
			logger.verbose(`🦠  ${this.name}.getMine() cached response: ${JSON.stringify(response, null, 2)}`);
			const results = response.value;
			return results;
		}

		const response = await this.please
			.debug(turbo.API_VERBOSE_MODE)
			.get(`${this.classname}/me`);

		logger.verbose(`🦠  ${this.name}.getMine() response: ${JSON.stringify(response, null, 2)}`);

		const { results } = response.json;

		if (this.ttl.mine) {
			await cache.mine.set(this.name, results, this.ttl.query);
		}

		logger.debug(`🦠  ${this.name}.getMine() count: ${JSON.stringify(results.length, null, 2)}`);
		return results;

	}

	async delete(id) {

		logger.track(`📌  you are here → ${module_name}.delete(${this.name}:${id})`);

		const response = await this.please
			.debug(turbo.API_VERBOSE_MODE)
			.delete(`${this.classname}/${id}`);

		logger.verbose(`🦠  ${this.name}.delete() response: ${JSON.stringify(response, null, 2)}`);

	}

	async getChildrenById(id, child_name, params) {

		logger.track(`📌  you are here → ${module_name}.getChildrenById(${this.name}:${id}:${child_name})`);

		const response = await this.please
			.debug(turbo.API_VERBOSE_MODE)
			.params(params)
			.get(`${this.classname}/${id}/${child_name}`);

		logger.verbose(`🦠  ${this.name}.getChildrenById() response: ${JSON.stringify(response, null, 2)}`);

		const { results } = response.json;

		logger.debug(`🦠  ${this.name}.getChildrenById() count: ${JSON.stringify(results.length, null, 2)}`);
		return results;

	}

	async getByProperty(name, value) {

		try {
			logger.track(`📌  you are here → ${module_name}.getByProperty(${this.name}:${name}:${value})`);

			const response = await this.please
				.debug(turbo.API_VERBOSE_MODE)
				.params({ where: { [name]: value } })
				.get(this.classname);

			logger.verbose(`🦠   ${this.name}.getByProperty(${name}, ${value}) response: ${JSON.stringify(response, null, 2)}`);

			const { results = [] } = response.json;

			logger.debug(`🦠  ${this.name}.getByProperty() count: ${JSON.stringify(results.length, null, 2)}`);
			return results;
		} catch (error) {
			console.error(error);
			logger.error(error);
			return [];
		}
	}


	async add(entity) {

		logger.track(`📌  you are here → Api.add(${this.name})`);

		logger.verbose(`🦠  entity to add: ${JSON.stringify(entity, null, 2)}`);

		const response = await this.please
			.debug(turbo.API_VERBOSE_MODE)
			.json(entity)
			.post(`${this.classname}`);

		logger.verbose(`🦠  ${this.name}.add() response: ${JSON.stringify(response, null, 2)}`);

		const { results } = response.json;

		logger.debug(`🦠  ${this.name}.add() count: ${JSON.stringify(results.length, null, 2)}`);
		return results[0];

	}

	async update(entity) {

		logger.track(`📌  you are here → Api.update(${this.name})`);

		const { id } = entity;

		if (!id) {
			logger.error(`Cannot update entity.  No property "id" was found.`);
			return;
		}

		const response = await this.please
			.debug(turbo.API_VERBOSE_MODE)
			.json(entity)
			.put(`${this.classname}/${id}`);


		logger.verbose(`🦠  ${this.name}.update() response: ${JSON.stringify(response, null, 2)}`);

		const { results } = response.json;

		logger.debug(`🦠  ${this.name}.update() count: ${JSON.stringify(results.length, null, 2)}`);


		return results[0];

	}

	async upsert(entity) {

		logger.track(`📌  you are here → Api.upsert(${this.name})`);

		const { id } = entity;
		let response;

		// update existing if ID exists, otherwise, insert.
		if (id) {
			response = await this.please
				.debug(turbo.API_VERBOSE_MODE)
				.json(entity)
				.put(`${this.classname}/${id}`);
		} else {
			response = await this.please
				.debug(turbo.API_VERBOSE_MODE)
				.json(entity)
				.post(`${this.classname}`);
		}


		logger.verbose(`🦠  ${this.name}.upsert() response: ${JSON.stringify(response, null, 2)}`);

		const { results } = response.json;

		logger.debug(`🦠  ${this.name}.upsert() count: ${JSON.stringify(results.length, null, 2)}`);


		return results[0];

	}
}

TurboApi.clearCache = () => {
	cache.query.clear();
	_.set(turbo, `app.data.hash`, _.get(turbo, `app.data.hash`, {}));
};

module.exports = TurboApi;
