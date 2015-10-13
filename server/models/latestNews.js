'use strict';
var oDate = require('o-date');

var model = {
		articles: []
	};

function buildImageMap (imgList) {
	var imgMap = {};
	imgList.forEach(function (img) {
		imgMap[img.type] = img;
	});
	return imgMap;
}

exports.buildModel = function (err, capiData) {
	var parsedCapiData = capiData.map(function (capiItem) {
		var item = capiItem.item,
			newsItem = {},
			aDate = new Date(item.lifecycle.lastPublishDateTime);

		newsItem.title = item.title.title;
		newsItem.id = item.id;
		newsItem.url = item.location.uri;
		newsItem.publishDate = item.lifecycle.lastPublishDateTime;
		newsItem.summary = item.summary.excerpt ? item.summary.excerpt : '';
		newsItem.publishTime = aDate.getTime();
		newsItem.articleType = item.aspectSet;
		newsItem.brand = item.metadata.brand.length > 0 ? item.metadata.brand[0].term.name : false;
		newsItem.genre = item.metadata.genre.length > 0 ? item.metadata.genre[0].term.name : '';
		newsItem.images = buildImageMap(item.images);
		newsItem.authors = item.metadata.authors.length > 0 ? item.metadata.authors : '';
		newsItem.displayDate = oDate.timeAgo(newsItem.publishTime);
		newsItem.byline = item.editorial.byline;

		return newsItem;
	});

	parsedCapiData = parsedCapiData.sort(sortByPublishTime);
	console.log('Model updated with', parsedCapiData.length, 'results');
	model.articles = parsedCapiData;
};

function sortByPublishTime (a, b) {
	if (a.publishTime > b.publishTime) {
		return -1;
	} else {
		return 1;
	}
}

exports.getModel = function () {
	return model;
};