'use strict';

const _ = require(`lodash`);
const path = require(`path`);
// const config = require('./config');

const pkg = require(`../package.json`);

const config = {
	logzio_token: process.env.LOGZIO_APIKEY,
	defaults:     {
		'api-environment': (process.env.API_ENV || `unknown`).toLowerCase(),
		'api-name':        pkg.name,
		'api-version':     pkg.version,
	},
};

const winston = require(`winston`);
const LogzioWinstonTransport = require(`winston-logzio`);
const filename = __filename.substring(path.join(__dirname, `..`).length);

const logzioWinstonTransport = new LogzioWinstonTransport({
	level: `silly`,
	name:  `winston_logzio`,
	token: config.logzio_token,
});

const logger = winston.createLogger({
	// format:     winston.format.simple(),
	format:     winston.format.json(),
	transports: [ logzioWinstonTransport ],
});

logger.trace = winston.silly;
logger.fatal = winston.error;


// winston.remove(winston.transports.Console);
// logger.add(new winston.transports.Console({ format: winston.format.simple()  }));
logger.add(new winston.transports.Console({
	// level:  'info',
	format: winston.format.combine(
		winston.format.colorize(),
		winston.format.timestamp(),
		winston.format.simple(),
		// winston.format.prettyPrint()
	),
}));

logger.log(`info`, { message: `Winston Logger Initialized.`, filename, ...config.defaults });

class Logger {

	constructor(defaults) {

		this.defaults = _.defaults({ ...config.defaults }, defaults);
		this.meta = {};

		_.forEach([ `verbose`, `debug`, `info`, `warn`, `error`, `silly` ], name => {
			this[name] = _.wrap(logger[name], (func, args) => {
				if (_.isString(args)) {
					args = { message: args };
				}
				_.defaults(args, this.defaults, this.meta);

				logger.log(name, args);
				return args;
			});
		});

		this.export = args => {
			return _.defaults({}, args, this.defaults, this.meta);
		};
		this.trace = this.silly;
		this.fatal = _.wrap(this.error, (func, args) => {
			args = func(args);
			// TODO: Do something with fatal error
			return args;
		});

		this.entering = _.wrap(this.silly, (func, args) => {
			if (_.isString(args)) {
				args = { message: args };
			}
			args.message = `entering  → ${args.message}` || `unknown`;
			args = func(args);
			// TODO: Do something with fatal error
			return args;
		});

		return this;
	}

	init(params) {
		this.meta = params;
	}

	metadata(params) {
		Object.assign(this.meta, params);
	}

}

Logger.instance  = new Logger();

module.exports = Logger;

