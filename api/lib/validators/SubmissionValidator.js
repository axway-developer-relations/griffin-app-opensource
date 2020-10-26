const _ = require(`lodash`);
// const sugar = require('sugar');

const TurboValidator = require(`./TurboValidator`);
const { GoogleSpreadsheet } = require(`@geek/google-sheets`);
const google_auth = require(`../keys/google-service-account.json`);

let debug = () => {};
if (process.env.DEBUG_MODE === `true`) {
	debug = (...args) => {
		console.debug(...args);
	};
}

class SubmissionValidator extends TurboValidator {
	constructor(...args) {
		debug(`📌  you are here → SubmissionValidator.constructor()`);
		super(...args);
	}

	async validateRequest() {
		debug(`📌  you are here → SubmissionValidator.validateRequest()`);
		await this.validateParameters();
	}

	async validateParameters() {}


	async validateResponse(response) {
		debug(`📌  you are here → SubmissionValidator.validateResponse()`);

		switch (this.manager.operation.metadata.actionName) {

			case `add-one`:
			case `add-many`:

				if (response.success) {

					for (const entity of response.results) {

						await this.validateResponseEntity(entity);
						// console.error(`🦠  item: ${JSON.stringify(item, null, 2)}`);
						const headers = [ `id`, `notice_id`, `employee_id`, `device_id`, `country`, `locale`, `office_id`, `notice_title`, `notice_version`, `notice_type`, `entries`, `entity_created_at`, `entity_updated_at`, `object_id` ];
						const doc = new GoogleSpreadsheet(entity.sheet_id);
						await doc.useServiceAccountAuth(google_auth);
						await doc.loadInfo();
						const sheet = doc.getSheetByTitle(`submissions`);
						// sheet.setHeaderRow(headers);
						const row = _.pick(entity, headers);
						row.entries = (row.entries || []).join(`,`);
						// console.error(`🦠  row: ${JSON.stringify(row, null, 2)}`);
						sheet.addRow(row);

					}

				}

				break;

			default:

				if (response.success && _.isArray(response.results)) {
					for (const entity of response.results) {
						await this.validateResponseEntity(entity);
					}
				}

		}
	}

	async validateResponseEntity(entity) {
		await super.validateResponseEntity(entity);
	}

}

module.exports = SubmissionValidator;
