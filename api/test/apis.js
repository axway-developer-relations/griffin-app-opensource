const { expect } = require('chai');
const { startApiBuilder, stopApiBuilder, requestAsync } = require('./_base');

describe('APIs', function () {
	this.timeout(30000);
	let server;
	let user;

	/**
	 * Start API Builder and create a user.
	 */
	before(() => {
		server = startApiBuilder();
		return server.started.then(
			() => new Promise((resolve, reject) => {
				server.apibuilder.getModel('testuser').create(
					{
						first_name: 'Johnny',
						last_name:  'Test',
						email:      'jtest@axway.com',
					},
					(err, result) => {
						if (err) {
							reject(err);
						} else {
							user = result;
							resolve(user);
						}
					});
			})
		);
	});

	/**
	 * Stop API Builder after the tests.
	 */
	after(() => stopApiBuilder(server));

	describe('testapi', () => {
		it('[API-0001] should be able to hit testapi programmatically', () => {
			const api = server.apibuilder.getAPI('/api/testapi/:id');
			expect(api).to.not.be.undefined;
			return new Promise((resolve, reject) => {
				api.execute({ id: user.getPrimaryKey() }, (err, body) => {
					if (err) {
						return reject(err);
					}
					return resolve(body);
				});
			}).then(body => {
				expect(body).to.have.property('success', true);
				expect(body).to.have.property('request-id');
				expect(body).to.have.property('key', 'testuser');
				expect(body).to.have.property('testuser');
				expect(body.testuser).to.have.property('id');
				expect(body.testuser).to.have.property('first_name', user.first_name);
				expect(body.testuser).to.have.property('last_name', user.last_name);
				expect(body.testuser).to.have.property('email', user.email);
			});
		});

		it('[API-0002] should be able to hit testapi via http', () => {
			const auth = {
				user:     server.apibuilder.config.apikey || 'test',
				password: '',
			};
			return requestAsync({
				method: 'GET',
				uri:    `http://localhost:${server.apibuilder.port}/api/testapi/${user.getPrimaryKey()}`,
				auth,
				json:   true,
			})
				.then(({ body }) => {
					expect(body).to.have.property('success', true);
					expect(body).to.have.property('request-id');
					expect(body).to.have.property('key', 'testuser');
					expect(body).to.have.property('testuser');
					expect(body.testuser).to.have.property('id');
					expect(body.testuser).to.have.property('first_name', user.first_name);
					expect(body.testuser).to.have.property('last_name', user.last_name);
					expect(body.testuser).to.have.property('email', user.email);
				});
		});
	});
});
