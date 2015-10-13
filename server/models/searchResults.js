'use strict';

var model = {};

exports.setModel = function (data) {
	model = data;
};

exports.getModel = function () {
	return model;
};