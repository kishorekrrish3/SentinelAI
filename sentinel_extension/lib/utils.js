// SentinelAI Utility Functions
const utils = {
    // Debounce function to limit function calls
    debounce(func, wait, immediate) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                if (!immediate) func(...args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func(...args);
        };
    },

    // Throttle function to limit function calls
    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    // Calculate string similarity (Levenshtein distance)
    calculateSimilarity(str1, str2) {
        const matrix = [];
        const len1 = str1.length;
        const len2 = str2.length;

        // Create matrix
        for (let i = 0; i <= len2; i++) {
            matrix[i] = [i];
        }
        for (let j = 0; j <= len1; j++) {
            matrix[0][j] = j;
        }

        // Fill matrix
        for (let i = 1; i <= len2; i++) {
            for (let j = 1; j <= len1; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1, // substitution
                        matrix[i][j - 1] + 1,     // insertion
                        matrix[i - 1][j] + 1      // deletion
                    );
                }
            }
        }

        const maxLen = Math.max(len1, len2);
        return maxLen === 0 ? 1 : (maxLen - matrix[len2][len1]) / maxLen;
    },

    // Validate URL format
    isValidURL(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    },

    // Extract domain from URL
    getDomainFromURL(url) {
        try {
            return new URL(url).hostname;
        } catch (_) {
            return null;
        }
    },

    // Check if domain is suspicious
    isSuspiciousDomain(domain) {
        const suspiciousPatterns = [
            /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/, // IP addresses
            /[0-9]{5,}/, // Long numbers in domain
            /-[a-z0-9]{10,}\./, // Long random strings
            /\.(tk|ml|ga|cf|bit)$/, // Suspicious TLDs
        ];

        return suspiciousPatterns.some(pattern => pattern.test(domain));
    },

    // Sanitize text for analysis
    sanitizeText(text) {
        return text
            .replace(/[^\w\s!@#$%^&*(),.?":{}|<>]/g, '') // Remove special chars
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim();
    },

    // Hash function for anonymization
    simpleHash(str) {
        let hash = 0;
        if (str.length === 0) return hash;

        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }

        return Math.abs(hash).toString(36);
    },

    // Format timestamp
    formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;

        if (diff < 60000) { // Less than 1 minute
            return 'Just now';
        } else if (diff < 3600000) { // Less than 1 hour
            const minutes = Math.floor(diff / 60000);
            return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
        } else if (diff < 86400000) { // Less than 1 day
            const hours = Math.floor(diff / 3600000);
            return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
        } else {
            return date.toLocaleDateString();
        }
    },

    // Local storage helpers
    storage: {
        async get(keys) {
            try {
                return await chrome.storage.local.get(keys);
            } catch (error) {
                console.error('Storage get error:', error);
                return {};
            }
        },

        async set(data) {
            try {
                await chrome.storage.local.set(data);
                return true;
            } catch (error) {
                console.error('Storage set error:', error);
                return false;
            }
        },

        async remove(keys) {
            try {
                await chrome.storage.local.remove(keys);
                return true;
            } catch (error) {
                console.error('Storage remove error:', error);
                return false;
            }
        }
    },

    // Risk level helpers
    getRiskLevel(score) {
        if (score < 30) return 'low';
        if (score < 70) return 'medium';
        return 'high';
    },

    getRiskColor(score) {
        if (score < 30) return '#4CAF50'; // Green
        if (score < 70) return '#FF9800'; // Orange
        return '#F44336'; // Red
    },

    getRiskLabel(score) {
        if (score < 30) return 'Safe';
        if (score < 70) return 'Caution';
        return 'Danger';
    },

    // Text analysis helpers
    extractEmails(text) {
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        return text.match(emailRegex) || [];
    },

    extractPhones(text) {
        const phoneRegex = /(\+?1[-.\s]?)?(\(?[0-9]{3}\)?[-.\s]?)?[0-9]{3}[-.\s]?[0-9]{4}/g;
        return text.match(phoneRegex) || [];
    },

    extractDomains(text) {
        const domainRegex = /https?:\/\/(www\.)?([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
        const matches = text.match(domainRegex) || [];
        return matches.map(url => this.getDomainFromURL(url)).filter(domain => domain);
    },

    // Performance helpers
    performance: {
        startTimer(name) {
            console.time(`SentinelAI:${name}`);
        },

        endTimer(name) {
            console.timeEnd(`SentinelAI:${name}`);
        },

        memory() {
            if (performance.memory) {
                return {
                    used: Math.round(performance.memory.usedJSHeapSize / 1048576),
                    total: Math.round(performance.memory.totalJSHeapSize / 1048576),
                    limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576)
                };
            }
            return null;
        }
    },

    // Logging helpers
    log: {
        info(message, ...args) {
            console.log(`🛡️ [SentinelAI] ${message}`, ...args);
        },

        warn(message, ...args) {
            console.warn(`⚠️ [SentinelAI] ${message}`, ...args);
        },

        error(message, ...args) {
            console.error(`❌ [SentinelAI] ${message}`, ...args);
        },

        debug(message, ...args) {
            if (chrome.runtime && chrome.runtime.getManifest().version.includes('dev')) {
                console.debug(`🔍 [SentinelAI] ${message}`, ...args);
            }
        }
    },

    // Animation helpers
    animations: {
        fadeIn(element, duration = 300) {
            element.style.opacity = '0';
            element.style.transition = `opacity ${duration}ms`;

            // Force reflow
            element.offsetHeight;

            element.style.opacity = '1';
        },

        fadeOut(element, duration = 300) {
            element.style.transition = `opacity ${duration}ms`;
            element.style.opacity = '0';

            setTimeout(() => {
                element.style.display = 'none';
            }, duration);
        },

        slideIn(element, direction = 'down', duration = 300) {
            const transforms = {
                'down': 'translateY(-20px)',
                'up': 'translateY(20px)',
                'left': 'translateX(20px)',
                'right': 'translateX(-20px)'
            };

            element.style.transform = transforms[direction];
            element.style.opacity = '0';
            element.style.transition = `all ${duration}ms ease`;

            // Force reflow
            element.offsetHeight;

            element.style.transform = 'translate(0)';
            element.style.opacity = '1';
        }
    },

    // Notification helpers
    notifications: {
        show(message, type = 'info', duration = 5000) {
            const notification = document.createElement('div');
            notification.className = `sentinelai-notification sentinelai-notification-${type}`;
            notification.textContent = message;

            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: ${type === 'error' ? '#f44336' : type === 'success' ? '#4caf50' : '#2196f3'};
                color: white;
                padding: 12px 20px;
                border-radius: 8px;
                z-index: 10002;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                font-size: 14px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                max-width: 300px;
                word-wrap: break-word;
                animation: slideInRight 0.3s ease;
            `;

            document.body.appendChild(notification);

            setTimeout(() => {
                if (notification.parentNode) {
                    utils.animations.fadeOut(notification, 300);
                    setTimeout(() => {
                        if (notification.parentNode) {
                            notification.parentNode.removeChild(notification);
                        }
                    }, 300);
                }
            }, duration);
        }
    },

    // Feature detection
    features: {
        hasWebWorkers: () => typeof Worker !== 'undefined',
        hasIndexedDB: () => typeof indexedDB !== 'undefined',
        hasNotifications: () => 'Notification' in window,
        hasGeolocation: () => 'geolocation' in navigator,
        hasCamera: () => 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices
    },

    // Browser detection
    browser: {
        isChrome: () => /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor),
        isFirefox: () => /Firefox/.test(navigator.userAgent),
        isEdge: () => /Edge/.test(navigator.userAgent),
        isSafari: () => /Safari/.test(navigator.userAgent) && /Apple Computer/.test(navigator.vendor)
    },

    // Data validation
    validate: {
        email(email) {
            const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return regex.test(email);
        },

        url(url) {
            return utils.isValidURL(url);
        },

        phone(phone) {
            const regex = /^[\+]?[1-9][\d]{0,15}$/;
            return regex.test(phone.replace(/\D/g, ''));
        }
    }
};

// Add CSS for notifications animation
if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(style);
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = utils;
}