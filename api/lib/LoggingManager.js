

const manager = {};
module.exports = manager;


manager.handleRequest = (logger, req) => {
	logger.init({
		'titanium-id': req.headers[`x-titanium-id`],
		'user-agent':  req.headers[`user-agent`],
	});
	return logger;
};


manager.handleJwt = (logger, jwt) => {
	logger.metadata({ email: jwt.email  });
	return logger;
};
