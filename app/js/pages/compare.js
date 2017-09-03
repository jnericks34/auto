define(['jquery', 'helpers/data', 'helpers/ui', 'components/components', 'helpers/pdfHelper', 'Api'], function ($, data, ui, comp, pdfHelper, Api) {
	'use strict';

	// cache the body
	var $container = $('body');

	// create a minimal current page state
	var state = {

		graphData: {},
		chartView: 'graphs',
		graph1: {
			name: '',
			container: $('[data-graph-tab="g1"]')
		},
		graph2: {
			name: '',
			container: $('[data-graph-tab="g2"]')
		},
	};

	function showGraph(state, name, graphId) {
		var graphState = data.slice(state, name);

		// fetch data if needed
		state.graphData[name] = data.fetchParamsLists.call(0, graphId);

		// render graph when data's ready
		state.graphData[name].then(renderGraphData.bind(0, graphState));
	}

	/**
	 * renderGraphData
	 * @param  {any} state
	 * @param  {any} paramsList
	 */
	function renderGraphData(state, paramsList) {
		ui.attachParamsLists(state.container, paramsList);
		ui.attachCostsGraphs(state.container, paramsList);
		state.paramsList = paramsList;
		// toggle hold for all params 
		data.toggleParamsHold(paramsList.arr, true);
		setTimeout(function () {
			data.toggleCostsHold(paramsList.costModels, true);
		}, 500);
	}

	// toggle the view on tablet
	function toggleChartView() {
		$('[data-chart-view]').hide();
		$('[data-chart-view="' + state.chartView + '"]').show();
		$('[data-toggle-chart]').removeClass('active');
		$('[data-toggle-chart="' + state.chartView + '"]').addClass('active');
	}

	$('[data-toggle-chart]').bind('click', function (ev) {
		state.chartView = $(ev.target).data('toggleChart');
		toggleChartView();
	});

	toggleChartView();

	// bind restore data actions
	$container.find('[data-restore-data]').bind('click', function (ev) {
		var graph = $(ev.target).data('restoreData');
		var graphState = data.slice(state, graph);
		showGraph(state, graph, 0);
	});

	$($container).on('click', '.save-graph', function () {

		var graph = state.graph1;
		if ($(this).parent().parent().attr('data-graph-tab')=='g2'){
			graph = state.graph2;
		}

		var parameters = _.chain(graph.paramsList.arr).map(function (item) {
			return {
				parameterIndex: item.parameterIndex,
				value: item.value || 0
			}
		}).filter(function (f) { return _.isNumber(f.parameterIndex) }).value();
		var isAutomate = _.chain(graph.paramsList.arr).filter({ name: 'automate' }).first().get('value').value() == 'Yes';
		graph.isAutomate = isAutomate;
		graph.parameters = parameters;
		var inputPayload = _.pick(graph, ['name', 'isAutomate', 'parameters']);

		Api.updateScenario(graph.id, inputPayload).then(function () {
			alert('Scenario is saved successfully');
		});
	});

	$($container).on('click', '.toggle-pdf-modal', function () {
		var graphTarget = $(this).data('modal');
		var graphState = data.slice(state, graphTarget);
	
		$("[data-export-pdf-title]").text('Your ' + graphState.name + ' PDF');
		var pdfName = pdfHelper.getPdfName(graphState.name, graphState.paramsList.costModels);
		$("[data-pdf-name]").text(pdfName);
		$("[data-download-pdf]").data("graphTarget", graphTarget);
		$('.modal-overlay[data-modal="export"]').toggleClass('active');
	});

	$($container).on('click', '[data-download-pdf]', function () {
		var graphTarget = $(this).data("graphTarget");
		var graphState = data.slice(state, graphTarget);
		var pdfName = $("[data-pdf-name]").text();
		pdfHelper.downloadPDF(graphState.paramsList, graphState.paramsList.costModels, graphState.container, pdfName);
	})

	$($container).on('click', '[data-share-pdf]', function () {
		var graphTarget = $('[data-download-pdf]').data("graphTarget");
		var graphState = data.slice(state, graphTarget);
		var pdfName = $("[data-pdf-name]").text();
		var email = $("[data-share-email]").val();
		pdfHelper.getPDF(graphState.paramsList, graphState.paramsList.costModels, graphState.container, pdfName).done(function(data){
			data.document.getBase64(function(pdfDoc){
				var apiData = {doc:pdfDoc, fileName:pdfName, email:email}
				Api.shareScenario(apiData).then(function(){
					alert('Scenario report shared successfully');
					$('.modal-overlay[data-modal="export"]').toggleClass('active');
				});
			})
		});
	})

	// attach the page modals
	ui.initModals($container)
		.then(function (data) {

			var graph1 = null; if (data.length>0) graph1 = data[0];
			var graph2 = null; if (data.length>1) graph2 = data[1];

			if (graph1) {
				state.graph1.name = graph1.name;
				state.graph1.id = graph1.id;
			} else {
				state.graph1.name = "Default Parameter";
			}
			var dd1 = (new comp.HeaderDropdown({
				model: data, options: { selected: state.graph1 }
			}));

			if (graph2) {
				state.graph2.name = graph2.name;
				state.graph2.id = graph2.id;
			} else {
				state.graph2.name = "Default Parameter";
			}

			var dd2 = (new comp.HeaderDropdown({
				model: data, options: { selected: state.graph2 }
			}));

			dd1.mount($container.find('[data-dd-select-graph1]')[0]);
			dd2.mount($container.find('[data-dd-select-graph2]')[0]);

			var updateGraph = function (graph, ev, gdata) {
				state[graph].name = gdata.name;
				state[graph].id = gdata.id;
				showGraph(state, graph,gdata.id);
			};

			dd1.$el.on('select:graph', updateGraph.bind(this, 'graph1'));
			dd2.$el.on('select:graph', updateGraph.bind(this, 'graph2'));

			var graph1Id = 0;
			if (graph1) {
				graph1Id = graph1.id;
			}
			var graph2Id = 0;
			if (graph2) {
				graph2Id = graph2.id;
			}

			// plot the graphs
			showGraph(state, 'graph1', graph1Id);
			setTimeout(function () {
				showGraph(state, 'graph2', graph2Id);
			}, 300);
		});
});