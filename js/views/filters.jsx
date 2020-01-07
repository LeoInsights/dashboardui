var React = require('react');
var Filter = require('./filter.jsx');
var OptionActions = require('../actions/options.js');
var DashboardOptions = require('../stores/options.js')();

class Filters extends React.Component {
    state = {
        filters: [],
        timefilter: null,
        timebreakdown: null
    };

    constructor(props) {
        super(props);
    }

    // test
    componentDidMount() {
        var options = DashboardOptions.getGroup('default');
        this.setState({
            timefilter: options.timeframe ? options.timeframe.value : null,
            timebreakdown: options.timebreakdown
        });

        var onUpdate = () => {
            var state = $.extend(
                true,
                {},
                DashboardOptions.getGroup('default')
            );
            state.timefilter = state.timeframe
                ? state.timeframe.value
                : state.timeframe;
            var oldFilters = state.filters;
            state.filters = [];
            for (var id in oldFilters) {
                state.filters.push(oldFilters[id]);
            }
            this.setState({ ...state });
        };
        DashboardOptions.on('change', onUpdate);
        onUpdate();
    }
    onTimeBreakdownChange(filter) {
        OptionActions.setTimeBreakdown('default', filter.value[0]);
    }
    onTimeFrameChange(filter) {
        this.state.timefilter = filter.value;
        OptionActions.setTimeFilter('default', filter.value);
    }
    onTimeFrameDelete(filter_id) {
        OptionActions.setTimeFilter('default', '');
    }
    onFilterChange(filter) {
        OptionActions.updateFilter('default', filter);
    }
    onFilterDelete(filter_id) {
        OptionActions.deleteFilter('default', filter_id);
    }
    autoComplete(filter_id, term, callback, api) {
        if (window.leo.autoComplete) {
            window.leo.autoComplete(filter_id, term, callback);
        } else if (api) {
            $.get(
                api +
                    encodeURIComponent(filter_id) +
                    '/' +
                    encodeURIComponent(term),
                function(result) {
                    callback(result);
                }
            );
        }
    }
    render() {
        var that = this;
        return (
            <div>
                <ul
                    className="leo-filters filters-wrapper active"
                    data-leo-group="default"
                >
                    {this.state.timefilter ? (
                        <Filter
                            key={'filter-timeframe'}
                            ref={'filter-timeframe'}
                            locked={true}
                            className="leo-timeframe-period"
                            filter={{
                                id: 'timeframe.d_date.id',
                                comparison: 'between',
                                value: this.state.timefilter,
                                label: 'Period'
                            }}
                            updateReportFilter={this.onTimeFrameChange.bind(
                                this
                            )}
                            removeFilter={this.onTimeFrameDelete.bind(this)}
                        />
                    ) : (
                        false
                    )}
                    {this.state.timebreakdown ? (
                        <Filter
                            key={'filter-timeframe-breakdown'}
                            ref={'filter-timeframe-breakdown'}
                            locked={true}
                            className="leo-timeframe-view-by"
                            filter={{
                                id: 'timeframe-visiblity',
                                comparison: '=',
                                value: this.state.timebreakdown,
                                label: 'View By',
                                singleChoice: true,
                                checkboxes: {
                                    //"hour": this.state.timebreakdown=="hour",
                                    day: this.state.timebreakdown == 'day',
                                    week: this.state.timebreakdown == 'week',
                                    month: this.state.timebreakdown == 'month',
                                    quarter:
                                        this.state.timebreakdown == 'quarter',
                                    year: this.state.timebreakdown == 'year'
                                }
                            }}
                            updateReportFilter={this.onTimeBreakdownChange.bind(
                                this
                            )}
                        />
                    ) : (
                        false
                    )}
                    {this.state.filters.map(function(filter, i) {
                        return (
                            <Filter
                                key={'filter-' + filter.id}
                                ref={'filter-' + filter.id}
                                locked={true}
                                filter={filter}
                                updateReportFilter={that.onFilterChange.bind(
                                    this
                                )}
                                removeFilter={that.onFilterDelete.bind(this)}
                                autoComplete={that.autoComplete.bind(this)}
                            />
                        );
                    })}
                </ul>
            </div>
        );
    }
}

module.exports = Filters;
