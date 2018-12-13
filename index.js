'use strict';

const {readdirSync} = require('fs');
const {join, sep} = require('path');

module.exports = (_exports) => {
    const path = module.parent.filename.substring(
        0, module.parent.filename.lastIndexOf(sep)
    ) + sep + 'activities';

    const files = readdirSync(path);
    const activities = new Map();

    for (let i = 0; i < files.length; i++) {
        if (
            files[i].indexOf('.json') === -1 &&
            files[i].indexOf('.js') !== -1
        ) {
            const name = files[i].substring(
                0, files[i].lastIndexOf('.')
            );

            activities.set(name, join(path, files[i]));
        }
    }

    if (process.env.GCP_PROJECT) {
        _exports.function = require('./provider.gcp')(activities);
    } else if (process.env.AWS_EXECUTION_ENV) {
        _exports.function = require('./provider.aws')(activities);
    } else if (process.env.AzureWebJobsStorage) {
        _exports.function = require('./provider.azure')(activities);
    } else {
        _exports.function = require('./provider.local')(activities);
    }
};
