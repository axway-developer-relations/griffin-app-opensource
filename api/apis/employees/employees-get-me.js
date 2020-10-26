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
const CacheManager = require(`../../lib/CacheManager`);


/***********************************
 * Initialize Responses
 ***********************************/
const ErrorResponse = require(`../../lib/responses/ErrorResponse`);
const Http404Response = require(`../../lib/responses/Http404Response`);
const NotFoundError = require(`../../lib/errors/NotFound`);

/***********************************
 * Initialize Instances
 ***********************************/
const api = new ApiManager();

/***********************************
 * Configure API
 ***********************************/

const operationMetadata = {
	group:              `employees`,
	name:               `get-employee-me`,
	path:               `/api/v1/employees/me`,
	method:             `GET`,
	description:        `Returns a employee based on the supplied JWT token.`,
	parameters:         { },
	scopes:             [ `read:employees` ],
	modelName:          `Employee`,
	actionName:         `get-me`,
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
				const email = _.get(operationManager, `authToken.user.email`);
				if (!email) {
					throw new NotFoundError();
				}
				const result = await api.employees.getAll({ where: { email } });


				// console.debug(`🦠  result.results.length: ${JSON.stringify(result.results.length, null, 2)}`);

				// DEBUG: get-employee result
				// console.debug(`🦠  get-employee result: ${JSON.stringify(result, null, 2)}`);

				const entity = result.results[0];

				if (_.isNil(entity)) {
					const errorResponse = new Http404Response({ meta: { email } });
					logger.error({ message: `error response`, body: errorResponse });
					resp.response.status(errorResponse.meta.code);
					return resp.send(errorResponse, null, next);
				}

				result.meta[`email`] = email;

				const response = {
					success: true,
					meta:    result.meta,
					results: [ entity ],
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
