import React from 'react';
import CertificateList from '../components/certificate/CertificateList';

const CertificatesPage = () => {
  return (
    <div className="certificates-page">
      <div className="page-header">
        <h1>My Certificates</h1>
        <p>View and share your earned certificates</p>
      </div>
      <CertificateList />
    </div>
  );
};

export default CertificatesPage; 