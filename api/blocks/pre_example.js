const APIBuilder = require(`@axway/api-builder-runtime`);

const PreBlock = APIBuilder.Block.extend({
	name:        `pre_example`,
	description: `will set a header named "Foo"`,

	action (req, resp) {
		// this is a synchronous block since it doesn't have a nex
		resp.set(`Foo`, `Bar`);
		req.log.info(`Pre Example Block executed`);
	},
});

module.exports = PreBlock;
