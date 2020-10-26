const Alloy = require(`/alloy`);
const logger = require(`@geek/logger`).createLogger(`app:authentication`, { meta: { filename: __filename } });

logger.track(`📌  You are here → inside Authentication`);

const { reset, bgRed, white } = require(`ansi-colors`);
// const colorJson = require('color-json');

const oauth_name = Ti.App.Properties.getString(`oauth-name`, ``);

const AuthenticationManager = require(`@titanium/authentication`);
const TurboApi = require(`/apis/TurboApi`);
const SheetsApi = require(`/apis/SheetsApi`);
const JsonApi = require(`/apis/JsonApi`);


// const getCurrentAuthToken = () => _.get(turbo, 'app.data.auth_token');
const updateAuthToken = auth_token => {
	// logger.debug(`🦠  auth_token: ${JSON.stringify(auth_token, null, 2)}`);
	// turbo.app.data.auth_token = auth_token;
	if (auth_token) {
		turbo.app.latest_username = auth_token.user.username;
		turbo.app.data.current_username = auth_token.user.username;
		turbo.app.data.auth_token = auth_token;

	} else {
		// turbo.app.data.current_username = undefined;
	}


};


class Authentication {

	constructor({ provider, options = {} } = {}) {


		this.authenticationManager = new AuthenticationManager({ provider, options });

		logger.verbose(`🦠  this.authenticationManager.token: ${JSON.stringify(this.authenticationManager.token, null, 2)}`);

		updateAuthToken(this.token);

		// Object.defineProperty(this, 'token', {
		// 	enumerable: true,
		// 	get () {
		// 		return this.authenticationManager.token;
		// 	},
		// });

	}

	get token() {
		logger.track(`📌  you are here → Authentication.token()`);
		return this.authenticationManager.token;
	}

	get username() {
		logger.track(`📌  you are here → Authentication.username()`);
		return _.get(this, `token.user.username`);
	}

	async renew() {
		logger.track(`📌  you are here → Authentication.renew()`);
		return await this.authenticationManager.renew();
	}

	async isAuthenticated() {
		logger.track(`📌  You are here → Authentication.isAuthenticated()`);
		logger.debug(`🦠  Authentication.username: ${this.username}`);

		logger.debug(`🦠  typeof this.token: ${JSON.stringify(typeof this.token, null, 2)}`);
		if (_.isEmpty(this.username) || _.isNil(this.token)) {
			logger.debug(`🦠  username and auth_token exists: false`);
			return false;
		}

		logger.secret(`🚨  ${bgRed.white(`Authentication.token:`)}\n${JSONC.colorify(this.token, null, 2)}`);

		logger.debug(`🦠  username and auth_token exists: true`);

		const isAccessTokenExpired = this.token.isAccessTokenExpired();

		logger.debug(`🦠  isAccessTokenExpired: ${JSON.stringify(isAccessTokenExpired, null, 2)}`);

		if (isAccessTokenExpired) {

			logger.debug(`🔑 \x1b[43m this.access_token_expires_at.fromNow():\x1b[0m  ${JSON.stringify(this.token.access_token_expires_at.fromNow(), null, 2)}`);

			if (this.token.isRefreshTokenExpired()) {
				logger.debug(`🦠  isRefreshTokenExpired: true`);
				logger.debug(`🔑 \x1b[43m this.refresh_token_expires_at.fromNow():\x1b[0m  ${JSON.stringify(this.token.refresh_token_expires_at.fromNow(), null, 2)}`);
				return false;
			} else {
				logger.trace(`📌  you are here → renewing access token`);

				const renewed_token = await this.renew()
					.catch(error => {
						logger.error(error);
						logger.error(`Error renewing token`, error);
						turbo.tracker.error(`Error renewing token`, error);
						alert(`\n${oauth_name} Authentication Error\n\nPlease try again.`);
					});

				if (_.isNil(renewed_token)) {
					logger.debug(`🦠  renewed_token exists: false`);
					return false;
				}

				updateAuthToken(renewed_token);

				if (_.isNil(this.token)) {
					logger.debug(`🦠  auth_token exists: false`);
					return false;
				}

				if (this.token.isAccessTokenExpired()) {
					logger.debug(`🦠  access token is still expired`);
					return false;
				} else {
					updateAuthToken(this.token);
					return true;
				}

			}
		} else {
			updateAuthToken(this.token);
			return true;
		}

	}


	// ---------------------------------------------------------
	//    Ensure that user is authenticated
	// ---------------------------------------------------------
	async ensure() {

		logger.track(`📌  You are here → Authentication.ensure()`);
		const authenticated = await this.isAuthenticated();

		logger.debug(`🦠  authenticated: ${JSON.stringify(authenticated, null, 2)}`);

		if (! authenticated) {
			await this.launch();
			logger.track(`📌  you are here → after await this.launch()`);
			turbo.tracker.auth_success();
			logger.track(`📌  you are here → awaiting turbo.closeLoadingScreen()`);
			await turbo.closeLoadingScreen();
			logger.track(`📌  you are here → loading screens closed`);
			return true;
		} else {
			this.renew()
				.catch(error => {
					logger.error(`🦠  token renew error: ${JSON.stringify(error, null, 2)}`);
					logger.error(`Error renewing token`, error);
					turbo.tracker.error(error);

					alert(`\n${oauth_name} Authentication Error\n\nAttempting to recover.`);
				});
			logger.track(`📌  You are here → Exiting Authentication.ensure()`);
			return true;
		}

	}


	// ---------------------------------------------------------
	//    Launch the authentication process
	// ---------------------------------------------------------
	async launch() {

		logger.track(`📌  You are here → Authentication.launch()`);
		turbo.tracker.auth_prompt();

		switch (turbo.OAUTH_PROVIDER) {

			case `custom_oauth`:

				turbo.closeLoadingScreen();
				return Alloy.open(turbo.SCREENS_LOGIN);

			case `keycloak`:

				turbo.openLoadingScreen();

				// this function will complete when authenticated
				const auth_token = await this.authenticationManager.authenticate()
					.catch(error => {
						logger.error(`Error calling authenticationManager.authenticate()`, error);
						console.error(error);
						turbo.tracker.error(error);
					});
				updateAuthToken(auth_token);
				logger.track(`📌  You are here → Exiting Authentication.launch()`);
				return;

			default:
		}

	}

	// ---------------------------------------------------------
	//    Sign out the user
	// ---------------------------------------------------------
	async logout({ initialize = true } = {}) {

		logger.track(`📌  You are here → Authentication.logout()`);
		turbo.feedback.medium();

		await turbo.openLoadingScreen();
		Ti.Network.removeAllHTTPCookies();
		await turbo.tracker.auth_signout();

		logger.track(`📌  you are here → awaiting authenticationManager.logout()`);

		await this.authenticationManager.logout(Authentication.currentAuthToken);

		logger.track(`📌  you are here → after authenticationManger.logout()`);

		// Clear all saved data
		turbo.app.data = {};

		TurboApi.clearCache();
		SheetsApi.clearCache();
		JsonApi.clearCache();


		// Clear out each Backbone collection
		_.forEach(_.without(_.keys(Alloy.Collections), `instance`), collectionName => {
			Alloy.Collections[collectionName].reset([]);
		});

		// manually reload static articles for now
		Alloy.Collections.articles.reset(require(`/data/latest-articles.json`));


		Ti.App.Properties.removeProperty(`allow_beta_updates`);
		turbo.allow_beta_updates = false;

		try {

			// TODO:  This needs to move out of the authentication class
			// logger.debug(`🦠  turbo.SCREENS_MAIN: ${JSON.stringify(turbo.SCREENS_MAIN, null, 2)}`);
			const tabGroupController = Alloy.Controllers[turbo.SCREENS_MAIN];
			if (tabGroupController) {
				const tabGroup = tabGroupController.getView();

				tabGroup.activeTab = 0;
				_.forEach(tabGroup.tabs, tab => {
					OS_IOS && tab.popToRootWindow();
				});
				tabGroup.activeTab = 0;
			}

		} catch (error) {
			console.error(error);
			logger.error(error);
			turbo.tracker.error(error);
		}

		if (initialize) {
			return turbo.initialize()
				.catch(error => {
					console.error(error);
					logger.error(`Error initializing app`, error);
					turbo.tracker.error(error);
				});
		}


	}

}

module.exports = Authentication;

