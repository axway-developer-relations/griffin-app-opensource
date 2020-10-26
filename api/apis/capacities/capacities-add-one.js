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
	group:       `capacities`,
	name:        `post-capacity`,
	path:        `/api/v1/capacities`,
	method:      `POST`,
	description: `Creates a new  capacity in the system.`,
	parameters:  {
		office_id:         { description: `Entity ID of the office this capacity is for`, type: `body`, optional: false  },
		maximum:           { description: `Maximum number of people that are allowed to be in office during date range`, type: `body`, optional: false  },
		maximum_percent:   { description: `Maximum number of people that are allowed to be in office during date range (by percentage of office max capacity)`, type: `body`, optional: true  },
		start_day:         { description: `Start day of capacity restriction.  (in format YYYYDDD)`, type: `body`, optional: false  },
		end_day:           { description: `End day of capacity restriction.  (in format YYYYDDD)`, type: `body`, optional: true  },
		start_time:        { description: `start_time`, type: `body`, optional: true  },
		end_time:          { description: `end_time`, type: `body`, optional: true  },
		entity_created_at: { description: `entity_created_at`, type: `body`, optional: true  },
		entity_updated_at: { description: `entity_updated_at`, type: `body`, optional: true  },
		import:            { description: `import existing capacities`, type: `query`, optional: true },
	},
	scopes:             [ `write:capacities` ],
	modelName:          `Capacity`,
	actionName:         `add-one`,
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

				const { office_id, maximum, maximum_percent, start_day, end_day, start_time, end_time, entity_created_at, entity_updated_at  } = req.params;

				const result = await api.capacities.add({
					office_id,
					maximum,
					maximum_percent,
					start_day,
					end_day,
					start_time,
					end_time,
					entity_created_at,
					entity_updated_at,
				});

				const response = {
					success: true,
					meta:    result.meta,
					results: result.results,
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
