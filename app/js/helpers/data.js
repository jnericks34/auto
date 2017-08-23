define(['exports', 'jquery', 'models/params-list', 'Api'], function (exports, $, ParamsList, Api) {
	'use strict';

	/**
	 * toggleParamsHold Toggle hold value for the provided list of parameters
	 * @param  {array<param>} list  The list
	 * @param  {boolean|undefined} toggle Specify toggle state
	 */
	exports.toggleParamsHold = function (list, toggle) {
		// check if list is toggled
		var isToggled = list[0].holdValue !== undefined;
		// provide value if toggle isn't specified
		toggle = toggle !== undefined ? toggle : !isToggled;

		// if the list is already in the specified toggle state
		// do nothing, so no update is triggered
		if (isToggled !== toggle) {
			var fn = toggle ? 'hold' : 'clearHold';
			list.forEach(function (param) {
				param[fn]()
			});
		}
	};
	/**
	 * toggleParamsHold Toggle hold value for the provided list of parameters
	 * @param  {array<param>} list  The list
	 * @param  {boolean|undefined} toggle Specify toggle state
	 */
	exports.toggleCostsHold = function (list, toggle) {
		_.forEach(list, function (item) {
			var isToggled = item.values[0].holdValue !== undefined;
			// provide value if toggle isn't specified
			toggle = toggle !== undefined ? toggle : !isToggled;
			// if the list is already in the specified toggle state
			// do nothing, so no update is triggered
			if (isToggled !== toggle) {
				var fn = toggle ? 'holdHoldValues' : 'clearHold';
				item.values.forEach(function (param) {
					param[fn]()
				});
			}
		});
	};

	/**
	 * fetchParamsLists Fetch all the parameter lists
	 *   Resolves with all parameter lists and utility functions
	 * @return {jqueryDeferred}
	 */
	exports.fetchParamsLists = function (id) {
		var getParams = function (d) {
			return d.params.map(function (paramName) {
				return d[paramName];
			});
		};

		/**
		 * flatten Return single-level array
		 */
		var flatten = function (d) {
			if (d.params) {
				return getParams(d);
			}

			return [].concat.apply([], d.map(getParams));
		}
		var getCostData = function (isAutomate, parameters) {

			return Api.getCostData(isAutomate, parameters);
		}

		return function (id) {
			return Api.getScenarioDetail(id || 0).then(function (response) {
				var costs = response.parameters.operational.costs;
				costs.push({
					"title": "Automate",
					"name": "automate",
					"value": response.isAutomate ? 'Yes' : 'No',
					"type": "toggle"
				});
				var params = [
					costs,
					response.parameters.operational.rates,
					response.parameters.tactical,
					response.parameters.strategic,
				].map(ParamsList.fetch.bind(ParamsList));
				return $.when.apply($, params).then(function (costs, rates, tactical, strategic) {
					return {

						costs: costs,
						rates: rates,
						tactical: tactical,
						strategic: strategic,
						arr: flatten([].slice.apply(arguments)),
						inline: flatten,
						getData: getCostData
					};
				});
			});
		}
	}();

	// get a sliced state from a main state
	exports.slice = function (state, domain) {
		return state[domain] !== undefined ? state[domain] : state[domain] = {};
	};
});