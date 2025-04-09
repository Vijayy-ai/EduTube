import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { CertificateAPI } from '../../utils/api';
import apiService from '../../utils/apiService';
import LoadingSpinner from '../common/LoadingSpinner';
import { 
  ArrowLeftIcon, 
  ShareIcon, 
  DocumentDuplicateIcon, 
  DocumentArrowDownIcon,
  CubeIcon, 
  CheckCircleIcon,
  XCircleIcon,
  WalletIcon,
  ChevronRightIcon,
  AcademicCapIcon,
  LinkIcon as ExternalLinkIcon,
  ShoppingBagIcon,
  ArrowPathIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import config from '../../config';

const CertificateView = () => {
  const { certificateId } = useParams();
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mintLoading, setMintLoading] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [isWalletConnecting, setIsWalletConnecting] = useState(false);
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const [courseId, setCourseId] = useState(null);

  useEffect(() => {
    const savedAddress = localStorage.getItem('walletAddress');
    if (savedAddress) {
      setWalletAddress(savedAddress);
    }
  }, []);

  useEffect(() => {
    const fetchCertificate = async () => {
      try {
        const response = await apiService.get(`certificates/${certificateId}/`);
        console.log('Certificate data:', response.data);
        setCertificate(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching certificate:', err);
        setError('Failed to load certificate. Please try again.');
        setLoading(false);
      }
    };

    fetchCertificate();
  }, [certificateId]);

  useEffect(() => {
    if (certificate?.course) {
      setCourseId(certificate.course);
    }
  }, [certificate]);

  // Connect to MetaMask wallet
  const connectWallet = async () => {
    setIsWalletConnecting(true);
    setError('');
    
    try {
      // Check if MetaMask is installed
      if (!window.ethereum) {
        toast.error('MetaMask not detected! Please install MetaMask to continue.');
        setIsWalletConnecting(false);
        return;
      }
      
      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const account = accounts[0];
      
      // Save wallet address
      setWalletAddress(account);
      localStorage.setItem('walletAddress', account);
      
      // Display success message
      toast.success('Wallet connected successfully!');
      
      // Check for Mumbai testnet
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      if (chainId !== '0x13881') { // Mumbai testnet
        try {
          // Switch to Mumbai testnet
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x13881' }], // Mumbai testnet
          });
        } catch (switchError) {
          // This error code indicates that the chain has not been added to MetaMask
          if (switchError.code === 4902) {
            try {
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [
                  {
                    chainId: '0x13881',
                    chainName: 'Mumbai Testnet',
                    nativeCurrency: {
                      name: 'MATIC',
                      symbol: 'MATIC',
                      decimals: 18
                    },
                    rpcUrls: ['https://rpc-mumbai.maticvigil.com/'],
                    blockExplorerUrls: ['https://mumbai.polygonscan.com/']
                  }
                ],
              });
            } catch (addError) {
              toast.error('Failed to add Mumbai network to MetaMask');
            }
          } else {
            toast.error('Failed to switch network in MetaMask');
          }
        }
      }
      
      // Set up event listeners for wallet
      window.ethereum.on('accountsChanged', (newAccounts) => {
        if (newAccounts.length === 0) {
          // User disconnected their wallet
          disconnectWallet();
        } else {
          // User switched accounts
          setWalletAddress(newAccounts[0]);
          localStorage.setItem('walletAddress', newAccounts[0]);
        }
      });
      
      window.ethereum.on('chainChanged', (chainId) => {
        // Handle chain changes - refresh page as recommended by MetaMask
        window.location.reload();
      });
      
    } catch (err) {
      console.error('Error connecting wallet:', err);
      toast.error('Failed to connect wallet. Please try again.');
    } finally {
      setIsWalletConnecting(false);
    }
  };
  
  // Disconnect wallet
  const disconnectWallet = () => {
    setWalletAddress('');
    localStorage.removeItem('walletAddress');
    toast.success('Wallet disconnected');
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
      
      // Check if wallet is connected
      if (!walletAddress) {
        toast.error('Please connect your wallet first');
        setMintLoading(false);
        return;
      }
      
      // Validate wallet address format
      if (!walletAddress.startsWith('0x') || walletAddress.length !== 42) {
        toast.error('Invalid wallet address format. Please reconnect your wallet.');
        setMintLoading(false);
        return;
      }
      
      // Log the wallet address being sent
      console.log('Sending wallet address to backend:', walletAddress);
      
      // Explicitly send the wallet address in the request
      const response = await CertificateAPI.mintNFT(certificate.certificate_id, walletAddress);
      console.log('Minting response:', response.data);
      
      // Update certificate with NFT data
      setCertificate({
        ...certificate,
        nft_token_id: response.data.token_id,
        blockchain_tx: response.data.blockchain_tx || response.data.transaction_hash
      });
      
      // Show success message with link to view on PolygonScan
      const txHash = response.data.blockchain_tx || response.data.transaction_hash;
      toast.success(
        <div>
          NFT minted successfully!
          <a 
            href={`https://mumbai.polygonscan.com/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block mt-1 text-xs underline"
          >
            View on PolygonScan
          </a>
        </div>,
        { duration: 6000 }
      );
      
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
        toast.success('Copied to clipboard');
      })
      .catch(err => {
        console.error('Error copying to clipboard:', err);
        toast.error('Failed to copy to clipboard');
      });
  };

  // Display NFT in wallet section if wallet is connected and certificate has NFT
  const renderWalletNFT = () => {
    // Only show if wallet connected and certificate has NFT info
    if (!walletAddress || !certificate?.nft_token_id) return null;
    
    const contractAddress = process.env.REACT_APP_NFT_CONTRACT_ADDRESS;
    const tokenId = certificate.nft_token_id;
    const txHash = certificate.blockchain_tx;
    
    // Create valid OpenSea testnet URL
    const openSeaUrl = `https://testnets.opensea.io/assets/mumbai/${contractAddress}/${tokenId}`;
    
    // Create valid PolygonScan URL 
    const polygonScanUrl = `https://mumbai.polygonscan.com/tx/${txHash}`;
    
    return (
      <div className="mt-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100 shadow-sm">
        <div className="flex items-center mb-4">
          <CubeIcon className="h-6 w-6 text-indigo-600 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Certificate NFT</h3>
        </div>
        
        <div className="mb-4 p-4 bg-white rounded-lg border border-gray-200">
          <div className="flex flex-col space-y-2">
            <div className="flex items-start">
              <span className="text-sm font-medium text-gray-500 w-24">Token ID:</span>
              <span className="text-sm text-gray-800 font-mono bg-gray-100 px-2 py-1 rounded">{tokenId}</span>
            </div>
            
            <div className="flex items-start">
              <span className="text-sm font-medium text-gray-500 w-24">Contract:</span>
              <span className="text-sm text-gray-800 font-mono bg-gray-100 px-2 py-1 rounded truncate max-w-xs">{contractAddress}</span>
            </div>
            
            <div className="flex items-start">
              <span className="text-sm font-medium text-gray-500 w-24">Tx Hash:</span>
              <span className="text-sm text-gray-800 font-mono bg-gray-100 px-2 py-1 rounded truncate max-w-xs">{txHash?.substring(0, 10)}...{txHash?.substring(txHash.length - 10)}</span>
            </div>
          </div>
        </div>
        
        {/* Simulated mode notice */}
        {process.env.NODE_ENV !== 'production' && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-700">
              <strong>Note:</strong> This is a simulated NFT for testing purposes. The links below may not work in the test environment.
            </p>
          </div>
        )}
        
        <div className="flex flex-wrap gap-3 mt-2">
          <a
            href={openSeaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
          >
            <img src="https://opensea.io/static/images/logos/opensea-logo.svg" alt="OpenSea" className="h-4 w-4 mr-2" />
            View on OpenSea
          </a>
          
          <a
            href={polygonScanUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors"
          >
            <ExternalLinkIcon className="h-4 w-4 mr-2" />
            View Transaction
          </a>
        </div>
        
        <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-800">
          <p>
            <strong>Tip:</strong> The NFT may take a few minutes to appear on OpenSea after minting. If you don't see it immediately, please check back later.
          </p>
        </div>
      </div>
    );
  };

  // Add a downloadCertificate function to the component
  const downloadCertificate = async () => {
    try {
      if (!certificate?.id) return;
      
      toast.loading('Downloading certificate...', { id: 'download-cert' });
      
      // Get auth token
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Authentication required', { id: 'download-cert' });
        return;
      }
      
      // Create download link
      const downloadUrl = `${apiService.baseURL}/certificates/${certificate.id}/download/`;
      
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
      a.download = `certificate-${certificate.certificate_id}.pdf`;
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
  
  // Function to open PDF in a new window with Google PDF viewer as fallback
  const viewCertificate = () => {
    try {
      if (!certificate) {
        toast.error('Certificate not found');
        return;
      }

      // Use our backend PDF viewer instead of direct Cloudinary URL
      const pdfUrl = `${config.API_URL}/certificates/${certificate.certificate_id}/pdf/`;
      const token = localStorage.getItem('token');

      // Create a URL with the token in the query string
      const viewerUrl = `${config.API_URL}/certificates/${certificate.certificate_id}/pdf/?token=${token}`;
      
      // Open in a new tab
      window.open(viewerUrl, '_blank');
      
    } catch (error) {
      console.error('Error opening PDF:', error);
      toast.error('Failed to open PDF viewer');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" text="Loading certificate..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        <p className="font-medium">Error</p>
        <p>{error}</p>
        <button 
          onClick={() => navigate(-1)} 
          className="mt-3 inline-flex items-center text-red-700 hover:text-red-900"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Go Back
        </button>
      </div>
    );
  }

  if (!certificate) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg">
        <p className="font-medium">Certificate Not Found</p>
        <p>The certificate you are looking for could not be found.</p>
        <Link 
          to="/certificates" 
          className="mt-3 inline-flex items-center text-yellow-700 hover:text-yellow-900"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          View All Certificates
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6 flex justify-between items-center">
        <Link 
          to="/certificates" 
          className="inline-flex items-center text-gray-600 hover:text-primary-600"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Certificates
        </Link>
        
        {courseId && (
          <Link 
            to={`/quiz/generate/${courseId}`}
            className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-yellow-50 text-yellow-700 border border-yellow-500 hover:bg-yellow-100 transition-colors"
          >
            <ArrowPathIcon className="h-5 w-5 mr-2" />
            Retake Quiz
          </Link>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
        <div className="bg-gradient-to-r from-primary-600 to-primary-800 px-6 py-4 text-white">
          <h1 className="text-2xl font-bold">Certificate of Completion</h1>
          <p className="text-primary-100">This certifies that you have successfully completed the course.</p>
        </div>

        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{certificate.course_details?.title || 'Course'}</h2>
              <p className="text-gray-600 text-sm">
                Issued on: {new Date(certificate.created_at).toLocaleDateString()}
              </p>
            </div>
            <div>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                certificate.is_valid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {certificate.is_valid ? (
                  <>
                    <CheckCircleIcon className="h-4 w-4 mr-1" />
                    Valid
                  </>
                ) : (
                  <>
                    <XCircleIcon className="h-4 w-4 mr-1" />
                    Invalid
                  </>
                )}
              </span>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-3">Certificate Details</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="mb-4">
                    <p className="text-xs text-gray-500">Certificate ID</p>
                    <div className="flex items-center">
                      <p className="text-sm font-mono font-medium text-gray-800 truncate">
                        {certificate.certificate_id}
                      </p>
                      <button 
                        onClick={() => copyToClipboard(certificate.certificate_id)}
                        className="ml-2 text-gray-400 hover:text-gray-600"
                      >
                        <DocumentDuplicateIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-xs text-gray-500">Issued To</p>
                    <p className="text-sm font-medium text-gray-800">
                      {certificate.user_fullname || certificate.username}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-3">Actions</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  {certificate.pdf_url && (
                    <>
                      <button
                        onClick={viewCertificate}
                        className="inline-flex items-center px-4 py-2 rounded-lg text-white bg-primary-600 hover:bg-primary-700 transition-colors w-full mb-2"
                      >
                        <DocumentTextIcon className="h-5 w-5 mr-2" />
                        View Certificate
                      </button>
                      
                      <button
                        onClick={downloadCertificate}
                        className="inline-flex items-center px-4 py-2 rounded-lg text-white bg-secondary-600 hover:bg-secondary-700 transition-colors w-full mb-2"
                      >
                        <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
                        Download Certificate
                      </button>
                    </>
                  )}
                  
                  <button
                    onClick={() => copyToClipboard(`${window.location.origin}/verify/${certificate.certificate_id}`)}
                    className="flex items-center text-primary-600 hover:text-primary-700 w-full text-left"
                  >
                    <ShareIcon className="h-5 w-5 mr-2" />
                    <span>Share Certificate</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Wallet NFT Section */}
          {renderWalletNFT()}

          <div className="border-t border-gray-200 mt-6 pt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Blockchain Verification</h3>
            <p className="text-sm text-gray-600 mb-4">
              This certificate is permanently stored on the blockchain and IPFS for verification.
            </p>
            
            <div className="grid gap-4 md:grid-cols-2">
              {/* IPFS Hash Section */}
              {certificate.ipfs_hash ? (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center mb-2">
                        <DocumentArrowDownIcon className="h-5 w-5 mr-2 text-primary-600" />
                        <span className="font-medium text-gray-700">IPFS Hash</span>
                      </div>
                      <p className="text-sm font-mono text-gray-700 break-all">
                        {certificate.ipfs_hash.substring(0, 16)}...
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Decentralized storage on IPFS
                      </p>
                    </div>
                    {!certificate.ipfs_hash.includes('placeholder') && (
                      <a 
                        href={`https://ipfs.io/ipfs/${certificate.ipfs_hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:text-primary-700"
                      >
                        <ExternalLinkIcon className="h-5 w-5" />
                      </a>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-xs text-gray-500">IPFS Hash</p>
                  <p className="text-sm text-gray-500">Not yet uploaded to IPFS</p>
                </div>
              )}
              
              {/* Blockchain Transaction Section */}
              {certificate.blockchain_tx && !certificate.blockchain_tx.includes('placeholder') ? (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center mb-2">
                        <CubeIcon className="h-5 w-5 mr-2 text-indigo-600" />
                        <span className="font-medium text-gray-700">Blockchain Transaction</span>
                      </div>
                      <p className="text-sm font-mono text-gray-700 break-all">
                        {certificate.blockchain_tx.substring(0, 16)}...
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Verified on Polygon Mumbai Testnet
                      </p>
                    </div>
                    <a 
                      href={`https://mumbai.polygonscan.com/tx/${certificate.blockchain_tx}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:text-primary-700"
                    >
                      <ExternalLinkIcon className="h-5 w-5" />
                    </a>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center mb-2">
                    <CubeIcon className="h-5 w-5 mr-2 text-gray-400" />
                    <span className="font-medium text-gray-700">Blockchain Verification</span>
                  </div>
                  <p className="text-sm text-gray-500">
                    {certificate.nft_token_id ? 'Transaction processing...' : 'Not yet minted on blockchain'}
                  </p>
                  <div className="mt-2">
                    {!certificate.nft_token_id && walletAddress && (
                      <button
                        onClick={handleMintNFT}
                        disabled={mintLoading}
                        className="text-xs text-primary-600 hover:text-primary-700 flex items-center"
                      >
                        {mintLoading ? 'Minting...' : 'Mint NFT now'}
                        <ChevronRightIcon className="h-3 w-3 ml-1" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificateView; 