class ParameterEmpty extends Error {

	constructor(...args) {
		super(...args);
		this.name = `ParameterEmpty`;
		this.message = `Parameter cannot have an empty value: ${this.message}`;
		Error.captureStackTrace(this, ParameterEmpty);
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
module.exports = ParameterEmpty;
