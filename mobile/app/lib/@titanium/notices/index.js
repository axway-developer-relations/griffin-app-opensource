
const logger = require(`@geek/logger`).createLogger(`@titanium/notices`, { meta: { filename: __filename } });

const manager = {};
const moment = require(`moment`);
const { observe, raw } = require(`@titanium/observer`);
const { once } = require(`events`);

manager.NOTICE_TAG_APP_LAUNCH_DEVICE = `app_launch_device`;
manager.NOTICE_TAG_APP_LAUNCH_USER = `app_launch_user`;
manager.NOTICE_TAG_SCHEDULED_DEVICE = `scheduled_device`;
manager.NOTICE_TAG_SCHEDULED_USER = `scheduled_user`;

const FREQUENCY_MANUAL = `manual`;
const FREQUENCY_LAUNCH = `launch`;
const TYPE_TEXT = `text`;

turbo.app.device_notices_completed = Ti.App.Properties.getList(`turbo.app.device_notices_completed`, []);


observe(() => {
	logger.track(`👀  Saving turbo.app.device_notices_completed: ${turbo.app.device_notices_completed.length}`);
	Ti.App.Properties.setList(`turbo.app.device_notices_completed`, raw(turbo.app).device_notices_completed);
});


const checkNoticeFrequency = (notice_submission, frequency) => {
	logger.track(`📌 You are here → turbo.checkNoticeFrequency()`);
	logger.debug(`🦠  notice_submission: ${JSON.stringify(notice_submission, null, 2)}`);
	logger.debug(`🦠  frequency: ${JSON.stringify(frequency, null, 2)}`);

	switch (frequency) {
		case `once`:
			return !notice_submission;

		case `day`:
			return moment(notice_submission.submission_date).format(`YYYYDDDD`) < moment().format(`YYYYDDDD`);

		case `week`:
			return moment(notice_submission.submission_date).format(`YYYYWW`) < moment().format(`YYYYWW`);

		case `month`:
			return moment(notice_submission.submission_date).format(`YYYYMM`) < moment().format(`YYYYMM`);

		case `year`:
			return moment(notice_submission.submission_date).format(`YYYY`) < moment().format(`YYYY`);

		case `manual`:
			return true;

		default:
			return false;
	}
};


manager.displayByTags = async (tags = []) => {
	logger.track(`📌 You are here → turbo.displayByTags(${JSON.stringify(tags)})`);

	const isAuthenticated = await turbo.authentication.isAuthenticated();

	await manager.show(
		_.filter(turbo.app.data.notices, notice => {

			logger.debug(`🦠  turbo.app.device_notices_completed: ${JSON.stringify(turbo.app.device_notices_completed, null, 2)}`);
			logger.debug(`🦠  tags: ${JSON.stringify(tags, null, 2)}`);
			logger.debug(`🦠  notice.tags: ${JSON.stringify(notice.tags, null, 2)}`);

			const tag_hit = _.intersection(tags, notice.tags || []);

			logger.debug(`🦠  tag_hit: ${JSON.stringify(tag_hit, null, 2)}`);

			if (!tag_hit.length) {
				return false;
			}

			if (notice.auth_required) {
				if (!isAuthenticated) {
					return false;
				}

				return checkNoticeFrequency(_.find(turbo.app.data.current_user.notices_submitted, { id: notice.id }), notice.frequency);

			} else {

				return checkNoticeFrequency(_.find(turbo.app.device_notices_completed, { id: notice.id }), notice.frequency);
			}
		}),
	);

};


manager.loadByIds = async ({ ids = [], force = false } = {}) => {
	logger.track(`📌 You are here → turbo.notices.loadByIds()`);

	logger.debug(`🦠  turbo.notices.loadByIds.ids: ${JSON.stringify(ids, null, 2)}`);

	// const FREQUENCY_MANUAL = 'manual';
	// const FREQUENCY_LAUNCH = 'launch';
	// const TYPE_TEXT = 'text';

	let notices = [];

	for (const id of ids) {

		logger.debug(`🦠  loading notice id: ${JSON.stringify(id, null, 2)}`);
		const results = await turbo.api.notices.getById(id, force);

		notices = notices.concat(_.filter(
			_.map(results, value => {
				value.responses = [];
				for (let i = 1; i <= 5; i++) {
					if (_.trim(value[`response_${i}`]).length) {
						value[`response_${i}`] = _.trim(value[`response_${i}`]);
						value.responses.push(value[`response_${i}`]);
					} else {
						value[`response_${i}`] = undefined;
					}
				}

				if (value.language) {
					if (value.language === `all`) {
						value.language = undefined;
					} else {
						value.language = value.language.toLowerCase();
					}
				}

				value.tags = _.split(_.trim(value.tags), /\s*,\s*/g).filter(o => o);
				value.frequency = _.trim(value.frequency).length ? _.trim(value.frequency) : FREQUENCY_MANUAL;
				value.type = _.trim(value.type).length ? _.trim(value.type) : TYPE_TEXT;

				if (value.frequency === FREQUENCY_LAUNCH) {
					value.frequency = FREQUENCY_MANUAL;
					if (value.auth_required) {
						value.tags.push(manager.NOTICE_TAG_SCHEDULED_USER);
					} else {
						value.tags.push(manager.NOTICE_TAG_SCHEDULED_DEVICE);
					}
				} else if ([ `once`, `day`, `week`, `month`, `year` ].includes(value.frequency)) {
					if (value.auth_required) {
						value.tags.push(manager.NOTICE_TAG_APP_LAUNCH_USER);
					} else {
						value.tags.push(manager.NOTICE_TAG_APP_LAUNCH_DEVICE);
					}
				}

				logger.verbose(`🦠  notice value: ${JSON.stringify(value, null, 2)}`);

				return value;
			}),
			notice => {
				// logger.debug(`🦠  notice: ${JSON.stringify(notice, null, 2)}`);
				const valid = (!_.isNil(notice.id) && !_.isNil(notice.version) && !_.isNil(notice.created_at) && !_.isNil(notice.updated_at) && notice.active && !_.isNil(notice.title) && !_.isNil(notice.content) && (!notice.language || notice.language === turbo.language_code));

				if (_.isNil(notice.id)) {
					logger.debug(`🦠  notice.id is null or undefined`);
					return false;
				}
				if (_.isNil(notice.updated_at)) {
					logger.debug(`🦠  notice.updated_at is null or undefined`);
					return false;
				}
				if (!notice.active) {
					logger.debug(`🦠  notice is not active`);
					return false;
				}
				if (_.isNil(notice.title)) {
					logger.debug(`🦠  notice.title is null or undefined`);
					return false;
				}
				if (_.isNil(notice.content)) {
					logger.debug(`🦠  notice.content is null or undefined`);
					return false;
				}
				if  (notice.language && notice.language !== turbo.language_code) {
					logger.debug(`🦠  notice.language is not set to ${turbo.language_code}`);
					logger.debug(`🦠  notice.language: ${JSON.stringify(notice.language, null, 2)}`);
					return false;
				}


				logger.debug(`🦠  valid: ${JSON.stringify(valid, null, 2)}`);

				if (valid) {
					if (!notice.responses.length) {
						notice.responses.push(`Close`);
					}
					return true;
				}
			},
		));


	}

	logger.debug(`🦠  turbo.app.data.notices.length: ${notices.length}`);
	turbo.app.data.notices = notices;

};


manager.load = async ({ force = false } = {}) => {
	logger.track(`📌 You are here → turbo.notices.load()`);

	await manager.loadByIds({ ids: _.get(manager, `notice_ids.global`, []).concat(_.get(manager, `notice_ids.local`, [])), force });

};

manager.notice_ids = {
	global: [ Ti.App.Properties.getString(`google-sheets-notices-global`) ],
	local:  [],
};


manager.show = async (notices = []) => {
	logger.track(`📌 You are here → turbo.notices.show()`);

	logger.debug(`🦠  notices.length: ${JSON.stringify(notices.length, null, 2)}`);

	const notices_iterator = notices[Symbol.iterator]();

	for await (const notice of notices_iterator) {
		const params = { notice };

		Alloy.open(`notice-full`, params);
		const [ submission ] = await once(turbo.events, `notice::submit`);

		logger.track(`📌 You are here → turbo.displayNotices() handling event - notice::submit`);
		// logger.debug(`🦠  notice::submit submission: ${JSON.stringify(submission, null, 2)}`);
		await Alloy.close(`notice-full`);

		// logger.debug(`🦠  notice::submit submission: ${JSON.stringify(submission, null, 2)}`);

		await turbo.api.submissions.add({
			device_id:       turbo.device_id,
			employee_id:     _.get(turbo, `app.data.current_user.id`),
			office_id:       _.get(turbo, `app.data.current_office.id`),
			country:         _.get(turbo, `app.data.current_office.country`),
			notice_id:       notice.id,
			notice_title:    notice.title,
			notice_type:     notice.type,
			notice_language: notice.language,
			notice_version:  notice.version,
			entries:         submission.entries,
			sheet_id:        notice.sheet_id,
			sheet_name:      notice.sheet_name,
			locale:          turbo.locale,
		});


		const now = moment().format();
		const notice_record_device = _.find(turbo.app.device_notices_completed, { id: notice.id });
		if (notice_record_device) {
			notice_record_device.submission_date = now;
		} else {
			turbo.app.device_notices_completed.push({ id: notice.id, submission_date: now });
		}

		if (turbo.app.data.current_user) {
			const notice_record_user = _.find(turbo.app.data.current_user.notices_submitted, { id: notice.id });
			if (notice_record_user) {
				notice_record_user.submission_date = now;
			} else {
				turbo.app.data.current_user.notices_submitted.push({ id: notice.id, submission_date: now });
			}
			await turbo.api.employees.update(turbo.app.data.current_user);
		}
	}

	// turbo.closeLoadingScreen();
};


module.exports = manager;
