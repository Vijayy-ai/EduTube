import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CertificateAPI } from '../../utils/api';

import apiService from '../../utils/apiService';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  DocumentTextIcon, 
  ArrowPathIcon, 
  CurrencyDollarIcon, 
  ShareIcon, 
  ChevronRightIcon,
  DocumentDuplicateIcon,
  DocumentDownloadIcon,
  CubeIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';
import { CheckBadgeIcon, ShieldCheckIcon } from '@heroicons/react/24/solid';
import { toast } from 'react-hot-toast';

const QuizResult = ({ result, courseId }) => {
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mintLoading, setMintLoading] = useState(false);
  const [error, setError] = useState('');
  const [course, setCourse] = useState(null);
  const [copied, setCopied] = useState(false);
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const isPassed = result?.passed;
  const score = result?.score || 0;
  const passingScore = 70; // Assuming 70% is passing

  useEffect(() => {
    // Fetch course information
    const fetchCourseInfo = async () => {
      try {
        console.log('Fetching course info with ID:', courseId);
        if (!courseId || courseId === 'undefined') {
          console.error('Invalid courseId:', courseId);
          setError('Invalid course ID. Please try again.');
          return;
        }
        
        const response = await apiService.get(`courses/${courseId}/`);
        setCourse(response.data);
      } catch (err) {
        console.error('Error fetching course info:', err);
        setError('Could not load course information.');
      }
    };
    
    fetchCourseInfo();
    
    // If passed, check if certificate exists
    if (isPassed) {
      const checkCertificate = async () => {
        try {
          console.log('Checking for existing certificate for course:', courseId);
          
          // The API can return either an array directly or a paginated response with "results" field
          const response = await CertificateAPI.getAllCertificates();
          const certificates = Array.isArray(response.data) ? response.data : 
                              response.data.results ? response.data.results : [];
          
          const matchingCert = certificates.find(cert => 
            cert.course === parseInt(courseId, 10) || cert.course_id === parseInt(courseId, 10)
          );
          
          if (matchingCert) {
            console.log('Found existing certificate:', matchingCert);
            setCertificate(matchingCert);
          }
        } catch (err) {
          console.error('Error checking certificate:', err);
        }
      };
      
      checkCertificate();
    }
  }, [isPassed, courseId]);

  const handleGenerateCertificate = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      console.log('Generating certificate for course:', courseId);
      
      if (!courseId || courseId === 'undefined') {
        throw new Error('Invalid course ID');
      }
      
      const response = await CertificateAPI.generateCertificate(parseInt(courseId, 10));
      setCertificate(response.data);
      setSuccess('Certificate generated successfully!');
    } catch (err) {
      console.error('Error generating certificate:', err);
      const errorMsg = err.response?.data?.error || 'Failed to generate certificate';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleMintNFT = async () => {
    if (!certificate) return;
    
    setMintLoading(true);
    setError('');
    setSuccess('');
    
    try {
      console.log('Minting NFT for certificate:', certificate);
      
      if (!certificate.certificate_id) {
        throw new Error('Certificate ID not found');
      }
      
      // Get wallet address from localStorage or prompt user to connect wallet
      let walletAddress = localStorage.getItem('walletAddress');
      
      if (!walletAddress) {
        // If no wallet is connected, show an error message
        setError('Please connect your wallet on the certificate page to mint an NFT');
        toast.error('Wallet not connected. Please view the certificate page to connect your wallet.');
        setMintLoading(false);
        return;
      }
      
      console.log('Using wallet address:', walletAddress);
      
      const response = await CertificateAPI.mintNFT(certificate.certificate_id, walletAddress);
      console.log('Minting response:', response.data);
      
      setCertificate({
        ...certificate,
        nft_token_id: response.data.token_id,
        blockchain_tx: response.data.transaction_hash || response.data.blockchain_tx
      });
      
      toast.success('NFT minted successfully!');
      setSuccess('NFT minted successfully! Your certificate is now on the blockchain.');
    } catch (err) {
      console.error('Error minting NFT:', err);
      const errorMsg = err.response?.data?.error || 'Failed to mint NFT. Please try again later.';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setMintLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        setSuccess('Copied to clipboard');
        setTimeout(() => setSuccess(''), 2000);
      })
      .catch(err => {
        console.error('Error copying to clipboard:', err);
        setError('Failed to copy to clipboard');
      });
  };

  return (
    <div className="container-custom py-12">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-card overflow-hidden mb-8">
          <div className={`p-8 ${
            isPassed ? 'bg-gradient-to-r from-green-500 to-green-700' : 'bg-gradient-to-r from-red-500 to-red-700'
          } text-white`}>
            <div className="flex items-center mb-4">
              {isPassed ? (
                <CheckBadgeIcon className="h-12 w-12 mr-4" />
              ) : (
                <XCircleIcon className="h-12 w-12 mr-4" />
              )}
              <div>
                <h1 className="text-3xl font-bold">
                  {isPassed ? 'Quiz Passed!' : 'Quiz Not Passed'}
                </h1>
                <p className="opacity-90 text-lg">
                  {isPassed 
                    ? 'Congratulations on completing the quiz successfully!' 
                    : 'Review the material and try again to earn your certificate.'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="p-8">
            <div className="flex flex-col md:flex-row justify-between gap-8 mb-8">
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Score Overview</h2>
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex-1">
                      <p className="text-gray-500 text-sm">Your Score</p>
                      <div className="text-3xl font-bold text-gray-900">{Math.round(score)}%</div>
                    </div>
                    <div className="relative h-24 w-24">
                      <svg viewBox="0 0 36 36" className="h-24 w-24 stroke-current">
                        <path
                          className="stroke-gray-200"
                          strokeWidth="3"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                          className={`${isPassed ? 'stroke-green-500' : 'stroke-red-500'}`}
                          strokeWidth="3"
                          strokeDasharray={`${score}, 100`}
                          strokeLinecap="round"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center text-sm font-medium">
                        {Math.round(score)}%
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <div>
                      <p className="text-gray-500">Passing Score</p>
                      <p className="font-medium text-gray-900">{passingScore}%</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Status</p>
                      <p className={`font-medium ${isPassed ? 'text-green-600' : 'text-red-600'}`}>
                        {isPassed ? 'PASSED' : 'FAILED'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Course Information</h2>
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                  {course ? (
                    <>
                      <h3 className="font-medium text-gray-900 mb-1">{course.title}</h3>
                      <p className="text-gray-500 text-sm mb-4">{course.description.substring(0, 120)}...</p>
                      <div className="flex items-center mt-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          course.difficulty === 'basic' ? 'bg-green-100 text-green-800' :
                          course.difficulty === 'intermediate' ? 'bg-blue-100 text-blue-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {course.difficulty.charAt(0).toUpperCase() + course.difficulty.slice(1)}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
                      <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {isPassed && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Your Certificate</h2>
                {certificate ? (
                  <div className="border border-gray-200 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6">
                      <div className="flex items-start">
                        <div className="bg-white border border-gray-200 rounded-lg p-4 mr-6 shadow-sm">
                          <DocumentTextIcon className="h-10 w-10 text-primary-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 text-lg mb-1">Certificate #{certificate.certificate_id}</h3>
                          <p className="text-gray-600 text-sm mb-3">Issued on {new Date(certificate.created_at).toLocaleDateString()} for {course?.title}</p>
                          
                          <div className="flex flex-wrap gap-3 mt-4">
                            {certificate.pdf_url && (
                              <a 
                                href={certificate.pdf_url.startsWith('http') 
                                  ? certificate.pdf_url 
                                  : `${process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:8000'}${certificate.pdf_url}`}
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-primary-100 text-primary-700 hover:bg-primary-200 transition-colors shadow-sm"
                              >
                                <DocumentTextIcon className="h-5 w-5 mr-2" />
                                View Certificate
                              </a>
                            )}
                            
                            <button
                              onClick={() => copyToClipboard(certificate.certificate_id)}
                              className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors shadow-sm"
                            >
                              <DocumentDuplicateIcon className="h-5 w-5 mr-2" />
                              {copied ? 'Copied!' : 'Copy ID'}
                            </button>
                            
                            <Link 
                              to={`/certificates/${certificate.certificate_id}`}
                              className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition-colors shadow-sm"
                            >
                              <ShareIcon className="h-5 w-5 mr-2" />
                              Share Certificate
                            </Link>

                            {certificate.blockchain_tx && (
                              <button
                                onClick={() => {
                                  // Open in a new window to check NFT in MetaMask
                                  const link = `https://testnets.opensea.io/assets/mumbai/${process.env.REACT_APP_NFT_CONTRACT_ADDRESS || '0x28944b34764b14ceb4d'}/${certificate.nft_token_id}`;
                                  window.open(link, '_blank');
                                }}
                                className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition-colors shadow-sm"
                              >
                                <CubeIcon className="h-5 w-5 mr-2" />
                                View NFT in OpenSea
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {certificate.ipfs_hash && (
                      <div className="border-t border-gray-200 p-6">
                        <h4 className="text-sm font-medium text-gray-900 mb-3">Blockchain Verification</h4>
                        <div className="grid gap-4 md:grid-cols-2">
                          {certificate.ipfs_hash ? (
                            <div className="bg-gray-50 rounded-lg p-3">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="text-xs text-gray-500">IPFS Hash</p>
                                  <p className="text-sm font-mono font-medium text-gray-800 break-all">
                                    {certificate.ipfs_hash.substring(0, 20)}...
                                  </p>
                                </div>
                                {!certificate.ipfs_hash.includes('placeholder') && (
                                  <a 
                                    href={`https://ipfs.io/ipfs/${certificate.ipfs_hash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary-600 hover:text-primary-700"
                                  >
                                    <ChevronRightIcon className="h-5 w-5" />
                                  </a>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="bg-gray-50 rounded-lg p-3">
                              <p className="text-xs text-gray-500">IPFS Hash</p>
                              <p className="text-sm text-gray-500">Not yet uploaded to IPFS</p>
                            </div>
                          )}
                          
                          {certificate.blockchain_tx && !certificate.blockchain_tx.includes('0x00000') ? (
                            <div className="bg-gray-50 rounded-lg p-3">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="text-xs text-gray-500">Blockchain Transaction</p>
                                  <p className="text-sm font-mono font-medium text-gray-800 break-all">
                                    {certificate.blockchain_tx.substring(0, 20)}...
                                  </p>
                                </div>
                                <a 
                                  href={`https://polygonscan.com/tx/${certificate.blockchain_tx}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary-600 hover:text-primary-700"
                                >
                                  <ChevronRightIcon className="h-5 w-5" />
                                </a>
                              </div>
                            </div>
                          ) : (
                            <div className="bg-gray-50 rounded-lg p-3">
                              <p className="text-xs text-gray-500 mb-2">NFT Certificate</p>
                              <button 
                                onClick={handleMintNFT} 
                                disabled={mintLoading}
                                className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700 disabled:opacity-70"
                              >
                                {mintLoading ? (
                                  <>
                                    <ArrowPathIcon className="h-4 w-4 mr-1.5 animate-spin" />
                                    Minting...
                                  </>
                                ) : (
                                  <>
                                    <CubeIcon className="h-4 w-4 mr-1.5" />
                                    Mint NFT Certificate
                                  </>
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-gray-200 rounded-xl p-8 text-center shadow-md">
                    <div className="mb-4 flex justify-center">
                      <AcademicCapIcon className="h-16 w-16 text-primary-500" />
                    </div>
                    <h3 className="text-xl font-medium text-gray-900 mb-3">Generate Your Certificate</h3>
                    <p className="text-gray-600 mb-6 max-w-md mx-auto">Create a permanent record of your achievement that you can share with others.</p>
                    
                    {loading ? (
                      <button 
                        disabled
                        className="bg-gray-400 text-white py-3 px-6 rounded-lg font-medium inline-flex items-center justify-center"
                      >
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Generating...
                      </button>
                    ) : (
                      <button 
                        onClick={handleGenerateCertificate}
                        className="bg-primary-600 hover:bg-primary-700 text-white py-3 px-8 rounded-lg font-medium transition-colors shadow-md hover:shadow-lg inline-flex items-center"
                      >
                        <AcademicCapIcon className="h-5 w-5 mr-2" />
                        Generate Certificate
                      </button>
                    )}
                    
                    {error && <p className="mt-4 text-red-600">{error}</p>}
                    {success && <p className="mt-4 text-green-600">{success}</p>}
                  </div>
                )}
              </div>
            )}
            
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
                <div className="flex">
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}
            
            {success && (
              <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6">
                <div className="flex">
                  <div className="ml-3">
                    <p className="text-sm text-green-700">{success}</p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row justify-between gap-4 border-t border-gray-200 pt-6">
              <Link 
                to={`/courses/${courseId}`}
                className="inline-flex items-center justify-center px-5 py-2.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Return to Course
              </Link>
              
              <div className="flex flex-wrap gap-2">
                <Link 
                  to={`/quiz/generate/${courseId}`}
                  className="inline-flex items-center justify-center px-5 py-2.5 border border-yellow-500 shadow-sm text-sm font-medium rounded-md text-yellow-700 bg-yellow-50 hover:bg-yellow-100"
                >
                  <ArrowPathIcon className="h-5 w-5 mr-2" />
                  Retake Quiz
                </Link>
                
                <Link 
                  to="/dashboard" 
                  className="inline-flex items-center justify-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
                >
                  Go to Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizResult; 