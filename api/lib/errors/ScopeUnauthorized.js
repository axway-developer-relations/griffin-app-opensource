class ScopeUnauthorized extends Error {

	constructor(...args) {
		super(...args);
		this.name = `ScopeMissing`;
		this.scope = this.message;
		this.message = `Unauthorized scope requested: ${this.message}`;
		Error.captureStackTrace(this, ScopeUnauthorized);
	}

	toJSON() {

		return {
		  error: {
				name:       this.name,
				message:    this.message,
				scope:      this.scope,
				stacktrace: this.stack.split(`\n`),
		  },
		};
	}
}
module.exports = ScopeUnauthorized;
