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
 * Initialize Responses
 ***********************************/
const ErrorResponse = require(`../../lib/responses/ErrorResponse`);
const Http404Response = require(`../../lib/responses/Http404Response`);

/***********************************
 * Initialize Instances
 ***********************************/
const api = new ApiManager();

/***********************************
 * Configure API
 ***********************************/

const operationMetadata = {
	group:       `schedules`,
	name:        `get-employee-schedules`,
	path:        `/api/v1/employees/:employee_id/schedules`,
	method:      `GET`,
	description: `Returns schedules associated with employee identified by supplied employee_id.`,
	parameters:  {
		employee_id: { description: `ID of the employee to find associated schedules`, type: `query`, optional: false  },
		where:       { description: `where`, type: `query`, optional: true  },
		skip:        { description: `number of results to skip`, type: `query`, optional: true  },
		limit:       { description: `limit number of results`, type: `query`, optional: true  },
	},
	scopes:             [ `read:schedules`, `read:employees`  ],
	modelName:          `Schedule`,
	actionName:         `get-children`,
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
				const { employee_id, where, limit, skip } = req.params;

				let whereQuery = {};
				if (_.isString(where)) {
					try {
						whereQuery = JSON.parse(where);
					} catch (error) {
						logger.error(`Error parsing where query: ${where}`);
					}
				} else if (_.isObject(where)) {
					whereQuery = where;
				}
				whereQuery[`employee_id`] = employee_id;

				const result = await api.schedules.getAll({ where: whereQuery, skip, limit });

				// DEBUG: get-employee-schedules result
				// console.debug(`🦠  get-employee-schedules result: ${JSON.stringify(result, null, 2)}`);


				const response = {
					success: true,
					meta:    result.meta,
					results: result.results,
				};

				await operationManager.validateResponse(response);

				// logger.debug({ message: 'success response', body: response });
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
