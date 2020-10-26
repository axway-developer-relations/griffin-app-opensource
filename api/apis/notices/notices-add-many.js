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
	group:       `notices`,
	name:        `post-notices`,
	path:        `/api/v1/notices/bulk`,
	method:      `POST`,
	description: `Creates one or more notices in the system.`,
	parameters:  {
		office_id:         { description: `Entity ID of the office this notice is associated with`, type: `body`, optional: true },
		country:           { description: `Country associated with this notice`, type: `body`, optional: true },
		title:             { description: `Title of this notice`, type: `body`, optional: true },
		content:           { description: `Full content for this notice`, type: `body`, optional: true },
		abridged:          { description: `Abridged version of content for the notice `, type: `body`, optional: true },
		version:           { description: `Version of the notice`, type: `body`, optional: true },
		language:          { description: `Language that this notice is restricted to`, type: `body`, optional: true },
		responses:         { description: `Responses that are allowed for this notice`, type: `body`, optional: true },
		active:            { description: `Is this notice active?`, type: `body`, optional: true },
		required:          { description: `Is this notice required?`, type: `body`, optional: true },
		type:              { description: `Type of notice`, type: `body`, optional: true },
		entity_created_at: { description: `entity_created_at`, type: `body`, optional: true },
		entity_updated_at: { description: `entity_updated_at`, type: `body`, optional: true },
		import:            { description: `import existing notices`, type: `query`, optional: true },
	},
	scopes:             [ `write:notices` ],
	modelName:          `Notice`,
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
				for (const notice of req.body) {

					const { office_id, country, title, content, abridged, version, language, responses, active, required, type, entity_created_at, entity_updated_at  } = notice;

					const entity = {
						office_id,
						country,
						title,
						content,
						abridged,
						version,
						language,
						responses,
						active,
						required,
						type,
						entity_created_at,
						entity_updated_at,
					};
					if (req.params.import) {
						_.defaults(entity, {});
					}
					const result = await api.notices.add(entity);

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
