define(['jquery', 'd3', 'components/ui-component/index', 'moment', 'Api'], function ($, d3, UiComponent, moment, Api) {
	'use strict';

	function Modals() {
		this.super.apply(this, arguments);
	}

	Modals.prototype.render = function () {
		clearSaveScenarioForm();
	}

	function clearSaveScenarioForm() {
		$("[data-save-date]").text(moment().format('DD/MM/YYYY'));
		$("[data-save-time]").text(moment().format('HH:mm'));
		$("#newScenarioName").val('');
	}

	return UiComponent.create(Modals)
});