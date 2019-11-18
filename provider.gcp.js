'use strict';

global.logger = require('@adenin/cf-logger');

const {resolve} = require('path');

const {initialize} = require('@adenin/cf-activity');

const authenticate = require('./auth');
const info = require('./info');
const settings = require('./settings');

module.exports = (activities) => {
  return async (req, res) => {
    const body = req.body;

    try {
      process.env.HOST = req.url;

      const name = req.path.substring(req.path.lastIndexOf('/') + 1, req.path.length).toLowerCase();

      if (name === 'keepalive') {
        res.status(200).send({
          date: new Date().toISOString()
        });
      }

      if (name === '_info') {
        const infoResult = await info();
        res.status(200).send(infoResult);
      }

      if (name === '_settings') {
        const settingsResult = await settings();
        res.status(200).send(settingsResult);
      }

      const authenticated = authenticate(req.headers);

      if (!authenticated) {
        logger.error('Unauthenticated request: API key missing or invalid');

        body.Response = {
          ErrorCode: 401,
          Data: {
            ErrorText: 'Access key missing or invalid'
          }
        };

        res.status(401).send(body);
      } else if (!body || !body.Request || !body.Context) {
        logger.error('Invalid request body');

        body.Response = {
          ErrorCode: 400,
          Data: {
            ErrorText: 'Activity body structure is invalid'
          }
        };

        res.status(400).send(body);
      } else {
        if (activities.has(name)) {
          const activity = require(activities.get(name));

          if (!body.Request.Query) body.Request.Query = {};
          if (!body.Context.connector) body.Context.connector = {};
          if (!body.Response) body.Response = {};
          if (!body.Response.Data) body.Response.Data = {};

          body.Context.ScriptFolder = resolve('./activities');

          await initialize(body);
          await activity(body);

          body.Context.connector.ProxyServer = undefined; // avoid circular json error

          res.status(200).send(body);
        } else {
          logger.error('Invalid activity requested');

          body.Response = {
            ErrorCode: 404,
            Data: {
              ErrorText: 'Requested activity not found'
            }
          };

          res.status(404).send(body);
        }
      }
    } catch (error) {
      logger.error(error);

      body.Response = {
        ErrorCode: 500,
        Data: {
          ErrorText: error.message
        }
      };

      res.status(500).send(body);
    }
  };
};
