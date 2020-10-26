
const config = {};
module.exports = config;

const OPERATIONS_ALL = [ `getAll`, `query`, `add`, `getByObjectId`, `getByEntityId`, `deleteByObjectId`, `deleteByEntityId`, `upsertByEntityId` ];

const apiEntities = [
	{
		name:       `offices`,
		operations: OPERATIONS_ALL,
	},
	{
		name:       `capacities`,
		operations: OPERATIONS_ALL,
	},
	{
		name:       `schedules`,
		operations: OPERATIONS_ALL,
	},
	{
		name:       `employees`,
		operations: OPERATIONS_ALL,
	},
	{
		name:       `submissions`,
		operations: OPERATIONS_ALL,
	},
	{
		name:       `checkins`,
		operations: OPERATIONS_ALL,
	},
];
config.apis = [
	{
		name:     `arrowdb1`,
		provider: `arrow`,
		config:   {
			apikey:     process.env.ARROWDB1_APIKEY,
			session_id: process.env.ARROWDB1_SESSION_ID,
			server_url: process.env.ARROWDB1_SERVER_URL,
		},
		entities: apiEntities,
	},
	{
		name:     `arrowdb2`,
		provider: `arrow`,
		config:   {
			apikey:     process.env.ARROWDB2_APIKEY,
			session_id: process.env.ARROWDB2_SESSION_ID,
			server_url: process.env.ARROWDB2_SERVER_URL,
		},
		entities: apiEntities,

	},
];

config.entities = {
	tweets:      `arrowdb1`,
	offices:     `arrowdb1`,
	capacities:  `arrowdb1`,
	schedules:   `arrowdb1`,
	employees:   `arrowdb1`,
	submissions: `arrowdb1`,
	checkins:    `arrowdb1`,
};


config.defaultApi = `arrowdb1`;

