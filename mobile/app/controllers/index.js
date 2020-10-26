logger.track(`📌  You are here → inside index controller`);

const moment = require(`moment`);
const fs = require(`fs`);
const Cache = require(`@geek/cache`);
const { once } = require(`events`);
const Authentication = require(`/Authentication`);
const AuthenticationOAuthProvider = require(`@titanium/authentication-oauth`);
const { observe, raw } = require(`@titanium/observer`);
turbo.notices = require(`/@titanium/notices`);

// #region ---[ Load Stored Data ]---

// turbo.app.data.current_username = Ti.App.Properties.getString('turbo.app.data.current_username');
// turbo.app.latest_username = Ti.App.Properties.getString('turbo.app.latest_username');
// turbo.app.data.current_user = Ti.App.Properties.getObject('turbo.app.data.current_user');
const token = Ti.App.Properties.getObject(`turbo.app.data.auth_token`);
if (token) {
	turbo.app.data.auth_token = new AuthenticationOAuthProvider.AuthToken(token);
	turbo.app.latest_username = turbo.app.data.auth_token.user.username;
	turbo.app.data.current_username = turbo.app.data.auth_token.user.username;
}

turbo.allow_beta_updates = Ti.App.Properties.getBool(`turbo.allow_beta_updates`, false);

logger.debug(`🦠  turbo.allow_beta_updates: ${JSON.stringify(turbo.allow_beta_updates, null, 2)}`);

// #endregion ---[ Load Stored Data ]---

// #region ---[ Initialize Collections ]---

const Collection = Backbone.Collection.extend({});
// const Model = Backbone.Model.extend({});
Alloy.Collections.articles = new Collection();
Alloy.Collections.current_reports = new Collection();
Alloy.Collections.active_capacities = new Collection();
Alloy.Collections.scheduled_employees = new Collection();
Alloy.Collections.schedules = new Collection();
Alloy.Collections.app_dependencies = new Collection();
Alloy.Collections.app_dependencies.reset(Alloy.dependency_registry || []);

logger.debug(`🦠  Alloy.dependency_registry: ${JSON.stringify(Alloy.dependency_registry, null, 2)}`);

logger.silly(`🦠  Alloy.Collections.current_reports.length: ${JSON.stringify(Alloy.Collections.current_reports.length, null, 2)}`);

Alloy.Collections.articles.reset(require(`/data/latest-articles.json`));
turbo.app.data.current_reports = [];

Alloy.Collections.schedules.comparator = `day`;
// Alloy.Collections.offices.comparator = 'name';

Alloy.Collections.offices = Alloy.Collections.offices || new Collection();
Alloy.Collections.offices.comparator = (model1, model2) => {
	const c1 = compareModels(`max_capacity`, model1, model2);
	if (c1 === 0) {
		const test = compareModels(`name`, model1, model2);
		// logger.silly(`🦠  test: ${JSON.stringify(test, null, 2)}`);
		return test;
	} else {
		// logger.silly(`🦠  c1: ${JSON.stringify(c1, null, 2)}`);
		return -c1;
	}
};
// {
// 	// return -item.get('max_capacity'); // Note the minus!
// 	return [ -item.get('max_capacity'), item.get('name') ]; // Note the minus!
// };

const compareModels = (prop, model1, model2) => {

	// logger.debug(`🦠  prop: ${JSON.stringify(prop, null, 2)}`);
	// logger.debug(`🦠  model1.get(prop): ${JSON.stringify(model1.get(prop), null, 2)}`);
	// logger.debug(`🦠  model2.get(prop): ${JSON.stringify(model2.get(prop), null, 2)}`);

	if (model1.get(prop) > model2.get(prop)) {
		// before
		return 1;
	} else if (model2.get(prop) > model1.get(prop)) {
		// after
		return -1;
	} else {
		// equal
		return 0;
	}
};

// #endregion ---[ Initialize Collections ]---

// #region ---[ Configure Observables ]---

observe(() => {
	logger.verbose(`👀  Saving turbo.app.data.current_user: ${JSON.stringify(turbo.app.data.current_user, null, 2)}`);
	Ti.App.Properties.setObject(`turbo.app.data.current_user`, raw(turbo.app).data.current_user);
	if (turbo.app.data.current_user) {
		if (turbo.app.data.offices) {
			turbo.app.data.current_office = _.find(turbo.app.data.offices, { id: turbo.app.data.current_user.office_id });
		}
	}
});

// observe(() => {
// 	logger.track(`👀  Observing turbo.app.data.office`);
// 	if (turbo.app.data.offices) {
// 		for (const office of turbo.app.data.offices) {
// 			office.notice_sources = office.notice_sources || [];
// 			for (const notice_source of office.notice_sources) {
// 				turbo.api.notices.getById(notice_source.sheetId);
// 			}
// 		}
// 	}
// });

observe(() => {
	logger.verbose(`👀  Saving turbo.app.data.current_username: ${turbo.app.data.current_username}`);
	Ti.App.Properties.setString(`turbo.app.data.current_username`, raw(turbo.app).data.current_username);
});

observe(() => {
	logger.track(`👀  Saving turbo.app.data.auth_token: ${turbo.app.data.auth_token}`);
	if (turbo.app.data.auth_token) {
		Ti.App.Properties.setObject(`turbo.app.data.auth_token`, JSON.parse(JSON.stringify(raw(turbo.app).data.auth_token)));
	} else {
		Ti.App.Properties.setObject(`turbo.app.data.auth_token`, null);
	}

});


observe(() => {
	logger.track(`👀  Saving turbo.app.latest_username: ${turbo.app.latest_username}`);
	Ti.App.Properties.setString(`turbo.app.latest_username`, raw(turbo.app).latest_username);
});

// #endregion ---[ Configure Observables ]---

// #region ---[ Initialize APIs ]---

// ---------------------------------------------------------
//    Initialize APIs
// ---------------------------------------------------------
const TurboApi = require(`/apis/TurboApi`);
const JsonApi = require(`/apis/JsonApi`);
const SheetsApi = require(`/apis/SheetsApi`);

const data_api_baseurl = Ti.App.Properties.getString(`data-api-baseurl`);
const resource_api_baseurl = Ti.App.Properties.getString(`resources-api-baseurl`);
const articles_url = Ti.App.Properties.getString(`articles-url`);
const apikey = Ti.App.Properties.getString(`data-api-apikey`, ``);

turbo.api = {
	offices:     new TurboApi({ name: `offices`, baseUrl: data_api_baseurl, apikey, ttl: { query: Cache.ONE_WEEK } }),
	employees:   new TurboApi({ name: `employees`, baseUrl: data_api_baseurl, apikey }),
	schedules:   new TurboApi({ name: `schedules`, baseUrl: data_api_baseurl, apikey, ttl: { query: Cache.ONE_WEEK, mine: Cache.ONE_WEEK } }),
	capacities:  new TurboApi({ name: `capacities`, baseUrl: data_api_baseurl, apikey }),
	submissions: new TurboApi({ name: `submissions`, baseUrl: data_api_baseurl, apikey }),
	checkins:    new TurboApi({ name: `checkins`, baseUrl: data_api_baseurl, apikey }),
	articles:    new JsonApi({ name: `articles`, baseUrl: resource_api_baseurl, filename: articles_url, ttl: { query: Cache.ONE_WEEK } }),
	notices:     new SheetsApi({
		name:       `notices`,
		firstRow:   2,
		primaryKey: `id`,
		sheetName:  `notices`,
		ttl:        { query: Cache.ONE_WEEK },
	}),

};

turbo.api.reports = {
	query: async () => {
		logger.track(`📌  you are here → turbo.api.reports.query()`);
		const reports = (await turbo.api.offices.getChildrenById(turbo.app.data.current_office.id, `reports`, { start_day: moment().format(`YYYYDDDD`), limit: 180 })) || [];

		_.forEach(reports, report => {
			if (report.percent_capacity === `Closed`) {
				report.int_capacity = 100;
			} else {
				report.int_capacity = _.toInteger(parseInt(report.percent_capacity || 0));
			}
		});

		Alloy.Collections.current_reports.reset(reports);
		Alloy.Collections.current_reports.trigger(`fetch`);
		turbo.app.data.current_reports = reports;
		logger.debug(`🦠  turbo.app.data.current_reports.length: ${turbo.app.data.current_reports.length}`);
		return turbo.app.data.current_reports;
	},
};

// #endregion ---[ Initialize APIs ]---

// #region ---[ Check for App Updates ]---

// ---------------------------------------------------------
//    Check for App Updates
// ---------------------------------------------------------

Ti.App.Properties.getBool(`turbo.allow_beta_updates`, false);
const updater_url = Ti.App.Properties.getString(`updater-api-url`);

turbo.createUpdater = ({ channel = `release` } = {}) => {
	if (!updater_url) {
		console.warn(`No updater url defined.  Skipping check for updates`);
		return;
	}

	if (channel === null) {
		channel = `release`;
	}

	logger.debug(`🦠  channel: ${JSON.stringify(channel, null, 2)}`);

	Ti.App.Properties.setString(`turbo.updater_channel`, channel);
	turbo.updater = new (require(`@titanium/updater`))({ baseUrl: updater_url, channel });
};

turbo.createUpdater({ channel: Ti.App.Properties.getString(`turbo.updater_channel`) }, `release`);

turbo.checkForUpdates = async ({ recommended = true, optional = false } = {}) => {
	logger.track(`📌  You are here → inside index.checkForUpdates()`);

	if (!updater_url) {
		console.warn(`No updater url defined.  Skipping check for updates`);
		return false;
	}

	const openHomePage = OS_ANDROID && _.toInteger(turbo.os_version) < 7;

	turbo.openLoadingScreen();
	const updateStatus = await turbo.updater.ensure({ recommended, optional, openHomePage }).catch(error => {
		logger.error(error);
		turbo.tracker.error(error);
		turbo.closeLoadingScreen();
		return false;
	});

	logger.track(`📌  You are here → index.checkForUpdates() - complete.`);
	turbo.closeLoadingScreen();
	return updateStatus;
};

// #endregion ---[ Check for App Updates ]---

// #region ---[ Check User Claims ]---

turbo.hasClaims = (claims = []) => {
	logger.debug(`🦠  turbo.app.data.current_user.claims: ${JSON.stringify(turbo.app.data.current_user.claims, null, 2)}`);
	const missing_claims = _.difference(claims, turbo.app.data.current_user.claims || []);
	if (missing_claims.length) {
		logger.error(`User does not have the following claims: ${JSON.stringify(missing_claims)}`);
		return false;
	}
	return true;
};

// #endregion ---[ Check User Claims ]---

// #region ---[ Initialize App ]---

turbo.initialize = async () => {
	logger.track(`📌  You are here → inside index.initialize()`);

	// ---------------------------------------------------------
	//    Initialize Permissions
	// ---------------------------------------------------------
	// turbo.permissions = require('@titanium/permissions');


	// ---------------------------------------------------------
	//    Ensure Authentication
	// ---------------------------------------------------------

	turbo.app.latest_username = Ti.App.Properties.getString(`turbo.app.latest_username`);
	await turbo.authentication.ensure();
	await turbo.openLoadingScreenAlt();

	if (!turbo.app.data.current_username) {
		logger.verbose(`🦠  turbo.app.data: ${JSON.stringify(turbo.app.data, null, 2)}`);
		// shouldn't ever be here...
		turbo.tracker.error(`current username is not found.`);
		throw new Error(`current username is not found.`);
	}

	const load_user = async () => {
		logger.track(`📌  You are here → index.load_user`);
		turbo.msgLoadingScreenAlt(`Loading user...`);
		const user = await turbo.api.employees.getMe()
			.catch(error => {
				// alert(error);
				alert(`User could not be loaded from API`);
				logger.error(`Error calling turbo.api.employees.getMe()`, error);
				turbo.tracker.error(error);
				// throw error;
				return;
			});
		logger.verbose(`🦠  user: ${JSON.stringify(user, null, 2)}`);
		if (_.isNil(user)) {
			alert(`User could not be loaded from API`);
			const error = new Error(`User is null after calling turbo.api.employees.getMe()`);
			if (turbo.app.data.auth_token) {
				error.meta = {
					subject_id: turbo.app.data.auth_token.subject,
					roles:      _.get(turbo, `app.data.auth_token.access_token_jwt.realm_access.roles`),
				};
			}
			logger.error(`User is null after calling turbo.api.employees.getMe()`, error);
			turbo.tracker.error(error);
			return;
		}
		user.notices_submitted = user.notices_submitted || [];
		turbo.app.data.current_user = user;
		return user;
	};

	logger.verbose(`🦠  turbo.app.data.current_user: ${JSON.stringify(turbo.app.data.current_user, null, 2)}`);
	if (!turbo.app.data.current_user) {
		logger.track(`📌  you are here → awaiting load_user`);
		turbo.msgLoadingScreenAlt(`Loading profile...`);
		const user = await load_user();
		if (_.isNil(user)) {
			turbo.authentication.logout();
			return;
		}
	}

	turbo.msgLoadingScreenAlt(`Loading offices...`);
	await turbo.api.offices.query({ force: false });

	logger.debug(`🦠  turbo.app.data.offices.length: ${JSON.stringify(turbo.app.data.offices.length, null, 2)}`);

	turbo.msgLoadingScreenAlt(`Loading schedules...`);
	// await turbo.api.schedules.query();
	const loading_schedules = turbo.api.schedules.getMine({ force: true });

	if (!turbo.app.data.current_office) {
		turbo.app.data.current_office = _.find(turbo.app.data.offices, { id: turbo.app.data.current_user.office_id });
	}


	if (!turbo.app.data.current_office) {
		Alloy.open(`offices-select-full`);
	} else {
		turbo.notices.notice_ids.local = _.map(turbo.app.data.current_office.notice_sources || [], `sheetId`);
		turbo.msgLoadingScreenAlt(`Loading notices...`);
		// await turbo.notices.load({ force: true });
		await turbo.notices.load({ force: false });
		await turbo.notices.displayByTags([ turbo.notices.NOTICE_TAG_APP_LAUNCH_USER ]);
		await turbo.notices.displayByTags([ turbo.notices.NOTICE_TAG_SCHEDULED_USER ]);
		await loading_schedules;
		await turbo.open_primary_screen();
	}
};


// #endregion ---[ Initialize App ]---

// #region ---[ Initialize Authentication ]---

// ---------------------------------------------------------
//    Initialize Authentication
// ---------------------------------------------------------

let authenticationProvider;

const public_key = fs.readFileSync(`./keys/${turbo.OAUTH_PROVIDER}.pub`, `utf8`);

if (turbo.OAUTH_PROVIDER === `custom_oauth`) {

	authenticationProvider = AuthenticationOAuthProvider({
		baseUrl:        Ti.App.Properties.getString(`oauth-base-url`),
		tokenPath:      `/oauth/token`,
		defaultHeaders: { apikey: Ti.App.Properties.getString(`oauth-apikey`, ``) },
		client_id:      turbo.oauth_client_id,
		keyfile:        `/keys/${Ti.App.Properties.getString(`oauth-kid`, `default`)}.pub`,
		token:          turbo.app.data.auth_token,
	});

} else if (turbo.OAUTH_PROVIDER === `keycloak`) {

	authenticationProvider = new AuthenticationOAuthProvider(`code`, {
		callback_url: turbo.oauth_callback_url,
		client_id:    turbo.oauth_client_id,
		endpoints:    turbo.oauth_endpoints,
		public_key,
		token:        turbo.app.data.auth_token,
	});
}

turbo.authentication = new Authentication({ provider: authenticationProvider });

// #endregion ---[ Initialize Authentication ]---


// ---------------------------------------------------------
//    Opening window kicks off everything...
// ---------------------------------------------------------

$.index.addEventListener(`open`, async () => {
	logger.track(`📖  you are here → index.onOpen`);

	if (turbo.isFirstLaunchForMinorVersion) {
		await turbo.authentication.logout({ initialize: false });
	}

	await turbo.notices.load({ force: true });
	await turbo.notices.displayByTags([ turbo.notices.NOTICE_TAG_APP_LAUNCH_DEVICE ]);
	await turbo.notices.displayByTags([ turbo.notices.NOTICE_TAG_SCHEDULED_DEVICE ]);
	await turbo.checkForUpdates();
	await turbo.initialize()
		.catch(error => {
			console.error(error);
			logger.error(`Error initializing app`, error);
			turbo.tracker.error(error);
		});
});
