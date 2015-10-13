'use strict';
var latestNewsModel = require('../models/latestNews.js');

module.exports = function (req, res) {
	res.json(latestNewsModel.getModel());
};