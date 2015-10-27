'use strict';

const express         = require('express'),
    middleware      = require('./middleware.js'),
    compression     = require('compression')(),
    config          = require('./config.js'),
    bodyParser = require('body-parser');


// Start fetching the data
require('./fetchNews.js').init();

var app = express();

// Enable output compression
app.use(compression);

// Set CORS headers
app.use(middleware.allowCrossDomain);

// Use bodyParser
app.use(bodyParser.json({
    limit:'1mb'
}));

// View the raw search results, useful for debugging
app.post('/searchResults', require('./controllers/searchResults'));

// View the latest news
app.get('/latestnews', require('./controllers/latestNews'));

// Utility end points
app.get('/__health', require('./controllers/health'));

app.listen(config.PORT);
console.log('Up and running on port', config.PORT);
