import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import PreventiveMaintenance from './src/pages/maintenance/PreventiveMaintenance.jsx';
import BreakdownMaintenance from './src/pages/maintenance/BreakdownMaintenance.jsx';
import SparePartsManagement from './src/pages/maintenance/SparePartsManagement.jsx';
import MaintenanceAnalytics from './src/pages/maintenance/MaintenanceAnalytics.jsx';

try {
  ReactDOMServer.renderToString(React.createElement(MemoryRouter, null, React.createElement(PreventiveMaintenance)));
  console.log("PreventiveMaintenance OK");
} catch(e) { console.error("Preventive error:", e); }

try {
  ReactDOMServer.renderToString(React.createElement(MemoryRouter, null, React.createElement(BreakdownMaintenance)));
  console.log("BreakdownMaintenance OK");
} catch(e) { console.error("Breakdown error:", e); }

try {
  ReactDOMServer.renderToString(React.createElement(MemoryRouter, null, React.createElement(SparePartsManagement)));
  console.log("SpareParts OK");
} catch(e) { console.error("SpareParts error:", e); }

try {
  ReactDOMServer.renderToString(React.createElement(MemoryRouter, null, React.createElement(MaintenanceAnalytics)));
  console.log("Analytics OK");
} catch(e) { console.error("Analytics error:", e); }
