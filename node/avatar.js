var bodyParser = require('body-parser'),
    express = require('express'),
    googleImages = require('google-images'),
    Promise = require('bluebird'),
    redis = require('redis'),
    validator = require('validator');

var settings = require('./settings');

var cacheSettings = settings.cache,
    googleSettings = settings.google;

Promise.promisifyAll(redis.RedisClient.prototype);
Promise.promisifyAll(redis.Multi.prototype);

var app = express();

var imageSearchEngine = googleImages(googleSettings.id, googleSettings.api);
var redisClient = redis.createClient(cacheSettings.port, cacheSettings.host);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use('/static', express.static(__dirname + '/../static'));

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});

app.post('/query', function(req, res) {
    var emailToQuery = req.body.email;

    if (!emailToQuery) {
        res.status(400).send('Missing parameter: email');
        return;
    }

    if (!validator.isEmail(emailToQuery)) {
        res.status(400).send('Invalid email address');
        return;
    }

    redisClient.getAsync(emailToQuery).then(function(imageUrl) {
        if (!imageUrl) {
            return imageSearchEngine.search(emailToQuery).then(function(results) {
                if (results.length === 0) {
                    return Promise.reject(404);
                }

                imageUrl = results[0].url;

                redisClient.set(emailToQuery, imageUrl);
                return imageUrl;
            }).catch(function(err) {
                // If search finds no images, it throws an error with
                // an empty object. So test if it is an empty object
                // or not and throw the proper error.
                if (Object.keys(err).length) {
                    return Project.reject(err);
                }
                else {
                    return Promise.reject(404);
                }
            });
        }

        return imageUrl;
    }).then(function(imageUrl) {
        res.send(imageUrl);
    }).catch(function(err) {
        if (err === 404) {
            res.status(404).send('No image found');
            return;
        }

        console.log('Err querying email address: ' + emailToQuery + ' message: ' + (err.message || 'no message'));
        res.status(500).send('Error querying email address ' + emailToQuery);
    });
});

app.listen(settings.port, function() {
    console.log('Up and listening on port ' + settings.port);
});
