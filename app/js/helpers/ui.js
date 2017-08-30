define(['exports', 'jquery', 'd3', 'models/model', 'models/costs', 'models/sensitivity', 'components/components', 'lodash', 'Api'],
	function (exports, $, d3, Model, Costs, SensitivityParam, comp, _, Api) {
		'use strict';
		var pageNumber = 1;
		var isMouseDown = false;
		document.body.onmousedown = function (evt) {
			isMouseDown = true;
		}
		document.body.onmouseup = function (evt) {
			isMouseDown = false;
		}
		var isProcessing = false;

		// list with graph colors
		var colors = {
			total: 'white',
			generators: '#40a0ff',
			engine: '#77ff00',
			qc: '#00e7ff',
			endw: '#ff15ab',
			wiring: '#9dc8d4',
		};

		exports.setPageNumber = function (number) {
			pageNumber = number;
		}

		// attach the body area sliders
		exports.attachParamsLists = function ($cEl, paramsLists) {
			renderParams(paramsLists.costs, $cEl.find('[data-operational-costs]'));
			renderParams(paramsLists.rates, $cEl.find('[data-operational-rates]'));
			renderParams(paramsLists.tactical, $cEl.find('[data-tactical-params]'));
			renderParams(paramsLists.strategic, $cEl.find('[data-strategic-params]'));
		};

		// attach the charts in the header area
		exports.attachCostsGraphs = function ($cEl, list, number) {
			pageNumber = number;

			_.forEach(list.arr, function (item) {
				item.rx.value.subscribe(function (v) {
					if (list.costModels && !list.isUpdatingSum) {
						checkIfTacticalSum100($cEl, list, item, v);
						list.isUpdatingSum = false;
					}
					attachCostsGraphs1.call(0, $cEl, list);
				});
			});
		}

		var attachCostsGraphs1 = function ($cEl, list) {
			if (isMouseDown || window.isMouseDown || isProcessing) {
				return;
			}

			isProcessing = true;
			var parameters = _.chain(list.arr).map(function (item) {
				return {
					parameterIndex: item.parameterIndex,
					value: item.value || 0
				}
			}).filter(function (f) { return _.isNumber(f.parameterIndex) }).value();
			var isAutomate = _.chain(list.arr).filter({ name: 'automate' }).first().get('value').value() == 'Yes';

			list.getData(isAutomate, parameters).then(function (response) {
				if (list.costModels) {
					_.forEach(list.costModels, function (item, key) {
						_.forEach(item.values, function (dataItem, index) {
							dataItem.set('value', _.find(response[key].data, { time: dataItem.time }).value);
						});
						item.set('holdValues', _.map(item.values, 'orig'));

					});
				} else {
					_.forEach(response, function (item) {
						_.forEach(item.data, function (dataItem, index) {
							item.data[index] = new Model(dataItem);
						})
					});
					list.costsData = response;
					prepareCostsGraphs.call(0, $cEl, list);
				}

			});
			setTimeout(function () {
				isProcessing = false;
			}, 100);
		}

		var prepareCostsGraphs = function ($cEl, list) {
			var apiData = list.costsData;
			var currentPageNumber = $($cEl).find('[data-gv-toggle].active').data('pageNumber');
			pageNumber = currentPageNumber || 0;
			list.costDataModel = cost(apiData.qcCost.displayName, getValuesFromData(apiData, 'qcCost'), colors.qc, false, getRowClassName('qc'));
			// create the cost models
			var costModels = {
				totalCosts: cost(apiData.totalCosts.displayName, getValuesFromData(apiData, 'totalCosts'), colors.total, true, getRowClassName('total')),
				generatorsCost: cost(apiData.generatorsCost.displayName, getValuesFromData(apiData, 'generatorsCost'), colors.generators, false, getRowClassName('generators')),
				engineInstallsCosts: cost(apiData.engineInstallsCosts.displayName, getValuesFromData(apiData, 'engineInstallsCosts'), colors.engine, false, getRowClassName('engine')),
				wiringAndLiningsCost: cost(apiData.wiringAndLiningsCost.displayName, getValuesFromData(apiData, 'wiringAndLiningsCost'), colors.wiring, false, getRowClassName('wiring')),
				endowmentsCost: cost(apiData.endowmentsCost.displayName, getValuesFromData(apiData, 'endowmentsCost'), colors.endw, false, getRowClassName('endw')),
				qcCost: list.costDataModel
			};


			// get the overall max costs
			var maxCosts = _.maxBy(getValuesFromData(apiData, 'totalCosts'), 'value').value;

			// attach the main line graph
			attachLineGraph(costModels, maxCosts, $cEl.find('[data-graphs]'));

			var $gauges = $cEl.find('[data-gauges]');
			$gauges.empty();
			// total costs gauge
			attachRingGraph('totalCosts', costModels, maxCosts, $gauges);
			// generators costs gauge
			attachRingGraph('generatorsCost', costModels, maxCosts, $gauges);
			// engine costs gauge
			attachRingGraph('engineInstallsCosts', costModels, maxCosts, $gauges);
			// qc costs gauge
			attachRingGraph('qcCost', costModels, maxCosts, $gauges);

			// attach the table 
			attachTable($cEl.find('[data-tables]'), $.extend(costModels, {
				paintingCost: new Costs({
					title: apiData.paintingCost.displayName,
					values: getValuesFromData(apiData, 'paintingCost'),
					rowClassName: getRowClassName('painting')
				}),
				interiorDetailingCost: new Costs({
					title: apiData.interiorDetailingCost.displayName,
					values: getValuesFromData(apiData, 'interiorDetailingCost'),
					rowClassName: getRowClassName('interior')
				}),
				chassisInTransitAmounts: new Costs({
					title: apiData.chassisInTransitAmounts.displayName,
					values: getValuesFromData(apiData, 'chassisInTransitAmounts'),
					rowClassName: getRowClassName('chassisInTransitAmounts')
				}),
				brakeInstallsAmounts: new Costs({
					title: apiData.brakeInstallsAmounts.displayName,
					values: getValuesFromData(apiData, 'brakeInstallsAmounts'),
					rowClassName: getRowClassName('brakeInstallsAmounts')
				}),
				paintJobsAmounts: new Costs({
					title: apiData.paintJobsAmounts.displayName,
					values: getValuesFromData(apiData, 'paintJobsAmounts'),
					rowClassName: getRowClassName('paintJobsAmounts')
				}),
				annualLightsInstalledAmounts: new Costs({
					title: apiData.annualLightsInstalledAmounts.displayName,
					values: getValuesFromData(apiData, 'annualLightsInstalledAmounts'),
					rowClassName: getRowClassName('annualLightsInstalledAmounts')
				}),
				engineInstallsAmounts: new Costs({
					title: apiData.engineInstallsAmounts.displayName,
					values: getValuesFromData(apiData, 'engineInstallsAmounts'),
					rowClassName: getRowClassName('engineInstallsAmounts')
				}),
				annualCarsProducedAmounts: new Costs({
					title: apiData.annualCarsProducedAmounts.displayName,
					values: getValuesFromData(apiData, 'annualCarsProducedAmounts'),
					rowClassName: getRowClassName('annualCarsProducedAmounts')
				}),
				sedansAmounts: new Costs({
					title: apiData.sedansAmounts.displayName,
					values: getValuesFromData(apiData, 'sedansAmounts'),
					rowClassName: getRowClassName('sedansAmounts')
				}),
				sUVsAmounts: new Costs({
					title: apiData.sUVsAmounts.displayName, values: getValuesFromData(apiData, 'sUVsAmounts'),
					rowClassName: getRowClassName('sUVsAmounts')
				}),
				luxurySUVsAmounts: new Costs({
					title: apiData.luxurySUVsAmounts.displayName,
					values: getValuesFromData(apiData, 'luxurySUVsAmounts'),
					rowClassName: getRowClassName('luxurySUVsAmounts')
				}),
				luxurySedansAmounts: new Costs({
					title: apiData.luxurySedansAmounts.displayName,
					values: getValuesFromData(apiData, 'luxurySedansAmounts'),
					rowClassName: getRowClassName('luxurySedansAmounts')
				}),
				sedanPercent: new Costs({
					title: apiData.sedanPercent.displayName,
					values: getValuesFromData(apiData, 'sedanPercent'),
					rowClassName: getRowClassName('sedanPercent')
				}),
				luxurySedanPercent: new Costs({
					title: apiData.luxurySedanPercent.displayName,
					values: getValuesFromData(apiData, 'luxurySedanPercent'),
					rowClassName: getRowClassName('luxurySedanPercent')
				}),
				suvPercent: new Costs({
					title: apiData.suvPercent.displayName,
					values: getValuesFromData(apiData, 'suvPercent'),
					rowClassName: getRowClassName('suvPercent')
				}),
				luxurySUVPercent: new Costs({
					title: apiData.luxurySUVPercent.displayName,
					values: getValuesFromData(apiData, 'luxurySUVPercent'),
					rowClassName: getRowClassName('luxurySUVPercent')
				})
			}));
			list.costModels = costModels;
		}

		function reMapArray(array, index, minValue, maxValue, arraySum) {
			var sum = _.sum(array);
			if (sum === arraySum) {
				return array; // end recursion: solution found
			}
			var reduced = array.reduce(function (c, a, i) { return c + (i === index ? 0 : arraySum > sum ? a < maxValue : a > minValue) }, 0);
			var adjust = (arraySum - sum) / reduced;

			// apply adjustment, but without getting out of range, and then recurse
			return reMapArray(array.map(function (a, i) { return i === index ? a : Math.max(minValue, Math.min(maxValue, Math.round(a + adjust))) }), index, minValue, maxValue, arraySum);
		}

		function checkIfTacticalSum100($cEl, list, item, v) {
			if (item.parameterIndex === 14 || item.name === 'luxury-sedan-perc' || item.name === 'suv-perc' || item.name === 'luxury-suv-perc') {
				var changedIndex = item.parameterIndex - 14;
				var currentValue = item.value;

				var array = _.chain(list.arr).filter(function (item) {
					return item.parameterIndex == 14 || item.parameterIndex == 15 || item.parameterIndex == 16 || item.parameterIndex == 17
				}).sortBy('parameterIndex')
					.map(function (o) { return _.toNumber(o.value) })
					.value();

				if (_.sum(array) !== 100 && !list.isUpdatingSum) {
					list.isUpdatingSum = true;
					try {
						var arrangedArray = reMapArray(array, changedIndex, 0, 100, 100);
						_.forEach(list.arr, function (item) {
							if (item.parameterIndex != changedIndex) {
								if (item.parameterIndex == 14) {
									item.value = arrangedArray[0];
								}
								else if (item.parameterIndex == 15) {
									item.value = arrangedArray[1];
								} else if (item.parameterIndex == 16) {
									item.value = arrangedArray[2];
								}
								else if (item.parameterIndex == 17) {
									item.value = arrangedArray[3];
								}
							}
						});
					} catch (e) {
						list.isUpdatingSum = false;
					}
				}
			}
		}

		function getRowClassName(name) {
			var className = 'hidden';
			if (pageNumber == 0) {
				return ''; // 0 means show all
			}
			var shouldShow = false;
			if (pageNumber == 1) {
				shouldShow = _.includes(['total', 'generators', 'engine', 'wiring', 'endw', 'qc', 'painting', 'interior'], name);
			} else if (pageNumber == 2) {
				shouldShow = _.includes(['chassisInTransitAmounts', 'brakeInstallsAmounts', 'paintJobsAmounts', 'annualLightsInstalledAmounts', 'engineInstallsAmounts',
					'annualCarsProducedAmounts', 'sedansAmounts', 'sUVsAmounts'], name);
			} else if (pageNumber == 3) {
				shouldShow = _.includes(['luxurySUVsAmounts', 'luxurySedansAmounts', 'luxurySUVsAmounts', 'sedanPercent', 'suvPercent', 'luxurySUVPercent'], name);
			}
			return shouldShow ? '' : className;
		};

		// map parameters to Costs model
		var cost = function (title, values, color, selected, rowClassName) {
			return new Costs({
				title: title,
				values: values,
				color: color,
				rowClassName: rowClassName,
				selected: selected || false,
			});
		};

		var getValuesFromData = function (data, propertyName) {
			return _(data[propertyName].data).sortBy('time').toArray().value();
		}

		// render a list of params in the specified container
		function renderParams(list, container) {
			container.empty();
			return list.params.map(function (param) {
				new comp.ParameterElement({ model: list[param] }).mount(container[0]);
			});

		}

		/**
		 * attachLineGraph
		 * @param  {any} costs    		List of costs
		 * @param  {number} maxCosts 	The maximum level of costs
		 * @param  {jqueryElement} container   The graph container
		 */
		function attachLineGraph(costs, maxCosts, container) {
			// empty the container
			container.empty();

			// create data model for the list of costs
			// easier to handle, and watch for changes
			var chartData = new Model({
				data: [
					{ model: costs.totalCosts, color: colors.total },
					{ model: costs.generatorsCost, color: colors.generators },
					{ model: costs.engineInstallsCosts, color: colors.engine },
					{ model: costs.qcCost, color: colors.qc },
					{ model: costs.endowmentsCost, color: colors.endw },
					{ model: costs.wiringAndLiningsCost, color: colors.wiring }
				], maxCosts: maxCosts
			});


			// Attach the line graph indicating the costs
			(new comp.LineChart({
				// provide data
				model: chartData,

				// config the graph
				options: {
					domains: { x: [0, 200, 400, 600, 800, 1000] },
					width: 370,
					height: 290,
					top: 20, right: 30, bottom: 30, left: 50
				}
			})).mount(container[0]);
		}

		/**
		 * attachRingGraph map params to RingChart, and attatch in container
		 * @param  {string} costName   The cost name to be plotted
		 * @param  {any}    data       The data used to plot the graph
		 * @param  {number} maxCosts   The max costs
		 * @param  {jqueryElement} container  The chat's container
		 */
		function attachRingGraph(costName, data, maxCosts, container) {
			(new comp.RingChart({
				model: data[costName],
				options: {
					color: colors[costName],
					max: 1, //maxCosts, max will be 100% percent
					width: 128,
					height: 128,
				}
			})).mount(container[0]);
		}

		/**
		 * attachTable description]
		 * @param  {jqueryElement} container
		 * @param  {any} costs
		 */
		function attachTable(container, costs, classToAdd) {
			container.empty();
			// map object to array
			var data = Object.keys(costs).map(function (d) { return costs[d] });

			(new comp.TableChart({
				model: new Model({ data: data }),
				rowClassName: classToAdd
			})).mount(container[0]);
		}

		/**
			 * appendSensitivityTable Create the sensitivity table
			 * @param  {jqueryElement} $cEl The container
			 * @return {any} Returns method to reInit the graph and subscribe to model changes
			 */
		exports.appendSensitivityTable = function ($cEl, paramList) {
			// create data model
			var sensitivityData = new Model({ data: [], changedCount: 0 });

			// Attach the line graph indicating the costs
			(new comp.SensitivityChart({
				// provide data
				model: sensitivityData,

				// config graph
				options: {
					width: 600,
					height: 300,
					top: 20, right: 20, bottom: 30, left: 50
				}
			})).mount($cEl.find('[data-sensitivity-graph]')[0]);
			_.forEach(paramList.arr, function (paramItem) {
				paramItem.rx.value.subscribe(function (v) {
					if (isMouseDown || window.isMouseDown) {
						return;
					}

					sensitivityData.isProcessing = true;
					_.forEach(sensitivityData.data, function (sensData, index) {
						var parameters = _.chain(paramList.arr).map(function (item) {
							return {
								parameterIndex: item.parameterIndex,
								value: item.value || 0
							}
						}).filter(function (f) { return _.isNumber(f.parameterIndex) }).value();
						var isAutomate = _.chain(paramList.arr).filter({ name: 'automate' }).first().get('value').value() == 'Yes';
						Api.getSensitivity(isAutomate, parameters, sensData.model.orig.parameterIndex).then(function (responseSensitivity) {
							sensData.model.sensitivityArray = responseSensitivity;
							sensitivityData.changedCount += 1;
						});
					});
				});
			});

			// get a color from d3's color schemes,
			// there's no limit on the poped number of colors
			var getColor = function () {
				var cc = [], c = d3.schemeCategory10.concat(d3.schemeCategory20);
				return function () {
					return (cc.length ? cc : cc = c.slice()).pop();
				};
			}();

			// keep track of the plotted models
			var plotted = {};
			// watch for plot events and add the model to graph
			$cEl.bind('plot:sensitivity', function (ev, param) {
				var parameters = _.chain(paramList.arr).map(function (item) {
					return {
						parameterIndex: item.parameterIndex,
						value: item.value || 0
					}
				}).filter(function (f) { return _.isNumber(f.parameterIndex) }).value();
				var isAutomate = _.chain(paramList.arr).filter({ name: 'automate' }).first().get('value').value() == 'Yes';

				if (!plotted[param.uuid]) {
					plotted[param.uuid] = {
						model: SensitivityParam.fromModel(param, paramList),
						color: getColor() // attach color
					};
				}

				// check if model is currently plotted
				var isPlotted = sensitivityData.data.filter(function (p) {
					return p.model._uuid === param.uuid;
				})[0];

				if (isPlotted) {
					sensitivityData.data = sensitivityData.data.filter(function (p) {
						return p.model._uuid !== param.uuid;
					});
					$(ev.target).removeClass('is-plotted');
				} else {
					if (_.isNumber(param.orig.parameterIndex)) {
						Api.getSensitivity(isAutomate, parameters, param.orig.parameterIndex).then(function (responseSensitivity) {
							plotted[param.uuid].model.sensitivityArray = responseSensitivity;
							sensitivityData.data = sensitivityData.data.concat(plotted[param.uuid]);
						});
						$(ev.target).removeClass('add-plotted').css({ color: plotted[param.uuid].color });
					}
				}
				// add/remove a selectedState to the element that triggered the event
				$(ev.target).toggleClass('selected-state', isPlotted);
			});

			return {
				reInit: function (data) {
					sensitivityData.data = [];
					plotted = {};
				},

				subscribe: sensitivityData.rx.data.subscribe.bind(sensitivityData.rx.data),
			};
		};

		/**
		 * initModals Create and attach the page modals
		 * @param  {jqueryElement} $cEl Container
		 * @return {jqueryDeferred} 	Resolves when all modals have been attached
		 */
		exports.initModals = function ($cEl) {
			return Api.getAllScenarios().then(function (response) {

				(new comp.AddGraphModal({ model: response })).mount($cEl[0]);
				(new comp.LoadModal({ model: response })).mount($cEl[0]);

				var path = '/js/components/modals/';
				(new comp.Modals({ templateUrl: path + 'save-scenario.html' })).mount($cEl[0]);
				(new comp.Modals({ templateUrl: path + 'export-pdf.html' })).mount($cEl[0]);

				return response;
			});
		}
		
	});
