var express = require('express'),
    request = require('request'),
    MongoClient = require('mongodb').MongoClient,
    imageHelper = require('./imageHelper'),
    //env = require('./env/env'),
    app = express();

var url = "https://api.cognitive.microsoft.com/bing/v5.0/images/search?";
var mongoUrl = process.env.MONGOLAB_URI || 'mongodb://localhost:27017/image';
var port = process.env.PORT || 8000;
// Options for the api request
var options = {
    url: "",
    headers: {
        "Content-Type": "multipart/form-data",
        "Ocp-Apim-Subscription-Key": process.env.BING_KEY || env.bingEnv.key
    }
};

// Default home page
app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});

// Search for images
app.get('/search/:search', function(req, res) {
    // Get the query parameters and add it to the options url
    var paramStr = "q=" + req.params.search + "&count=10&offset=" + req.query.offset;
    options.url = url + paramStr;

    // Request images from Bing api
    request(options, function(err, response, body) {
        // Error
        if (err) {
            console.log(err);
        }
        // Else, if everything is ok, return search info and insert into db
        else if (response.statusCode == 200) {
            var info = JSON.parse(body);

            // Return the search info as a JSON object
            res.send(info.value.map(function(curr) {
                return {
                    "image url": imageHelper.parseUrl(curr.contentUrl),
                    "name": curr.name,
                    "page url": imageHelper.parseUrl(curr.hostPageUrl)
                };
            }));

            // Connect to mongo and insert new search
            MongoClient.connect(mongoUrl, function(err, db) {
                if (err) {
                    console.log(err);
                }
                // Insert into search history
                db.collection('image').insertOne({
                    "term": req.params.search,
                    "date": new Date().toISOString()
                }, function(err, record){
                    // Error inserting
                    if (err) {
                        console.log(err);
                    }
                });

                db.close();
            });
        }
    });
});

// Retrieve the last 10 search terms
app.get('/latest', function(req, res) {
    // Connect to mongo
    MongoClient.connect('mongodb://localhost:27017/image', function(err, db) {
        if (err) {
            console.log(err);
        }
        db.collection('image').find({}, {_id: 0}).sort({date: -1}).limit(10).toArray(function(err, docs) {
            // Check for error
            if (err) {
                console.log(err);
            }
            // Else, return latest searches
            else {
                res.send(docs);
            }

            db.close();
        });
    });
});

var server = app.listen(port, function() {
    var port = server.address().port;
    console.log('Express server listening on port %s.', port);
});
