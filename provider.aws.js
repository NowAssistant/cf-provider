const logger = require('@adenin/cf-logger');
const authenticate = require('./auth');

module.exports = service => {
    return async event => {
        const authorized = authenticate(event.headers);

        if (!authorized) {
            logger.error({
                message: 'Unauthorized request',
                headers: event.headers
            });

            return {
                isBase64Encoded: false,
                statusCode: 401,
                body: JSON.stringify({
                    error: 'Access key missing or invalid'
                })
            };
        }

        return {
            isBase64Encoded: false,
            statusCode: 200,
            body: JSON.stringify(
                await service(
                    JSON.parse(event.body)
                )
            )
        };
    };
};
