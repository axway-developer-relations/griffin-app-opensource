class NotFound extends Error {

	constructor(...args) {
		super(...args);
		this.name = `NotFound`;
		this.message = this.message || `Entity Not Found`;
		Error.captureStackTrace(this, NotFound);
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
module.exports = NotFound;
