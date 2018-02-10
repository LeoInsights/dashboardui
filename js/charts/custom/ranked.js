var base = require("../base.js");
var React = require("react");

module.exports = function (element, spec, options, my) {
	
	if (spec.select) {
		options.select = spec.select;
	} else {
		var select = {
			options: []
		}
		var metrics = [];
		spec.metrics.map(function(metric) {
			if (metric.default) {
				metrics.unshift({ field: metric.field} )
			} else {
				metrics.push({ field: metric.field} )
			}
			if (metric.label) {
				select.options.push({
					text: metric.label,
					value: metric.field
				})
				if (!select.defaultValue || metric.default) {
					select.defaultValue = metric.field
				}
			}
		})
		if (select.options.length != 0) {
			options.select = select
		}
		spec.metrics = metrics;
	}
	
	if (!spec.controller) {
		element.removeClass('is-controller')
		element.removeClass('is-not-controller')
		element.removeAttr('data-controller-selector')
	} else if (spec.controller && spec.controller.enabled === true) {
		element.addClass('is-controller')
		element.removeClass('is-not-controller')
		element.attr('data-controller-selector', spec.controller.selector)
	} else {
		element.removeClass('is-controller')
		element.addClass('is-not-controller')
		element.removeAttr('data-controller-selector')
	}
	
	my = my || {};
	var that = base(element, spec, options, my);
	
	
	my.redraw = function() {
		var compareValue = null;
		var data = my.getMetric(0);
		var metricOffset = data.metricOffsets[0];
		var column = data.mapping[data.metricOffsets[0]];
		
		return <div className="leo-ranked-chart" data-column_id={spec.columns[0]}>
			
			{
				spec.controller && spec.controller.enabled === true
				? <header></header>
				: false
			}
			
			<div>
				{
					options.select
					? <select defaultValue={options.select.defaultValue} className={options.select.options.length < 2 ? 'disabled' : ''} onChange={ (e) => { my.changeChart({ metrics: [{field: e.target.value}]}); }}>
						{
							options.select.options.map(function(option, index) {
								return <option key={index} value={option.value}>{option.text}</option>
							})
						}
					</select>
					: false
				}
			</div>
			<div className="table-wrapper">
				<table>
					<tbody>
					{
						data.rows.sort(function(a,b) {return parseFloat(0 + b[metricOffset]) - parseFloat(0 + a[metricOffset])}).map((row, i) => {
							var label = row[0] || '\u00a0' //non-breaking space
							var value = parseFloat(0 + row[metricOffset])
							if (!compareValue && compareValue !== 0) {
								compareValue = value;
							}
							var percentage = compareValue == 0 ? 0 : (value/compareValue)
							return <tr key={label} onClick={(e) => {
									var target = $(e.currentTarget);
									if (target.is(".active")) {
										target.removeClass("active");
										element.trigger('leo-click', [{active: false, series: row[0], value: row[1]}]); 
									} else {
										target.addClass('active').siblings().removeClass('active'); 
										element.trigger('leo-click', [{active: true, series: row[0], value: row[1]}]); 
									}
								}}>
								<td>
									<div>
										<span className={percentage<0 ? 'negative': ''} style={{width: Math.abs(percentage * 100) + "%"}}>{label}</span>
									</div>
								</td>
								<td>
									<div className="gray-zero">{column.formatter(value) || ''}</div>
								</td>
							</tr>
						})
					}
					</tbody>
				</table>
			</div>
		</div>
	};
	return that;
};
