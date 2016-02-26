var bodyParser = require('body-parser'),
    express = require('express'),
    googleImages = require('google-images'),
    Promise = require('bluebird'),
    redis = require('redis'),
    validator = require('validator');

// load the server settings
var settings = require('./settings');

var redisSettings = settings.redis,
    googleSettings = settings.google;

// promisify redis
Promise.promisifyAll(redis.RedisClient.prototype);
Promise.promisifyAll(redis.Multi.prototype);

// declare the app
var app = express();

// initialize googleImages and redis clients
var imageSearchEngine = googleImages(googleSettings.id, googleSettings.api);
var redisClient = redis.createClient(redisSettings.port, redisSettings.host);

// tell app to use bodyParser functions and set /static to the
// static files directory
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use('/static', express.static(__dirname + '/../static'));

// set / to index.html
app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});

// the avatar search endpoint
app.post('/query', function(req, res) {
    // get the value of the email parameter
    var emailToQuery = req.body.email;

    // check that it is defined, else return 400
    if (!emailToQuery) {
        res.status(400).send('Missing parameter: email');
        return;
    }

    // validate the email address, else return 400
    if (!validator.isEmail(emailToQuery)) {
        res.status(400).send('Invalid email address');
        return;
    }

    // check if we have cached the avatar url
    redisClient.getAsync(emailToQuery).then(function(imageUrl) {
        if (!imageUrl) {
            // if we do not have it cached, search for it
            return imageSearchEngine.search(emailToQuery).then(function(results) {
                // if results is an empty array, error with 404
                if (results.length === 0) {
                    return Promise.reject(404);
                }

                // results is an array of objects where .url is the
                // matching image's url. we are only interested in
                // the url of the first result.
                imageUrl = results[0].url;

                // cache the url using the email address as the key
                redisClient.set(emailToQuery, imageUrl);

                // return the found url
                return imageUrl;
            }).catch(function(err) {
                // If search finds no images, it throws an error with
                // an empty object. So test if it is an empty object
                // or not and throw the proper error.
                if (Object.keys(err).length) {
                    return Project.reject(err);
                }
                else {
                    // no results, so error with 404
                    return Promise.reject(404);
                }
            });
        }

        // since we do have the url cached, just return it
        return imageUrl;
    }).then(function(imageUrl) {
        // we found a url, so send it in the response
        res.send(imageUrl);
    }).catch(function(err) {
        if (err === 404) {
            // we got a 404 err, so respond with 404 and
            // a message that we did not find an image
            res.status(404).send('No image found');
            return;
        }

        // else, log the error and respond with 500
        console.log('Err querying email address: ' + emailToQuery + ' message: ' + (err.message || 'no message'));
        res.status(500).send('Error querying email address ' + emailToQuery);
    });
});

// start the app
app.listen(settings.port, function() {
    console.log('Up and listening on port ' + settings.port);
});
