const path = require('path');
const _omit = require('lodash/omit');
const { createLogger, format, transports } = require('winston');
const { combine, timestamp, colorize, printf } = format;

/**
 * Creates logger instance
 * @param {Object} context meta
 * @returns {import('winston').Logger} logger
 */
module.exports = context => {
  if (context.file) {
    const filePath = path.relative(process.cwd(), context.file);

    context.file = filePath;
  }

  return createLogger({
    level: process.env.LOG_LEVEL || 'info',
    defaultMeta: context,
    format: combine(
      colorize(),
      timestamp(),
      printf(info => {
        const json = JSON.stringify(_omit(info, ['level', 'message', 'service']), undefined, 2);
        const service = info.service ? `[${info.service.toUpperCase()}]` : '';

        return `${info.level}:${service} ${info.message} \n${json}\n`;
      })
    ),
    transports: [new transports.Console()]
  });
};
