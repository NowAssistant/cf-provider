'use strict';

const logger = require('@adenin/cf-logger');
const authenticate = require('./auth');

module.exports = (activities) => {
    return async (event) => {
        const authorized = authenticate(event.headers);
        const body = JSON.parse(event.body);

        if (!authorized) {
            logger.error('Unauthorized request');

            body.Response = {
                ErrorCode: 401,
                Data: {
                    ErrorText: 'Access key missing or invalid'
                }
            };

            return {
                isBase64Encoded: false,
                statusCode: 401,
                body: JSON.stringify(body)
            };
        }

        if (!body.Request || !body.Context) {
            logger.error('Invalid request body');

            body.Response = {
                ErrorCode: 400,
                Data: {
                    ErrorText: 'Activity body structure is invalid'
                }
            };

            return {
                isBase64Encoded: false,
                statusCode: 400,
                body: JSON.stringify(body)
            };
        }

        const pathParameters = event.pathParameters;

        if (pathParameters && pathParameters.activity && activities.has(pathParameters.activity.toLowerCase())) {
            const activity = require(activities.get(pathParameters.activity.toLowerCase()));

            if (!body.Response) {
                body.Response = {};
            }

            await activity(body);

            return {
                isBase64Encoded: false,
                statusCode: 200,
                body: JSON.stringify(body)
            };
        }

        logger.error('Invalid activity requested');

        body.Response = {
            ErrorCode: 404,
            Data: {
                ErrorText: 'Requested activity not found'
            }
        };

        return {
            isBase64Encoded: false,
            statusCode: 404,
            body: JSON.stringify(body)
        };
    };
};
