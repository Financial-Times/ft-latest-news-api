'use strict';

var FtApi				= require('ft-api-client'),
	latestNewsModel		= require('./models/latestNews.js'),
	config				= require('./config.js'),
	request				= require('request');


// Calculate the date in the past from when search results should be fetched
function getLastPublishDateTime () {
    var lastPublishDateTime = null,
        thePast = Date.now() - (config.TIME_LIMIT * 3600000), // hours * milliseconds in an hour
        date = new Date(thePast);

    // Convert to a suitable format ISO 8601 Extended Format.
    lastPublishDateTime = date.toISOString();

    // Except search API throws a fit if you have milliseconds so trim them off
    lastPublishDateTime = lastPublishDateTime.slice(0, lastPublishDateTime.length-5) + 'Z';

    return lastPublishDateTime;
}


// Build a configuration object specific to making a request to the search API
function getSearchRequestConfig (offset) {
	return {
		path: config.getCapiSearchPath(),
		offset: offset
	};
}


// Kicks off the search requests and a setInterval to retrieve the results periodically
exports.init = function () {
	var requestConfig = getSearchRequestConfig();
	getSearchResults(requestConfig);

	// We go back and get new data every 5 minutes (or whatever the config.POLL_INTERVAL is set to)
	setInterval(function () {
		getSearchResults(requestConfig);
	}, config.POLL_INTERVAL);
};


// Recursive function used to fetch search results
function getSearchResults (reqConfig, fetchedResults) {
	var results = fetchedResults === undefined ? [] : fetchedResults;

	var options = {
		url: reqConfig.path,
		method: 'POST',
		body: JSON.stringify(getSearchPostJson(reqConfig.offset))
	};

	request(options, function (err, res, resBody) {

		if (err) {
			console.log('Error with the search request', err, resBody);
			return;
		}

		// Parse the results
		var searchResponse, maxResults, offset, indexCount;

		// Parse the response body, concatonate the results
		try {
			searchResponse	= JSON.parse(resBody);
			maxResults = searchResponse.query.resultContext.maxResults;
			offset = searchResponse.query.resultContext.offset;
			indexCount = searchResponse.results[0].indexCount;
			results = results.concat(searchResponse.results[0].results);
		} catch (e) {
			console.log('Failed to parse the search results', e, resBody);
			return;
		}

		// If there are more results to come make another request
		if (searchResponse && (maxResults + offset < indexCount)) {
			var reqConfig = getSearchRequestConfig(maxResults + offset);
			getSearchResults(reqConfig, results);
			return;
		}

		// Get CAPI data to fill out the model
		getCapiData(results);
	});
}
// Expose this function for testing
exports.getSearchResults = getSearchResults;


// Fetch data from the content API
function getCapiData (resultsList) {
	// Extract a list of IDs from the search results
	var idList = resultsList.map(function (resultItem) {
		return resultItem.id;
	});

	// Fetch the data from CAPI
	var ftApi = new FtApi({
		apiKey: config.CAPI_KEY,
		featureFlags: ['blogposts'] // Blogs are still behind a feature flag
	});
	ftApi.getItems(idList, null, latestNewsModel.buildModel);
}


// Generate the JSON used in the POST request to the search API
var getSearchPostJson = function (sapiResultsOffset) {
    var searchPostJson = {
	        queryString: config.SEARCH_QUERY + getLastPublishDateTime(),
	        queryContext: {
	            curations: ["ARTICLES", "BLOGS"]
	        },
	        resultContext: {
	            maxResults: config.MAX_RESULTS,
	            offset: sapiResultsOffset
	        }
    };
    console.log('config settings: searchPostJson=' + JSON.stringify(searchPostJson));
    return searchPostJson;
};
exports.getSearchPostJson = getSearchPostJson;