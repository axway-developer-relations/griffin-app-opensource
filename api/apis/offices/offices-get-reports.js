// eslint-disable-next-line no-global-assign
Promise = require(`bluebird`);

const _ = require(`lodash`);
const path = require(`path`);
const moment = require(`moment`);

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
const CacheManager = require(`../../lib/CacheManager`);

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
	group:       `offices`,
	name:        `get-office-reports`,
	path:        `/api/v1/offices/:office_id/reports`,
	method:      `GET`,
	description: `Returns scheduling reports for an office based on the ID supplied.`,
	parameters:  {
		office_id: { description: `ID of the office to fetch`, type: `query`, optional: false  },
		start_day: { description: `Start Day of scheduling reports for the selected office.  (in format YYYYDDD)`, optional: true  },
		limit:     { description: `Limit to number of records returned`, optional: true  },
	},
	scopes:     [ `read:offices` ],
	modelName:  `Office`,
	actionName: `get-one-custom`,
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

				const { office_id, start_day = moment().format(`YYYYDDDD`) } = req.params;

				const limit =  _.toInteger(req.params.limit || 20);

				const result = await api.offices.getByEntityId(office_id);

				// DEBUG: get-office result
				// console.debug(`🦠  get-office result: ${JSON.stringify(result, null, 2)}`);

				if (_.isNil(result.results[0])) {
					const errorResponse = new Http404Response({ meta: { office_id } });
					logger.error({ message: `error response`, body: errorResponse });
					resp.response.status(errorResponse.meta.code);
					return resp.send(errorResponse, null, next);
				}

				const [ office ] = result.results;
				result.meta[`office_id`] = office_id;

				result.results = [];

				const first_day = _.toInteger(start_day);


				const capacities_response = await api.capacities.getAll({
					 where: {
						 office_id,
						 $or: [
							 { end_day: { $gte: _.toInteger(first_day) } },
							 { end_day: { $exists: false } },
						],
					},
				});

				const capacities = capacities_response.results;

				const schedules_response = await api.schedules.getAll({
					where: {
						office_id,
						day: { $gte: _.toInteger(first_day) },
				  },
			  });

			  if (! (schedules_response.success && _.isArray(schedules_response.results))) {
					throw new Error(`Invalid response when retrieving schedules`);
			  }

			  const schedules = schedules_response.results;

			  for (let current_day = first_day; current_day < first_day + limit; current_day++) {

					const capacity_limit = _.toInteger(_.get(_.find(capacities, capacity => {
						return (capacity.start_day <= current_day)
					&& ((capacity.end_day >= current_day)
					|| (_.isNil(capacity.end_day)));

					}), `maximum`, office.max_capacity));

					const day_scheduled = _.filter(schedules, { day: current_day });
					const num_scheduled = day_scheduled.length;

					const scheduled_employees = [];

					for (const entity of day_scheduled) {
						const user = CacheManager.user_ids.get(entity.employee_id) || {};
						// console.debug(`🦠  user: ${JSON.stringify(user, null, 2)}`);
						const employee_name = user.anonymous ? `Anonymous Employee` : user.name || `Unknown Employee`;
						scheduled_employees.push(employee_name);
					}


					const percent_capacity = (capacity_limit <= 0) ? `Closed` : `${parseFloat(num_scheduled / capacity_limit * 100).toFixed(0)}%`;

					const report = {
						office_name:  office.name,
						office_id:    office.id,
						max_capacity: office.max_capacity,
						day:          current_day,
						limit:        capacity_limit,
						num_scheduled,
						percent_capacity,
						scheduled_employees,
					};

					result.results.push(report);

			  }

			  result.meta.limit = limit;
			  result.meta.total = result.results.length;

				const response = {
					success: true,
					meta:    result.meta,
					results: result.results,
				};

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
