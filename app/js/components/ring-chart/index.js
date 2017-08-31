define(['jquery', 'components/ui-component/index', 'd3'], function ($, UiComponent, d3) {
	'use strict';
	// save tau for ease of use
	var tau = Math.PI * 2;

	function RingChart(model, $el) {
		this.className = 'ring-chart';
		this.templateUrl = 'js/components/ring-chart/template.html';

		this.elems = {
			'chartEl': '.ring-chart-el',
			'titleEl': '.ring-chart-title'
		};

		this.super.apply(this, arguments);

		// config current ring/donut chart
		this.donutSize = .75; // % of the entire graph
		this.bgThickness = 8; // thickness of the background track
		this.progressThickness = 4; // thickness of the progress track
		this.color = this.cfg.color || 'white'; // progress track's color

		// calculate the donut's radius
		this.radius = Math.min(this.cfg.width, this.cfg.height) / 2 * this.donutSize;
		// the progress' domain
		this.domain = this.model.max || this.cfg.max || this.model.maxCosts(1000);
	}

	RingChart.prototype.render = function () {
		// update chart's title/label
		this.titleEl.text(this.model.title);

		this.svg = this.createSvg();

		// draw chart's background arc
		this.appendArc({
			data: { endAngle: tau + tau / 2 },
			width: this.bgThickness,
			cls: 'bg-arc'
		});

		// arc function used to draw the progress
		var arc = function (value) {
			return {
				data: this.toArc(value),
				width: this.progressThickness,
				cls: 'arc',
				color: this.color,
			};
		}.bind(this);

		// offset for the tick that indicates the holdValue's position
		var offset = this.radius + this.bgThickness;

		// subscribe to model updates
		this.model.rx.subscribe(function (model) {
			// calculate the current value, save format function
			// value will be percent of value at 365 divided by value at 1000
			var value365 = model.cost(365);
			var value1000 = model.cost(1000);
			if (value1000 === 0) {
			  value1000 = 1;
			}
			var value = _.divide(value365, value1000), fm = d3.format('.0%');
			// update text for current value + progress arc
			this.text.text(fm(value));
			this.appendArc(arc(value));
			this.value = value;

			// update the holdValue indicators
			var hv = model.holdValue,
				holdValue = hv !== undefined ? _.divide(model.costFnValues(hv, 365), model.costFnValues(hv, 1000)) : value;

			// show the holdValue indicators
			if (hv !== undefined) {
				!this.deltaText && this.showDeltaValues();

				this.deltaText.text(fm(value - holdValue));

				// update the tick that indicates the holdValue's position
				var rotation = this.toRad(holdValue, this.domain);
				this.deltaIndicator.attr("transform", "translate(" + Math.cos(rotation - Math.PI / 2) * offset + "," +
					Math.sin(rotation - Math.PI / 2) * offset + ") rotate(" + (rotation * 180 / Math.PI) + ")");
			} else {
				this.deltaText && this.hideDeltaValues();
			}
		}.bind(this));
	}

	/**
	 * showDeltaValues Append and update the elements indicating holdValue
	 */
	RingChart.prototype.showDeltaValues = function () {
		// draw the tick
		this.deltaIndicator = this.svg.append('polygon')
			.style("fill", "#ffd900")
			.attr('points', '0 2, 4 -8, -4 -8');

		// add the delta texts
		this.deltaTextsWrap = this.texts.append('g');

		// add the delta icon
		var deltaTriangle = this.deltaTextsWrap.append('polygon')
			.attr('points', '-15 12, -21 20, -9 20')
			.attr('fill', 'transparent').attr('stroke', '#ffd900');

		// position the texts inside the circle
		this.deltaText = this.deltaTextsWrap.append("text")
			.attr('class', 'delta')
			.attr('y', '18')
			.style('fill', '#ffd900')
			.attr('dx', '9');

		this.text.attr('y', '-5');
	}

	/**
	 * hideDeltaValues Hide all holdValue indicators
	 * 	and reposition the main text
	 */
	RingChart.prototype.hideDeltaValues = function () {
		this.deltaIndicator.remove();
		this.deltaTextsWrap.remove();
		this.deltaText = undefined;
		this.text.attr('y', '0');
	}

	/**
	 * toArc Utility function to convert value to d3 arc
	 */
	RingChart.prototype.toArc = function (value) {
		return { "endAngle": this.toRad(value, this.domain) };
	}

	/**
	 * toRad Convert value to radians
	 * @param  {number} value Current value
	 * @param  {number} max   Max value
	 */
	RingChart.prototype.toRad = function (value, max) {
		var delta = max || value;

		return tau / 2 + (value / delta * tau) || 0;
	}

	/**
	 * appendArc Append arc to svg
	 * @param  {any} p Config data
	 */
	RingChart.prototype.appendArc = function (p) {
		var arcPath = d3.arc()
			.innerRadius(this.radius - (p.width || 10) / 2)
			.outerRadius(this.radius + (p.width || 10) / 2)
			.startAngle(tau / 2);

		var arc = this.svg.selectAll("." + p.cls)
			.data([p.data]);

		// create the arc paths 
		// and update the old ones
		return arc.enter().append("path")
			.attr("class", p.cls)
			.merge(arc)
			.attr("fill", p.color)
			.attr("d", arcPath);
	}

	/**
	 * createSvg Create the main svg element + additional text elements
	 */
	RingChart.prototype.createSvg = function () {
		if (!this.__svg) {
			var svg = d3.select(this.chartEl[0])
				.append("svg:svg")
				.attr("width", this.cfg.width)
				.attr("height", this.cfg.height);

			var translate = "translate(" + this.cfg.width / 2 + "," + this.cfg.height / 2 + ")";

			// add the bg color
			svg.append('circle')
				.attr('r', this.radius - this.bgThickness / 2)
				.attr('cx', this.cfg.width / 2)
				.attr('cy', this.cfg.height / 2)
				.attr('fill', '#2b7d93');

			this.texts = svg.append("g")
				.attr("transform", translate)
				.style("text-anchor", "middle")
				.style("dominant-baseline", "middle")
				.attr('class', 'values');

			this.text = this.texts.append("text").attr('class', 'cvalue').style("font-size", "24px").style('fill','#fff');

			this.__svg = svg.append("g")
				.attr("transform", translate);
		}

		return this.__svg;
	}

	return UiComponent.create(RingChart);
});
