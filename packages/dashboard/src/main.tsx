import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
import Layout from './Layout';
import Agents from './pages/Agents';
import Integrations from './pages/Integrations';
import Approvals from './pages/Approvals';
import Tasks from './pages/Tasks';
import Activity from './pages/Activity';
import Settings from './pages/Settings';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/agents" />} />
          <Route path="/agents" element={<Agents />} />
          <Route path="/integrations" element={<Integrations />} />
          <Route path="/approvals" element={<Approvals />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/activity" element={<Activity />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);
