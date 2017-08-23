// utility file to fetch all available components
define([
	'components/slider-input/index',
	'components/line-chart/index',
	'components/sensitivity-chart/index',
	'components/ring-chart/index',
	'components/table-chart/index',
	'components/toggle-input/index',
	'components/parameter-element/index',
	'components/add-graph/index',
	'components/load-modal/index',
	'components/header-dropdown/index',
	'components/modals/index'
], function(Slider, LineChart, SensitivityChart, RingChart, Table, Toggle, Parameter, AddGraph, LoadModal, Modals, HeaderDd) {
	var components = {};

	components[Slider.name] = Slider;
	components[LineChart.name] = LineChart;
	components[SensitivityChart.name] = SensitivityChart;
	components[RingChart.name] = RingChart;
	components[Table.name] = Table;
	components[Toggle.name] = Toggle;
	components[Parameter.name] = Parameter;
	components[AddGraph.name] = AddGraph;
	components[LoadModal.name] = LoadModal;
	components[HeaderDd.name] = HeaderDd;
	components[Modals.name] = Modals;

	return components;
});