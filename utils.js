/**
 * Utility Functions for JSON-RPC Client
 * 
 * This module provides helper functions for data formatting,
 * validation, and common operations used throughout the application.
 * 
 * @module utils
 * @version 1.0.0
 */

// =============================================================================
// Data Formatting Utilities
// =============================================================================

/**
 * Format bytes into human-readable format
 * 
 * @param {number} bytes - Number of bytes
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted string (e.g., "1.5 MB")
 */
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Format duration in milliseconds to readable string
 * 
 * @param {number} ms - Duration in milliseconds
 * @returns {string} Formatted duration (e.g., "2h 30m 15s")
 */
function formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
}

/**
 * Format number with thousand separators
 * 
 * @param {number} num - Number to format
 * @returns {string} Formatted number (e.g., "1,234,567")
 */
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Format date to relative time (e.g., "2 hours ago")
 * 
 * @param {Date|string} date - Date to format
 * @returns {string} Relative time string
 */
function formatRelativeTime(date) {
    const now = new Date();
    const then = typeof date === 'string' ? new Date(date) : date;
    const diffMs = now - then;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    
    if (diffSec < 60) return 'just now';
    if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
    if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
    if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
    
    return then.toLocaleDateString();
}

// =============================================================================
// Validation Utilities
// =============================================================================

/**
 * Check if value is a valid URL
 * 
 * @param {string} str - String to validate
 * @returns {boolean} True if valid URL
 */
function isValidURL(str) {
    try {
        new URL(str);
        return true;
    } catch {
        return false;
    }
}

/**
 * Check if value is a valid JSON string
 * 
 * @param {string} str - String to validate
 * @returns {boolean} True if valid JSON
 */
function isValidJSON(str) {
    try {
        JSON.parse(str);
        return true;
    } catch {
        return false;
    }
}

/**
 * Check if object is empty
 * 
 * @param {object} obj - Object to check
 * @returns {boolean} True if empty
 */
function isEmpty(obj) {
    if (obj === null || obj === undefined) return true;
    if (Array.isArray(obj)) return obj.length === 0;
    if (typeof obj === 'object') return Object.keys(obj).length === 0;
    if (typeof obj === 'string') return obj.trim().length === 0;
    return false;
}

/**
 * Deep clone an object
 * 
 * @param {any} obj - Object to clone
 * @returns {any} Cloned object
 */
function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    
    if (obj instanceof Date) {
        return new Date(obj.getTime());
    }
    
    if (Array.isArray(obj)) {
        return obj.map(item => deepClone(item));
    }
    
    const cloned = {};
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            cloned[key] = deepClone(obj[key]);
        }
    }
    
    return cloned;
}

// =============================================================================
// String Utilities
// =============================================================================

/**
 * Truncate string to specified length
 * 
 * @param {string} str - String to truncate
 * @param {number} length - Maximum length
 * @param {string} suffix - Suffix to add (default: '...')
 * @returns {string} Truncated string
 */
function truncate(str, length, suffix = '...') {
    if (str.length <= length) return str;
    return str.substring(0, length - suffix.length) + suffix;
}

/**
 * Convert string to title case
 * 
 * @param {string} str - String to convert
 * @returns {string} Title cased string
 */
function toTitleCase(str) {
    return str.replace(/\w\S*/g, (txt) => {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}

/**
 * Convert camelCase to kebab-case
 * 
 * @param {string} str - String to convert
 * @returns {string} Kebab-cased string
 */
function camelToKebab(str) {
    return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

/**
 * Convert snake_case to camelCase
 * 
 * @param {string} str - String to convert
 * @returns {string} Camel-cased string
 */
function snakeToCamel(str) {
    return str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
}

// =============================================================================
// Array Utilities
// =============================================================================

/**
 * Remove duplicates from array
 * 
 * @param {array} arr - Array with potential duplicates
 * @returns {array} Array with duplicates removed
 */
function removeDuplicates(arr) {
    return [...new Set(arr)];
}

/**
 * Chunk array into smaller arrays
 * 
 * @param {array} arr - Array to chunk
 * @param {number} size - Chunk size
 * @returns {array} Array of chunks
 */
function chunkArray(arr, size) {
    const chunks = [];
    for (let i = 0; i < arr.length; i += size) {
        chunks.push(arr.slice(i, i + size));
    }
    return chunks;
}

/**
 * Shuffle array randomly
 * 
 * @param {array} arr - Array to shuffle
 * @returns {array} Shuffled array
 */
function shuffleArray(arr) {
    const shuffled = [...arr];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

/**
 * Get random item from array
 * 
 * @param {array} arr - Array to pick from
 * @returns {any} Random item
 */
function randomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

// =============================================================================
// Object Utilities
// =============================================================================

/**
 * Pick specific properties from object
 * 
 * @param {object} obj - Source object
 * @param {array} keys - Keys to pick
 * @returns {object} New object with picked properties
 */
function pick(obj, keys) {
    const result = {};
    keys.forEach(key => {
        if (key in obj) {
            result[key] = obj[key];
        }
    });
    return result;
}

/**
 * Omit specific properties from object
 * 
 * @param {object} obj - Source object
 * @param {array} keys - Keys to omit
 * @returns {object} New object without omitted properties
 */
function omit(obj, keys) {
    const result = { ...obj };
    keys.forEach(key => {
        delete result[key];
    });
    return result;
}

/**
 * Merge objects deeply
 * 
 * @param {object} target - Target object
 * @param {object} source - Source object
 * @returns {object} Merged object
 */
function deepMerge(target, source) {
    const result = { ...target };
    
    for (const key in source) {
        if (source.hasOwnProperty(key)) {
            if (source[key] instanceof Object && key in target) {
                result[key] = deepMerge(target[key], source[key]);
            } else {
                result[key] = source[key];
            }
        }
    }
    
    return result;
}

// =============================================================================
// Math Utilities
// =============================================================================

/**
 * Clamp number between min and max
 * 
 * @param {number} num - Number to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Clamped number
 */
function clamp(num, min, max) {
    return Math.min(Math.max(num, min), max);
}

/**
 * Generate random number between min and max
 * 
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Random number
 */
function randomBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Round number to specified decimal places
 * 
 * @param {number} num - Number to round
 * @param {number} decimals - Decimal places
 * @returns {number} Rounded number
 */
function roundTo(num, decimals) {
    const factor = Math.pow(10, decimals);
    return Math.round(num * factor) / factor;
}

/**
 * Calculate percentage
 * 
 * @param {number} value - Current value
 * @param {number} total - Total value
 * @param {number} decimals - Decimal places
 * @returns {number} Percentage
 */
function percentage(value, total, decimals = 2) {
    if (total === 0) return 0;
    return roundTo((value / total) * 100, decimals);
}

// =============================================================================
// Storage Utilities
// =============================================================================

/**
 * Save to localStorage with error handling
 * 
 * @param {string} key - Storage key
 * @param {any} value - Value to store
 * @returns {boolean} True if successful
 */
function saveToStorage(key, value) {
    try {
        const serialized = JSON.stringify(value);
        localStorage.setItem(key, serialized);
        return true;
    } catch (error) {
        console.error('Failed to save to storage:', error);
        return false;
    }
}

/**
 * Load from localStorage with error handling
 * 
 * @param {string} key - Storage key
 * @param {any} defaultValue - Default value if not found
 * @returns {any} Stored value or default
 */
function loadFromStorage(key, defaultValue = null) {
    try {
        const serialized = localStorage.getItem(key);
        return serialized ? JSON.parse(serialized) : defaultValue;
    } catch (error) {
        console.error('Failed to load from storage:', error);
        return defaultValue;
    }
}

/**
 * Remove from localStorage
 * 
 * @param {string} key - Storage key
 * @returns {boolean} True if successful
 */
function removeFromStorage(key) {
    try {
        localStorage.removeItem(key);
        return true;
    } catch (error) {
        console.error('Failed to remove from storage:', error);
        return false;
    }
}

/**
 * Clear all localStorage
 * 
 * @returns {boolean} True if successful
 */
function clearStorage() {
    try {
        localStorage.clear();
        return true;
    } catch (error) {
        console.error('Failed to clear storage:', error);
        return false;
    }
}

// =============================================================================
// Async Utilities
// =============================================================================

/**
 * Debounce function execution
 * 
 * @param {function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {function} Debounced function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle function execution
 * 
 * @param {function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {function} Throttled function
 */
function throttle(func, limit) {
    let inThrottle;
    return function executedFunction(...args) {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Retry async operation
 * 
 * @param {function} operation - Async operation to retry
 * @param {number} maxRetries - Maximum retry attempts
 * @param {number} delay - Delay between retries in ms
 * @returns {Promise<any>} Operation result
 */
async function retryOperation(operation, maxRetries = 3, delay = 1000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await operation();
        } catch (error) {
            if (attempt === maxRetries) throw error;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

// =============================================================================
// Export all utilities
// =============================================================================

if (typeof window !== 'undefined') {
    window.Utils = {
        // Formatting
        formatBytes,
        formatDuration,
        formatNumber,
        formatRelativeTime,
        
        // Validation
        isValidURL,
        isValidJSON,
        isEmpty,
        deepClone,
        
        // String
        truncate,
        toTitleCase,
        camelToKebab,
        snakeToCamel,
        
        // Array
        removeDuplicates,
        chunkArray,
        shuffleArray,
        randomItem,
        
        // Object
        pick,
        omit,
        deepMerge,
        
        // Math
        clamp,
        randomBetween,
        roundTo,
        percentage,
        
        // Storage
        saveToStorage,
        loadFromStorage,
        removeFromStorage,
        clearStorage,
        
        // Async
        debounce,
        throttle,
        retryOperation
    };
}
