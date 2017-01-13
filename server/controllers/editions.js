'use strict';

const fetch = require('node-fetch');
const config = require('../config');
const FtApi = require('ft-api-client');


exports.get = (req, res) => {

    let ftApi = new FtApi({ apiKey: config.CAPI_KEY });

    ftApi.getPageContent(req.edition, (err, items) => {

        let allResults = items && items.pageItems;

        if (allResults) {

            let formattedResults = allResults.map((singleNews) => {


                return {
                    id: singleNews.id,
                    title: singleNews.title.title,
                    url: singleNews.location.uri,
                    summary: singleNews.editorial.standFirst,
                    images: singleNews.images
                };

            });

            return res.json(formattedResults);

        } else {
            return res.json([]);
        }
    });


};




exports.editionsById = (req, res, next, id) => {

    req.edition = id;
    next();

};
