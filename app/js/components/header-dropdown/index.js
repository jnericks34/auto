define(['jquery', 'd3', 'components/ui-component/index', 'moment'], function ($, d3, UiComponent, moment) {
	'use strict';

	/**
	 * HeaderDropdown Dropdown that allows user to select different graphs for comparision
	 */
	function HeaderDropdown() {
		this.templateUrl = 'js/components/header-dropdown/template.html';

		this.bindings = {};

		this.elems = {
			'$graphRowTpl': '[data-row-graph]',
			'$loadRowTpl': '[data-row-load]',
			'$graphRows': '[graph-rows]',
			'$loadRows': '[load-rows]',
			'$selected': '[data-selected]'
		};

		this.super.apply(this, arguments);
	}

	HeaderDropdown.prototype.render = function () {
		var vm = this;
		// trigger rows update
		this.updateRows();

		// move the saves under graph names
		d3.select(this.$graphRows[0])
			.selectAll('li')
			.sort(function (d) { return d ? -1 : 1 });

		// show the selected option
		this.$selected.text(this.cfg.selected.name);

		// listen for changes and trigger custom event
		this.$el.on('change', '.select-graph', function (ev) {
			vm.$el.trigger('select:graph', ev.target.value);
			vm.$selected.text(ev.target.value);
		});
	}

	/**
	 * updateRows Render the available graphs and saves
	 */
	HeaderDropdown.prototype.updateRows = function () {
		var data = [];
		this.model.map(function (item) {
			data.push({
				id: item.id,
				name: item.name,
				date: moment(item.createdAt).format('DD/MM/YYYY'),
				time: moment(item.createdAt).format('HH:mm')
			});
		});

		var loadRows = d3.select(this.$loadRows[0])
			.selectAll('tr.load-row')
			.data(data);

		loadRows.enter()
			.append(this.loadRowTpl.bind(this));

		loadRows.exit().remove();
	}

	/**
	 * graphRowTpl Template for new graph name row
	 * @param  {DomElement} row The element that's being updated
	 * @param  {any} d   Data for the row
	 */
	HeaderDropdown.prototype.graphRowTpl = function (row, d) {
		row.select('[data-col-name]').text(d.name);

		var isSelected = this.cfg.selected.name === d.name;

		row.select('input')
			.attr('id', this.uuid + d.name)
			.attr('checked', isSelected || undefined)
			.attr('value', d.name)
			.attr('name', 'in-' + this.uuid);

		row.select('label').attr('for', this.uuid + d.name);
	}

	/**
	 * loadRowTpl Template for new graph save
	 * @param  {data} d Data for the row
	 * @return {DomElement}
	 */
	HeaderDropdown.prototype.loadRowTpl = function (d) {
		var vm = this;
		var row = this.$loadRowTpl.clone();
		var isSelected = this.cfg.selected.name === d.name;
		row.find('[data-col-date]').text(d.date);
		row.find('[data-col-time]').text(d.time);
		row.find('[data-col-total]').text(d.name);
		row.data('id', d.id);
		row.on('click', function (ev) {
			vm.$el.trigger('select:graph', {name: d.name,id:d.id});
			vm.$selected.text(d.name);
		});
		return row[0];
	}


	return UiComponent.create(HeaderDropdown)
});
