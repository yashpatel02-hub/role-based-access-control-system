import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-container">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <Navbar onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />
        <main className="page-body">
          <Outlet />
        </main>
      </div>
      <style>{`
        @media (max-width: 900px) {
          .nav-shortcuts, .navbar-search {
            display: none !important;
          }
        }
        @media (max-width: 768px) {
          .sidebar {
            position: fixed !important;
            left: 0;
            top: 0;
            bottom: 0;
            transform: translateX(-100%);
            box-shadow: var(--shadow-lg);
          }
          .sidebar.sidebar-open {
            transform: translateX(0);
          }
          .mobile-close-btn {
            display: flex !important;
          }
        }
        @media (min-width: 769px) {
          .hamburger-btn {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default MainLayout;
