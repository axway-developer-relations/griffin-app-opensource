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
	name:        `get-submissions`,
	path:        `/api/v1/submissions`,
	method:      `GET`,
	description: `Returns all submissions from the system.`,
	parameters:  {
		object_id: { description: `object_id`, type: `query`, optional: true  },
		where:     { description: `where query`, type: `query`, optional: true  },
		skip:      { description: `number of results to skip`, type: `query`, optional: true  },
		limit:     { description: `limit number of results`, type: `query`, optional: true  },
	},
	scopes:             [ `read:submissions` ],
	modelName:          `Submission`,
	actionName:         `get-all`,
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
				const { object_id, where, limit, skip } = req.params;
				let result;

				if (object_id) {
					result = await api.submissions.getByObjectId(object_id);

					if (_.isNil(result.results[0])) {
						const errorResponse = new Http404Response({ meta: { object_id } });
						logger.error({ message: `error response`, body: errorResponse });
						resp.response.status(errorResponse.meta.code);
						return resp.send(errorResponse, null, next);
					}

				} else {
					result = await api.submissions.getAll({ where, limit, skip });
				}

				// DEBUG: get-submissions result
				// console.debug(`🦠  get-submissions result: ${JSON.stringify(result, null, 2)}`);

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
