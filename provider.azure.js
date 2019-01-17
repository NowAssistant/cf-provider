/* eslint-disable no-console */
'use strict';

const logger = require('@adenin/cf-logger');
const authenticate = require('./auth');

module.exports = (activities) => {
    return async (context) => {
        mapConsole(context);

        const authorized = authenticate(context.req.headers);

        if (!authorized) {
            logger.error('Unauthorized request\n' + JSON.stringify(context.req.headers, null, 4));

            context.res.status = 401;
            context.res.body = {
                error: 'Access key missing or invalid'
            };
        } else if (context.req.params && context.req.params.activity && activities.has(context.req.params.activity)) {
            const activity = require(activities.get(context.req.params.activity));
            const body = context.req.body;

            await activity(body);

            context.res.body = body;
        } else {
            logger.error('Invalid activity request\n' + JSON.stringify(context.req.params, null, 4));

            context.res.status = 404;
            context.res.body = {
                error: 'Requested activity not found'
            };
        }
    };
};

function mapConsole(context) {
    console.log = context.log;
    console.info = context.log.info;
    console.error = context.log.error;
    console.warn = context.log.warn;
    console.debug = context.log.verbose;
}
