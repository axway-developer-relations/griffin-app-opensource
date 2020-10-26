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
	group:       `submissions`,
	name:        `post-submission`,
	path:        `/api/v1/submissions`,
	method:      `POST`,
	description: `Creates a new  submission in the system.`,
	parameters:  {
		employee_id:     { description: `Entity ID of the user this capacity is for`, type: `body`, optional: true  },
		office_id:       { description: `Entity ID of the office this submission is for`, type: `body`, optional: true  },
		notice_id:       { description: `Entity ID of the notice this submission is for`, type: `body`, optional: false  },
		device_id:       { description: `Device ID for user`, type: `body`, optional: true  },
		sheet_id:        { description: `ID of the Google Sheet`, type: `body`, optional: true  },
		sheet_name:      { description: `Name of the Google Sheet`, type: `body`, optional: true  },
		notice_title:    { description: `Title of the notice that this submission is in response to`, type: `body`, optional: false  },
		notice_content:  { description: `Abbreviated form of content for the notice that this submission is in response to`, type: `body`, optional: true  },
		notice_version:  { description: `Version of the notice that this submission is in response to`, type: `body`, optional: true  },
		notice_type:     { description: `Type of notice`, type: `body`, optional: true  },
		notice_language: { description: `Limit notice to particular language`, type: `body`, optional: true  },
		entries:         { description: `Submitted entries for the associated notice`, type: `body`, optional: false  },
		country:         { description: `Country of office`, type: `body`, optional: true  },
		locale:          { description: `Locale of user`, type: `body`, optional: true  },
		import:          { description: `import existing submissions`, type: `query`, optional: true },
	},
	scopes:             [ `write:submissions` ],
	modelName:          `Submission`,
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

				const { employee_id, office_id, notice_id, device_id, sheet_id, sheet_name, notice_title, notice_content, notice_version, notice_type, notice_language, entries, country, locale  } = req.params;

				const result = await api.submissions.add({
					employee_id,
					office_id,
					notice_id,
					device_id,
					sheet_id,
					sheet_name,
					notice_title,
					notice_content,
					notice_version,
					notice_type,
					notice_language,
					entries,
					country,
					locale,
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
