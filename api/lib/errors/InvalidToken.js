class InvalidToken extends Error {

	constructor(...args) {
		super(...args);
		this.name = `InvalidToken`;
		this.message = this.message || `Bearer token is invalid`;
		Error.captureStackTrace(this, InvalidToken);
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
module.exports = InvalidToken;
