define(['jquery', 'models/model', 'models/parameter'], function($, Model, Parameter) {
	'use strict'

	function ParametersList(paramsList) {
		// reduce list to object with keys as prop name
		var params = paramsList.reduce(function(props, param) {
			if(!(param instanceof Parameter)) {
				param = new Parameter(param);
			}

			return props[param.name] = param, props;
		}, {});

		this.super.call(this, $.extend({params: Object.keys(params)}, params));
	}

	return Model.create(ParametersList);
});