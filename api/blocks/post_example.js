const APIBuilder = require(`@axway/api-builder-runtime`);

const PostBlock = APIBuilder.Block.extend({
	name:        `post_example`,
	description: `will log a message after the request`,

	action (req, resp, next) {
		req.log.info(`Post Example Block executed`);
		next();
	},
});

module.exports = PostBlock;
