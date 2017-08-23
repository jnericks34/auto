define(['jquery', 'helpers/data', 'helpers/ui', 'lodash', 'Api', 'helpers/pdfHelper'], function ($, data, ui, _, Api, pdfHelper) {
	'use strict';

	// create minimal page state
	var state = {
		hold: false,
		graph: null
	};
	var graph;
	var parametersList;

	// cache body
	var $container = $('body');

	$.fn.nextOrFirst = function (selector) {
		var next = this.next(selector);
		return (next.length) ? next : this.prevAll(selector).last();
	};

	$.fn.prevOrLast = function (selector) {
		var prev = this.prev(selector);
		return (prev.length) ? prev : this.nextAll(selector).last();
	};

	// create the sensitivity table
	var sensitivityTable
	function showGraph(state, graphId) {
		graphId = parseInt(graphId, 10);
		state.activeGraphId = graphId;

		graph = {};

		if (graph.graphData === undefined || graphId == 0) {
			graph.graphData = data.fetchParamsLists.call(0, graphId);
		}

		graph.container = $container;
		graph.graphData.then(renderGraphData.bind(0, graph));
		state.hold = false;

	}

	function renderGraphData(graph, paramsList) {
		sensitivityTable = ui.appendSensitivityTable($container, paramsList);

		parametersList = paramsList;
		sensitivityTable.reInit(paramsList);

		// toggle the sensitivity graph depending on plotted data
		sensitivityTable.subscribe(function (data) {
			$container.find('.content-wrap').toggleClass('sensitivity-view', data.length > 0);
		});

		ui.attachParamsLists(graph.container, paramsList);
		ui.attachCostsGraphs(graph.container, paramsList, 1);
		if (!graph.onHoldValues) {
			graph.onHoldValues = $('[data-hold-values]')
				.off('click').bind('click', function () {
					state.hold = true;
					data.toggleParamsHold(paramsList.arr);
					data.toggleCostsHold(paramsList.costModels);
				});
		}
		data.toggleParamsHold(paramsList.arr, state.hold);

		graph.onSaveScenario = $('[data-save-scenario]').off('click').bind('click', function () {
			var newScenarioName = $("#newScenarioName").val();
			if (newScenarioName && newScenarioName.length > 0) {
				var parameters = _.chain(paramsList.arr).map(function (item) {
					return {
						parameterIndex: item.parameterIndex,
						value: item.value || 0
					}
				}).filter(function (f) { return _.isNumber(f.parameterIndex) }).value();
				var isAutomate = _.chain(paramsList.arr).filter({ name: 'automate' }).first().get('value').value() == 'Yes';
				var scenario = {
					name: newScenarioName,
					isAutomate: isAutomate,
					parameters: parameters
				}
				if (state.activeGraphId <= 0) {
					Api.createScenario(scenario).then(function (result) {
						alert('Scenario is saved successfully');
						$("newScenarioName").val('');
						state.graphs.push(result);
						addTabsMenu([result]);
						$(".save-scenario-modal").find('.toggle-modal').trigger('click');
					});
				} else {
					Api.updateScenario(state.activeGraphId, scenario).then(function () {
						alert('Scenario is saved successfully');
						$("newScenarioName").val('');
						$(".save-scenario-modal").find('.toggle-modal').trigger('click');
					});
				}
			} else {
				alert('Please enter the scenario name.');
			}
		});
		graph.onDownloadPDf = $("[data-download-pdf]").off('click').on('click', function () {
			var graphTarget = _.find(state.graphs, { id: state.activeGraphId });
			var pdfName = $("[data-pdf-name]").text();
			pdfHelper.downloadPDF(paramsList, paramsList.costModels, graph.container, pdfName);
		});
		graph.onSharePdf = $('[data-share-pdf]').off('click').on('click', function () {
			var pdfName = $("[data-pdf-name]").text();
			var email = $("[data-share-email]").val();
			pdfHelper.getPDF(paramsList, paramsList.costModels, graph.container, pdfName).done(function(data){
				data.document.getBase64(function(pdfDoc){
					var apiData = {doc:pdfDoc, fileName:pdfName, email:email}
					Api.shareScenario(apiData).then(function(){
						alert('Scenario report shared successfully');
						$('.modal-overlay[data-modal="export"]').toggleClass('active');
					});
				})
			});
		})
		if (state.activeGraphId > 0) {
			var tabMenu = $(".tab[data-select-graph='" + state.activeGraphId + "']");
			var graphDetail = _.find(state.graphs, { id: state.activeGraphId });
			if (!tabMenu.length) {
				addTabsMenu([graphDetail]);
			}
			$(".tabs-content .tab").removeClass('active');
			$(".tab[data-select-graph='" + state.activeGraphId + "']").addClass('active');

			$(".action-btns .title span").text('Active ' + graphDetail.name);
		}
		else {
			$(".action-btns .title span").text('Active default paramter');
		}
	}

	// action for hide the sensitivity graph 
	$container.find('[data-toggle-sgraph]').bind('click', function () {
		$('.selected-state').removeClass('selected-state');
		sensitivityTable.reInit();
	});

	// bind restore data actions
	$container.find('[data-restore-data]').bind('click', function () {
		showGraph(state, 0);
	});

	// bind the graph selector actions
	$(document).on('click', '[data-select-graph]', function (e) {
		var $target = $(this), tab = $target.closest('.tab');
		if (tab.is('.active')) {
			return;
		}

		tab.addClass('active').siblings().removeClass('active');
		$('[data-gv-toggle="tables"][data-page-number=1]').trigger('click');
		var graphId = parseInt($target.data('selectGraph'), 10);
		$('[data-selected-graph]').text($target.text());
		showGraph(state, graphId);
	});

	// watch for click on [data-rm] elements and remove closest
	// specified element
	$(document).on('click', '[data-rm]', function (ev) {
		ev.stopPropagation();
		var target = $(ev.target);
		var tab = target.closest('.' + target.data('rm'));

		var isCurrentActive = tab.is('.active');
		var nextGraphTab = tab.nextOrFirst('.tab');
		tab.remove();
		if (isCurrentActive) {
			var nextGraphId = parseInt(nextGraphTab.data('selectGraph'), 10);
			if (_.isFinite(nextGraphId)) {
				showGraph(state, nextGraphId);
			} else {
				showGraph(state, 0);
			}
		}
	});
	$(document).on('click', '[data-add-graph]', function () {
		var newId = 0;
		var graph = {
			id: 0,
			name: 'Default',
		};
		state.graphs.push(graph);
		addTabsMenu([graph]);
		$('.add-new-graph .toggle-modal').find('.icon-close').trigger('click');
		$(".tab[data-select-graph='" + newId + "']").trigger('click');
	});

	$(document).on('click', '[data-delete-scenario]', function (ev) {
		ev.stopPropagation();
		var target = $(ev.target);
		var row = target.closest('.' + target.data('delete-scenario'));
		var graphId = _.toNumber(row.data('id'));
		if (graphId > 0) {
			Api.deleteScenario(graphId).then(function () {
				$(row).remove();
				$(".tab[data-select-graph='" + graphId + "'] [data-rm]").trigger('click');
			});
		}
	});

	$(document).on('click', '[data-load-scenario]', function (ev) {
		ev.stopPropagation();
		var target = $(ev.target);
		var row = target.closest('.' + target.data('load-scenario'));
		var graphId = _.toNumber(row.data('id'));

		showGraph(state, graphId);
		$(".load-scenario-modal").find('.toggle-modal').trigger('click');
	});

	$(document).on('click', '[data-add-graph-scneario]', function () {
		var id = $(this).closest('tr').data('id');
		showGraph(state, id);
	});

	$(document).on('click', '.saveScenario', function () {
		if (state.activeGraphId <= 0) {
			$(".save-scenario-modal").find('.toggle-modal').trigger('click');
		} else {
			var parameters = _.chain(parametersList.arr).map(function (item) {
				return {
					parameterIndex: item.parameterIndex,
					value: item.value || 0
				}
			}).filter(function (f) { return _.isNumber(f.parameterIndex) }).value();
			var isAutomate = _.chain(parametersList.arr).filter({ name: 'automate' }).first().get('value').value() == 'Yes';
			var graphToUpdate = _.find(state.graphs, { id: state.activeGraphId });
			graphToUpdate.isAutomate = isAutomate;
			graphToUpdate.parameters = parameters;
			var inputPayload = _.pick(graphToUpdate, ['name', 'isAutomate', 'parameters']);
			Api.updateScenario(state.activeGraphId, inputPayload).then(function () {
				alert('Scenario is saved successfully');
			});
		}
	});

	$(document).on('click', '.toggle-pdf-modal', function () {
		var graphToUpdate = _.find(state.graphs, { id: state.activeGraphId });
		var graphName;
		if (graphToUpdate) {
			graphName = graphToUpdate.name;
		} else {
			graphName = "Default Parameter";
		}
		$("[data-export-pdf-title]").text('Your ' + graphName + ' PDF');
		var pdfName = pdfHelper.getPdfName(graphName, parametersList.costModels);
		$("[data-pdf-name]").text(pdfName);
		$('.modal-overlay[data-modal="export"]').toggleClass('active');
	});

	$(document).on('click', '.showPrevGraph', function () {
		var tabs = $(".tabs-content .tab").length;
		if (tabs > 1) {
			var currentActiveTab = $(".tabs-content .tab.active");
			if (currentActiveTab.is($('.tabs-content .tab').first())) {
				return;
			}
			var nextGraphTab = currentActiveTab.prevOrLast('.tab');
			nextGraphTab.trigger('click');
		}
	});

	$(document).on('click', '.showNextGraph', function () {
		var tabs = $(".tabs-content .tab").length;
		if (tabs > 1) {
			var currentActiveTab = $(".tabs-content .tab.active");
			if (currentActiveTab.is($('.tabs-content .tab').last())) {
				return;
			}
			var nextGraphTab = currentActiveTab.nextOrFirst('.tab');
			nextGraphTab.trigger('click');
		}
	});

	function addTabsMenu(graphs) {
		var graphMenuHtml = '';
		$.each(graphs, function (index, graph) {
			graphMenuHtml += '<div class="tab" data-select-graph="' + graph.id + '">' +
				'<span class="title">' + graph.name + '</span>' +
				'<i class="fa fa-times close" data-rm="tab"></i>' +
				'</div>';
		});
		$(".header-wrap .tabs-content .add-tab").before(graphMenuHtml);
	}



	ui.initModals($container).then(function (graphs) {
		// show the graph
		if (graphs.length) {
			state.graphs = graphs;
			addTabsMenu(graphs);
			showGraph(state, graphs[0].id); // load first graph
		} else {
			// load default
			state.graphs=[];
			showGraph(state, 0); // 0 id will return default;
		}
	});
});