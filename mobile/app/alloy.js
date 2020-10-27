(async global => {

	const fs = require(`fs`);
	const { observable } = require(`@titanium/observer`);
	const { retry } = require(`@geek/retry`);

	turbo.app = observable({ data: { hash: {} } });

	// #region ---[ Define Constants ]---

	Alloy.MANUAL_OPEN = true;

	const IS_DEV = (Ti.App.deployType === `development`);
	const IS_PROD = ! IS_DEV;
	turbo.API_VERBOSE_MODE = process.env.API_VERBOSE_MODE = IS_DEV;
	turbo.DEBUG_UI_MODE = false;
	turbo.SCREENS_LOGIN = `login2`;
	turbo.SCREENS_MAIN = `app`;
	turbo.SCREENS_LOADING = `loading`;
	turbo.SCREENS_LOADING_ALT = `loading3`;

	// #endregion ---[ Define Constants ]---

	// ---------------------------------------------------------
	//    Configuration order:
	//    - Bluebird Promises
	//    - Exception Handling
	//    - Events  (initialized in Essentials)
	//    - Logging
	//    - Essentials
	//    - Event Tracker
	//    - Themes and Colors
	// ---------------------------------------------------------


	// #region ---[ Configure Bluebird Promises ]---

	// ---------------------------------------------------------
	//    Configure Bluebird Promises
	// ---------------------------------------------------------
	global.Promise = require(`bluebird`);

	Promise.config({
		warnings:        false, // Enable warnings
		// longStackTraces: ENV_DEV,  // Enable long stack traces for dev builds
		longStackTraces: true, // Forcing log stack trace for all builds
		cancellation:    true, // Enable cancellation
		monitoring:      true, // Enable monitoring
	});

	// #endregion ---[ Configure Bluebird Promises ]---

	// #region ---[ Configure Exception Handlers ]---

	// ---------------------------------------------------------
	//    Configure Exception Handlers
	// ---------------------------------------------------------
	require(`/exceptions`);

	// #endregion ---[ Configure Exception Handlers ]---

	// #region ---[ Configure Logging Manager ]---

	// ---------------------------------------------------------
	//    Configure Logging Manager
	// ---------------------------------------------------------

	const Logger = require(`@geek/logger`);

	const consoleStore = new Logger.stores.Console({
		// default_format: 'timestamp_message_args_color',
		default_format: `debug_message_color`,
		extras:         IS_DEV ? [ `track`, `http`, `event`, `secret` ] : [ `track`, `event` ],
		level_formats:  {
			event: `events_color_simple`,
			// track: 'timestamp_message_color',
			// track: 'timestamp_message_args_color',
			track: `debug_message_color`,
			error: `debug_message_args_color`,
		},
	});
	const titaniumStore = new Logger.stores.Titanium();

	const defaultLogger = new Logger({
		namespace: `app:default`,
		stores:    [ consoleStore, titaniumStore ],
		level:     turbo.API_VERBOSE_MODE ? `silly` : `info`,
		meta:      () => {
			return {
				user_id:             _.get(turbo, `app.data.current_user.id`),
				office_id:           _.get(turbo, `app.data.current_office.id`),
				device_model_name:   turbo.device_model_name,
				network_type_name:   turbo.network_type_name,
				device_manufacturer: turbo.device_manufacturer,
			};
		},
	});

	Logger.defaultLogger = defaultLogger;

	const logger = Logger.createLogger(`app:alloy`, { meta: { filename: __filename } });
	logger.track(`logger configured`);


	// disable all namespaces
	// Logger.filter([ '!**' ]);

	// enable all namespaces
	const filters = [ `**` ];

	if (IS_PROD) {
		filters.push(`!@titanium/please`);
		filters.push(`!@titanium/notices`);
		filters.push(`!@geek/cache`);
	} else if (!turbo.API_VERBOSE_MODE) {
		filters.push(`!@titanium/please`);
	}

	Logger.filter(filters);

	// #endregion ---[ Configure Logging Manager ]---

	// #region ---[ Initialize Titanium Essentials ]---

	// ---------------------------------------------------------
	//    Initialize Titanium Essentials
	// ---------------------------------------------------------

	require(`@titanium/essentials`);

	// #endregion ---[ Initialize Titanium Essentials ]---

	// #region ---[ Load Stored Data ]---

	turbo.app.data.current_username = Ti.App.Properties.getString(`turbo.app.data.current_username`);
	turbo.app.latest_username = Ti.App.Properties.getString(`turbo.app.latest_username`);
	turbo.app.data.current_user = Ti.App.Properties.getObject(`turbo.app.data.current_user`);

	// #endregion ---[ Load Stored Data ]---

	// #region ---[ Configure ACA Adapter ]---

	// ---------------------------------------------------------
	//    Configure ACA Adapter
	// ---------------------------------------------------------

	try {
		Alloy.Globals.aca = require(`com.appcelerator.aca`);
	} catch (error) {

		logger.error(`Error loading module com.appcelerator.aca`, error);
		Alloy.Globals.aca = {
			logHandledException: error => { console.debug(`aca.logHandledException(${error})`); },
			leaveBreadcrumb:     (breadcrumb, data) => { console.debug(`aca.leaveBreadcrumb(${breadcrumb})`); },
			setUsername:         username => { console.debug(`aca.setUsername(${username})`); },
			setMetadata:         (key, value) => { console.debug(`aca.setMetadata(${key}:${value})`); },
			setOptOutStatus:     optOutStatus => { console.debug(`aca.setOptOutStatus(${optOutStatus})`); },
			getOptOutStatus:     () => { return false; },
			setBreadcrumbLimit:  (breadcrumbLimit = 100) => { console.debug(`aca.setBreadcrumbLimit(${breadcrumbLimit})`); },
		};
	}


	// #endregion ---[ Configure ACA Adapter ]---

	// #region ---[ Configure Event Tracker ]---

	// ---------------------------------------------------------
	//    Configure Event Tracker
	// ---------------------------------------------------------
	turbo.tracker = {
		event: async (name, data = {}) => {
			await logger.event(name, data);
		},
		app_open:                       async () => turbo.tracker.event(`app_open`),
		app_close:                      async () => turbo.tracker.event(`app_close`),
		app_resume:                     async () => turbo.tracker.event(`app_resume`),
		app_resumed:                    async () => turbo.tracker.event(`app_resumed`),
		app_pause:                      async () => turbo.tracker.event(`app_pause`),
		app_paused:                     async () => turbo.tracker.event(`app_paused`),
		app_first_launch_ever:          async () => turbo.tracker.event(`app_first_launch_ever`),
		app_first_launch_version:       async () => turbo.tracker.event(`app_first_launch_version`),
		app_first_launch_major_version: async () => turbo.tracker.event(`app_first_launch_major_version`),
		app_first_launch_minor_version: async () => turbo.tracker.event(`app_first_launch_minor_version`),
		app_first_launch_update:        async () => turbo.tracker.event(`app_first_launch_update`),
		auth_prompt:                    async () => turbo.tracker.event(`auth_prompt`),
		auth_success:                   async () => turbo.tracker.event(`auth_success`),
		auth_refresh:                   async () => turbo.tracker.event(`auth_refresh`),
		auth_signout:                   async () => turbo.tracker.event(`auth_signout`),
		legal_agree:                    async () => turbo.tracker.event(`legal_agree`),
		schedule_update:                async () => turbo.tracker.event(`schedule_update`),
		app_update_check:               async () => turbo.tracker.event(`app_update_check`),
		open_teams:                     async () => turbo.tracker.event(`open_teams`),
		office_select:                  async ({ old_office_id, new_office_id } = {}) => turbo.tracker.event(`office_select`, { old_office_id, new_office_id, event_value: new_office_id }),
		office_capacity_add:            async ({ start_date, end_date, limit } = {}) => turbo.tracker.event(`office_capacity_add`, { start_date, end_date, limit }),
		office_capacity_remove:         async ({ start_date, end_date, limit } = {}) => turbo.tracker.event(`office_capacity_remove`, { start_date, end_date, limit }),
		article_open:                   async article_id => turbo.tracker.event(`article_open`, {	article_id, event_value: article_id }),
		schedule_employees_view:        async date => turbo.tracker.event(`schedule_employees_view`, {	date }),
		screen_view:                    async screen_name => turbo.tracker.event(`screen_view`, { screen_name,  event_value: screen_name }),
		toggle_beta:                    async () => turbo.tracker.event(`toggle_beta`, { allow_beta_updates: turbo.allow_beta_updates, event_value: turbo.allow_beta_updates }),
		toggle_anonymous:               async () => turbo.tracker.event(`toggle_anonymous`, { anonymize_name: turbo.app.data.current_user.anonymous, event_value: turbo.app.data.current_user.anonymous }),
		error:                          async error => turbo.tracker.event(`error`, error),

	};

	logger.debug(`🦠  turbo.app_version_previous: ${JSON.stringify(turbo.app_version_previous, null, 2)}`);
	logger.debug(`🦠  turbo.app_version_history: ${JSON.stringify(turbo.app_version_history, null, 2)}`);

	turbo.tracker.app_open();
	turbo.isFirstLaunchEver && turbo.tracker.app_first_launch_ever();
	turbo.isFirstLaunchForCurrentVersion && turbo.tracker.app_first_launch_version({ app_previous_version: turbo.app_version_previous, event_value: turbo.app_version_previous });
	turbo.isFirstLaunchAfterUpdate && turbo.tracker.app_first_launch_update({ app_previous_version: turbo.app_version_previous, event_value: turbo.app_version_previous  });
	turbo.isFirstLaunchForMajorVersion && turbo.tracker.app_first_launch_major_version({ app_previous_version: turbo.app_version_previous, event_value: turbo.app_version  });
	turbo.isFirstLaunchForMinorVersion && turbo.tracker.app_first_launch_minor_version({ app_previous_version: turbo.app_version_previous, event_value: turbo.app_version  });

	Ti.App.addEventListener(`close`, turbo.tracker.app_close);
	Ti.App.addEventListener(`resume`, turbo.tracker.app_resume);
	Ti.App.addEventListener(`resumed`, turbo.tracker.app_resumed);
	Ti.App.addEventListener(`pause`, turbo.tracker.app_pause);
	Ti.App.addEventListener(`paused`, turbo.tracker.app_paused);

	// #endregion ---[ Configure Event Tracker ]---

	// #region ---[ Configure Themes and Colors ]---

	// ---------------------------------------------------------
	//    Configure Themes and Colors
	// ---------------------------------------------------------

	const tinycolor = require(`@mobile/tinycolor2`);
	const initial_theme_name = Ti.App.Properties.getString(`initial-theme-name`, `default`);

	const jsonc_themes = fs.readFileSync(`./themes.jsonc`, `utf8`);
	const errors = [];

	turbo.themes = JSONC.parse(jsonc_themes, errors);
	if (errors.length) {
		console.error(errors);
	}

	turbo.setTheme = (theme_name = initial_theme_name) => {

		const theme = _.find(turbo.themes, { name: theme_name });
		const colors = theme.colors.light || theme.colors.dark;

		_.defaults(colors, {
			white:     `#fafafa`,
			black:     `#1b1b1b`,
			red:       `#dc3545`,
			blue:      `#007bff`,
			yellow:    `#ffc107`,
			green:     `#28a745`,
			cyan:      `#17a2b8`,
			secondary: tinycolor(colors.primary).lighten(35).toHexString(),
		});

		_.defaults(colors, {
			danger:  colors.red,
			warning: colors.yellow,
			success: colors.green,
			info:    colors.cyan,


			primary_disabled: tinycolor(colors.primary).lighten(30).toHexString(),
			primary_accent:   tinycolor(colors.primary).complement().toHexString(),
			primary_active:   tinycolor.mostReadable(colors.primary, [ colors.black, colors.white ], { includeFallbackColors: true }).toHexString(),

			background_disabled: tinycolor(colors.background).darken(30).toHexString(),
			background_accent:   tinycolor(colors.background).complement().toHexString(),
			background_active:   tinycolor.mostReadable(colors.background, [ colors.black, colors.white ], { includeFallbackColors: true }).toHexString(),

			surface_disabled: tinycolor(colors.surface).darken(30).toHexString(),
			surface_accent:   tinycolor(colors.surface).complement().toHexString(),
			surface_active:   tinycolor.mostReadable(colors.surface, [ colors.black, colors.white ], { includeFallbackColors: true }).toHexString(),

			secondary_disabled: tinycolor(colors.secondary).lighten(30).toHexString(),
			secondary_accent:   tinycolor(colors.secondary).complement().toHexString(),
			secondary_active:   tinycolor.mostReadable(colors.secondary, [ colors.black, colors.white ], { includeFallbackColors: true }).toHexString(),

		});


		_.defaults(colors, {
			surface_subtle:    tinycolor(colors.surface_active).lighten(25).toHexString(),
			background_subtle: tinycolor(colors.background_active).lighten(25).toHexString(),
			primary_subtle:    tinycolor(colors.primary_active).darken(25).toHexString(),
			secondary_subtle:  tinycolor(colors.secondary_active).darken(25).toHexString(),

			success_active: tinycolor.mostReadable(colors.success, [ colors.black, colors.white ], { includeFallbackColors: true }).toHexString(),
			error_active:   tinycolor.mostReadable(colors.error, [ colors.black, colors.white ], { includeFallbackColors: true }).toHexString(),
			warn_active:    tinycolor.mostReadable(colors.warn, [ colors.black, colors.white ], { includeFallbackColors: true }).toHexString(),
			info_active:    tinycolor.mostReadable(colors.info, [ colors.black, colors.white ], { includeFallbackColors: true }).toHexString(),


		});

		_.defaults(colors, { text: colors.surface_active });

		turbo.colors = colors;

	};

	turbo.setTheme();

	// #endregion ---[ Configure Themes and Colors ]---

	// #region ---[ Configure Font Awesome Icon Fonts ]---

	// ---------------------------------------------------------
	//    Configure Font Awesome Icon Fonts
	// ---------------------------------------------------------

	turbo.fonts[`FontAwesome-Regular`] = require(`/fonts/meta/FontAwesome-Regular`);
	turbo.fonts[`FontAwesome-Solid`] = require(`/fonts/meta/FontAwesome-Solid`);
	turbo.fonts[`FontAwesome-Light`] = require(`/fonts/meta/FontAwesome-Light`);

	// #endregion ---[ Configure Font Awesome Icon Fonts ]---

	// #region ---[ Configure Navigation ]---

	// ---------------------------------------------------------
	//    Configure Navigation
	// ---------------------------------------------------------

	turbo.openLoadingScreen = async message => {
		logger.track(`📌  you are here → turbo.openLoadingScreen(${message || ``})`);
		await Alloy.open(turbo.SCREENS_LOADING, { message });
	};

	turbo.openLoadingScreenAlt = async message => {
		logger.track(`📌  you are here → turbo.openLoadingScreenAlt(${message || ``})`);
		await Alloy.open(turbo.SCREENS_LOADING_ALT, { message });
	};

	turbo.msgLoadingScreenAlt = async message => {
		logger.track(`📌  you are here → turbo.msgLoadingScreenAlt(${message || ``})`);
		// console.warn(`🦠  turbo.SCREENS_LOADING_ALT: ${JSON.stringify(turbo.SCREENS_LOADING_ALT, null, 2)}`);
		// console.debug(`🦠  _.keys(Alloy.controllers): ${JSON.stringify(_.keys(Alloy.controllers), null, 2)}`);
		Alloy.Controllers[turbo.SCREENS_LOADING_ALT].updateMessage(message);
	};

	turbo.closeLoadingScreen = async () => {
		logger.track(`📌  you are here → turbo.closeLoadingScreen()`);
		Alloy.close(turbo.SCREENS_LOADING);
		// .timeout(2000)
		// .catch(Promise.TimeoutError, () => {
		// 	console.error('could not close window within 2000ms');
		// });
		logger.track(`📌  you are here → after close screens_loading`);
		Alloy.close(turbo.SCREENS_LOADING_ALT);
		logger.track(`📌  you are here → after close screens_loading_alt`);
	};

	turbo.openTabWindowHandler = (name, ...params) => _.wrap({ name, params }, turbo.openTabWindow);

	turbo.openTabWindow = async params => {
		logger.track(`📌  you are here → turbo.openTabWindow(${JSON.stringify(params)})`);
		turbo.feedback.medium();
		let name;
		if (typeof params === `string`) {
			name = params;
		} else if (typeof params === `object`) {
			params = { ...params };
			name = params.name;
			params.name = undefined;
		}

		if (typeof name !== `string`) {
			logger.debug(`🦠  typeof name: ${JSON.stringify(typeof name, null, 2)}`);
			logger.debug(`🦠  name: ${JSON.stringify(name, null, 2)}`);
			logger.debug(`🦠  params: ${JSON.stringify(params, null, 2)}`);
			throw new Error(`Invalid name passed to turbo.openTabWindow`);
		}

		const window = Alloy.createController(name, params).getView();
		Alloy.Controllers[turbo.SCREENS_MAIN].getView().activeTab.open(window);
	};

	turbo.closeTabWindow = async window => {

		OS_IOS && Alloy.Controllers.mainWindow.getView().activeTab.close(window);
		OS_ANDROID && Alloy.Controllers.mainWindow.getView().activeTab.close();

	};

	turbo.open_primary_screen = async () => {
		logger.track(`📌  You are here → index.open_primary_screen`);
		turbo.msgLoadingScreenAlt(`Loading reports...`);
		await turbo.api.reports.query();
		turbo.msgLoadingScreenAlt(`Loading articles...`);
		// await turbo.api.articles.query();
		await retry(() => turbo.api.articles.query(), { retries: 1, delay: 100 });
		turbo.closeLoadingScreen();
		await Alloy.open(turbo.SCREENS_MAIN);

	};

	// #endregion ---[ Configure Navigation ]---

	// #region ---[ Configure OAuth Authentication Endpoints ]---

	// ---------------------------------------------------------
	//    Configure OAuth Authentication Endpoints
	// ---------------------------------------------------------

	turbo.OAUTH_PROVIDER = `keycloak`;


	turbo.logout = async () => {
		return turbo.authentication.logout();
	};


	const oauth_base_url = Ti.App.Properties.getString(`oauth-base-url`);
	const oauth_realm = Ti.App.Properties.getString(`oauth-realm`);
	turbo.oauth_callback_url = Ti.App.Properties.getString(`oauth-callback`);
	turbo.oauth_client_id = Ti.App.Properties.getString(`oauth-clientid`);


	if (turbo.OAUTH_PROVIDER === `keycloak`) {
		turbo.oauth_endpoints = {
			auth:      `${oauth_base_url}/auth/realms/${oauth_realm}/protocol/openid-connect/auth`,
			certs:     `${oauth_base_url}/auth/realms/${oauth_realm}/protocol/openid-connect/certs`,
			logout:    `${oauth_base_url}/auth/realms/${oauth_realm}/protocol/openid-connect/logout`,
			token:     `${oauth_base_url}/auth/realms/${oauth_realm}/protocol/openid-connect/token`,
			userinfo:  `${oauth_base_url}/auth/realms/${oauth_realm}/protocol/openid-connect/userinfo`,
			wellKnown: `${oauth_base_url}/auth/realms/${oauth_realm}/.well-known/openid-configuration`,
		};
	} else {

		//TODO:  If you are using something other than keycloak, you will need to define your endpoints to use the OAuth library
		turbo.oauth_endpoints = {};
	}

	// #endregion ---[ Configure OAuth Authentication Endpoints ]---

	// Initialize Permissions Module
	// const { camera, notifications } = require(`@titanium/permissions`);
	// await camera.ensure();
	// await notifications.ensure();

	Alloy.open(`index`);

})(this);
