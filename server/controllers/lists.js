'use strict';

const fetch = require('node-fetch');
const config = require('../config');
const FtApi = require('ft-api-client');

exports.get = function (req, res) {

  let id = req.params.listId;

  let params = {
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": config.CAPI_KEY,
      Accept: "application/json"
    },
    method: 'get',
  };

  fetch(config.listsPath + id, params)
    .then(response => {
      if (response.ok) {
        return response.json();
      }
      else {
        throw new Error(response.statusText);
      }
    })
    .then(json => {

      res.header("Content-Type", "application/json; charset=utf-8");

      let news = json.items || [];

      if (!news.length) {
        return res.json(news);
      }

      let idList = news.map(function (resultItem) {
        return resultItem.apiUrl.split('content/')[1];
      });

      let ftApi = new FtApi({
        apiKey: config.CAPI_KEY,
        featureFlags: ['blogposts'] // Blogs are still behind a feature flag
      });

      ftApi.getItems(idList, null, (err, allResults) => {

        if (allResults) {

          let formattedResults = allResults.reduce((newsArr, singleNews) => {

            const newsItem = {
              id: singleNews.item.id,
              title: singleNews.item.title.title,
              url: 'http://www.ft.com/content/' + singleNews.item.id,
              summary: singleNews.item.summary.excerpt,
              images: singleNews.item.images,
              body: singleNews.item.body.body
            }

            const brand = singleNews.item.metadata.brand.length && singleNews.item.metadata.brand[0].term.name;
            if (brand) {
              newsItem.brand = brand.toString();
            }
            const genre = singleNews.item.metadata.genre.length && singleNews.item.metadata.genre[0].term.name;
            if (genre) {
              newsItem.genre = genre.toString();
            }
            const author = singleNews.item.metadata.authors.length && singleNews.item.metadata.authors[0].term.name;
            if (author) {
              newsItem.author = author.toString();
            }

            newsArr.push(newsItem);

            return newsArr;
          }, []);

          return res.json(formattedResults);

        } else {
          return res.json([]);
        }


      });

    })
    .catch(err => {
      console.log(err);
      return res.status(400).json({
        message: 'The search API returned an error'
      });
    });

};
