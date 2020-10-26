class ParameterInvalidValue extends Error {

	constructor(...args) {
		super(...args);
		this.name = `ParameterInvalidValue`;
		this.message = `Parameter has invalid value: ${this.message}`;
		Error.captureStackTrace(this, ParameterInvalidValue);
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
module.exports = ParameterInvalidValue;
