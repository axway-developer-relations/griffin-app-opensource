# Griffin Mobile API

![GitHub stars](https://img.shields.io/github/stars/axway-developer-relations/griffin-app-opensource?style=social)
![GitHub forks](https://img.shields.io/github/forks/axway-developer-relations/griffin-app-opensource?style=social)
![GitHub watchers](https://img.shields.io/github/watchers/axway-developer-relations/griffin-app-opensource?style=social)
[![Dependabot Status](https://api.dependabot.com/badges/status?host=github&repo=axway-developer-relations/griffin-app-opensource)](https://dependabot.com)

> The Griffin App API is an open source API specially designed to work with the Griffin App mobile project.  The goal of this App and API is to help you and your team transition back into the workplace as safely as possible. At Axway, we've used this app to help our own teams return safely — now, let us help you!


* [📓   &nbsp; Description](#--description)
* [🚀   &nbsp; Getting Started](#--getting-started)
* [✨   &nbsp;  Features](#--features)
* [🎓  &nbsp;  Learn More](#--learn-more)
	* [📚  &nbsp;  Related projects](#--related-projects)
		* [🎟️  &nbsp; Modules for Node.js and Titanium Mobile](#️--modules-for-nodejs-and-titanium-mobile)
* [📣  &nbsp; Feedback](#--feedback)
* [©️  &nbsp; Legal](#️--legal)


## 📓   &nbsp; Description

Open-source API for managing the safe return of team members to the office.  It is built using `AMPLIFY API Builder` and several open-source products.  

## 🚀   &nbsp; Getting Started

<image align="left" src="https://cdn.secure-api.org/images/01_circled_100.png" height="30" width="30" />

Clone this GitHub repo

```bash
git clone git@github.com:axway-developer-relations/griffin-app-opensource.git
```

<image align="left" src="https://cdn.secure-api.org/images/02_circled_100.png" height="30" width="30" />

Install npm dependencies

```bash
pushd api
npm install
popd
```

<image align="left" src="https://cdn.secure-api.org/images/03_circled_100.png" height="30" width="30" />

Save Google Service Account JSON file

> Save your `google-service-account.json` file in the `/lib/keys` directory so that your API can read/write to Google Sheets API.  For more information about creating the file, [please reference Google's documentation here.](https://cloud.google.com/iam/docs/creating-managing-service-account-keys)


<image align="left" src="https://cdn.secure-api.org/images/04_circled_100.png" height="30" width="30" />

Specify API Builder url and keys info in the `.env` file

> The API key you specify here will be used to secure your API


```properties
	API_BUILDER_APIKEY=EnSQVDkhe6X9SKYr5tWlAOKFZhGVpyqFfSanFHOpRPk
```

<image align="left" src="https://cdn.secure-api.org/images/05_circled_100.png" height="30" width="30" />

Specify Axway AMPLIFY MBS (Arrow DB) url and API keys

> You can retrieve your API Keys and info after logging into https://platform.axway.com


```properties
	ARROWDB1_SERVER_URL=https://api.cloud.appcelerator.com/v1/objects/
	ARROWDB1_APIKEY=abcdefghijklmnopqrstuvwxyz1234567890
	ARROWDB1_SESSION_ID=abcdefghijklmnopqrstuvwxyz1234567890
```

<image align="left" src="https://cdn.secure-api.org/images/06_circled_100.png" height="30" width="30" />

Specify logz.io key info in the `.env` file

> If you use logz.io or a similar distribution logging solution, you can specify the config settings here

```properties
	LOGZIO_APIKEY=abcdefghijklmnopqrstuvwxyz1234567890
```

<image align="left" src="https://cdn.secure-api.org/images/07_circled_100.png" height="30" width="30" />

Session Encryption Keys

> If you wish to change the Session encryption keys used by API Builder, you can specify them in your `.env` file.

```properties
	SESSION_ENCRYPTION_KEY=njMgwXv3rZmnJ3liLFY9yNfJd5hod5RhLr6ZuXsIsIw=
	SESSION_SIGNATURE_KEY=Y79U/UsYvDSXRS1q/JOlavZraExuXIAnMvcDOZ8cdZSMwiuAQrZjoXFyqGmJ1eTL7p2oHJwhPrYi4g97l3Rzkw==
	SESSION_SECRET=PkK6LErMwTZcGzfSBKR39lDrfLpu3nmj
```

> If you want to set these using Node.js, you can do so like this:

```JavaScript
{
	encryptionKey: crypto.randomBytes(32).toString('base64'),
	signatureKey: crypto.randomBytes(64).toString('base64'),
	secret: crypto.randomBytes(24).toString('base64'),
}
```

<image align="left" src="https://cdn.secure-api.org/images/08_circled_100.png" height="30" width="30" />

Compile and run API locally.

> [Please see API Builder readme](./api_builder_readme.md) for more information about using API Builder

```bash
npm start
```


<image align="left" src="https://cdn.secure-api.org/images/09_circled_100.png" height="30" width="30" />

Publish to AMPLIFY ARS when you are ready to go live


```bash
npm install acs
acs login
acs publish
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
⭐  &nbsp; [Axway AMPLIFY API Builder](https://www.axway.com/en/products/api-management/build-apis)   
⭐  &nbsp; [Axway Corporate Blog](https://blog.axway.com)   
⭐  &nbsp; [Axway Developer YouTube Channel](https://youtube.com/axwaydev)   
⭐  &nbsp; [Axway Developer Portal](https://developer.axway.com)   



### 📚  &nbsp;  Related projects

⭐  &nbsp; [AMPLIFY API Builder CLI](https://www.npmjs.com/package/@axway/api-builder) - Installer for the AMPLIFY API Builder CLI tool   
⭐  &nbsp; [AMPLIFY Runtime CLI](https://www.npmjs.com/package/acs) - Installer for the AMPLIFY Runtime CLI tool   
⭐  &nbsp; [Titanium Mobile](https://www.npmjs.com/package/titanium) - Open-source tool for building powerful, cross-platform native apps with JavaScript.   
⭐  &nbsp; [Titanium Alloy](https://www.npmjs.com/package/alloy) - MVC framework built on top of Titanium Mobile.   
⭐  &nbsp; [Appcelerator CLI](https://www.npmjs.com/package/appcelerator) - Installer for the Appcelerator Platform tool   


#### 🎟️  &nbsp; Modules for Node.js and Titanium Mobile

| project  	|  description 	|  npm	|
|---	|---  |---	|
| [@geek/cache](https://www.npmjs.com/package/@geek/cache)  	| Caching module for Node.js and Axway Titanium  	| [![@geek/cache](https://img.shields.io/npm/v/@geek/cache.png)](https://www.npmjs.com/package/@geek/cache)      |
| [@geek/jsonc](https://www.npmjs.com/package/@geek/cache)  	| JSONC and JSON utilities for JavaScript with Node.js and Axway Titanium.  	| [![@geek/jsonc](https://img.shields.io/npm/v/@geek/jsonc.png)](https://www.npmjs.com/package/@geek/jsonc)      |
| [@geek/jwt](https://www.npmjs.com/package/@geek/jwt) 	| JWT parser for JavaScript Node.js and Titanium native mobile  |  [![@geek/jwt](https://img.shields.io/npm/v/@geek/jwt.png)](https://www.npmjs.com/package/@geek/jwt)     |
| [@geek/logger](https://www.npmjs.com/package/@geek/logger) 	| Logging module for Node.js and Axway Titanium  |   [![@geek/logger](https://img.shields.io/npm/v/@geek/logger.png)](https://www.npmjs.com/package/@geek/logger)        |
| [@geek/mobile](https://www.npmjs.com/package/@geek/mobile)  	| Toolkit for creating, building, and managing mobile app projects.  	| [![@geek/mobile](https://img.shields.io/npm/v/@geek/mobile.png)](https://www.npmjs.com/package/@geek/mobile)    	|
| [@geek/retry](https://www.npmjs.com/package/@geek/retry) 	| Retry JavaScript functions and promises in Node.js and Axway Titanium  |   [![@geek/retry](https://img.shields.io/npm/v/@geek/retry.png)](https://www.npmjs.com/package/@geek/retry)        |



## 📣  &nbsp; Feedback

Have an idea or a comment?  [Join in the conversation here](https://github.com/axway-developer-relations/griffin-app-opensource/issues)! 

## ©️  &nbsp; Legal

App Code is licensed under MIT by Axway, Inc. All Rights Reserved.

Alloy is developed by Appcelerator and the community and is Copyright (c) 2012-present by Axway, Inc. All Rights Reserved.

Alloy is made available under the Apache Public License, version 2. See their license file for more information.

Titanium is Copyright (c) 2008-present by Axway, Inc. All Rights Reserved.

Titanium is licensed under the Apache Public License (Version 2). Please see the the Titanium license file for the full license.

Appcelerator is a registered trademark of Axway, Inc. Titanium is a registered trademark of Axway, Inc. Please see the LEGAL information about using trademarks, privacy policy, terms of usage and other legal information at http://www.appcelerator.com/legal.