# Griffin Mobile App

![GitHub stars](https://img.shields.io/github/stars/axway-developer-relations/griffin-app-opensource?style=social)
![GitHub forks](https://img.shields.io/github/forks/axway-developer-relations/griffin-app-opensource?style=social)
![GitHub watchers](https://img.shields.io/github/watchers/axway-developer-relations/griffin-app-opensource?style=social)
[![Dependabot Status](https://api.dependabot.com/badges/status?host=github&repo=axway-developer-relations/griffin-app-opensource)](https://dependabot.com)

> The Griffin App is an open source mobile app specially designed to help you and your team transition back into the workplace as safely as possible. At Axway, we've used this app to help our own teams return safely — now, let us help you!


* [📓   &nbsp; Description](#--description)
* [🚀   &nbsp; Getting Started](#--getting-started)
* [✨   &nbsp;  Features](#--features)
* [🎓  &nbsp;  Learn More](#--learn-more)
	* [📚  &nbsp;  Related projects](#--related-projects)
		* [🎟️  &nbsp; Modules for Titanium Mobile](#️--modules-for-titanium-mobile)
		* [🎟️  &nbsp; Modules for Node.js and Titanium Mobile](#️--modules-for-nodejs-and-titanium-mobile)
		* [📦  &nbsp; Project Starter Kits](#--project-starter-kits)
* [📣  &nbsp; Feedback](#--feedback)
* [©️  &nbsp; Legal](#️--legal)


## 📓   &nbsp; Description

Cross-Platform native mobile app for managing the safe return of team members to the office.  It is built using `AMPLIFY Titanium` and other open-source products.  

## 🚀   &nbsp; Getting Started

<image align="left" src="https://cdn.secure-api.org/images/01_circled_100.png" height="30" width="30" />

Clone this GitHub repo

```bash
git clone git@github.com:axway-developer-relations/griffin-app-opensource.git
```

<image align="left" src="https://cdn.secure-api.org/images/02_circled_100.png" height="30" width="30" />

Install npm dependencies

```bash
pushd app
npm install
popd
```

<image align="left" src="https://cdn.secure-api.org/images/03_circled_100.png" height="30" width="30" />

Specify Google Sheets info `tiapp.xml`

> Google sheets can be used to create notices that can prompt the user for a response.  You will need to specify your Google Sheets API key and the ID of the Google Sheets spreadsheet that you are going to use.

```xml
	<!-- For use with in-app notices -->
	<property name="google-sheets-apikey">INSERT-GOOGLE-API-KEY-HERE</property>
	<property name="google-sheets-notices-global">GOOGLE-SHEET-ID</property>
```

<image align="left" src="https://cdn.secure-api.org/images/04_circled_100.png" height="30" width="30" />

Specify OAuth info `tiapp.xml`

> If you use Keycloak or similar OAuth server, you can specify the config settings here

```xml
	<!-- For use with OAuth Authentication -->
	<property name="oauth-base-url" type="string">https://auth-prod.acme.com/api/v1</property>
	<property name="oauth-callback" type="string">acme-prod://auth</property>
	<property name="oauth-realm">realm</property>
	<property name="app-display-name">Acme Office App</property>
	<property name="oauth-clientid">acme-app</property>
```

<image align="left" src="https://cdn.secure-api.org/images/05_circled_100.png" height="30" width="30" />

Specify Data API info in `tiapp.xml`

> Here you will specify the endpoint of the API project that you setup.  You can also include the API Key used with this endpoint.

```xml
	<!-- For use with data API -->
	<property name="data-api-baseurl" type="string">https://data-prod.acme.com/api/v1/</property>
	<property name="data-api-apikey" type="string">0123456789abcdefghijklmnopqrstuvwxyz</property>
	<property name="resources-api-baseurl" type="string">https://resources-prod.acme.com/api/v1/</property>
	<property name="articles-url" type="string">articles.json</property>
```

<image align="left" src="https://cdn.secure-api.org/images/06_circled_100.png" height="30" width="30" />

Compile and run on iOS simulator or Android emulator

```bash
npm run ios
npm run android
```


## ✨   &nbsp;  Features

* [x] Administrators can edit Office capacities
* [x] Administrators can require users to answer questions upon launch of app
* [x] Employees can select/change office locations
* [x] Employees can hide/share their name and schedule with peers
* [x] Employees can see office capacities for upcoming days at selected office
* [x] Employees can see names of peers (that have enabled sharing) scheduled at office
* [x] Employees can select which days they will be at office
   


## 🎓  &nbsp;  Learn More

⭐  &nbsp; [Axway Developer Blog](https://devblog.axway.com)   
⭐  &nbsp; [Axway Developer YouTube Channel](https://youtube.com/axwaydev)   
⭐  &nbsp; [Axway Developer Portal](https://developer.axway.com)   
⭐  &nbsp; [AMPLIFY Titanium GitHub Repo](https://github.com/appcelerator/titanium_mobile)   
⭐  &nbsp; [Titanium Alloy GitHub Repo](https://github.com/appcelerator/alloy)   
⭐  &nbsp; [Titanium Turbo GitHub Repo](https://github.com/brentonhouse/titanium-turbo)   


### 📚  &nbsp;  Related projects

⭐  &nbsp; [Titanium Mobile](https://www.npmjs.com/package/titanium) - Open-source tool for building powerful, cross-platform native apps with JavaScript.   
⭐  &nbsp; [Titanium Alloy](https://www.npmjs.com/package/alloy) - MVC framework built on top of Titanium Mobile.   
⭐  &nbsp; [Appcelerator CLI](https://www.npmjs.com/package/appcelerator) - Installer for the Appcelerator Platform tool   


#### 🎟️  &nbsp; Modules for Titanium Mobile

| project  	|  description 	|  npm	|
|---	|---  |---	|
| [@titanium/applesignin](https://www.npmjs.com/package/@titanium/applesignin)  	| Native modules that allows you to use the iOS 13+ Apple Sign In API with Axway Titanium native mobile apps.     	| [![@@titanium/applesignin](https://img.shields.io/npm/v/@titanium/applesignin.png)](https://www.npmjs.com/package/@titanium/applesignin)      |
| [@titanium/authentication](https://www.npmjs.com/package/@titanium/authentication)  	| Titanium native mobile authentication manager   	| [![@titanium/authentication](https://img.shields.io/npm/v/@titanium/authentication.png)](https://www.npmjs.com/package/@titanium/authentication)      |
| [@titanium/authentication-oauth](https://www.npmjs.com/package/@titanium/authentication-oauth)  	| Titanium native mobile OAuth plugin for authentication manager    	| [![@titanium/authentication-oauth](https://img.shields.io/npm/v/@titanium/authentication-oauth.png)](https://www.npmjs.com/package/@titanium/authentication-oauth)      |
| [@titanium/calendar-picker](https://www.npmjs.com/package/@titanium/calendar-picker)  	| Turbo widget that allows you to pick dates from a calendar with Axway Titanium.      	| [![@titanium/calendar-picker](https://img.shields.io/npm/v/@titanium/calendar-picker.png)](https://www.npmjs.com/package/@titanium/calendar-picker)      |
| [@titanium/coremotion](https://www.npmjs.com/package/@titanium/coremotion)  	|  Native modules that allows you to use iOS CoreMotion framework with Axway Titanium native mobile apps.     	| [![@titanium/coremotion](https://img.shields.io/npm/v/@titanium/coremotion.png)](https://www.npmjs.com/package/@titanium/coremotion)      |
| [@titanium/essentials](https://www.npmjs.com/package/@titanium/essentials)  	| The <u>Essential Toolkit</u> for Titanium Turbo Native Mobile Apps       	| [![@titanium/essentials](https://img.shields.io/npm/v/@titanium/essentials.png)](https://www.npmjs.com/package/@titanium/essentials)      |
| [@titanium/icloud](https://www.npmjs.com/package/@titanium/icloud)  	|  Native module that allows you to use the Apple iCloud framework with Axway Titanium native mobile apps.   	| [![@titanium/icloud](https://img.shields.io/npm/v/@titanium/icloud.png)](https://www.npmjs.com/package/@titanium/icloud)      |
| [@titanium/identity](https://www.npmjs.com/package/@titanium/identity)  	|  Native modules to add Fingerprint/FaceId/keychain access to Titanium native mobile apps   	| [![@titanium/identity](https://img.shields.io/npm/v/@titanium/identity.png)](https://www.npmjs.com/package/@titanium/identity)      |
| [@titanium/facebook](https://www.npmjs.com/package/@titanium/facebook)  	|  Native modules that allows you to use Facebook SDK with Axway Titanium native mobile apps.    	| [![@titanium/facebook](https://img.shields.io/npm/v/@titanium/facebook.png)](https://www.npmjs.com/package/@titanium/facebook)      |
| [@titanium/googlesignin](https://www.npmjs.com/package/@titanium/googlesignin)  	| Native modules that allows you to use the Google Sign-in SDK with Axway Titanium native mobile apps.    	| [![@titanium/googlesignin](https://img.shields.io/npm/v/@titanium/googlesignin.png)](https://www.npmjs.com/package/@titanium/googlesignin)      |
| [@titanium/lottie](https://www.npmjs.com/package/@titanium/lottie)  	| Native modules that allows you to use Airbnb Lottie animations with Axway Titanium native mobile apps.      	| [![@titanium/lottie](https://img.shields.io/npm/v/@titanium/lottie.png)](https://www.npmjs.com/package/@titanium/lottie)      |
| [@titanium/observer](https://www.npmjs.com/package/@titanium/observer)  	| Repackaging of nx-js/observer-util for Titanium Native Mobile        	| [![@titanium/observer](https://img.shields.io/npm/v/@titanium/observer.png)](https://www.npmjs.com/package/@titanium/observer)      |
| [@titanium/please](https://www.npmjs.com/package/@titanium/please)  	|  Titanium native mobile library for politely requesting stuff from the internets   	| [![@titanium/please](https://img.shields.io/npm/v/@titanium/please.png)](https://www.npmjs.com/package/@titanium/please)      |
| [@titanium/polyfill](https://www.npmjs.com/package/@titanium/polyfill)  	|  Titanium native mobile polyfills necessary to use packages that depend on Node.js modules  	| [![@titanium/polyfill](https://img.shields.io/npm/v/@titanium/polyfill.png)](https://www.npmjs.com/package/@titanium/polyfill)      |
| [@titanium/turbo](https://www.npmjs.com/package/@titanium/turbo)  	|  🚀 Turbo is the awesome framework for turbo charging your Titanium cross-platform native mobile app development! | [![@titanium/turbo](https://img.shields.io/npm/v/@titanium/turbo.png)](https://www.npmjs.com/package/@titanium/turbo)      |
| [@titanium/updater](https://www.npmjs.com/package/@titanium/updater)  	|   Titanium native mobile widget to check for app updates  | [![@titanium/updater](https://img.shields.io/npm/v/@titanium/updater.png)](https://www.npmjs.com/package/@titanium/updater)      |
| [@titanium/webdialog](https://www.npmjs.com/package/@titanium/webdialog)  	|    Native modules that allows you to use native SFSafariViewController (iOS) and Chrome Pages (Android) with Axway Titanium native mobile apps. | [![@titanium/webdialog](https://img.shields.io/npm/v/@titanium/webdialog.png)](https://www.npmjs.com/package/@titanium/webdialog)      |



#### 🎟️  &nbsp; Modules for Node.js and Titanium Mobile

| project  	|  description 	|  npm	|
|---	|---  |---	|
| [@geek/cache](https://www.npmjs.com/package/@geek/cache)  	| Caching module for Node.js and Axway Titanium  	| [![@geek/cache](https://img.shields.io/npm/v/@geek/cache.png)](https://www.npmjs.com/package/@geek/cache)      |
| [@geek/jsonc](https://www.npmjs.com/package/@geek/cache)  	| JSONC and JSON utilities for JavaScript with Node.js and Axway Titanium.  	| [![@geek/jsonc](https://img.shields.io/npm/v/@geek/jsonc.png)](https://www.npmjs.com/package/@geek/jsonc)      |
| [@geek/jwt](https://www.npmjs.com/package/@geek/jwt) 	| JWT parser for JavaScript Node.js and Titanium native mobile  |  [![@geek/jwt](https://img.shields.io/npm/v/@geek/jwt.png)](https://www.npmjs.com/package/@geek/jwt)     |
| [@geek/logger](https://www.npmjs.com/package/@geek/logger) 	| Logging module for Node.js and Axway Titanium  |   [![@geek/logger](https://img.shields.io/npm/v/@geek/logger.png)](https://www.npmjs.com/package/@geek/logger)        |
| [@geek/mobile](https://www.npmjs.com/package/@geek/mobile)  	| Toolkit for creating, building, and managing mobile app projects.  	| [![@geek/mobile](https://img.shields.io/npm/v/@geek/mobile.png)](https://www.npmjs.com/package/@geek/mobile)    	|
| [@geek/retry](https://www.npmjs.com/package/@geek/retry) 	| Retry JavaScript functions and promises in Node.js and Axway Titanium  |   [![@geek/retry](https://img.shields.io/npm/v/@geek/retry.png)](https://www.npmjs.com/package/@geek/retry)        |


#### 📦  &nbsp; Project Starter Kits

| project  	|  description 	|  npm	|
|---	|---  |---	|
| [Titanium Turbo Template (Default)](https://www.npmjs.com/package/@titanium/template-turbo-default)  	| Template for default Turbo app.  Based on the basic Alloy Template + some extra goodies.  	| [![@titanium/template-turbo-default](https://img.shields.io/npm/v/@titanium/template-turbo-default.png)](https://www.npmjs.com/package/@titanium/template-turbo-default)      |
| [Titanium Turbo Template (Next)](https://www.npmjs.com/package/@titanium/template-turbo-next)  	| Template for Titanium Turbo app (with extras).  Based on the default Turbo Template + some extras.   	| [![@titanium/template-turbo-next](https://img.shields.io/npm/v/@titanium/template-turbo-next.png)](https://www.npmjs.com/package/@titanium/template-turbo-next)      |
| [Titanium Turbo Template (Fully Loaded)](https://www.npmjs.com/package/@titanium/template-turbo-fully-loaded)  	| Template for Titanium Turbo app with all the bells and whistles!  	| [![@titanium/template-turbo-fully-loaded](https://img.shields.io/npm/v/@titanium/template-turbo-fully-loaded.png)](https://www.npmjs.com/package/@titanium/template-turbo-fully-loaded)      |



## 📣  &nbsp; Feedback

Have an idea or a comment?  [Join in the conversation here](https://github.com/axway-developer-relations/griffin-app-opensource/issues)! 

## ©️  &nbsp; Legal

App Code is licensed under MIT by Axway, Inc. All Rights Reserved.

Alloy is developed by Appcelerator and the community and is Copyright (c) 2012-present by Axway, Inc. All Rights Reserved.

Alloy is made available under the Apache Public License, version 2. See their license file for more information.

Titanium is Copyright (c) 2008-present by Axway, Inc. All Rights Reserved.

Titanium is licensed under the Apache Public License (Version 2). Please see the the Titanium license file for the full license.

Appcelerator is a registered trademark of Axway, Inc. Titanium is a registered trademark of Axway, Inc. Please see the LEGAL information about using trademarks, privacy policy, terms of usage and other legal information at http://www.appcelerator.com/legal.