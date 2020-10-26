(async () => {


	const APIBuilder = require(`@axway/api-builder-runtime`);
	const server = new APIBuilder();
	const _ = require(`lodash`);
	const path = require(`path`);


	require(`./lib/utils`);

	/****************************************
	 * Initialize Environmental Variables
	 ****************************************/
	const dotenv = require(`@geek/dotenv`);
	dotenv.config();
	dotenv.overload(`.env.overrides`);

	/****************************************
	 * Initialize Logger
	 ****************************************/
	const Logger = require(`./lib/logger`);
	server.app.locals.Logger = Logger;

	/****************************************
	 * Initialize Database Manager
	 ****************************************/
	const DatabaseManager = require(`./lib/DatabaseManager`);
	DatabaseManager.addProvider(`arrow`, require(`./lib/providers/arrow`));

	/****************************************
	 * Initialize API Manager
	 ****************************************/
	const apiConfig = require(`./lib/apiConfig`);
	const ApiManager = require(`./lib/ApiManager`);
	ApiManager.config(apiConfig);

	/****************************************
	 * Initialize Cache Manager
	 ****************************************/
	const CacheManager = require(`./lib/CacheManager`);
	const api = new ApiManager();
	const employee_results = await api.employees.getAll({ limit: 5000 });
	if (employee_results.success && _.isArray(employee_results.results)) {

		console.debug(`🦠  employee_results.results.length: ${JSON.stringify(employee_results.results.length, null, 2)}`);

		for (const entity of employee_results.results) {
			const user = {
				id:         entity.id,
				name:       entity.formatted_name,
				email:      entity.email,
				// anonymous: !!entity.anonymous,
				anonymous:  _.isNil(entity.anonymous) ? true : !!entity.anonymous,
				subject_id: entity.subject_id,
			};

			CacheManager.user_emails.set(entity.email, user);
			CacheManager.user_ids.set(entity.id, user);
		}

	}


	/****************************************
	 * Initialize Server Events
	 ****************************************/
	server.on(`started`, () => {
		server.logger.debug(`server started!`);
	});

	/****************************************
 * Start API Server
 ****************************************/
	server.start();


})();
