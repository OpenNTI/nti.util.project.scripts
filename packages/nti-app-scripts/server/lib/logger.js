const {default: Logger} = require('nti-util-logger');

const logger = Logger.get('server-side:mobile');

module.exports = {

	info () {
		logger.info(...arguments);
	},


	error () {
		logger.error(...arguments);
	},


	warn () {
		logger.warn(...arguments);
	},


	debug () {
		logger.debug(...arguments);
	}

};
