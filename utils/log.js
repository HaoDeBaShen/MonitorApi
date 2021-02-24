const log4js = require('log4js');

log4js.configure({
    appenders: { monitor: { type: 'file', filename: 'logs/monitor.log' } },
    categories: { default: { appenders: ['monitor'], level: 'info' } }
});

const logger = log4js.getLogger('monitor');
logger.level = 'info';
module.exports.logger = logger;