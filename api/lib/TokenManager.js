/* eslint-disable promise/avoid-new */
// eslint-disable-next-line no-global-assign
// Promise = require('bluebird');
const _ = require(`lodash`);
const path = require(`path`);
// const jwtUtil = require('jwt-simple');
// const jwtUtil = require('@geek/jwt');
const AuthenticationToken = require(`@geet/jwt/AuthToken`);

const fs = require(`fs-extra`);
const assert = require(`assert`).strict;

const ScopeMissingError = require(`./errors/ScopeMissing`);
const ScopeUnauthorizedError = require(`./errors/ScopeUnauthorized`);
const InvalidTokenError = require(`./errors/InvalidToken`);

const public_key = fs.readFileSync(path.join(__dirname, `keys`, `keycloak.pub`), `utf8`);

const manager = {};
module.exports = manager;

const public_scopes = [
	`read:statuses`,
	`create:statuses`,
	`query:statuses`,
	`like:statuses`,
	`unlike:statuses`,
	`read:stations`,
	`query:stations`,
	`like:stations`,
	`unlike:stations`,
	`read:photos`,
	`create:photos`,
];

manager.cleanScopes = (scopes = []) => {

	if (_.isString(scopes)) {
		scopes = scopes.split(` `);
	} else if (! _.isArray(scopes)) {
		throw new Error(`Invalid type for scopes: ${typeof scopes}`);
	}

	return _.reduce(scopes, (clean, item) => {
		if (!_.isNil(item)) {
			item = item.trim();
			if (!_.isEmpty(item)) {
				// console.debug(`item: ${JSON.stringify(item, null, 2)}`);
				clean.push(item);
			}
			return clean;
		}
	  }, []);

};

manager.findMissingScopes = (user_scopes = [], required_scopes = []) => {
	console.debug(`you are here → token-manager.findMissingScopes`);

	const missing_scope = manager.checkScopes(user_scopes, required_scopes);

	if (missing_scope) {
		throw new ScopeMissingError(missing_scope);
	}

};

manager.validateScopes = (user_scopes = [], required_scopes = []) => {
	console.debug(`you are here → token-manager.validateScopes`);

	const missing_scope = manager.checkScopes(user_scopes, required_scopes);

	if (missing_scope) {
		throw new ScopeUnauthorizedError(missing_scope);
	}

};


manager.checkScopes = (user_scopes = [], required_scopes = []) => {
	console.debug(`you are here → token-manager.checkScopes`);

	required_scopes = manager.cleanScopes(required_scopes);

	const included_scopes = []
		.concat(manager.cleanScopes(user_scopes))
		.concat(public_scopes);

	// console.debug(`required_scopes: ${JSON.stringify(required_scopes, null, 2)}`);
	// console.debug(`included_scopes: ${JSON.stringify(included_scopes, null, 2)}`);

	let missing_scope;
	if (!included_scopes.includes(`admin:master`)) {
		_.forEach(required_scopes, scope => {
			if (! included_scopes.includes(scope)) {

				const scope_parts = scope.split(`:`);
				if (! (scope_parts.length === 2 && included_scopes.includes(`admin:${scope_parts[1]}`))) {
					missing_scope = scope;
					return false;
				}
			}
		});

	}

	return missing_scope;

};

manager.validate = async request => {
	console.debug(`you are here → tokenManager.validate`);

	const valid = {
		aud: `griffin-app`,
		iss: `https://login.axway.com/auth/realms/Broker`,
		// sub: 'f181f818-011c-4121-ae8b-fd6ad903ce34',
		// alg: 'HS256',
		alg: `RS256`,
		azp: `griffin-app`,
	};

	let jwt;
	// return new Promise((resolve, reject) => {
	const authHeader = request.headers[`authorization`];
	if (authHeader && authHeader.startsWith(`Bearer `)) {
		const access_token = authHeader.substring(7, authHeader.length);

		try {
			const authToken = new AuthenticationToken({ access_token }, { key: public_key, alg: valid.alg });
			jwt = authToken.access_token_jwt;
			// assert.strictEqual(jwt.aud, valid.aud, `Requires token with audience: ${valid.aud}`);
			assert.strictEqual(jwt.iss, valid.iss, `Requires token with issuer: ${valid.iss}`);
			valid.sub && assert.strictEqual(jwt.sub, valid.sub, `Requires token with subject: ${valid.sub}`);

			let audience = [];
			if (_.isString(jwt.aud)) {
				audience = [ jwt.aud ];
			} else if (_.isArray(jwt.aud)) {
				audience = jwt.aud;
			}

			// console.debug(`🦠  audience: ${JSON.stringify(audience, null, 2)}`);
			assert(_.includes(audience, valid.aud), `Requires token with audience: ${valid.aud}`);

			const roles = _.get(jwt, `realm_access.roles`, []);
			if (! _.includes(roles, `axway_employee`)) {
				console.error(`Requires token with role of 'axway_employee'`);
				console.error(jwt);
			}
			// assert(_.includes(roles, 'axway_employee'), `Requires token with role of 'axway_employee`);

			return authToken;

		} catch (error) {
			console.error(error);
			console.error(jwt);
			throw new InvalidTokenError();
		}


	} else {
		throw new InvalidTokenError();
	}
	// });
};

