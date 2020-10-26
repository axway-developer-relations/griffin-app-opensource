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
	group:              `capacities`,
	name:               `delete-capacity`,
	path:               `/api/v1/capacities/:capacity_id`,
	method:             `DELETE`,
	description:        `Deletes a capacity based on the ID supplied.`,
	parameters:         { capacity_id: { description: `ID of the capacity to delete`, type: `query`, optional: false  } },
	scopes:             [ `delete:capacities` ],
	modelName:          `Capacity`,
	actionName:         `delete-one`,
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
				const { capacity_id } = req.params;

				const result = await api.capacities.deleteByEntityId(capacity_id);

				// DEBUG: delete-capacity result
				// console.debug(`🦠  delete-capacity result: ${JSON.stringify(result, null, 2)}`);

				result.meta[`capacity_id`] = capacity_id;

				const response = {
					success: true,
					meta:    result.meta,
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
