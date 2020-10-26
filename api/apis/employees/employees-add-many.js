// eslint-disable-next-line no-global-assign
Promise = require(`bluebird`);

const _ = require(`lodash`);
const path = require(`path`);

/***********************************
 * Initialize API Builder
 ***********************************/
const ApiBuilder = require(`@axway/api-builder-runtime`);
const { app } = ApiBuilder.getGlobal();

/***********************************
 * Initialize Logging
 ***********************************/
const filename = __filename.substring(path.join(__dirname, `..`).length);
const logger = new app.locals.Logger({ filename });
logger.trace(`module initialization: ${filename}`);


/***********************************
 * Initialize Managers
 ***********************************/
const ApiManager = require(`../../lib/ApiManager`);
const ErrorManager = require(`../../lib/ErrorManager`);
const OperationManager = require(`../../lib/OperationManager`);


/***********************************
 * Initialize Instances
 ***********************************/
const api = new ApiManager();

/***********************************
 * Configure API
 ***********************************/

const operationMetadata = {
	group:       `employees`,
	name:        `post-employees`,
	path:        `/api/v1/employees/bulk`,
	method:      `POST`,
	description: `Creates one or more employees in the system.`,
	parameters:  {
		first_name:         { description: `First Name`, type: `body`, optional: true },
		last_name:          { description: `Last Name`, type: `body`, optional: true },
		email:              { description: `Email address`, type: `body`, optional: true },
		job_title:          { description: `Job Title`, type: `body`, optional: true },
		department:         { description: `Department`, type: `body`, optional: true },
		formatted_name:     { description: `Formatted name`, type: `body`, optional: true },
		manager_name:       { description: `Manager name`, type: `body`, optional: true },
		jive_id:            { description: `jive_id`, type: `body`, optional: true },
		jive_refreshed:     { description: `jive_refreshed`, type: `body`, optional: true },
		exchange_refreshed: { description: `exchange_refreshed`, type: `body`, optional: true },
		username:           { description: `Username`, type: `body`, optional: true },
		office_id:          { description: `ID of the default office for the employee`, type: `body`, optional: true },
		entity_created_at:  { description: `entity_created_at`, type: `body`, optional: true },
		entity_updated_at:  { description: `entity_updated_at`, type: `body`, optional: true },
		claims:             { description: `Claims for this user`, type: `body`, optional: true },
		notices_submitted:  { description: `Record of submitted notices`, type: `body`, optional: true },
		anonymous:          { description: `Keep user&#x27;s name anonymous`, type: `body`, optional: true },
		tags:               { description: `Tags associated with entity`, type: `body`, optional: true },
		import:             { description: `import existing employees`, type: `query`, optional: true },
	},
	scopes:             [ `write:employees` ],
	modelName:          `Employee`,
	actionName:         `add-many`,
	wildcardParameters: true,
};

module.exports = ApiBuilder.API.extend(
	Object.assign(operationMetadata, {
		async action (req, resp, next) {
			console.error(`******************************************************************************`);
			logger.entering(`operation: ${operationMetadata.name}`);

			try {
				const operationManager = new OperationManager({
					operationId: operationMetadata.operationId,
					metadata:    operationMetadata,
					logger,
					request:     req,
					response:    resp,
					next,
					api,
				});

				await operationManager.validateRequest();

				const results = [];
				const meta = [];
				for (const employee of req.body) {

					const { first_name, last_name, email, job_title, department, formatted_name, manager_name, jive_id, jive_refreshed, exchange_refreshed, username, office_id, entity_created_at, entity_updated_at, claims, notices_submitted, anonymous, tags  } = employee;

					const entity = {
						first_name,
						last_name,
						email,
						job_title,
						department,
						formatted_name,
						manager_name,
						jive_id,
						jive_refreshed,
						exchange_refreshed,
						username,
						office_id,
						entity_created_at,
						entity_updated_at,
						claims,
						notices_submitted,
						anonymous,
						tags,
					};
					if (req.params.import) {
						_.defaults(entity, {});
					}
					const result = await api.employees.add(entity);

					_.isArray(result.results) && results.push(result.results[0]);
					result.meta && meta.push(result.meta);

				}

				const response = {
					success: true,
					meta,
					results,
				};

				await operationManager.validateResponse(response);

				logger.debug({ message: `success response`, body: response });
				resp.response.status(201);
				return resp.send(response, null, next);

			} catch (error) {
				logger.entering(`catch`);
				const errorResponse = ErrorManager.createErrorResponse(error, logger);
				logger.error({ message: `error response`, body: errorResponse });
				resp.response.status(errorResponse.meta.code);
				return resp.send(errorResponse, null, next);
			}
		},
	}));
