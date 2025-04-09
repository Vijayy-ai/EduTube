import React from 'react';
import Dashboard from '../components/dashboard/Dashboard';
import Navbar from '../components/common/Navbar';

const DashboardPage = () => {
  return (
    <div className="dashboard-page min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-6">
        <Dashboard />
      </div>
    </div>
  );
};

export default DashboardPage; 