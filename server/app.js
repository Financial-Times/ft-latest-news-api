'use strict';

var express         = require('express'),
    middleware      = require('./middleware.js'),
    mustache        = require('hogan-express'),
    compression     = require('compression')(),
    config          = require('./config.js');

// Start fetching the data
require('./fetchNews.js').init();

var app = express();

// Enable output compression
app.use(compression);

// Set CORS headers
app.use(middleware.allowCrossDomain);

// Using mustache via Hogan
app.set('view engine', 'mustache');

// Set the default, parent template
app.set('layout', 'layout');

// Set the partials available to all templates
app.set('partials', {
	header: 'partials/header',
	head: 'partials/head', 
	footer: 'partials/footer',
	popularContent: 'partials/popularContent'
});

// Set the default location for templates
app.set('views', process.cwd() + '/app/main/tpl');

// Set mustache (hogan) as the rendering engine
app.engine('mustache', mustache);

// Static resources folder
app.use(express.static('./static'));

// View the raw search results, useful for debugging
app.get('/api/searchResults', require('./controllers/searchResults'));

// View the latest news
app.get('/latestnews', require('./controllers/latestNews'));

// Utilty end points
app.get('/__health', require('./controllers/health'));

app.listen(config.PORT);
console.log('Up and running on port', config.PORT);
