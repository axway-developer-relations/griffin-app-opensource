const { expect } = require('chai');
const { startApiBuilder, stopApiBuilder, requestAsync } = require('./_base');

describe('Endpoints', function () {
	this.timeout(30000);
	let server;

	/**
	 * Start API Builder.
	 */
	before(() => {
		server = startApiBuilder();
		return server.started;
	});

	/**
	 * Stop API Builder after the tests.
	 */
	after(() => stopApiBuilder(server));

	describe('Greet', () => {
		it('[Endpoint-0001] should be able to hit Greet endpoint', () => {
			const auth = {
				user:     server.apibuilder.config.apikey || 'test',
				password: '',
			};
			const username = 'Johnny Test';
			return requestAsync({
				method: 'GET',
				uri:    `http://localhost:${server.apibuilder.port}/api/greet?username=${username}`,
				auth,
				json:   true,
			}).then(({ response, body }) => {
				expect(response.statusCode).to.equal(200);
				expect(body).to.equal(`Howdy ${username}`);
			});
		});

		it('[Endpoint-0002] should be able to get error response from Greet endpoint', () => {
			const auth = {
				user:     server.apibuilder.config.apikey || 'test',
				password: '',
			};
			return requestAsync({
				method: 'GET',
				uri:    `http://localhost:${server.apibuilder.port}/api/greet`,
				auth,
				json:   true,
			}).then(({ response }) => {
				expect(response.statusCode).to.equal(400);
			});
		});
	});
});
