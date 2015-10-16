'use strict';

const fetch = require('node-fetch');
const config = require('../config');


module.exports = function (req, res) {

	let requestBody = req.body;

	let q = requestBody.q;

	let body = {
		queryString: q, //E.g.: 'sections:"Latin America & Caribbean"',
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

	fetch(config.getCapiSearchPath(), params)
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

			let news = json.results[0].results;

			let formattedNews = news.map((singleNews) => {

				return {
					title: singleNews.title.title,
					url: singleNews.location.uri,
					summary: singleNews.summary.excerpt
				};

			});

			return res.json(formattedNews);
		});

};