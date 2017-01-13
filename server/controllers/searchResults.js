'use strict';

const fetch = require('node-fetch');
const config = require('../config');
const FtApi = require('ft-api-client');


const DateTimeMap = {
  '1WEEK': (24 * 60 * 60 * 1000 * 7),
  '12HOURS': (12 * 60 * 60 * 1000)
};

function constructISODateQuery(limit) {
  const oneDay = 24 * 60 * 60 * 1000;
  let time;
  if (limit.includes('DAY')) {
    time = new Date(new Date().getTime() - (oneDay * parseInt(limit, 10) || oneDay));
  } else {
    time = new Date(new Date().getTime() - (DateTimeMap[limit] || oneDay));
  }
  // Search API throws a fit if you have milliseconds so trim them off
  const limitDateTime = time.toISOString();
  return 'lastPublishDateTime:>' + limitDateTime.slice(0, limitDateTime.length-5) + 'Z';
}

module.exports = function (req, res) {

	let requestBody = req.body;

	let q = requestBody.q; //E.g.: 'sections:"Latin America & Caribbean"'
	let limit = requestBody.limit.toUpperCase();
  let filter = requestBody.filter || [];
  let summaryFilter = filter.includes('summary');

	let dateQuery = constructISODateQuery(limit);
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

				if (allResults) {

					let formattedResults = allResults.reduce((newsArr, singleNews) => {

            const newsItem = {
              brand: singleNews.item.metadata.brand.length && singleNews.item.metadata.brand[0].term.name,
              genre: singleNews.item.metadata.genre.length && singleNews.item.metadata.genre[0].term.name,
              author: singleNews.item.metadata.authors.length && singleNews.item.metadata.authors[0].term.name,
              id: singleNews.item.id,
              title: singleNews.item.title.title,
              url: singleNews.item.location.uri,
              summary: singleNews.item.summary.excerpt,
              images: singleNews.item.images,
              body: singleNews.item.body.body
            }

            if (!summaryFilter) {
              newsArr.push(newsItem);
            } else if (summaryFilter && singleNews.item.summary.excerpt) {
              newsArr.push(newsItem);
            }

            return newsArr;
					}, []);

					return res.json(formattedResults);

				} else {
					return res.json([]);
				}


			});

		})
		.catch(err => {
			return res.status(400).json({
				message: 'The search API returned an error'
			});
		});

};
