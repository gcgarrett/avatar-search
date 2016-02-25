// Move this file to settings.js and update the values as needed.
module.exports = {
    // the port to run the node server on
    'port': 80,
    'redis': {
        // the host of the cache service
        'host': 'localhost',
        // the port of the cache service
        'port': 6379
    },
    'google': {
        // the google custom seach engine id
        'id': null,
        // the google api key
        'api': null
    }
};
