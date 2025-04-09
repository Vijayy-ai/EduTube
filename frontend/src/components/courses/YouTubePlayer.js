import React, { useEffect, useRef, useState } from 'react';

/**
 * YouTubePlayer Component
 * Embeds a YouTube video with event handling for completion and state changes
 * 
 * @param {Object} props
 * @param {string} props.videoId - YouTube video ID
 * @param {Function} props.onVideoComplete - Callback when video playback completes
 * @param {Function} props.onVideoProgress - Callback with progress percentage
 * @param {Function} props.onStateChange - Callback when player state changes
 * @param {Object} props.playerVars - Additional YouTube player parameters
 * @returns {JSX.Element}
 */
const YouTubePlayer = ({ 
  videoId, 
  onVideoComplete, 
  onVideoProgress,
  onStateChange,
  playerVars = {}
}) => {
  const playerRef = useRef(null);
  const playerInstanceRef = useRef(null);
  const progressIntervalRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [tabSwitches, setTabSwitches] = useState(0);
  const [duration, setDuration] = useState(0);

  // Function to update progress
  const updateProgress = () => {
    if (playerInstanceRef.current && isPlaying) {
      try {
        const currentTime = playerInstanceRef.current.getCurrentTime() || 0;
        const videoDuration = playerInstanceRef.current.getDuration() || 0;
        
        if (videoDuration > 0) {
          const progressPercent = Math.min(Math.round((currentTime / videoDuration) * 100), 100);
          setProgress(progressPercent);
          
          // Call the progress callback if provided
          if (onVideoProgress) {
            onVideoProgress(progressPercent);
          }
        }
      } catch (error) {
        console.error('Error updating progress:', error);
      }
    }
  };

  useEffect(() => {
    // Load the YouTube IFrame Player API code asynchronously.
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    // Handler for player state changes
    const onPlayerStateChange = (event) => {
      // Update playing state
      const isNowPlaying = event.data === window.YT.PlayerState.PLAYING;
      setIsPlaying(isNowPlaying);
      
      // Start or stop progress tracking
      if (isNowPlaying) {
        // Start tracking progress
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
        }
        progressIntervalRef.current = setInterval(updateProgress, 1000);
      } else {
        // Stop tracking progress
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
      }
      
      // If video ended (state = 0) call the completion callback
      if (event.data === window.YT.PlayerState.ENDED) {
        setProgress(100);
        if (onVideoComplete) {
          onVideoComplete();
        }
      }
      
      // Call the optional onStateChange callback
      if (onStateChange) {
        onStateChange(event.data);
      }
    };

    // Create YouTube player when API is ready
    const createPlayer = () => {
      if (!playerRef.current) return;

      playerInstanceRef.current = new window.YT.Player(playerRef.current, {
        videoId: videoId,
        height: '100%',
        width: '100%',
        playerVars: {
          autoplay: 1,
          rel: 0,
          modestbranding: 1,
          origin: window.location.origin,
          ...playerVars
        },
        events: {
          onStateChange: onPlayerStateChange,
          onError: (event) => console.error('YouTube Player Error:', event.data)
        }
      });
    };

    // Set up the player
    if (window.YT && window.YT.Player) {
      createPlayer();
    } else {
      window.onYouTubeIframeAPIReady = createPlayer;
    }

    // Cleanup
    return () => {
      if (playerInstanceRef.current) {
        playerInstanceRef.current.destroy();
      }
      
      if (window.onYouTubeIframeAPIReady === createPlayer) {
        window.onYouTubeIframeAPIReady = null;
      }
      
      // Clear any intervals
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };
  }, [videoId, onVideoComplete, onStateChange, playerVars]);

  // Handle tab visibility changes for anti-cheat
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // User switched tabs
        setTabSwitches(prev => prev + 1);
        
        // Pause the video if it's playing
        if (playerInstanceRef.current && isPlaying) {
          playerInstanceRef.current.pauseVideo();
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isPlaying]);

  return (
    <div className="youtube-player-container w-full h-full relative">
      <div id={`youtube-player-${videoId}`} ref={playerRef} className="w-full h-full"></div>
      
      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-900 bg-opacity-50">
        <div 
          className="h-full bg-primary-600" 
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      
      {/* Anti-cheat warning if excessive tab switching */}
      {tabSwitches > 5 && (
        <div className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded">
          Warning: Excessive tab switching detected
        </div>
      )}
    </div>
  );
};

export default YouTubePlayer; 