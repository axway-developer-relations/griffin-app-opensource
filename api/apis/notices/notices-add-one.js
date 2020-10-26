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
	name:        `post-notice`,
	path:        `/api/v1/notices`,
	method:      `POST`,
	description: `Creates a new  notice in the system.`,
	parameters:  {
		office_id:         { description: `Entity ID of the office this notice is associated with`, type: `body`, optional: true  },
		country:           { description: `Country associated with this notice`, type: `body`, optional: false  },
		title:             { description: `Title of this notice`, type: `body`, optional: false  },
		content:           { description: `Full content for this notice`, type: `body`, optional: false  },
		abridged:          { description: `Abridged version of content for the notice `, type: `body`, optional: false  },
		version:           { description: `Version of the notice`, type: `body`, optional: false  },
		language:          { description: `Language that this notice is restricted to`, type: `body`, optional: false  },
		responses:         { description: `Responses that are allowed for this notice`, type: `body`, optional: true  },
		active:            { description: `Is this notice active?`, type: `body`, optional: false  },
		required:          { description: `Is this notice required?`, type: `body`, optional: false  },
		type:              { description: `Type of notice`, type: `body`, optional: false  },
		entity_created_at: { description: `entity_created_at`, type: `body`, optional: true  },
		entity_updated_at: { description: `entity_updated_at`, type: `body`, optional: true  },
		import:            { description: `import existing notices`, type: `query`, optional: true },
	},
	scopes:             [ `write:notices` ],
	modelName:          `Notice`,
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

				const { office_id, country, title, content, abridged, version, language, responses, active, required, type, entity_created_at, entity_updated_at  } = req.params;

				const result = await api.notices.add({
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
