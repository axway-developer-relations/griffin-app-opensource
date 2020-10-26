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
	group:       `checkins`,
	name:        `post-checkin`,
	path:        `/api/v1/checkins`,
	method:      `POST`,
	description: `Creates a new  checkin in the system.`,
	parameters:  {
		office_id:         { description: `Entity ID of the office this capacity is for`, type: `body`, optional: false  },
		employee_id:       { description: `Entity ID of the employee scheduling to be in office`, type: `body`, optional: false  },
		day:               { description: `Day that user is scheduled to be in the selected office.  (in format YYYYDDD)`, type: `body`, optional: true  },
		checkin_time:      { description: `Time that user is checking into office`, type: `body`, optional: true  },
		entity_created_at: { description: `entity_created_at`, type: `body`, optional: true  },
		entity_updated_at: { description: `entity_updated_at`, type: `body`, optional: true  },
		import:            { description: `import existing checkins`, type: `query`, optional: true },
	},
	scopes:             [ `write:checkins` ],
	modelName:          `Checkin`,
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

				const { office_id, employee_id, day, checkin_time, entity_created_at, entity_updated_at  } = req.params;

				const result = await api.checkins.add({
					office_id,
					employee_id,
					day,
					checkin_time,
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
