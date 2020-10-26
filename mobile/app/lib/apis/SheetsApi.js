const Alloy = require(`/alloy`);
const Please = require(`@titanium/please`);
const Collection = Backbone.Collection.extend({});
const logger = require(`@geek/logger`).createLogger(`app:api`, { meta: { filename: __filename } });

const google_sheets_apikey = Ti.App.Properties.getString(`google-sheets-apikey`, ``);
const Cache = require(`@geek/cache`);
const cache = {};
// cache.query = new Cache({ name: 'sheets_api_query', ttl: Cache.ONE_HOUR, store: 'titanium-properties' });
cache.query = new Cache({ name: `sheets_api_query`, store: `titanium-properties` });

_.set(turbo, `app.data.hash`, _.get(turbo, `app.data.hash`, {}));

const module_name = `SheetsApi`;

class SheetsApi {
	constructor({ baseUrl = `https://sheets.googleapis.com/v4/spreadsheets/`, apikey = google_sheets_apikey, name, classname = name, collectionName = name, ttl = {}, sheetId, sheetName, firstRow = 1, primaryKey, timeout = 60000 } = {}) {
		logger.track(`📌  You are here → ${module_name}.constructor({${name}})`);

		this.name = name;
		this.classname = classname;
		this.ttl = ttl;
		this.sheet_name = sheetName;
		this.sheet_id = sheetId;
		this.firstRow = firstRow;
		this.primaryKey = primaryKey;

		this.please = new Please({
			baseUrl,
			timeout,
			responseType: `json`,
			url:          `${sheetId}/values/${sheetName}`,
			params:       {
				key:                  apikey,
				valueRenderOption:    `UNFORMATTED_VALUE`,
				dateTimeRenderOption: `FORMATTED_STRING`,
				majorDimension:       `ROWS`,
			},
		});

		this.cache = { instance: new Cache({ name: `sheets_api__${this.name}`, ttl: Cache.ONE_DAY, store: `titanium-properties` }) };


		this.collection = Alloy.Collections[collectionName] = Alloy.Collections[collectionName] || new Collection();
		turbo.app.data[name] = [];
	}

	async query({ params = {}, force = false } = {}) {
		logger.track(`📌  you are here → ${module_name}.query(${this.name})`);


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
			return results;
		}

		try {
			const response = await this.please
				.debug(turbo.API_VERBOSE_MODE)
				.get();

			logger.verbose(`🦠  ${this.name}.query() response: ${JSON.stringify(response, null, 2)}`);

			const results = [];

			const values = _.get(response, `json.values`);
			if (_.isArray(values)) {
				const headers = _.first(_.pullAt(values, 0));
				for (let i = 0; i < this.firstRow; i++) {
					_.pullAt(values, i);
				}
				// logger.debug(`🦠  values: ${JSON.stringify(values, null, 2)}`);
				_.forEach(values, row => {
					if (_.isNil(row[0]) || _.isEmpty(row[0])) {
						return true;
					}
					const item = {};
					for (let i = 0; i < headers.length; i++) {
						item[headers[i]] = row[i];
					}
					item.sheet_id = this.sheet_id;
					item.sheet_name = this.sheet_name;
					results.push(item);
				});


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
			} else {
				logger.error(`🦠  Google Sheets API ${this.name}.query() response did not contain the property 'values'`);
			}
		} catch (error) {
			logger.error(`Google Sheets API Error`, error);
			turbo.tracker.error(error);
			return [];
		}
	}

	async getById(id, force) {
		logger.track(`📌  you are here → ${module_name}.getById(${id})`);

		const unique_id = `${this.name}__${id}`;
		if (!force && this.ttl.query && await this.cache.instance.has(id)) {
			const response =  await this.cache.instance.get(id);
			logger.verbose(`🦠  ${this.name}.getById(${id}) cached response: ${JSON.stringify(response, null, 2)}`);
			const results = response.value;
			if (turbo.app.data.hash[id] !== response.hash) {
				turbo.app.data.hash[id] = response.hash;
				turbo.app.data[id] = results;
				this.collection.reset(results);
				this.collection.trigger(`fetch`);
			}
			return results;
		}

		try {
			const response = await this.please
				.debug(turbo.API_VERBOSE_MODE)
				.url(`${id}/values/${this.sheet_name}`)
				.get();

			logger.verbose(`🦠  ${this.name}.getById(${id}) response: ${JSON.stringify(response, null, 2)}`);

			const results = [];

			let values = _.get(response, `json.values`);
			if (_.isArray(values)) {
				const headers = _.first(values);
				values = _.drop(values, this.firstRow);

				// logger.debug(`🦠  values: ${JSON.stringify(values, null, 2)}`);
				const primaryKeyIndex = this.primaryKey ? _.findIndex(headers, o => o === this.primaryKey) : undefined;

				_.forEach(values, row => {
					// console.debug(`row: ${JSON.stringify(row, null, 2)}`);
					if (!_.isNil(primaryKeyIndex) && (_.isNil(row[primaryKeyIndex]) || _.isEmpty(row[primaryKeyIndex]))) {
						return true;
					}
					const item = {};
					for (let i = 0; i < headers.length; i++) {
						item[headers[i]] = row[i];
					}
					item.sheet_id = id;
					item.sheet_name = this.sheet_name;

					// logger.debug(`🦠  item: ${JSON.stringify(item, null, 2)}`);
					results.push(item);
				});


				if (this.ttl.query) {
					const hash = await this.cache.instance.set(id, results, this.ttl.query);
					logger.debug(`🦠  turbo.app.data.hash[${unique_id}]: ${JSON.stringify(turbo.app.data.hash[unique_id], null, 2)}`);
					// logger.debug(`🦠  new hash: ${JSON.stringify(hash, null, 2)}`);
					if (turbo.app.data.hash[unique_id] !== hash) {
						turbo.app.data.hash[unique_id] = hash;
						turbo.app.data[unique_id] = results;
					}
				} else {
					turbo.app.data[unique_id] = results;
				}

				logger.debug(`🦠  ${this.name}.getById(${id}) count: ${results.length}`);

				return results;
			} else {
				logger.error(`🦠  Google Sheets API ${this.name}.getById(${id}) response did not contain the property 'values'`);
			}
		} catch (error) {
			console.error(error);
			logger.error(error);
			return [];
		}

	}
}

SheetsApi.clearCache = () => {
	cache.query.clear();
	_.set(turbo, `app.data.hash`, _.get(turbo, `app.data.hash`, {}));
};


module.exports = SheetsApi;
