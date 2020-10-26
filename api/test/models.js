const { expect } = require('chai');
const { promisify } = require('util');
const { startApiBuilder, stopApiBuilder } = require('./_base');

describe('Models', function () {
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

	describe('testuser', () => {
		it('[Model-0001] verify model definition', () => {
			const model = server.apibuilder.getModel('testuser');
			expect(model.fields).to.deep.equal({
				first_name: {
					type:     'string',
					required: false,
					optional: true,
				},
				last_name: {
					type:     'string',
					required: false,
					optional: true,
				},
				email: {
					type:     'string',
					required: false,
					optional: true,
				},
			});
			expect(model.connector.name).to.equal('memory');
		});

		it('[Model-0002] test CRUD methods on model', () => {
			const model = server.apibuilder.getModel('testuser');

			// Use promisify for cleaner tests
			const createAsync = promisify(model.create.bind(model));
			const findByIDAsync = promisify(model.findByID.bind(model));
			const updateAsync = promisify(model.update.bind(model));
			const deleteAsync = promisify(model.delete.bind(model));

			const user = {
				first_name: 'Test',
				last_name:  'User1',
				email:      'testuser1@example.com',
			};

			// Create user, find the user, update the user, delete the user.
			let expectedId;

			return createAsync(user)
				.then(created => {
					// Verify the created model
					expectedId = created.id;
					expect(created).to.have.property('id');
					expect(created).to.have.property('first_name', user.first_name);
					expect(created).to.have.property('last_name', user.last_name);
					expect(created).to.have.property('email', user.email);
					return created;
				})
			//
			// Find the testuser by id
			//
				.then(created => findByIDAsync(created.id))
				.then(found => {
					// Verify the found model
					expect(found).to.have.property('id', expectedId);
					expect(found).to.have.property('first_name', user.first_name);
					expect(found).to.have.property('last_name', user.last_name);
					expect(found).to.have.property('email', user.email);
					return found;
				})
			//
			// Update the testuser record.
			//
				.then(found => {
					const update = JSON.parse(JSON.stringify(found));
					update.first_name = 'Another';
					return updateAsync(update);
				})
				.then(updated => {
					// Verify the updated model
					expect(updated).to.have.property('id', expectedId);
					expect(updated).to.have.property('first_name', 'Another');
					expect(updated).to.have.property('last_name', user.last_name);
					expect(updated).to.have.property('email', user.email);
					return updated;
				})
			//
			// Delete the test user record.
			//
				.then(updated => deleteAsync(updated.id))
				.then(deleted => findByIDAsync(deleted.id))
				.then(found => {
					// Verify the deleted model cannot be found
					expect(found).to.be.undefined;
				});
		});
	});
});
