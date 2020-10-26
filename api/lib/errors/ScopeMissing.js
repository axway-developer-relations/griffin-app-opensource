class ScopeMissing extends Error {

	constructor(...args) {
		super(...args);
		this.name = `ScopeMissing`;
		this.message = `Required scope not included: ${this.message}`;
		Error.captureStackTrace(this, ScopeMissing);
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
module.exports = ScopeMissing;
