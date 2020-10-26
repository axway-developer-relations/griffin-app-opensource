const Alloy = require(`/alloy`);
const Please = require(`@titanium/please`);
const Collection = Backbone.Collection.extend({});
const _ = require(`lodash`);
const logger = require(`@geek/logger`).createLogger(`app:api`, { meta: { filename: __filename } });

const Cache = require(`@geek/cache`);
const cache = {};
cache.query = new Cache({ name: `json_api_query`, ttl: Cache.ONE_DAY, store: `titanium-properties` });

_.set(turbo, `app.data.hash`, _.get(turbo, `app.data.hash`, {}));


class JsonApi {
	constructor({ baseUrl, apikey, name, classname = name, filename, collectionName = name, ttl = {}, timeout = 60000 } = {}) {
		logger.track(`📌  You are here → JsonApi.constructor({${name}})`);

		this.name = name;
		this.classname = classname;
		this.ttl = ttl;
		this.filename = filename;

		this.please = new Please({
			baseUrl,
			timeout,
			responseType: `json`,
			headers:      { APIKey: apikey },
		});

		this.collection = Alloy.Collections[collectionName] = Alloy.Collections[collectionName] || new Collection();
		turbo.app.data[name] = [];
	}

	async query({ params = {}, force = false } = {}) {
		logger.track(`📌  you are here → JsonApi.query(${this.name})`);

		if (!force && this.ttl.query && await cache.query.has(this.name)) {
			const response =  await cache.query.entry(this.name);
			logger.verbose(`🦠  ${this.name}.query() cached response: ${JSON.stringify(response, null, 2)}`);
			const results = response.value;

			if (turbo.app.data.hash[this.name] !== response.hash) {
				turbo.app.data.hash[this.name] = response.hash;
				turbo.app.data[this.name] = results;
				this.collection.reset(results);
				this.collection.trigger(`fetch`);
			}
			logger.debug(`🦠  ${this.name}.query() count: ${results.length}`);
			return results;
		}

		try {
			if (force) {
				this.please.header(`Cache-Control`, `no-store, no-cache, must-revalidate, proxy-revalidate`);
				this.please.header(`Pragma`, `no-cache`);
				this.please.header(`Expires`, 0);
				this.please.header(`Surrogate-Control`, `no-store`);
			}
			const response = await this.please
				.debug(turbo.API_VERBOSE_MODE)
				.get(this.filename);

			logger.verbose(`🦠  ${this.name}.query() response: ${JSON.stringify(response, null, 2)}`);
			logger.verbose(`🦠  ${this.name}.query() response.headers: ${JSON.stringify(response.headers, null, 2)}`);


			const results = response.json;

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

			logger.debug(`🦠  ${this.name}.query() count: ${results.length}`);
			return results;
		} catch (error) {
			logger.error(`JSON API Error`, error);
			turbo.tracker.error(error);
			return [];
		}
	}
}

JsonApi.clearCache = () => {
	cache.query.clear();
	_.set(turbo, `app.data.hash`, _.get(turbo, `app.data.hash`, {}));
};

module.exports = JsonApi;
