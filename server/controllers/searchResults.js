'use strict';

const fetch = require('node-fetch');
const config = require('../config');


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

	let queryString = q ? `${q} AND ${dateQuery}` : dateQuery;

	let body = {
		queryString,
		resultContext : {
			aspects : [ "title", "summary", "location"]
		},
		queryContext : {
			curations : [ "ARTICLES"]
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

			let formattedNews = news.map((singleNews) => {

				console.log(singleNews);

				return {
					id: singleNews.id,
					title: singleNews.title.title,
					url: singleNews.location.uri,
					summary: singleNews.summary.excerpt
				};

			});

			return res.json(formattedNews);
		})
		.catch(err => console.log(err));

};