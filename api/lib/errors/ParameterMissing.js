class ParameterMissing extends Error {

	constructor(...args) {
		super(...args);
		this.name = `ParameterMissing`;
		this.message = `Required parameter is missing: ${this.message}`;
		Error.captureStackTrace(this, ParameterMissing);
	}

	toJSON() {

		return {
		  error: {
				name:       this.name,
				message:    this.message,
				stacktrace: this.stack.split(`\n`),
		  },
		};
	}
}
module.exports = ParameterMissing;
