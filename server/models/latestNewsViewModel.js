'use strict';

var latestNewsModel		= require('./latestNews.js');

exports.buildModel = function (data) {
	var model = {};
	var articles = latestNewsModel.getModel().articles;

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