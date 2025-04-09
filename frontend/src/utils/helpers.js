/**
 * Format a date to a readable string
 * @param {string|Date} date - The date to format
 * @returns {string} Formatted date string
 */
export const formatDate = (date) => {
  if (!date) return '';
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(date).toLocaleDateString(undefined, options);
};

/**
 * Truncate text to a specific length
 * @param {string} text - The text to truncate
 * @param {number} length - Maximum length
 * @returns {string} Truncated text
 */
export const truncateText = (text, length = 100) => {
  if (!text) return '';
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
};

/**
 * Format a duration in seconds to HH:MM:SS format
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted duration string
 */
export const formatDuration = (seconds) => {
  if (!seconds) return '0:00';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Parse ISO 8601 duration format (used by YouTube API)
 * @param {string} isoDuration - ISO 8601 duration string (e.g. "PT1H30M15S")
 * @returns {string} Human-readable duration
 */
export const parseIsoDuration = (isoDuration) => {
  // Regular expression to extract hours, minutes, and seconds
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  
  if (!match) return '0:00';
  
  // Extract hours, minutes, and seconds, defaulting to 0 if not present
  const hours = parseInt(match[1] || 0);
  const minutes = parseInt(match[2] || 0);
  const seconds = parseInt(match[3] || 0);
  
  // Format the duration
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

/**
 * Calculate the time remaining from a total duration and progress percentage
 * @param {number} totalDuration - Total duration in seconds
 * @param {number} progressPercent - Progress percentage (0-100)
 * @returns {number} Time remaining in seconds
 */
export const calculateTimeRemaining = (totalDuration, progressPercent) => {
  if (!totalDuration || progressPercent >= 100) return 0;
  return totalDuration * (1 - progressPercent / 100);
};

/**
 * Check if a user is authenticated
 * @returns {boolean} Authentication status
 */
export const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};

/**
 * Convert a difficulty string to a display-friendly format
 * @param {string} difficulty - Difficulty level (basic, intermediate, advanced)
 * @returns {string} Formatted difficulty string
 */
export const formatDifficulty = (difficulty) => {
  if (!difficulty) return '';
  
  const map = {
    basic: 'Basic',
    intermediate: 'Intermediate',
    advanced: 'Advanced'
  };
  
  return map[difficulty] || difficulty;
};

/**
 * Parse a YouTube URL to extract the video ID
 * @param {string} url - YouTube URL
 * @returns {string|null} YouTube video ID or null if invalid
 */
export const parseYouTubeUrl = (url) => {
  if (!url) return null;
  
  // Regular expression to extract YouTube video ID
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  
  return (match && match[2].length === 11) ? match[2] : null;
};

/**
 * Generate a placeholder initials avatar from a name
 * @param {string} name - User name
 * @returns {string} Initials (1-2 characters)
 */
export const getInitials = (name) => {
  if (!name) return '';
  
  const parts = name.split(' ').filter(Boolean);
  
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}; 