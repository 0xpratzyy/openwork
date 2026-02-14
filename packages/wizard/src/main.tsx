import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
import Welcome from './pages/Welcome';
import Roles from './pages/Roles';
import Integrations from './pages/Integrations';
import Review from './pages/Review';
import Progress from './pages/Progress';
import Done from './pages/Done';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/welcome" />} />
        <Route path="/welcome" element={<Welcome />} />
        <Route path="/roles" element={<Roles />} />
        <Route path="/integrations" element={<Integrations />} />
        <Route path="/review" element={<Review />} />
        <Route path="/progress" element={<Progress />} />
        <Route path="/done" element={<Done />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);
