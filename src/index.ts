import { app } from './server';
import { createLogger, format, transports } from "winston";
import { get_log_level, get_log_file } from './../package-metrics/src/index'

const logger = createLogger({
  level: get_log_level(),
      format: format.combine(
        format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  format.errors({ stack: true }),
  format.splat(),
  format.simple()
      ),
      defaultMeta: { service: '461 Project 1' },
      transports: [
                   new transports.File({ filename: get_log_file(), level: get_log_level() })
                   ]
});

global.logger = logger;

app.listen(process.env.PORT, () => console.log(`Running on port ${process.env.PORT}`));