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
// const token_manager = require('../../lib/token-manager');
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
	group:              `notices`,
	name:               `get-notice`,
	path:               `/api/v1/notices/:notice_id`,
	method:             `GET`,
	description:        `Returns a notice based on the ID supplied.`,
	parameters:         { notice_id: { description: `ID of the notice to fetch`, type: `query`, optional: false  } },
	scopes:             [ `read:notices` ],
	modelName:          `Notice`,
	actionName:         `get-one`,
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

				const { notice_id } = req.params;

				const result = await api.notices.getByEntityId(notice_id);

				// DEBUG: get-notice result
				// console.debug(`🦠  get-notice result: ${JSON.stringify(result, null, 2)}`);

				if (_.isNil(result.results[0])) {
					const errorResponse = new Http404Response({ meta: { notice_id } });
					logger.error({ message: `error response`, body: errorResponse });
					resp.response.status(errorResponse.meta.code);
					return resp.send(errorResponse, null, next);
				}

				result.meta[`notice_id`] = notice_id;

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
