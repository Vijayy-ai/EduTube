import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import config from '../../config';
import { 
  ArrowPathIcon, 
  DocumentTextIcon, 
  ChevronRightIcon,
  CubeIcon,
  DocumentArrowDownIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../common/LoadingSpinner';
import { toast } from 'react-hot-toast';

const CertificateList = () => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSimulationMode, setIsSimulationMode] = useState(false);

  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${config.API_URL}/certificates/`, {
          headers: {
            'Authorization': `Token ${token}`
          }
        });
        
        console.log("Certificate API response:", response.data);
        
        // Ensure that response.data is an array
        if (response.data && response.data.results) {
          // If the API returns a paginated response with results field
          setCertificates(response.data.results);
        } else if (Array.isArray(response.data)) {
          // If the API returns an array directly
          setCertificates(response.data);
        } else if (response.data && typeof response.data === 'object') {
          // Try to extract certificates if the data is in a different format
          if (Array.isArray(response.data.certificates)) {
            setCertificates(response.data.certificates);
          } else {
            // Last resort - convert object to array
            const certArray = Object.values(response.data).filter(item => typeof item === 'object');
            if (certArray.length > 0) {
              setCertificates(certArray);
            } else {
              setCertificates([]);
            }
          }
        } else {
          // If the response is in an unexpected format, use an empty array
          console.error('Unexpected response format:', response.data);
          setCertificates([]);
        }

        // Check if we're in simulation mode
        try {
          const configResponse = await axios.get(`${config.API_URL}/config/`, {
            headers: { 'Authorization': `Token ${token}` }
          });
          setIsSimulationMode(configResponse.data?.simulate_minting === true);
        } catch (configErr) {
          console.log('Could not determine simulation mode, assuming production');
          setIsSimulationMode(false);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching certificates:', err);
        if (err.response && err.response.status === 404) {
          setError('The certificates feature may not be available yet');
        } else {
          setError('Failed to load certificates: ' + (err.response?.data?.error || err.message));
        }
        setLoading(false);
      }
    };

    fetchCertificates();
  }, []);

  // Function to open PDF in a new window with Google PDF viewer as fallback
  const viewCertificate = (pdfUrl) => {
    if (!pdfUrl) {
      toast.error('Certificate PDF not available');
      return;
    }
    
    try {
      // Log the URL we're trying to open
      console.log('Opening certificate URL:', pdfUrl);
      
      // Create a fallback with Google PDF Viewer first
      const googlePdfViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(pdfUrl)}&embedded=true`;
      
      // Open the Google PDF viewer instead of direct PDF
      window.open(googlePdfViewerUrl, '_blank');
      
    } catch (error) {
      console.error('Error opening PDF:', error);
      toast.error('Failed to open PDF viewer');
    }
  };

  const downloadCertificate = async (certificateId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Authentication required');
        return;
      }
      
      toast.loading('Downloading certificate...', { id: 'download-cert' });
      
      // Create download link
      const downloadUrl = `${config.API_URL}/certificates/${certificateId}/download/`;
      
      // Make a direct fetch request to get the PDF content
      const response = await fetch(downloadUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Token ${token}`,
          'Accept': 'application/pdf'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      // Get the blob from the response
      const blob = await response.blob();
      
      // Create a download link and trigger it
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `certificate-${certificateId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Certificate downloaded successfully!', { id: 'download-cert' });
    } catch (error) {
      console.error('Download error:', error);
      toast.error(`Failed to download: ${error.message}`, { id: 'download-cert' });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-10">
        <LoadingSpinner size="lg" text="Loading certificates..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 p-4 rounded-lg text-red-600">
        <p className="font-medium">Error</p>
        <p>{error}</p>
      </div>
    );
  }

  // Ensure certificates is an array before rendering
  const certificatesToDisplay = Array.isArray(certificates) ? certificates : [];

  if (certificatesToDisplay.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">My Certificates</h2>
        <p className="text-gray-600 mb-6">You haven't earned any certificates yet.</p>
        <Link to="/courses" className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-md">
          Browse Courses
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">My Certificates</h2>
      
      {isSimulationMode && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start">
          <InformationCircleIcon className="h-5 w-5 text-yellow-500 mr-2 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-yellow-700">
              <strong>Simulation Mode Active:</strong> NFT minting and blockchain transactions are simulated for testing purposes.
              External blockchain links will not work in this mode.
            </p>
          </div>
        </div>
      )}
      
      <div className="grid gap-6 md:grid-cols-2">
        {certificatesToDisplay.map(certificate => (
          <div key={certificate.id} className="border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 truncate">
                {certificate.course_details?.title || certificate.course?.title || 'Untitled Course'}
              </h3>
              <div className="text-sm text-gray-500 mt-1">
                Issued: {new Date(certificate.created_at).toLocaleDateString()}
              </div>
            </div>
            
            <div className="px-6 py-4">
              <div className="flex justify-between items-center mb-3">
                <div className="text-sm text-gray-500">
                  ID: <span className="font-mono">{certificate.certificate_id ? certificate.certificate_id.substring(0, 8) + '...' : 'Pending'}</span>
                </div>
                
                <div>
                  {certificate.blockchain_tx ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span> 
                      {isSimulationMode ? "Simulated" : "Verified"}
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      <span className="w-2 h-2 bg-yellow-500 rounded-full mr-1"></span> Pending
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 mt-4">
                <Link 
                  to={`/certificates/${certificate.certificate_id}`} 
                  className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-primary-100 text-primary-700 hover:bg-primary-200 transition-colors"
                >
                  <ChevronRightIcon className="h-4 w-4 mr-1" />
                  View
                </Link>
                
                <Link 
                  to={`/quiz/generate/${certificate.course}`}
                  className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-yellow-50 text-yellow-700 border border-yellow-200 hover:bg-yellow-100 transition-colors"
                >
                  <ArrowPathIcon className="h-4 w-4 mr-1" />
                  Retake Quiz
                </Link>
                
                {certificate.pdf_url && (
                  <button 
                    onClick={() => viewCertificate(certificate.pdf_url)}
                    className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-primary-100 text-primary-700 hover:bg-primary-200 transition-colors"
                  >
                    <DocumentTextIcon className="h-4 w-4 mr-1" />
                    View PDF
                  </button>
                )}
                
                {certificate.pdf_url && (
                  <button 
                    onClick={() => downloadCertificate(certificate.id)}
                    className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                  >
                    <DocumentArrowDownIcon className="h-4 w-4 mr-1" />
                    Download
                  </button>
                )}
                
                {certificate.blockchain_tx && certificate.nft_token_id && !isSimulationMode && (
                  <a 
                    href={`https://testnets.opensea.io/assets/mumbai/${process.env.REACT_APP_NFT_CONTRACT_ADDRESS}/${certificate.nft_token_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
                  >
                    <CubeIcon className="h-4 w-4 mr-1" />
                    NFT
                  </a>
                )}
                
                {certificate.blockchain_tx && certificate.nft_token_id && isSimulationMode && (
                  <button 
                    onClick={() => toast.info("NFT links are disabled in simulation mode")}
                    className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-50 text-gray-500 cursor-not-allowed"
                  >
                    <CubeIcon className="h-4 w-4 mr-1" />
                    NFT (Simulated)
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CertificateList; 