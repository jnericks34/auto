define(['jquery', 'd3', 'components/ui-component/index', 'moment', 'Api'], function ($, d3, UiComponent, moment, Api) {
	'use strict';
	
	var sNameMax = 15; // Maximum length for scenario name
		
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
		$("#newScenarioName").attr('maxLength', sNameMax);
	}

	return UiComponent.create(Modals)
});
