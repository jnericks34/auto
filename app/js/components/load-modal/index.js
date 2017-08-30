define(['jquery', 'd3', 'components/ui-component/index', 'moment', 'Api'], function ($, d3, UiComponent, moment, Api) {
	'use strict';

	/**
	 * LoadModal The modal visible when user selects load from 
	 * the header dropdown
	 */
	function LoadModal() {
		this.templateUrl = 'js/components/load-modal/template.html';

		this.bindings = {};

		this.elems = {
			'$rowTpl': '[data-row-tpl]',
			'$rowsWrap': '[load-rows]'
		};

		this.super.apply(this, arguments);
	}

	LoadModal.prototype.render = function () {
		this.$rowsWrap.empty();
		this.updateRows();
	}

	LoadModal.prototype.updateRows = function () {
		var data = [];
		this.model.map(function (item) {
			data.push({
				id: item.id,
				name: item.name,
				date: moment(item.createdAt).format('DD/MM/YYYY'),
				time: moment(item.createdAt).format('HH:mm')
			});
		});
		var graphRows = d3.select(this.$rowsWrap[0])
			.selectAll('tr.load-row')
			.data(data);

		graphRows.enter().append(this.rowTpl.bind(this));

		graphRows.exit().remove();
	}

	/**
	 * rowTpl Template for new graph name row
	 * @param  {DomElement} row The element that's being updated
	 * @param  {any} d   Data for the row
	 */
	LoadModal.prototype.rowTpl = function (d) {
		var row = this.$rowTpl.clone();
		row.find('[data-col-date]').text(d.date);
		row.find('[data-col-time]').text(d.time);
		row.find('[data-col-total]').text(d.name);
		row.data('id', d.id);
		return row[0];
	}

	return UiComponent.create(LoadModal)
});
