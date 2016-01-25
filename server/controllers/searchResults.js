'use strict';

const fetch = require('node-fetch');
const config = require('../config');
const FtApi = require('ft-api-client');


module.exports = function (req, res) {

	let requestBody = req.body;

	let q = requestBody.q; //E.g.: 'sections:"Latin America & Caribbean"'
	let limit = requestBody.limit;

	let dateQuery = '';

	if (limit === '1DAY') { //TODO extract function

		let oneDayAgo = new Date(new Date().getTime() - (24 * 60 * 60 * 1000));

		// Convert to a suitable format ISO 8601 Extended Format.
		let lastPublishDateTime = oneDayAgo.toISOString();

		// Except search API throws a fit if you have milliseconds so trim them off
		lastPublishDateTime = lastPublishDateTime.slice(0, lastPublishDateTime.length-5) + 'Z';

		dateQuery = 'lastPublishDateTime:>' + lastPublishDateTime;

	} else if (limit === '1WEEK') { //TODO extract function

		let oneWeekAgo = new Date(new Date().getTime() - (24 * 60 * 60 * 1000 * 7));

		// Convert to a suitable format ISO 8601 Extended Format.
		let lastPublishDateTime = oneWeekAgo.toISOString();

		// Except search API throws a fit if you have milliseconds so trim them off
		lastPublishDateTime = lastPublishDateTime.slice(0, lastPublishDateTime.length-5) + 'Z';

		dateQuery = 'lastPublishDateTime:>' + lastPublishDateTime;
	}

	let queryString = q ? `(${q}) AND ${dateQuery}` : dateQuery;

	let body = {
		queryString,
		resultContext : {
			maxResults : "100"
		},
		queryContext : {
			curations : [
				"ARTICLES",
				"BLOGS",
				"PAGES",
				"PODCASTS",
				"VIDEOS"
			]
		}
	};

	let stringBody = JSON.stringify(body);

	let params = {
		body: stringBody,
		headers: {
			"Content-Type": "application/json",
			Accept: "application/json"
		},
		method: 'post',
		'Content-Length': Buffer.byteLength(stringBody)
	};

	fetch(config.capiSearchPath, params)
		.then(response => {
			if (response.status >= 200 && response.status < 300) {
				return response.json();
			}
			else {
				throw new Error(response.statusText);
			}
		})
		.then(json => {

			res.header("Content-Type", "application/json; charset=utf-8");

			let news = json.results[0].results || [];

			if (!news.length) {
				return res.json(news);
			}

			let idList = news.map(function (resultItem) {
				return resultItem.id;
			});

			let ftApi = new FtApi({
				apiKey: config.CAPI_KEY,
				featureFlags: ['blogposts'] // Blogs are still behind a feature flag
			});

			ftApi.getItems(idList, null, (err, allResults) => {
				
				if (err) {
					
					return res.status(400).send({
						message: err.message
					});
					
				} else if (allResults) {
					let formattedResults = allResults.map((singleNews) => {

						return {
							id: singleNews.item.id,
							title: singleNews.item.title.title,
							url: singleNews.item.location.uri,
							summary: singleNews.item.summary.excerpt,
							images: singleNews.item.images
						};

					});

					return res.json(formattedResults);
					
				} else {
					return res.status(400).send({
						message: 'CAPI returned an error'
					});
				}


			});

		})
		.catch(err => {
			return res.status(400).send({
				message: 'The search API returned an error'
			});
		});

};
