var ReactDom = require('react-dom');

import React, { Fragment, useState, useEffect } from 'react';

var Filters = require('./views/filters.jsx');
var OptionActions = require('./actions/options.js');
var DataActions = require('./actions/data.js');
var TableView = require('./views/controls/tableView.jsx');
var api = require('./webAPI.js');
var json5 = require('json5');

var chartFigure = require('./lib/chartFigure.js');

var Highcharts = require('highcharts');
//import '@babel/polyfill';
require('jquery');
//require('popper');
require('bootstrap');
//require('mdbootstrap');

// load AFTER jquery
require('highcharts/modules/exporting')(Highcharts);
require('highcharts/modules/export-data')(Highcharts);


import { library } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faDownload,
    faPrint,
    faCircle,
    faQuestion,
    faTimes,
    faBars,
} from '@fortawesome/free-solid-svg-icons';

library.add(faCircle);

var charts = [];

// import classNames from 'classnames';

// import AppBar from '@material-ui/core/AppBar';
// import Button from '@material-ui/core/Button';
// import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
// import ChevronRightIcon from '@material-ui/icons/ChevronRight';
// import Close from '@material-ui/icons/Close';
// import Divider from '@material-ui/core/Divider';
// import Drawer from '@material-ui/core/Drawer';
// import GetAppIcon from '@material-ui/icons/GetApp';
// import Help from '@material-ui/icons/Help';
// import IconButton from '@material-ui/core/IconButton';
// import List from '@material-ui/core/List';
// import ListItem from '@material-ui/core/ListItem';
// import ListItemText from '@material-ui/core/ListItemText';
// import ListSubheader from '@material-ui/core/ListSubheader';
// import MenuIcon from '@material-ui/icons/Menu';
// import Print from '@material-ui/icons/Print';
// import TextField from '@material-ui/core/TextField';
// import Toolbar from '@material-ui/core/Toolbar';
// import Tooltip from '@material-ui/core/Tooltip';
// import Typography from '@material-ui/core/Typography';
// import {
//     createMuiTheme,
//     MuiThemeProvider,
//     styled,
// } from '@material-ui/core/styles';

const drawerWidth = 260;

// const theme = createMuiTheme({
//     palette: {
//         primary: { main: '#0067b4' },
//     },
//     typography: {
//         useNextVariants: true,
//     },
// });

// const MyAppBar = styled(AppBar)({
//     root: {
//         overflowY: 'hidden',
//     },
//     appBar: {
//         paddingLeft: 0,
//     },
//     appBarShift: {
//         width: `calc(100% - ${drawerWidth}px)`,
//         marginLeft: drawerWidth,
//         paddingLeft: 16,
//         paddingRight: 16,
//     },
// });

var tbForceUpdate = false;
// this will be called by simpletable when selections change
function multiSelectCountChange() {
    if (window.multiSelectSelectedCallback) {
        var newLabel = window.multiSelectSelectedCallback();
        if (typeof newLabel != 'undefined' && newLabel) {
            window.multiSelectButtonLabel = newLabel;
            if (tbForceUpdate) {
                tbForceUpdate();
            }
        }
    }
}

window.multiSelectCountChange = multiSelectCountChange;

function ReactTitleBar({
    loadingOverlay,
    loading,
    title,
    sidebarContent,
    children,
}) {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [isHelpOpen, setHelpOpen] = useState(false);

    function openSidebar() {
        setSidebarOpen(true);
    }

    function closeSidebar() {
        setSidebarOpen(false);
    }

    function openHelp() {
        setHelpOpen(true);
        window.helpOpen(closeHelp);
    }

    function closeHelp() {
        setHelpOpen(false);
        window.helpClose();
    }

    if (loadingOverlay) {
        return (
            <div className="vw-100 vh-100 d-flex justify-content-center align-items-center">
                <i className="fa fa-circle-notch fa-spin fa-4x"></i>
            </div>
        );
    }

    function printData() {
        if (window.printData) {
            window.printData(); // this is probably simpletable's printData function
        }
    }

    function exportData() {
        if (window.exportData) {
            window.exportData(); // this is probably simpletable's exportData function
        }
    }

    function multiSelectButtonCallback() {
        if (window.multiSelectActionCallback) {
            window.multiSelectActionCallback();
        }
    }

    return (
        <div className="container-fluid p-0">
            <div className="no-gutters" style={{ minHeight: '100vh' }}>
                {sidebarContent && sidebarOpen ? (
                    <div className="col-2">
                        <div
                            className="border-right"
                            style={{ height: '100vh', overflowY: 'scroll' }}
                        >
                            <div className="navbar navbar-light bg-light p-2">
                                <span className="navbar-brand">Dashboards</span>
                                <button
                                    className="btn btn-outline"
                                    type="button"
                                    onClick={closeSidebar}
                                >
                                    <i className="fa fa-chevron-left"></i>
                                </button>
                            </div>
                            <div className="p-2">{sidebarContent}</div>
                        </div>
                    </div>
                ) : null}
                <div
                    className={
                        (sidebarContent && sidebarOpen ? 'col-10' : 'col-12') +
                        ' d-flex flex-column'
                    }
                >
                    <nav
                        className="navbar navbar-dark bg-primary justify-content-start"
                        style={{ height: '64px', flexWrap: 'unset' }}
                    >
                        {sidebarContent && !sidebarOpen ? (
                            <button
                                className="navbar-toggler mr-3"
                                onClick={openSidebar}
                                type="button"
                                aria-expanded="false"
                                aria-label="Toggle filters"
                            >
                                <i className="fa fa-bars"></i>
                            </button>
                        ) : null}
                        <span
                            className="navbar-brand"
                            style={{ flex: 1, fontSize: '22px' }}
                        >
                            {window.reportTitle || ''}
                        </span>
                        {window.multiSelect &&
                            window.multiSelectActionCallback && (
                                <button
                                    type="button"
                                    className="btn btn-outline-light"
                                    style={{ marginLeft: 8, marginRight: 8 }}
                                    onClick={multiSelectButtonCallback}
                                >
                                    {window.multiSelectButtonLabel ||
                                        'Action here'}
                                </button>
                            )}
                        <FontAwesomeIcon
                            icon={faDownload}
                            className="svg-shadow svg-icon-basic svg-icon-basic-hover"
                            title="Export to CSV"
                            onClick={exportData}
                            //transform="shrink-6"
                        />
                        <FontAwesomeIcon
                            icon={faPrint}
                            className="svg-shadow svg-icon-basic svg-icon-basic-hover"
                            title="Print"
                            onClick={printData}
                            //transform="shrink-6"
                        />
                        {window.helpOpen && isHelpOpen && (
                            <FontAwesomeIcon
                                icon={faTimes}
                                className="svg-shadow svg-icon-basic svg-icon-basic-hover"
                                style={{ zIndex: 50000 }} //display above any overlays
                                title="Close Help"
                                onClick={closeHelp}
                            />
                        )}
                        {window.helpOpen && !isHelpOpen && (
                            <FontAwesomeIcon
                                icon={faQuestion}
                                title="Show Help"
                                className="svg-shadow svg-icon-basic svg-icon-basic-hover"
                                onClick={openHelp}
                            />
                        )}
                    </nav>
                    <main role="main" className="flex-grow-1">
                        {loading ? (
                            <Fragment>
                                <div className="modal show fade d-flex justify-content-center align-items-center">
                                    <i className="fa fa-circle-notch fa-spin fa-4x"></i>
                                </div>
                                <div className="modal-backdrop fade show"></div>
                            </Fragment>
                        ) : null}
                        <div className="d-flex flex-column h-100 pt-3 pl-3 pr-3">
                            {children}
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}

// class ReactTitleBarOld extends React.Component {
//     state = {
//         isHelpOpen: false,
//     };

//     self = this;

//     constructor(props) {
//         super(props);
//         self = this;
//         tbForceUpdate = this.doForceUpdate;
//     }

// toggleIsHelpOpen(isNative = false) {
//     if (this.state.isHelpOpen) {
//         window.helpClose();
//     } else {
//         window.helpOpen(this.toggleIsHelpOpen.bind(this));
//     }
//     this.setState({ isHelpOpen: !this.state.isHelpOpen });
// }

// printData() {
//     if (window.printData) {
//         window.printData(); // this is probably simpletable's printData function
//     }
// }

// exportData() {
//     if (window.exportData) {
//         window.exportData(); // this is probably simpletable's exportData function
//     }
// }

// doForceUpdate() {
//     self.forceUpdate();
// }

// multiSelectButtonCallback() {
//     if (window.multiSelectActionCallback) {
//         window.multiSelectActionCallback();
//     }
// }

//     render() {
//         return (
//             <MuiThemeProvider theme={theme}>
//                 <MyAppBar>
//                     <Toolbar style={{ paddingRight: 20 }}>
//                         <Typography
//                             variant="h6"
//                             color="inherit"
//                             style={{ flexGrow: 1 }}
//                         >
//                             {window.reportTitle}
//                         </Typography>
//                         {window.multiSelect &&
//                             window.multiSelectActionCallback && (
//                                 <Button
//                                     variant="outlined"
//                                     onClick={this.multiSelectButtonCallback.bind(
//                                         this
//                                     )}
//                                 >
//                                     {window.multiSelectButtonLabel}
//                                 </Button>
//                             )}
//                         <Tooltip title="Print">
//                             <IconButton
//                                 aria-label="Print"
//                                 color="inherit"
//                                 onClick={this.printData.bind(this)}
//                             >
//                                 <Print />
//                             </IconButton>
//                         </Tooltip>
//                         <Tooltip title="Export to CSV">
//                             <IconButton
//                                 aria-label="Export to CSV"
//                                 color="inherit"
//                                 onClick={this.exportData.bind(this)}
//                             >
//                                 <GetAppIcon />
//                             </IconButton>
//                         </Tooltip>
//                         {!this.state.isHelpOpen ? (
//                             <Tooltip title="Help" id="helpButton">
//                                 <IconButton
//                                     id="helpButton"
//                                     aria-label="Help"
//                                     color="inherit"
//                                     onClick={this.toggleIsHelpOpen.bind(
//                                         this,
//                                         true
//                                     )}
//                                 >
//                                     <Help />
//                                 </IconButton>
//                             </Tooltip>
//                         ) : (
//                             <Tooltip title="Close Help">
//                                 <IconButton
//                                     id="helpButton"
//                                     aria-label="Close Help"
//                                     color="inherit"
//                                     onClick={this.toggleIsHelpOpen.bind(
//                                         this,
//                                         true
//                                     )}
//                                 >
//                                     <Close />
//                                 </IconButton>
//                             </Tooltip>
//                         )}
//                     </Toolbar>
//                 </MyAppBar>
//             </MuiThemeProvider>
//         );
//     }
// }

var dashboardThis = null;
class DashboardFramework extends React.Component {
    state = {
        isHelpOpen: false,
        currentView: '',
        currentIcon: '',
        currentLabel: '',
        drawerOpen: false,
        loading: false,
    };

    constructor(props) {
        super(props);
        dashboardThis = this;
    }

    componentDidMount() {
        this.initialLoad();
    }

    handleDrawerOpen = () => {
        this.setState({ drawerOpen: true, hideTooltip: false });
    };

    handleDrawerClose = () => {
        this.setState({
            drawerOpen: false,
        });
        // window.setTimeout(this.doHideTooltip, 5000);
    };

    toggleIsHelpOpen(isNative = false) {
        if (this.state.isHelpOpen) {
            window.helpClose();
        } else {
            window.helpOpen(this.toggleIsHelpOpen.bind(this));
        }
        this.setState({ isHelpOpen: !this.state.isHelpOpen });
    }

    printData() {
        if (window.printData) {
            window.printData(); // this is probably simpletable's printData function
        }
    }

    exportData() {
        if (window.exportData) {
            window.exportData(); // this is probably simpletable's exportData function
        }
    }

    openHelp() {
        this.setState({ isHelpOpen: true });
        if (window.helpOpen) {
            window.helpOpen(this.outsideCloseHelp);
        }
    }

    outsideCloseHelp() {
        dashboardThis.setState({ isHelpOpen: false });
        dashboardThis.forceUpdate();
    }

    closeHelp() {
        this.setState({ isHelpOpen: false });
        if (window.helpClose) {
            window.helpClose();
        }
    }

    componentDidUpdate(prevProps) {

    }

    onDashboardMenuSelect(event, item) {
        var currentIcon = '';
        var currentLabel = '';
        if (typeof item.icon != 'undefined' && item.icon != '') {
            currentIcon = '<i class="' + item.icon + '"></i>';
        }
        currentLabel = item.label;
        this.setState(
            {
                currentView: item.link,
                currentIcon: currentIcon,
                currentLabel: currentLabel,
                drawerOpen: false,
            },
            () => {
                console.log('onDashboardMenuSelect!', this.state);
            }
        );
    }

    multiSelectButtonCallback() {
        if (window.multiSelectActionCallback) {
            window.multiSelectActionCallback();
        }
    }

    initialLoad() {
        var parsedMenu = json5.parse(this.props.menuList);
        if (this.state.currentView == '') {
            // set up the current selection
            for (var i = 0; i < parsedMenu.length; i++) {
                var item = parsedMenu[i];
                //console.log("comparing #" + item + " to " + window.location.hash);
                if('#' + item.link == window.location.hash || (i == 0 && !window.location.hash)) {
                    console.log("FOUND");
                    this.setState({ currentIcon: '<i class="' + item.icon + '"></i>', currentLabel: item.label });
                    this.onDashboardMenuSelect(null, item);
                    window.location.hash = '#' + item.link;
                    break;
                }
            }
        }
    }

    render() {
        var parsedMenu = [];
        if (typeof this.props.menuList != 'undefined') {
            parsedMenu = json5.parse(this.props.menuList);
        }
        return (
            <div style={{ display: 'table', width: '100%' }}>
                {this.state.drawerOpen ? (
                    <div
                        style={{
                            display: 'table-cell',
                            width: '260px',
                            overflowY: 'scroll',
                        }}
                    >
                        <div
                            className="border-right"
                            style={{ height: '100vh', overflowY: 'scroll' }}
                        >
                            <div className="navbar navbar-light bg-light p-2">
                                <div
                                    style={{
                                        paddingBottom: 20,
                                        width: '100%',
                                        display: 'flex',
                                        flexWrap: 'unset',
                                    }}
                                >
                                    <i
                                        style={{
                                            color: '#888888',
                                            fontSize: 20,
                                            fontFamily: 'fantasy, freesans',
                                            fontStyle: 'italic',
                                            marginLeft: 16,
                                            flex: 1,
                                        }}
                                    >
                                        {window.reportTitle || ''}
                                    </i>
                                    <button
                                        className="btn"
                                        style={{ color: 'white' }}
                                        type="button"
                                        onClick={this.handleDrawerClose}
                                    >
                                        <i className="fa fa-chevron-left"></i>
                                    </button>
                                </div>
                                <ul
                                    className="dashboard-menu-group"
                                    style={{ paddingTop: 0, width: '100%' }}
                                >
                                    {parsedMenu.map((item, i) => {
                                        item.type =
                                            typeof item.type == 'undefined'
                                                ? ''
                                                : item.type;
                                        return (
                                            <li
                                                className={
                                                    'dashboard-menu-group-item' +
                                                    ((this.state.currentView ==
                                                        '' &&
                                                        i == 0) ||
                                                    (this.state.currentView ==
                                                        item.link && item.link)
                                                        ? ' active'
                                                        : '')
                                                }
                                                id={i}
                                                key={i}
                                                style={{
                                                    cursor: 'pointer',
                                                    ...item.menuItemStyle
                                                }}
                                                data-dashboard={item.link}
                                                onClick={(event) =>
                                                    this.onDashboardMenuSelect(
                                                        event,
                                                        item
                                                    )
                                                }
                                            >
                                                {item.iconAltText && (
                                                    <span
                                                        style={{
                                                            minWidth: 26,
                                                            maxWidth: 26,
                                                            width: 26,
                                                            marginRight: 5,
                                                            marginLeft: 5,
                                                            display:
                                                                'inline-block',
                                                            textAlign: 'center',
                                                        }}
                                                    >
                                                        <i
                                                            style={{
                                                                width: 26,
                                                                minWidth: 26,
                                                                fontSize:
                                                                    '.6vw',
                                                                padding: 1,
                                                                ...item.iconAltTextStyle,
                                                            }}
                                                        >
                                                            {item.iconAltText}
                                                        </i>
                                                    </span>
                                                )}
                                                {item.type == 'Heading' ? (
                                                    <b>{item.label}</b>
                                                ) : (
                                                    <Fragment>
                                                        {item.icon && (
                                                            <i
                                                                className={
                                                                    item.icon
                                                                }
                                                                style={{
                                                                    padding:
                                                                        '10px',
                                                                    width: '36',
                                                                    ...item.iconStyle
                                                                }}
                                                            ></i>
                                                        )}
                                                        {item.label}
                                                    </Fragment>
                                                )}
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        </div>
                    </div>
                ) : null}
                <div style={{ minHeight: '100vh' }}>
                    <nav className="navbar navbar-dark bg-primary justify-content-start">
                        {!this.state.drawerOpen ? (
                            <button
                                className="navbar-toggler mr-3"
                                onClick={this.handleDrawerOpen}
                                type="button"
                                aria-expanded="false"
                                aria-label="Show Menu"
                            >
                                <FontAwesomeIcon
                                    icon={faBars}
                                    className="svg-shadow svg-icon-basic-nomargin"
                                    title="Show Menu"
                                    //transform="shrink-6"
                                />
                            </button>
                        ) : null}
                        <span
                            className="navbar-brand"
                            style={{ flex: 1, fontSize: '22px' }}
                            dangerouslySetInnerHTML={{
                                __html:
                                    (this.state.drawerOpen
                                        ? ''
                                        : '<i style="color: white; font-size: 22px; font-family: fantasy, freesans; font-style: italic; marginLeft: 16px; flex: 1;">' +
                                          '' +
                                          window.reportTitle +
                                          '</i>' +
                                          '&nbsp;&nbsp;-&nbsp;&nbsp;') +
                                    this.state.currentIcon +
                                    ' ' +
                                    this.state.currentLabel + '&nbsp;',
                            }}
                        ></span>
                        {window.multiSelect &&
                            window.multiSelectActionCallback && (
                                <button
                                    type="button"
                                    className="btn btn-outline-light"
                                    style={{ marginLeft: 8, marginRight: 8 }}
                                    onClick={multiSelectButtonCallback}
                                >
                                    {window.multiSelectButtonLabel ||
                                        'Action here'}
                                </button>
                            )}
                        {!window.disableCSVTitleBarButton && (
                            <FontAwesomeIcon
                                icon={faDownload}
                                className="svg-shadow svg-icon-basic svg-icon-basic-hover"
                                title="Export to CSV"
                                onClick={this.exportData.bind(this)}
                                //transform="shrink-6"
                            />
                        )}
                        {!window.disablePrintTitleBarButton && (
                            <FontAwesomeIcon
                                icon={faPrint}
                                className="svg-shadow svg-icon-basic svg-icon-basic-hover"
                                title="Print"
                                onClick={this.printData.bind(this)}
                                //transform="shrink-6"
                            />
                        )}
                        <div
                            id="helpButton"
                            style={{
                                position: 'relative',
                                left: 16,
                                zIndex: 49999,
                            }}
                        />
                        {window.helpOpen && this.state.isHelpOpen && (
                            <FontAwesomeIcon
                                icon={faTimes}
                                className="svg-shadow svg-icon-basic svg-icon-basic-hover"
                                style={{ zIndex: 50000 }} //display above any overlays
                                title="Close Help"
                                onClick={this.closeHelp.bind(this)}
                            />
                        )}
                        {window.helpOpen && !this.state.isHelpOpen && (
                            <FontAwesomeIcon
                                icon={faQuestion}
                                title="Show Help"
                                className="svg-shadow svg-icon-basic svg-icon-basic-hover"
                                onClick={this.openHelp.bind(this)}
                            />
                        )}
                    </nav>
                    <main
                        role="main"
                        style={{
                            height: '100vh',
                        }}
                    >
                        {this.state.loading ? (
                            <Fragment>
                                <div className="modal show fade d-flex justify-content-center align-items-center">
                                    <i className="fa fa-circle-notch fa-spin fa-4x"></i>
                                </div>
                                <div className="modal-backdrop fade show"></div>
                            </Fragment>
                        ) : null}
                        <div id="leo-dashboard"></div>
                    </main>
                </div>
            </div>
        );
    }
}

// class DashboardFrameworkOld extends React.Component {
//     state = {
//         isHelpOpen: false,
//         currentView:
//             '<i class="fa fa-truck fa-flip-horizontal"></i>&nbsp;Carriers',
//         drawerOpen: false,
//     };

//     constructor(props) {
//         super(props);
//     }

//     handleDrawerOpen = () => {
//         this.setState({ drawerOpen: true, hideTooltip: false });
//     };

//     handleDrawerClose = () => {
//         this.setState({
//             drawerOpen: false,
//         });
//         // window.setTimeout(this.doHideTooltip, 5000);
//     };

//     toggleIsHelpOpen(isNative = false) {
//         if (this.state.isHelpOpen) {
//             window.helpClose();
//         } else {
//             window.helpOpen(this.toggleIsHelpOpen.bind(this));
//         }
//         this.setState({ isHelpOpen: !this.state.isHelpOpen });
//     }

//     printData() {
//         if (window.printData) {
//             window.printData(); // this is probably simpletable's printData function
//         }
//     }

//     exportData() {
//         if (window.exportData) {
//             window.exportData(); // this is probably simpletable's exportData function
//         }
//     }

//     onDashboardMenuSelect(event, item) {
//         var currentItem = '';
//         if (typeof item.icon != 'undefined' && item.icon != '') {
//             currentItem = '<i class="' + item.icon + '"><i>';
//         }
//         currentItem += '<i>&nbsp;' + item.label + '</i>';
//         this.setState({ currentView: currentItem });
//     }

//     render() {
//         var parsedMenu = [];
//         if (typeof this.props.menuList != 'undefined') {
//             parsedMenu = json5.parse(this.props.menuList);
//         }
//         return (
//             <MuiThemeProvider theme={theme}>
//                 <div style={{ width: '100%', height: '100%' }}>
//                     <MyAppBar
//                         position="fixed"
//                         style={{
//                             paddingLeft: 0,
//                             width: `calc(100% - ${
//                                 this.state.drawerOpen ? drawerWidth : 0
//                             }px)`,
//                             marginLeft: this.state.drawerOpen ? 260 : 0,
//                             paddingLeft: 8,
//                         }}
//                     >
//                         <Toolbar style={{ paddingRight: 20, paddingLeft: 0 }}>
//                             <IconButton
//                                 aria-label="open drawer"
//                                 onClick={this.handleDrawerOpen}
//                                 style={{
//                                     marginLeft: 12,
//                                     marginRight: 20,
//                                     display: this.state.drawerOpen
//                                         ? 'none'
//                                         : 'block',
//                                 }}
//                             >
//                                 <MenuIcon style={{ color: 'white' }} />
//                             </IconButton>
//                             <table style={{ flex: 1 }}>
//                                 <tr>
//                                     <td>
//                                         <Typography
//                                             variant="h6"
//                                             color="inherit"
//                                             style={{
//                                                 whiteSpace: 'nowrap',
//                                                 display: this.state.drawerOpen
//                                                     ? 'none'
//                                                     : 'block',
//                                                 flexGrow: 5,
//                                                 paddingLeft: 16,
//                                                 fontFamily: 'fantasy, freesans',
//                                             }}
//                                         >
//                                             shipping
//                                             CENTRAL&nbsp;&nbsp;&nbsp;&nbsp;-&nbsp;&nbsp;&nbsp;&nbsp;
//                                         </Typography>
//                                     </td>
//                                     <td>
//                                         <Typography
//                                             variant="h6"
//                                             color="inherit"
//                                             style={{
//                                                 fontFamily:
//                                                     'Roboto, Tahoma, Helvetica',
//                                                 fontSize: 24,
//                                                 whiteSpace: 'nowrap',
//                                                 paddingLeft: this.state
//                                                     .drawerOpen
//                                                     ? 16
//                                                     : 0,
//                                             }}
//                                             dangerouslySetInnerHTML={{
//                                                 __html: this.state.currentView,
//                                             }}
//                                         ></Typography>
//                                     </td>
//                                     <td style={{ width: '100%' }}>&nbsp;</td>
//                                 </tr>
//                             </table>
//                             {/* <Tooltip title="Print">
//                             <IconButton
//                                 aria-label="Print"
//                                 color="inherit"
//                                 onClick={ this.printData.bind(this) }
//                             >
//                                 <Print />
//                             </IconButton>
//                         </Tooltip>
//                         <Tooltip title="Export to CSV">
//                             <IconButton
//                                 aria-label="Export to CSV"
//                                 color="inherit"
//                                 onClick={ this.exportData.bind(this) }
//                             >
//                                 <GetAppIcon />
//                             </IconButton>
//                         </Tooltip> */}
//                             {!this.state.isHelpOpen ? (
//                                 <Tooltip title="Help" id="helpButton">
//                                     <IconButton
//                                         id="helpButton"
//                                         aria-label="Help"
//                                         color="inherit"
//                                         onClick={this.toggleIsHelpOpen.bind(
//                                             this,
//                                             true
//                                         )}
//                                     >
//                                         <Help />
//                                     </IconButton>
//                                 </Tooltip>
//                             ) : (
//                                 <Tooltip title="Close Help">
//                                     <IconButton
//                                         id="helpButton"
//                                         aria-label="Close Help"
//                                         color="inherit"
//                                         onClick={this.toggleIsHelpOpen.bind(
//                                             this,
//                                             true
//                                         )}
//                                     >
//                                         <Close />
//                                     </IconButton>
//                                 </Tooltip>
//                             )}
//                         </Toolbar>
//                     </MyAppBar>
//                     <Drawer
//                         variant="persistent"
//                         anchor="left"
//                         open={this.state.drawerOpen}
//                         style={{
//                             width: this.state.drawerOpen ? 260 : 0,
//                             flexShrink: 0,
//                             zIndex: 5050,
//                             overflowX: 'hidden',
//                         }}
//                     >
//                         <div
//                             style={{
//                                 overflowX: 'hidden',
//                                 height: 64,
//                                 minHeight: 64,
//                                 display: 'flex',
//                                 alignItems: 'center',
//                                 padding: '16 8px',
//                                 justifyContent: 'flex-end',
//                                 width: '260px',
//                             }}
//                         >
//                             <i
//                                 style={{
//                                     width: '100%',
//                                     position: 'absolute',
//                                     color: '#888888',
//                                     fontSize: 18,
//                                     fontFamily: 'fantasy, freesans',
//                                     marginLeft: 16,
//                                 }}
//                             >
//                                 shipping<br></br>CENTRAL
//                             </i>
//                             <IconButton onClick={this.handleDrawerClose}>
//                                 {this.state.drawerOpen ? (
//                                     <ChevronLeftIcon />
//                                 ) : (
//                                     <ChevronRightIcon />
//                                 )}
//                             </IconButton>
//                         </div>
//                         <Divider />
//                         <List style={{ paddingTop: 0 }}>
//                             {parsedMenu.map((item, key) => {
//                                 item.type =
//                                     typeof item.type == 'undefined'
//                                         ? ''
//                                         : item.type;
//                                 return (
//                                     <ListItem
//                                         id={item.i}
//                                         key={item.i}
//                                         style={{
//                                             cursor: 'pointer',
//                                             paddingTop: 2,
//                                             paddingBottom: 2,
//                                         }}
//                                         data-dashboard={item.link}
//                                         onClick={(event) =>
//                                             this.onDashboardMenuSelect(
//                                                 event,
//                                                 item
//                                             )
//                                         }
//                                         className={
//                                             item.type == 'Heading'
//                                                 ? 'heading'
//                                                 : 'menuitem'
//                                         }
//                                     >
//                                         {item.type != 'Heading' && item.icon && (
//                                             <div style={{ width: 36 }}>
//                                                 <i
//                                                     style={{
//                                                         fontSize: 20,
//                                                     }}
//                                                     className={item.icon}
//                                                 ></i>
//                                             </div>
//                                         )}
//                                         {item.iconAltText && (
//                                             <div style={{ width: 36 }}>
//                                                 <i
//                                                     style={{
//                                                         width: 36,
//                                                         ...item.iconAltTextStyle,
//                                                     }}
//                                                 >
//                                                     {item.iconAltText}
//                                                 </i>
//                                             </div>
//                                         )}
//                                         {item.type == 'Heading' ? (
//                                             <ListSubheader
//                                                 style={{
//                                                     height: 40,
//                                                     paddingTop: 2,
//                                                     paddingBottom: 2,
//                                                 }}
//                                             >
//                                                 {item.label}
//                                             </ListSubheader>
//                                         ) : (
//                                             <ListItemText
//                                                 style={{
//                                                     fontSize: 10,
//                                                     fontWeight:
//                                                         item.type == 'Heading'
//                                                             ? 'bold'
//                                                             : 'normal',
//                                                 }}
//                                                 primary={item.label}
//                                             />
//                                         )}
//                                     </ListItem>
//                                 );
//                             })}
//                         </List>
//                     </Drawer>
//                     <main
//                         style={{
//                             height: '100%',
//                             marginLeft: this.state.drawerOpen ? 270 : 0,
//                         }}
//                     >
//                         <div style={{ width: '100%', height: 64 }}></div>
//                         <div id="leo-dashboard"></div>
//                     </main>
//                 </div>
//             </MuiThemeProvider>
//         );
//     }
// }

var LEO = require('./lib/leo.js');
var self = (module.exports = $.extend({}, LEO, {
    init: function (opts) {
        if (opts) {
            window.leo = $.extend(true, window.leo || {}, opts);
            api.setEndpoint(opts.apiEndpoint);
            window.apiEndpoint = opts.apiEndpoint;
            window.apiKey = undefined;
            window.disableCSVTitleBarButton =
                typeof opts.disableCSVTitleBarButton != 'undefined'
                    ? opts.disableCSVTitleBarButton
                    : false;
            window.disablePrintTitleBarButton =
                typeof opts.disablePrintTitleBarButton != 'undefined'
                    ? opts.disablePrintTitleBarButton
                    : false;
            window.reportTitle =
                opts.reportTitle || "";
            window.helpOpen = opts.helpOpen || function () {};
            window.helpClose = opts.helpClose || function () {};
            window.openHelp = false;
            window.gridAPICallback = opts.gridAPICallback
                ? opts.gridAPICallback
                : null;
            window.periodLabel = opts.periodLabel ? opts.periodLabel : 'Period';
            window.simpleTableHeaderHeight =
                opts.simpleTableHeaderHeight || null;
            window.simpleTableRowHeight = opts.simpleTableRowHeight || null;
            window.simpleTableLineHeight = opts.simpleTableLineHeight || null;
            window.simpleTableExtraCellStyles =
                opts.simpleTableExtraCellStyles || null;
            window.multiSelect = opts.multiSelect || false;
            window.multiSelectButtonLabel =
                opts.multiSelectButtonLabel || 'Action';
            window.multiSelectSelectedCallback =
                opts.multiSelectSelectedCallback || false;
            window.multiSelectActionCallback =
                opts.multiSelectActionCallback || false;
        }
        doStart();
    },
    initDashboard: function (element, filterBarId) {
        element = $(element);
        var filterBar = $('#' + filterBarId);

        if (!element.length) {
            return;
        }

        if (element.find('#tool-bar').length > 0) {
            element.find('.leo-charts-wrapper').addClass('has-header');
        }

        if (element.find('#leo-viewfilter').length > 0) {
            element.find('.leo-charts-wrapper').addClass('has-footer');
        }

        window.globalTitleBar = false;
        if (element.find('#leo-title-bar').length > 0) {
            ReactDom.render(
                <ReactTitleBar id="reacttb" />,
                document.getElementById('leo-title-bar')
            );
            window.globalTitleBar = true;
        }

        console.log('element.find(leo-dashboard-framework)');
        element.find('#leo-dashboard-framework').each(function (i, dashboard) {
            var menuList = dashboard.innerHTML;
            menuList = $(menuList).text(); // remove <script ...> </script> tags around menus
            ReactDom.render(
                <DashboardFramework id="reacttb" menuList={menuList} />,
                dashboard
            );
        });

        element.find('.leo-filters').each(function (i, filterSection) {
            var leoGroup = $(filterSection).data('leo-group');
            if (!leoGroup) {
                leoGroup = 'default';
            }

            if ($(filterSection).find('.leo-timeframe').length) {
                OptionActions.setTimeFilter(
                    leoGroup,
                    $(filterSection).find('.leo-timeframe').val()
                );
            }
            if ($(filterSection).find('.leo-timeframe-breakdown').length) {
                OptionActions.setTimeBreakdown(
                    leoGroup,
                    $(filterSection).find('.leo-timeframe-breakdown').val()
                );
            }

            $(filterSection)
                .find('.leo-filter')
                .each(function (i, f) {
                    var filter = $(f);
                    var label = filter.find('label').remove().text();
                    var checkboxes = null;
                    var values = [];
                    var api = $(f).data('api');
                    var isRequired = $(f).data('required') || false;
                    var singleValue = $(f).data('single-value') || false;
                var comparison = $(f).data('comparison') || 'in';

                    if (filter.find('select').length) {
                        checkboxes = {};
                        filter
                            .find('select')
                            .find('option')
                            .each(function (i, o) {
                                var option = $(o);
                                if (option.attr('selected')) {
                                    values.push(option.val());
                                    checkboxes[option.val()] = true;
                                } else {
                                    checkboxes[option.val()] = false;
                                }
                            });
                    }
                    OptionActions.setFilter(
                        leoGroup,
                        filter.data('column'),
                        comparison,
                        values,
                        label,
                        checkboxes,
                        api,
                        isRequired,
                        singleValue
                    );
                });

            $(filterSection).remove();
        });

        for (var f in leo.reportFilters) {
            var filter = leo.reportFilters[f];
            if (!filter.checkboxes && filter.value) {
                filter.checkboxes = {};
                if (typeof filter.value == 'string') {
                    filter.checkboxes[filter.value] = true;
                } else {
                    filter.value.map((f) => (filter.checkboxes[f] = true));
                }
            }
            OptionActions.setFilter(
                filter.group || 'default',
                filter.id,
                filter.comparison,
                filter.value,
                filter.label,
                filter.checkboxes,
                filter.api,
                filter.isRequired,
                filter.singleValue,
                true
            );
        }

        charts = chartFigure.initAll($(element));

        if (filterBar.length) {
            ReactDom.render(<Filters />, document.getElementById(filterBarId));
        }

        if ($(element).find('#leo-viewfilter').length) {
            var Legend = require('./views/controls/legend.jsx');

            var toggles = [];
            $(element)
                .find('#leo-viewfilter input')
                .each(function (i, input) {
                    input = $(input);
                    toggles.push({
                        name: input.attr('name'),
                        checked: input.is(':checked'),
                        color: input.inlineStyle('color') || null,
                    });
                });
            OptionActions.setLegendToggles('default', toggles);
            ReactDom.render(
                <Legend />,
                $(element).find('#leo-viewfilter').get(0)
            );
        }
    },

    showDashboard: function (dashboard, params) {
        charts.map(function (chart) {
            chart.destroy();
        });
        DataActions.reset();
        OptionActions.reset();

        $.get(window.leodashboardurl + 'dashboards/' + dashboard, function (
            result
        ) {
            $('#leo-dashboard').html(
                result
                    .replace(/^[\s\S]*<body[^>]*>/im, '')
                    .replace(/<\/body>[\s\S]*$/im, '')
            );
            module.exports.initDashboard('#leo-dashboard', 'tool-bar');
        });

        $('[data-dashboard].active').removeClass('active');
        $('[data-dashboard="' + dashboard + '"]').addClass('active');
        $('[data-dashboard="' + dashboard + '"]')
            .closest('ul')
            .closest('li')
            .children('a')
            .addClass('active-parent');
    },

    initMenu: function (id) {
        window.onhashchange = function () {
            let [dashboard, params] = location.hash
                .replace(/^#/, '')
                .split('|');
            self.showDashboard(dashboard, params);
        };

        $('body').on('click', '[data-dashboard]', function (e) {
            e.preventDefault();
            if (window.location.hash == '#' + $(this).data('dashboard')) {
                window.onhashchange();
            } else {
                window.location = '#' + $(this).data('dashboard');
            }
        });

        if (window.location.hash) {
            let [dashboard, params] = window.location.hash
                .replace(/^#/, '')
                .split('|');
            self.showDashboard(dashboard, params);
        } else {
            // WON'T WORK WITH HIDDEN SIDEBAR NOW: $($('nav').find('a')[0]).trigger('click');
            console.log("ERROR - no hash value specified. Cannot decide which dashboard to show.");
        }
    },
    initChart: function (figure, filters) {
        return chartFigure.init(figure, filters);
    },
}));

/*yepnope1.5.x|WTFPL*/
(function (a, b, c) {
    function d(a) {
        return '[object Function]' == o.call(a);
    }

    function e(a) {
        return 'string' == typeof a;
    }

    function f() {}

    function g(a) {
        return !a || 'loaded' == a || 'complete' == a || 'uninitialized' == a;
    }

    function h() {
        var a = p.shift();
        (q = 1),
            a
                ? a.t
                    ? m(function () {
                          ('c' == a.t
                              ? B.injectCss
                              : B.injectJs)(a.s, 0, a.a, a.x, a.e, 1);
                      }, 0)
                    : (a(), h())
                : (q = 0);
    }

    function i(a, c, d, e, f, i, j) {
        function k(b) {
            if (
                !o &&
                g(l.readyState) &&
                ((u.r = o = 1),
                !q && h(),
                (l.onload = l.onreadystatechange = null),
                b)
            ) {
                'img' != a &&
                    m(function () {
                        t.removeChild(l);
                    }, 50);
                for (var d in y[c]) y[c].hasOwnProperty(d) && y[c][d].onload();
            }
        }
        var j = j || B.errorTimeout,
            l = b.createElement(a),
            o = 0,
            r = 0,
            u = {
                t: d,
                s: c,
                e: f,
                a: i,
                x: j,
            };
        1 === y[c] && ((r = 1), (y[c] = [])),
            'object' == a ? (l.data = c) : ((l.src = c), (l.type = a)),
            (l.width = l.height = '0'),
            (l.onerror = l.onload = l.onreadystatechange = function () {
                k.call(this, r);
            }),
            p.splice(e, 0, u),
            'img' != a &&
                (r || 2 === y[c]
                    ? (t.insertBefore(l, s ? null : n), m(k, j))
                    : y[c].push(l));
    }

    function j(a, b, c, d, f) {
        return (
            (q = 0),
            (b = b || 'j'),
            e(a)
                ? i('c' == b ? v : u, a, b, this.i++, c, d, f)
                : (p.splice(this.i++, 0, a), 1 == p.length && h()),
            this
        );
    }

    function k() {
        var a = B;
        return (
            (a.loader = {
                load: j,
                i: 0,
            }),
            a
        );
    }
    var l = b.documentElement,
        m = a.setTimeout,
        n = b.getElementsByTagName('script')[0],
        o = {}.toString,
        p = [],
        q = 0,
        r = 'MozAppearance' in l.style,
        s = r && !!b.createRange().compareNode,
        t = s ? l : n.parentNode,
        l = a.opera && '[object Opera]' == o.call(a.opera),
        l = !!b.attachEvent && !l,
        u = r ? 'object' : l ? 'script' : 'img',
        v = l ? 'script' : u,
        w =
            Array.isArray ||
            function (a) {
                return '[object Array]' == o.call(a);
            },
        x = [],
        y = {},
        z = {
            timeout: function (a, b) {
                return b.length && (a.timeout = b[0]), a;
            },
        },
        A,
        B;
    (B = function (a) {
        function b(a) {
            var a = a.split('!'),
                b = x.length,
                c = a.pop(),
                d = a.length,
                c = {
                    url: c,
                    origUrl: c,
                    prefixes: a,
                },
                e,
                f,
                g;
            for (f = 0; f < d; f++)
                (g = a[f].split('=')), (e = z[g.shift()]) && (c = e(c, g));
            for (f = 0; f < b; f++) c = x[f](c);
            return c;
        }

        function g(a, e, f, g, h) {
            var i = b(a),
                j = i.autoCallback;
            i.url.split('.').pop().split('?').shift(),
                i.bypass ||
                    (e &&
                        (e = d(e)
                            ? e
                            : e[a] ||
                              e[g] ||
                              e[a.split('/').pop().split('?')[0]]),
                    i.instead
                        ? i.instead(a, e, f, g, h)
                        : (y[i.url] ? (i.noexec = !0) : (y[i.url] = 1),
                          f.load(
                              i.url,
                              i.forceCSS ||
                                  (!i.forceJS &&
                                      'css' ==
                                          i.url
                                              .split('.')
                                              .pop()
                                              .split('?')
                                              .shift())
                                  ? 'c'
                                  : c,
                              i.noexec,
                              i.attrs,
                              i.timeout
                          ),
                          (d(e) || d(j)) &&
                              f.load(function () {
                                  k(),
                                      e && e(i.origUrl, h, g),
                                      j && j(i.origUrl, h, g),
                                      (y[i.url] = 2);
                              })));
        }

        function h(a, b) {
            function c(a, c) {
                if (a) {
                    if (e(a))
                        c ||
                            (j = function () {
                                var a = [].slice.call(arguments);
                                k.apply(this, a), l();
                            }),
                            g(a, j, b, 0, h);
                    else if (Object(a) === a)
                        for (n in ((m = (function () {
                            var b = 0,
                                c;
                            for (c in a) a.hasOwnProperty(c) && b++;
                            return b;
                        })()),
                        a))
                            a.hasOwnProperty(n) &&
                                (!c &&
                                    !--m &&
                                    (d(j)
                                        ? (j = function () {
                                              var a = [].slice.call(arguments);
                                              k.apply(this, a), l();
                                          })
                                        : (j[n] = (function (a) {
                                              return function () {
                                                  var b = [].slice.call(
                                                      arguments
                                                  );
                                                  a && a.apply(this, b), l();
                                              };
                                          })(k[n]))),
                                g(a[n], j, b, n, h));
                } else !c && l();
            }
            var h = !!a.test,
                i = a.load || a.both,
                j = a.callback || f,
                k = j,
                l = a.complete || f,
                m,
                n;
            c(h ? a.yep : a.nope, !!i), i && c(i);
        }
        var i,
            j,
            l = window.yepnope.loader;
        if (e(a)) g(a, 0, l, 0);
        else if (w(a))
            for (i = 0; i < a.length; i++)
                (j = a[i]),
                    e(j)
                        ? g(j, 0, l, 0)
                        : w(j)
                        ? B(j)
                        : Object(j) === j && h(j, l);
        else Object(a) === a && h(a, l);
    }),
        (B.addPrefix = function (a, b) {
            z[a] = b;
        }),
        (B.addFilter = function (a) {
            x.push(a);
        }),
        (B.errorTimeout = 1e4),
        null == b.readyState &&
            b.addEventListener &&
            ((b.readyState = 'loading'),
            b.addEventListener(
                'DOMContentLoaded',
                (A = function () {
                    b.removeEventListener('DOMContentLoaded', A, 0),
                        (b.readyState = 'complete');
                }),
                0
            )),
        (a.yepnope = k()),
        (a.yepnope.executeStack = h),
        (a.yepnope.injectJs = function (a, c, d, e, i, j) {
            var k = b.createElement('script'),
                l,
                o,
                e = e || B.errorTimeout;
            k.src = a;
            for (o in d) k.setAttribute(o, d[o]);
            (c = j ? h : c || f),
                (k.onreadystatechange = k.onload = function () {
                    !l &&
                        g(k.readyState) &&
                        ((l = 1),
                        c(),
                        (k.onload = k.onreadystatechange = null));
                }),
                m(function () {
                    l || ((l = 1), c(1));
                }, e),
                i ? k.onload() : n.parentNode.insertBefore(k, n);
        }),
        (a.yepnope.injectCss = function (a, c, d, e, g, i) {
            var e = b.createElement('link'),
                j,
                c = i ? h : c || f;
            (e.href = a), (e.rel = 'stylesheet'), (e.type = 'text/css');
            for (j in d) e.setAttribute(j, d[j]);
            g || (n.parentNode.insertBefore(e, n), m(c, 0));
        });
})(window, document);

function doStart() {
    window.Highcharts = Highcharts;

    window.setTimeout(
        () => {
            $('#leo-dashboard').show();
        },
        $('#leo-dashboard').length == 0 ? 500 : 0
    );

    /*
	// close on mouse out
	hs.Expander.prototype.onMouseOut = function (sender) {
		sender.close();
	};
	// close if mouse is not over on expand (using the internal mouseIsOver property)
	hs.Expander.prototype.onAfterExpand = function (sender) {
		if (!sender.mouseIsOver) sender.close();
	};
	*/

    var DateRangePicker = require('./jquery.leo.daterangepicker.js');
    var DateRangePicker = require('./jquery-ui.multidatespicker.js');

    chartFigure.runScripts();

    module.exports.initDashboard('body', 'tool-bar');
    module.exports.initMenu('leo-menu');

    $('body').on(
        {
            click: function (e) {
                var data = $(this).data();
                var checkboxes = JSON.parse(
                    decodeURIComponent(data.checkboxes)
                );
                OptionActions.setFilter(
                    data.group,
                    data.id,
                    data.comparison,
                    data.value,
                    data.label,
                    checkboxes
                );
            },
        },
        '#leoChartDetails header a.leo-addFilter'
    );

    $('body').on(
        {
            click: function (e) {
                var div = $('body #dialog-box');
                if (div.length == 0) {
                    div = $('<div id="dialog-box"/>');
                    $('body').append(div);
                }
                var params = JSON.parse(
                    decodeURIComponent($(this).data('params'))
                );
                var userClicked = JSON.parse(
                    decodeURIComponent($(this).data('user_clicked'))
                );
                ReactDom.render(
                    <TableView params={params} userClicked={userClicked} />,
                    div.get(0)
                );
            },
        },
        '#leoChartDetails header a.leo-tableView'
    );
}

yepnope([
    {
        load: ['__CDN__/css/leo-oem__VERSION__css'],
    },
]);
$(function () {
    $('#leo-dashboard').hide();
});
