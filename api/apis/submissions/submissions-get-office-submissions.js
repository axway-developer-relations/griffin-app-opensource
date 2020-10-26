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
	group:       `submissions`,
	name:        `get-office-submissions`,
	path:        `/api/v1/offices/:office_id/submissions`,
	method:      `GET`,
	description: `Returns submissions associated with office identified by supplied office_id.`,
	parameters:  {
		office_id: { description: `ID of the office to find associated submissions`, type: `query`, optional: false  },
		where:     { description: `where`, type: `query`, optional: true  },
		skip:      { description: `number of results to skip`, type: `query`, optional: true  },
		limit:     { description: `limit number of results`, type: `query`, optional: true  },
	},
	scopes:             [ `read:submissions`, `read:offices`  ],
	modelName:          `Submission`,
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
				const { office_id, where, limit, skip } = req.params;

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
				whereQuery[`office_id`] = office_id;

				const result = await api.submissions.getAll({ where: whereQuery, skip, limit });

				// DEBUG: get-office-submissions result
				// console.debug(`🦠  get-office-submissions result: ${JSON.stringify(result, null, 2)}`);


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
