define(['jquery', 'd3', 'components/ui-component/index'], function ($, d3, UiComponent) {
	'use strict';

	function TableChart(model, $el) {
		this.className = 'table-chart';
		this.templateUrl = 'js/components/table-chart/template.html';
		this.elems = {
			'tableEl': '.table-chart-el',
			'rowsWrap': '[data-rows]',
			'$rowTpl': '[data-row-tpl]'
		};

		this.super.apply(this, arguments);
	}

	TableChart.prototype.render = function () {
		// remove the template row
		this.$rowTpl.remove();
		
		// watch for new rows
		this.model.rx.data.subscribe(this.updateRows.bind(this));

		// check if view is on hold
		var onHold = this.model.data.filter(function (d) {
			return d.holdValue !== undefined && d.selected;
		})[0];

		// show the delta column if model's on hold
		if (onHold) {
			this.$el.find('.delta-col').show();
		}
	}

	TableChart.prototype.updateRows = function (rows) {
		var vm = this;

		// render table rows by provided data
		var rows = d3.select(this.rowsWrap[0])
			.selectAll('tr')
			.data(rows);

		// remove old rows
		rows.exit().remove();

		// add and update rows as necessary
		rows.enter()
			.append(this.rowTpl.bind(this))
			.merge(rows)
			.each(function (data) {
				vm.updateRow.call(vm, this, data);
			});
	}

	/**
	 * rowTpl Template function for new row
	 * @return {DomElement} The new row
	 */
	TableChart.prototype.rowTpl = function () {
		return this.$rowTpl.clone()[0];
	}

	/**
	 * updateRow Updates specificed row with provided data
	 * @param  {DomElement} row  Row to be updated
	 * @param  {any} data		 Data for current row
	 */
	TableChart.prototype.updateRow = function (row, data) {
		var fm = this.format != undefined ? d3.format(this.format) : d3.format('.2s'),
			s = d3.select(row),
			classToAdd = data.rowClassName;

		$(row).addClass(classToAdd);
		// update current row color
		s.select('[data-col-color]').style('color', data.color || 'transparent');
		s.select('[data-col-name]').text(data.title);

		// add unique ids for table rows and toggle
		// the input based on model's existence of color
		// which means the row is plotted on graph or not
		s.select('[data-col-delta]').select('label')
			.attr('for', data.uuid)
			.attr('class', data.color ? '' : 'hide-input');

		s.select('[data-col-delta]').select('input')
			.attr('checked', data.selected ? true : undefined)
			.attr('id', data.uuid);

		var update = function () {
			// update estimated costs for 365D and 1000D
			s.select('[data-col-costs="365"]').text(fm(data.cost(365)));
			s.select('[data-col-costs="1000"]').text(fm(data.cost(1000)));

			if (data.holdValue !== undefined) {
				var hv = data.costFn(data.value, 1000) - data.costFnValues(data.holdValue, 1000);
				s.select('[data-col-hold]').text(fm(hv))
			}

			this.$el.find('.delta-col').toggle(data.holdValue !== undefined);
		}.bind(this);

		$('[data-col-delta] input', row).bind('update change', function (ev) {
			var $input = $(ev.target);
			data.selected = $input.is(':checked');

			if (ev.type === 'change') {
				this.$el.find('[data-col-delta] input').not($input).trigger('update');
			}
		}.bind(this));

		// watch for row updates
		data.rx.subscribe(update);
	}

	return UiComponent.create(TableChart);
});