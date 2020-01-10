var base = require("../base.js");
var React = require("react");
var ReactDOM = require("react-dom");
var debounce = require('lodash.debounce');
var Highcharts = require('highcharts');

var DataAction = require("../../actions/data.js");

import { AgGridReact } from 'ag-grid-react';

var sort = require("../../sort.js");
var format = require("../../format.js");

class BasicRenderer extends React.Component {
    render() {
        const { value } = this.props;

        return <div 
        style={{
            width: '100%',
            height: '100%',
            paddingLeft: 0,
            verticalAlign: 'middle',
            textAlign:
                (this.props.colDef.colType == 'metric' || this.props.colDef.colType == 'fact') ? 'right' : (this.props.colDef.colType == 'center' ? 'center' : 'left'),
        }}
        dangerouslySetInnerHTML={{ __html: this.props.colDef.formatter ? this.props.colDef.formatter(value) : value }}></div>;
    }
}

class CustomPinnedRowRenderer extends React.Component {
    render() {
        var val = this.props.colDef.formatter ? this.props.colDef.formatter(this.props.value) : this.props.value;
        return (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    paddingLeft: 0,
                    fontWeight: 'bold',
                    verticalAlign: 'middle',
                    textAlign:
                        (this.props.colDef.colType == 'metric' || this.props.colDef.colType == 'fact') ? 'right' : (this.props.colDef.colType == 'center' ? 'center' : 'left'),
                    paddingTop: 0,
                    color: '#444444'
                }}
                dangerouslySetInnerHTML={{ __html: val }}
            >
            </div>
        );
    }
}

module.exports = function(element, spec, options, my) {
	my = my || {};

	spec.dimensions = spec.dimensions || spec.columns

	var that = base(element, spec, options, my)

	my.redraw = function() {
		var compareValue = null;
		return <SimpleTable spec = {
			spec
		}
		options = {
			options
		}
		data = {
			my.dataSources[0]
		}
		element = {
			element
		}
		/>
	}

	return that

}

class SimpleTable extends React.Component {

			// getInitialState() {
			// 	var sortBy = false;
			// 	var sortDir = 1;
			// 	if (this.props.spec && this.props.spec.sort && this.props.spec.sort[0]) {
			// 		sortBy = (this.props.spec.sort[0].column || this.props.spec.sort[0].column === 0) ? this.props.spec.sort[0].column : sortBy;
			// 		sortDir = this.props.spec.sort[0].direction == 'desc' ? -1 : 1
			// 	}

			// 	this.props.spec.startDownload = this.exportData

			// 	return {
			// 		filters: [],
			// 		sortBy: sortBy, //false,
			// 		sortDir: sortDir, //1
			// 		startRow: 0
			// 	};
            // }

            state = {
                filters: [],
                sortBy: null,
                sortDir: null,
                startRow: 0,
                agGridObject: null
            }

            constructor(props) {
                super(props);

                if($('#leo-title-bar').length) {
                    $(".leo-charts-wrapper").addClass('has-header2')
                }

                window.printData = this.printData.bind(this);
                window.exportData = this.exportData.bind(this);
            }

			componentWillMount() {
				this.preProcess()
			}

			componentWillReceiveProps(props) {
				this.preProcess(props)
			}

			componentDidMount() {
				var scrolls = $('#leo-dashboard .simple-table-wrapper .table-body:not(.has-scroll-handler)');
				var thisComponent = this
				scrolls.each(function() {
					$(this).scroll(function() {
						thisComponent.sparkline.doChart($(this))
					}).addClass('has-scroll-handler')
				})
				var sortBy = false;
				var sortDir = 1;
				if (this.props.spec && this.props.spec.sort && this.props.spec.sort[0]) {
					sortBy = (this.props.spec.sort[0].column || this.props.spec.sort[0].column === 0) ? this.props.spec.sort[0].column : sortBy;
					sortDir = this.props.spec.sort[0].direction == 'desc' ? -1 : 1
				}

				this.props.spec.startDownload = this.exportData
                this.setState({ sortBy: sortBy, sortDir: sortDir });

				this.componentDidUpdate()
			}

			componentDidUpdate() {
				this.adjustScrollFiller()
			}

			filterChange(col, e) {
				var filters = this.state.filters
				filters[col] = e.currentTarget.value
				this.setState({
					filters: filters
				}, () => {
					this.preProcess()
				})
            }
            
            exportData2(doPrint) {
                var outRows = [];
                var newRow = [];
        
                var xtable = $(".leo-simpletable").eq(0);
                var xheader = xtable.find("tr.headers");
                var xh = xheader.find("span:visible");
                var hc = 0;
                var hidecols = [];
                var i;
                if(xheader.length == 0) {
                    var columns = this.state.agGridObject.columnApi.getAllDisplayedColumns();
    
                    for(i = 0; i < columns.length; i++) {
                        var headername = columns[i].colDef.headerName;
                        newRow.push(headername);
                    }
                }
                else {
                    xheader.find("span").each(function() {
                        //console.log($(this)[0].textContent);
                        if($(this).is(":visible")) {
                            hidecols[hc] = false;
                            newRow.push('"' + $(this)[0].textContent.replace("\"","") + '"');
                        }
                        else {
                            hidecols[hc] = true;
                        }
                        hc++;
                    });
                }
        
                outRows.push(newRow);
        
                newRow = [];
                var main_table = [];

                if(this.state.agGridObject == null) {
                    return; // nope
                }

                var visible = this.state.agGridObject.columnApi.getAllDisplayedColumns();

                // hide all by default
                hidecols.forEach((e,i,a)=>{
                    hidecols[i] = true;
                })

                for(i = 0; i < visible.length; i++) {
                    var col = parseInt(visible[i].colId.split("_")[0]);
                    hidecols[col] = false;
                }

                // we are going to print/export the currently-filtered view!
                this.state.agGridObject.api.forEachNodeAfterFilter((node,index)=> {
                    var res = [];
                    Object.keys(node.data).map(function(key,i) {
                        res[i] = [node.data[i]];
                    });
                    main_table.push(res);
                });

                if(main_table.length > 1800 && doPrint) {
                    alert("Report is too large to print at " + main_table.length + " rows. Please filter the report to less than 1800 rows, or export the data to CSV and use Excel to print.");
                    return; // abort.
                }

                for(i = 0; i < main_table.length; i++) {
                    for(var j = 0; j < main_table[i].length; j++) {
                        if(hidecols[j] == false) {
                            if(main_table[i][j] === null) {
                                newRow.push('""'); // null - blank.
                            }
                            else {
                                // if(outRows[0][newRow.length].indexOf("Expected") >= 0) {
                                //     // special case...this is in pennies for whatever reason, and we need it formatted as money.  this is because the value: is a function() for this column.
                                //         newRow.push('"' + (Math.round(toDecimal(main_table[i][j].toString())) / 100) + '"');
                                // }
                                // else {
                                    newRow.push('"' + main_table[i][j].toString().replace("\"","") + '"');
                                // }
                            }
                        }
                    }
                    outRows.push(newRow);
                    newRow = [];
                }
                for(var j = 0; j < main_totals.length; j++) {
                    if(hidecols[j] == false) {
                        if(main_totals[j] === null || typeof main_totals[j] === 'undefined') {
                            newRow.push('""'); // null - blank.
                        }
                        else {
                            // if(outRows[0][newRow.length].indexOf("Adj ") >= 0 && (outRows[0][newRow.length].indexOf(",") == -1 && outRows[0][newRow.length].indexOf(",") == -1) && outRows[0][newRow.length].indexOf(" % ") == -1) {
                            //     // for some reason on the Credits by Effective Date version, the Adjusted columns are still in pennies.  In this case, divide by 100.
                            //     newRow.push('"' + (Math.round(toDecimal(main_totals[j].toString())) / 100) + '"');
                            // }
                            // else if(outRows[0][newRow.length].indexOf("Expected") >= 0) {
                            //     // special case...this is in pennies for whatever reason, and we need it formatted as money.  this is because the value: is a function() for this column.
                            //     newRow.push('"' + (Math.round(toDecimal(main_totals[j].toString())) / 100) + '"');
                            // }
                            // else {
                                newRow.push('"' + main_totals[j].toString().replace("\"","") + '"');
                            // }
                        }
                    }
                }
                outRows.push(newRow);
        
                var title="export";
                var data = outRows;
        
                var downloadForm = $("#downloadformRSIS");
                // if (!downloadForm.length) {
                if(doPrint == true) {
                    downloadForm = $('<div id="downloadformRSIS" style="display: none"><form method="POST" target="_blank" action="./printPage.php?name=Import Totals" /></div>').appendTo("body");;
                }
                else {
                    downloadForm = $('<div id="downloadformRSIS" style="display: none"><form method="POST" action="/api/warehouse2/download" /></div>').appendTo("body");
                }
                        // downloadForm = $('<div id="downloadformRSIS" style="display: none"><form method="POST" action="/api/warehouse2/download" /></div>').appendTo("body");
                // }
                var inputtitle = $('<input type="hidden" name="title" value="' + title + '.csv"/>');
                var inputdata = $('<input type="hidden" name="data" />');
                inputdata.val(data.map(function (r) {
                    var rStr = r.join(",");
                    rStr = rStr.replace(/<\/?[^>]+(>|$)/g, "");
                    return rStr;
                }).join("\r\n"));
                downloadForm.find("form").empty().append(inputtitle).append(inputdata).submit();
            }
        
            help() {
                return;
            }

            printData() {
                return this.exportData2(true);
            }

			exportData(data, columns) {
                return this.exportData2(false);

				if (!data) {
					data = this.rows
					columns = this.columns
				}

				var outColumns = [];
				columns.forEach(function(col, i) {
					if (col.export !== false) {
						col.export.forEach(function(ex, i) {
							outColumns.push(ex);
						});
						if (col.export.length == 0 && col.func) {
							outColumns.push({
								label: col.label,
								func: col.func
							})
						}
					}
				});

				var outRows = [];

				// HEADERS
				let newRow = [];
				outColumns.forEach(function(col, i) {
					newRow.push(col.label);
				});
				outRows.push(newRow);

				for (let i = 0; i <data.length; i++) {
					var row = data[i];
					let newRow = [];
					outColumns.forEach((col, i) => {
						let v = '';
						if (col.formatter) {
							v = col.formatter(row[col.rowIndex]);
						} else {
							v = col.func(this.getValue.bind(this, row));
						}
						if (v && v.replace) {
							newRow.push('"' + v.replace(/\"/g, '') + '"');
						} else {
							newRow.push(v);
						}
					});
					outRows.push(newRow);
				}
				DataAction.downloadData("export", outRows);
			}

			sortBy(col, e) {
				this.setState({
					sortBy: col,
					sortDir: (col == this.state.sortBy ? -this.state.sortDir : -1)
				}, function() {
					setTimeout(() => {
						var element = ReactDOM.findDOMNode(this)
						$(element).trigger('leo-after-sort', [$(element)]);
					}, 500)
				});
			}

			sparkline = {
				start: 0,
				$tds: [],
				fullLen: 0,
				lastcall: 0,
				hasSparkline: false,

			    init: function() {
					var sparkline = this;

					if (!sparkline.hasSparkline) {
						sparkline.hasSparkline = true;

						$('#leo-dashboard').on({
							'leo-after-render'(event, element) {
								sparkline.doChart(element);
							},
							'leo-after-sort'(event, element) {
								sparkline.doChart(element);
							}
						});

						Highcharts.SparkLine = function(a, b, c) {
							var hasRenderToArg = typeof a === 'string' || a.nodeName,
								options = arguments[hasRenderToArg ? 1 : 0],
								defaultOptions = {
									chart: {
										renderTo: (options.chart && options.chart.renderTo) || this,
										backgroundColor: null,
										borderWidth: 0,
										type: 'area',
										height: 20,
										margin: [0, 0, 0, 0],
										style: {
											overflow: 'visible'
										},
										skipClone: true
									},
									title: {
										text: ''
									},
									credits: {
										enabled: false
									},
									xAxis: {
										labels: {
											enabled: false
										},
										title: {
											text: null
										},
										startOnTick: false,
										endOnTick: false,
										tickPositions: []
									},
									yAxis: {
										endOnTick: false,
										startOnTick: false,
										labels: {
											enabled: false
										},
										title: {
											text: null
										},
										tickPositions: [0]
									},
									legend: {
										enabled: false
									},
									tooltip: {
										backgroundColor: null,
										borderWidth: 0,
										shadow: false,
										useHTML: true,
										hideDelay: 0,
										shared: true,
										padding: 0,
										positioner(w, h, point) {
											return {
												x: -5,
												y: -10
											};
										}
									},
									plotOptions: {
										series: {
											animation: false,
											lineWidth: 1,
											shadow: false,
											states: {
												hover: {
													lineWidth: 1
												}
											},
											marker: {
												radius: 1,
												states: {
													hover: {
														radius: 2
													}
												}
											},
											fillOpacity: 0.25
										},
										column: {
											negativeColor: '#910000',
											borderColor: 'silver'
										}
									}
								};

							options = Highcharts.merge(defaultOptions, options);

							return hasRenderToArg ?
								new Highcharts.Chart(a, options, c) :
								new Highcharts.Chart(options, b);
						};

					}
				},

				doChart: function(element) {
					var sparkline = this;
					this.start = new Date();
					this.$tds = element.find('span[data-sparkline]');

					var scrollTop = element.parent().scrollTop(),
						scrollBottom = scrollTop + element.parent().height(),
						start = 0,
						end = 0

					this.$tds.each(function(index) {
						var visiblePoint = $(this).position().top;
						if (visiblePoint <= scrollTop) {
							start = index
						}
						if (visiblePoint <= scrollBottom) {
							end = (index + 1)
						} else {
							return false;
						}
					})

					this.$tds = this.$tds.slice(start, end)
					this.$tds = this.$tds.filter(':not([data-highcharts-chart])');
					this.fullLen = this.$tds.length;

					//if ($.now() - this.lastcall > 5000) {
					sparkline.doChunk(sparkline);
					//}
                },
                
				doChunk: function (sparkline) {
					var time = new Date(),
						i,
						len = sparkline.$tds.length,
						$td,
						stringdata,
						arr,
						data,
						chart;

					for (i = 0; i <len; i++) {
						this.lastcall = $.now();
						$td = $(this.$tds[i]);
						stringdata = $td.data('sparkline');
						arr = stringdata.split('; ');
						data = $.map(arr[0].split(','), parseFloat);
						chart = {};
						if (arr[1]) {
							chart.type = arr[1];
						}
						$td.highcharts('SparkLine', {
							series: [{
								data: data,
								pointStart: 1
							}],
							tooltip: {
								formatter: (typeof sparkLineToolTipFormatter == 'function') ? function() {
									return sparkLineToolTipFormatter(this.x, this.y)
								} : null
							},
							chart: chart
						});

						// If the process takes too much time, run a timeout to allow interaction with the browser
						if (new Date() - time > 500) {
							this.$tds.splice(0, i + 1);
							setTimeout(function() {
								sparkline.doChunk(sparkline)
							}, 0);
							break;
						}
					}
				}
            }

			getValue(row, column, format = true) {
				let index = null;
				let matches;

				if (column.index !== undefined) {
					index = this.colMapping[column.col.id || column.col][column.index];
				} else if (matches = column.match(/^(.*)\:(\d+)$/)) {
					index = this.colMapping[matches[1]][matches[2]];
				} else if (this.colMapping[column]) {
					index = this.colMapping[column][0];
				} else {
					index = -1
				}

				let c = this.props.data.mapping[index];
				if (format && c && c.formatter) {
					return c.formatter(row[index]);
				} else {
					return row[index];
				}
			}

			colMapping = {};
			rows = [];
			columns = [];

			preProcess(props) {

				props = props || this.props

				this.rows = props.data.rows;
				if (props.spec.onNewData && props.spec.onNewData in window) {
					this.rows = window[props.spec.onNewData](this.rows);
				}

				/** **************This should only happen on datasource change instead of every render*********************************** */

				// Map IN columns
				this.colMapping = {};
				if (props.data.mapping) {
					for (var i = 0; i <props.data.mapping.length; i++) {
						if (!(props.data.mapping[i].id in this.colMapping)) {
							this.colMapping[props.data.mapping[i].id] = [];
						}
						this.colMapping[props.data.mapping[i].id].push(i);
					}
				}

				//expand "*"
				var outColumns = [];
				props.spec.outColumns.map((col) => {
					if (col.value && typeof col.value === 'string' && col.value.match(/\:\*$/)) {
						var value = col.value.replace(/\:\*$/, '');
						for (var j = 0; j <props.data.headers[0].length; j++) {
							var col2 = JSON.parse(JSON.stringify(col));
							col2.label = col2.label.replace('*', props.data.headers[0][j].value);
							col2.value = value + ':' + j;
							outColumns.push(col2)
						}
					} else {
						outColumns.push(col)
					}
				});

				// Map OUT columns
				this.columns = []
				outColumns.map((col, i) => {
					var column = {
						col: null,
						export: []
					};

					var colName = false;
					if (col.sparkline) {
						if (typeof col.sparkline === 'string') {
							col.sparkline = [col.sparkline];
						}

						if (col.sparkline.length == 1 && col.sparkline[0].match(/\:\*$/)) {
							var value = col.sparkline[0].replace(/\:\*$/, '');
							col.sparkline = [];
							for (var j = 0; j <props.data.headers[0].length; j++) {
								col.sparkline.push(value + ':' + j)
							}
						}

						column.func = (values) => {
							this.sparkline.init();
							return '<span data-sparkline="' + col.sparkline.map(function(query) {
								var value = values(query);
								return (value ? value.toString().replace(/[^0-9.-]/g, '') : 0);
							}).join(',') + '"></span>';
						}
					} else if (col.value && typeof col.value === 'function') {
						column.func = col.value;
					} else {
						var colName = col.value;
					}

					if (colName) {
						if (colName.match(/\:\d+$/)) {
							var index = colName.split(/\:/).pop();
							colName = colName.replace(/\:\d+$/, '');
						} else {
							index = 0;
						}
						column.id = colName;
						column.index = index;
						column.col = props.data.columns[colName];
						column.formatter = column.col ? column.col.formatter : (n) => {
							return n
						}
						column.sort = column.col ? column.col.sort : (n) => {
							return n
						} //this.props.data.dimensions[colName].sort;
					} else {
						column.sort = col.sort || {
							type: 'string'
						};
					}
					if (typeof col.formatter == "function") {
						column.formatter = col.formatter;
					} else if (col.formatter) {
						column.formatter = format.get({
							format: col.formatter
						});
					}
					column.width = col.width || (Math.floor(100 / outColumns.length) + '%') // 60;
					column.className = col.className || '';

					if (column.col) {
						column.type = col.type || column.col.type;
						column.label = col.label || column.col.label;
					} else {
						column.type = col.type;
						column.label = col.label;
					}
					if (column.type === "metric") {
						column.className += " numeric";
					}
					if (col.filter === false) {
						column.filter = false;
					} else {
						column.filter = col.filter || null;
					}

					if (col.sparkline) {
						col.export = false;
					}

					if (col.export === false) {
						column.export = false;
					} else if (col.export || column.id) {
						if (!col.export) {
							col.export = [column.id];
						} else if (!$.isArray(col.export)) {
							col.export = [col.export];
						}
						col.export.forEach((ex, i) => {
							let e = {};
							if (!ex.label && !ex.value) {
								e.label = column.label;
								e.value = column.id;
							} else {
								e.label = ex.label || column.label;
								e.value = ex.value || column.id;
							}

							var colName = e.value;
							e.formatter = props.data.columns[colName] ? props.data.columns[colName].formatter : (n) => {
								return n
							}
							var index = 0;
							if (colName.match(/\:\d+$/)) {
								index = colName.split(/\:/).pop();
								colName = colName.replace(/\:\d+$/, '');
							}
							e.rowIndex = this.colMapping[colName] ? this.colMapping[colName][index] : -1
							column.export.push(e);
						});
					}

					if (!column.func) {
						column.rowIndex = this.colMapping[column.id] ? this.colMapping[column.id][column.index] : -1;
					}

					this.columns.push(column);
				});

				// Translate IN columns into OUT columns
				this.outRows = []
				for (let i = 0; i <this.rows.length; i++) {
					var row = this.rows[i];
					var newRow = [];
					this.columns.forEach((column, i) => {
						var value = null;
						if (column.func) {
							newRow.push(column.func(this.getValue.bind(this, row)));
						} else {
							newRow.push(row[column.rowIndex]);
						}
					});
					this.outRows.push(newRow);
				}

				if (props.spec.onRender && props.spec.onRender in window) {
					this.outRows = window[props.spec.onRender](this.outRows);
				}

				/** ***************************END*********************************** */
			}

			visibleRowCount = 300;
			rowHeight = 30;

			handleScroll(event) {
				var scrollTop = $(event.currentTarget).scrollTop(),
					startRow = Math.floor(scrollTop / (this.rowHeight * (this.visibleRowCount / 3))) * (this.visibleRowCount / 3)

				if (startRow != this.state.startRow) {
					this.adjustScrollFiller(startRow)
					this.setState({
						startRow: startRow
					})
				}
			}

			adjustScrollFiller(startRow) {
				startRow = startRow || this.state.startRow
				var $element = $(this.props.element)
				this.rowHeight = $element.find('.top-filler').next().height()
				$element.find('.top-filler').css({
					height: this.rowHeight * startRow
				})
				$element.find('.bottom-filler').css({
					height: this.rowHeight * (this.totalRows - startRow - this.visibleRowCount)
				})
            }
            
            onFirstDataRendered = params => {
                params.api.sizeColumnsToFit();
            }

            onFilterChanged = params => {
                if (this.props.spec.onTotals && this.props.spec.onTotals in window) {
                    var outRows = [];
                    params.api.forEachNodeAfterFilter((node,index)=> {
                        outRows.push(node.data)
                    });

					this.totals = []
					outRows.forEach((row, rowNum) => {
						this.columns.forEach((column, i) => {
							if (typeof row[i] == 'number') {
								this.totals[i] = (typeof this.totals[i] == 'undefined' ? 0 : this.totals[i]) + parseFloat(0 + row[i])
							}
						})
					})

					this.totalRows = outRows.length

                    var totals = this.totals
                    
					if (this.props.spec.onTotals && this.props.spec.onTotals in window) {
						totals = window[this.props.spec.onTotals](totals, outRows, this.rows);
					}

                    var totals2 = [];
                    totals2[0] = [];
                    for(var i = 0; i < totals.length; i++) {
                        totals2[0][i] = totals[i] ? totals[i] : '';
                    }

                    params.api.setPinnedBottomRowData(totals2);

                    // var totals = window[this.props.spec.onTotals](this.totals, outRows, this.rows);
                    // var totals2 = [];
                    // totals2[0] = [];                    
                    // for(var i = 0; i < totals.length; i++) {
                    //     totals2[0][i] = totals[i] ? totals[i] : '';
                    // }

                    this.totals = totals2;
                }
            }

            onGridReady = params => {
                this.setState( { agGridObject: params });
                if(window.gridAPICallback) {
                    window.gridAPICallback(params);
                }
            }

            onGridSizeChanged = params => {
                params.api.sizeColumnsToFit();
            }

			render() {
                console.log("rerender");
					// Filter this new table
					this.outRows = this.outRows.filter((row, i) => {
						var matched = true;
						this.columns.map((column, j) => {
							if (column.filter && this.state.filters[j] !== undefined && matched) {
								var r = new RegExp(this.state.filters[j], 'i')
								if (column.filter === true) {
									matched = String(row[j]).match(r)
								} else {
									matched = column.filter(row, this.getValue.bind(this, this.rows[i]), r)
								}
							}
						});
						return !!matched;
					})

					this.totals = []
					this.outRows.forEach((row, rowNum) => {
						this.columns.forEach((column, i) => {
							if (typeof row[i] == 'number') {
								this.totals[i] = (typeof this.totals[i] == 'undefined' ? 0 : this.totals[i]) + parseFloat(0 + row[i])
							}
						})
					})

					this.totalRows = this.outRows.length

                    var totals = this.totals
                    
					if (this.props.spec.onTotals && this.props.spec.onTotals in window) {
						totals = window[this.props.spec.onTotals](totals, this.outRows, this.rows);
					}

                    var totals2 = [];
                    totals2[0] = [];
                    for(var i = 0; i < totals.length; i++) {
                        totals2[0][i] = totals[i] ? totals[i] : '';
                    }

					if (this.props.data.error || this.rows.length == 0) {
						 return <span> {
						 	this.props.spec.onEmpty || "No Data"
						 } </span>;
					}

					let className = "leo-simpletable";
					if (this.props.spec.style) {
						className += " leo-simpletable-" + this.props.spec.style;
					}

					// sort the rows
					var sortBy = this.state.sortBy;
					if (sortBy || sortBy === 0) {
						var mappings = {};
						mappings[sortBy] = this.columns[sortBy];
						this.outRows = this.outRows.sort(sort.getMultiCompare([{
							direction: this.state.sortDir === 1 ? 'asc' : 'desc',
							column: sortBy
						}], mappings));
					}

                    var gridOptions = {
                        enableSorting: true,
                        enableColResize: true,
                        enableFilter: true,
                        headerHeight: 48,
                        rowHeight: 30,
                        suppressPropertyNamesCheck: true,
                        enableCellTextSelection: true
                    };

                    var numComparator = function(num1, num2) {
                        var formatNum1 = parseFloat(num1.toString().replace(/[^0-9.-]/g, "")); 
                        var formatNum2 = parseFloat(num2.toString().replace(/[^0-9.-]/g, ""));
                        if (formatNum1 === null && formatNum2 === null) {
                          return 0;
                        }
                        if (formatNum1 === null) {
                          return -1;
                        }
                        if (formatNum2 === null) {
                          return 1;
                        }
                        return formatNum1 - formatNum2;
                    };
                    console.log("columnDefs");
                    var columnDefs = this.columns.map((column, i) => {
                        var headerClass = column.type == 'fact' || column.type == 'metric' ? 'rightJustifyHeader' : null;
                        var typ = column.type == 'fact' || column.type == 'metric' ? 'rightJustifyHeader' : null;
                        if(column.type == 'center') {
                            headerClass = 'centerJustifyHeader';
                        }
                        var extra = {};
                        if(this.state.sortBy == i && this.state.sortDir != null) {
                            extra.sort = this.state.sortDir == -1 ? 'desc' : 'asc';
                        }
                        return {                   
                            minWidth: 70,
                            headerName: column.label,
                            field: i.toString(),
                            type: typ,
                            pinnedRowCellRenderer: 'customPinnedRowRenderer',
                            cellRenderer: 'basicRenderer',
                            formatter: column.formatter,
                            colType: column.type,
                            headerClass: headerClass,
                            columnClassName: column.className,
                            ...extra
                        }
                    });
                    var rows = this.outRows.map(r=>{
                        var rw = {};
                        for(var i = 0; i < r.length; i++) {
                            rw[i.toString()] = r[i];
                        }
                        return rw;
                    });
                    var c = JSON.stringify(this.columns).substring(0,500);
                    var o = JSON.stringify(rows).substring(0,500);
					return ( 
                        <div className="simple-table-wrapper">

                        {/* <table className={className}>
                        <thead>
                            <tr className="title">
                                <td><span title="download">{this.props.options.title || this.props.spec.title}</span><i className="icon-download" onClick={this.exportData.bind(this, rows, this.columns)}></i></td>
                            </tr>
                        </thead>
                        </table> */}
                        <div
                            style={{
                                width: '100%',
                                height: '100%'
                            }}
                            className="ag-theme-balham my-grid"
                        >
                            <AgGridReact
                                    style={{ lineHeight: 20 }}
                                    columnDefs={columnDefs} /* this.state.columnDefs */
                                    rowData={rows}
                                    gridOptions={gridOptions}
                                    enableColResize={true}
                                    frameworkComponents={{
                                        customPinnedRowRenderer: CustomPinnedRowRenderer,
                                        basicRenderer: BasicRenderer 
                                    }}
                                    onGridSizeChanged={this.onGridSizeChanged.bind(this)}
                                    onGridReady={this.onGridReady.bind(this)}
                                    onFirstDataRendered={this.onFirstDataRendered.bind(this)}
                                    onFilterChanged={this.onFilterChanged.bind(this)}
                                    pinnedBottomRowData={
                                        totals2
                                    }
                            />
                        </div>
                    </div>
                    )
                }
}