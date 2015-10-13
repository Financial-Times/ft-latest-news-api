'use strict';

var latestNewsModel		= require('./latestNews.js');

// We look for FT members of staff, if present we add an alert tag to identify content without author metatdata
function addFtUserData (latestNewsModel, req) {

	latestNewsModel = latestNewsModel.map(function (newsItem) {

		newsItem.authorAlert = false;

		return newsItem;
	});
	return latestNewsModel;
}

exports.buildModel = function (data) {
	var model = {};
	var articles = latestNewsModel.getModel().articles;

	// We may not have retrieved any data from CAPI yet or there could be some other issue
	articles = addFtUserData(articles, data.req);
	
	//searchApiJson.runCount		= appState.getRunCount();
	//searchApiJson.appStartDate	= appState.getAppStartDate();
	model.title						= data.title;
	model.version					= data.version;
	model.itemsFetchedFromApi		= -1;
	model.lastModified				= '';
	model.lastModifiedTime			= 0;
	model.platform					= process.platform;
	model.articles					= articles;
	model.results					= model.articles.length; // starts at 0 and will be incremented as we add in items
	return model;
};