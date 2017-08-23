define(['jquery'], function ($) {
	// open or close header dropdown
	$(document).on('click', '.header-dropdown, .tabs', function (ev) {
		if (ev.target === ev.currentTarget) {
			$(this).toggleClass('active');
		}
	});

	// open or close header dropdown
	$(document).on('click', '.header-dropdown-btn, .header-dropdown li:not(.disabled)', $.debounce(function (ev) {
		$(this).closest('.header-dropdown').toggleClass('active');
	}));

	// open or close graph tabs on tablet
	$('.add-tab, .tab-action-btn, .tab .title').on('click', function () {
		$(this).closest('.tabs').toggleClass('active');
	});

	// open or close modal
	$(document).on('click', '.toggle-modal', function () {
		$('.modal-overlay[data-modal="' + $(this).data('modal') + '"]').toggleClass('active');
	});

	$('[data-pagination] .nav-item').on('click', function (ev) {
		var target = $(ev.target).closest('.nav-item');
		target.addClass('active').siblings().removeClass('active');
	});

	// toggle view between gauges and tables on tablet
	$('[data-gv-toggle]').on('click', function (ev) {
		var target = $(this).closest('[data-gv-toggle]'),
			view = target.data('gvToggle');
		var details = target.closest('.graphs-details');
		$('[data-tables], [data-gauges]', details).removeClass('active');
		$('[data-' + view + ']', details).addClass('active');
		var pageNumber = target.data('pageNumber');
		$('[data-' + view + ']', details).find("tbody tr").hide();
		$('[data-' + view + ']', details).find("tbody tr").slice((pageNumber - 1) * 8, pageNumber * 8).show();
	});
});