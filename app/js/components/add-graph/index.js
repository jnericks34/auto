define(['jquery', 'd3', 'components/ui-component/index', 'moment'], function ($, d3, UiComponent, moment) {
	'use strict';

	/**
	 * AddGraphModal Modal that show's user options for adding new graph on dashboard
	 */
	function AddGraphModal() {
		this.templateUrl = 'js/components/add-graph/template.html';

		this.bindings = {};

		this.elems = {
			'$graphRowTpl': '[data-row-graph]',
			'$loadRowTpl': '[data-row-load]',
			'$rowsWrap': 'tbody'
		};

		this.super.apply(this, arguments);
	}

	AddGraphModal.prototype.render = function () {
		// empty the rows
		this.$rowsWrap.empty();
		// trigger rows update
		this.updateRows();
		this.model.rx.subscribe(this.updateRows.bind(this));
	}

	/**
	 * updateRows Render the available graphs and saves
	 */
	AddGraphModal.prototype.updateRows = function () {
		var graphs = [];
		this.model.data.map(function (item) {
			graphs.push({
				id: item.id,
				name: item.name,
				date: moment(item.createdAt).format('DD/MM/YYYY'),
				time: moment(item.createdAt).format('HH:mm')
			});
		});

		var loadRows = d3.select(this.$rowsWrap[0])
			.selectAll('tr.load-row')
			.data(graphs,function(d){return d.id;});

		loadRows.exit().remove();
		loadRows.enter().append(this.loadRowTpl.bind(this));


		
	}

	/**
	 * graphRowTpl Template for a row containing a graph name
	 * @param  {any} d Data for the row
	 * @return {DomElement} The new row
	 */
	AddGraphModal.prototype.graphRowTpl = function (d) {
		var row = this.$graphRowTpl.clone();
		row.find('[data-col-name]').text(d.name);
		return row[0];
	}

	/**
	 * graphRowTpl Template for a row containing a graph save
	 * @param  {any} d Data for the row
	 * @return {DomElement} The new row
	 */
	AddGraphModal.prototype.loadRowTpl = function (d) {
		var row = this.$loadRowTpl.clone();
		row.find('[data-col-date]').text(d.date);
		row.find('[data-col-time]').text(d.time);
		row.find('[data-col-total]').text(d.name);
		row.data('id', d.id);
		return row[0];
	}

	return UiComponent.create(AddGraphModal)
});