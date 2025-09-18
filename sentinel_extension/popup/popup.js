// SentinelAI Popup JavaScript
class SentinelAIPopup {
    constructor() {
        this.currentTab = null;
        this.riskScore = 0;
        this.threats = [];
        this.stats = {
            threatsBlocked: 0,
            pagesScanned: 0,
            riskReduction: 0
        };

        this.initializePopup();
        this.setupEventListeners();
        this.loadStoredData();
    }

    async initializePopup() {
        try {
            // Get current active tab
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            this.currentTab = tab;

            // Request current page analysis
            this.requestPageAnalysis();

        } catch (error) {
            console.error('Failed to initialize popup:', error);
            this.showError('Failed to initialize SentinelAI');
        }
    }

    setupEventListeners() {
        // Scan button
        document.getElementById('scanButton').addEventListener('click', () => {
            this.scanCurrentPage();
        });

        // Settings
        document.getElementById('realTimeProtection').addEventListener('change', (e) => {
            this.updateSetting('realTimeProtection', e.target.checked);
        });

        document.getElementById('notificationsEnabled').addEventListener('change', (e) => {
            this.updateSetting('notificationsEnabled', e.target.checked);
        });

        document.getElementById('sensitivityLevel').addEventListener('change', (e) => {
            this.updateSetting('sensitivityLevel', e.target.value);
        });

        // Footer actions
        document.getElementById('reportFalsePositive').addEventListener('click', () => {
            this.reportFalsePositive();
        });

        document.getElementById('learnMore').addEventListener('click', () => {
            this.openLearnMore();
        });
    }

    async loadStoredData() {
        try {
            const result = await chrome.storage.local.get([
                'stats', 'settings', 'recentActivity'
            ]);

            if (result.stats) {
                this.stats = result.stats;
                this.updateStatsDisplay();
            }

            if (result.settings) {
                this.applySettings(result.settings);
            }

            if (result.recentActivity) {
                this.updateActivityDisplay(result.recentActivity);
            }

        } catch (error) {
            console.error('Failed to load stored data:', error);
        }
    }

    async requestPageAnalysis() {
        try {
            this.setScanning(true);

            const response = await chrome.tabs.sendMessage(this.currentTab.id, {
                action: 'getPageAnalysis'
            });

            if (response && response.success) {
                this.updateRiskDisplay(response.data);
            } else {
                this.showError('Unable to analyze current page');
            }

        } catch (error) {
            console.error('Failed to get page analysis:', error);
            this.showError('Page analysis unavailable');
        } finally {
            this.setScanning(false);
        }
    }

    async scanCurrentPage() {
        try {
            this.setScanning(true);

            const response = await chrome.tabs.sendMessage(this.currentTab.id, {
                action: 'forceScan'
            });

            if (response && response.success) {
                this.updateRiskDisplay(response.data);
                this.updateStats('pagesScanned');

                if (response.data.riskScore > 70) {
                    this.updateStats('threatsBlocked');
                }
            }

        } catch (error) {
            console.error('Scan failed:', error);
            this.showError('Scan failed - please refresh the page');
        } finally {
            this.setScanning(false);
        }
    }

    updateRiskDisplay(analysisData) {
        this.riskScore = analysisData.riskScore || 0;
        this.threats = analysisData.threats || [];

        const riskIndicator = document.getElementById('riskIndicator');
        const riskScore = document.getElementById('riskScore');
        const riskLabel = document.getElementById('riskLabel');
        const threatDetails = document.getElementById('threatDetails');

        // Update score
        riskScore.textContent = Math.round(this.riskScore);

        // Update styling based on risk level
        riskIndicator.className = 'risk-indicator';

        if (this.riskScore < 30) {
            riskIndicator.classList.add('safe');
            riskLabel.textContent = 'Safe';
        } else if (this.riskScore < 70) {
            riskIndicator.classList.add('warning');
            riskLabel.textContent = 'Caution';
        } else {
            riskIndicator.classList.add('danger');
            riskLabel.textContent = 'High Risk';
        }

        // Show/hide threat details
        if (this.threats.length > 0) {
            this.displayThreats();
            threatDetails.style.display = 'block';
        } else {
            threatDetails.style.display = 'none';
        }

        // Update activity log
        this.addActivityEntry(this.riskScore, this.threats.length);
    }

    displayThreats() {
        const threatList = document.getElementById('threatList');
        threatList.innerHTML = '';

        this.threats.forEach(threat => {
            const threatItem = document.createElement('div');
            threatItem.className = 'threat-item';

            threatItem.innerHTML = `
                <div class="threat-type">${threat.type}</div>
                <div class="threat-description">${threat.description}</div>
            `;

            threatList.appendChild(threatItem);
        });
    }

    setScanning(isScanning) {
        const riskIndicator = document.getElementById('riskIndicator');
        const scanButton = document.getElementById('scanButton');
        const riskLabel = document.getElementById('riskLabel');

        if (isScanning) {
            riskIndicator.classList.add('scanning');
            scanButton.disabled = true;
            scanButton.textContent = '🔄 Scanning...';
            riskLabel.textContent = 'Analyzing...';
        } else {
            riskIndicator.classList.remove('scanning');
            scanButton.disabled = false;
            scanButton.textContent = '🔍 Scan Current Page';
        }
    }

    updateStats(statType) {
        this.stats[statType]++;

        // Calculate risk reduction percentage
        if (this.stats.pagesScanned > 0) {
            this.stats.riskReduction = Math.round(
                (this.stats.threatsBlocked / this.stats.pagesScanned) * 100
            );
        }

        this.updateStatsDisplay();
        this.saveStats();
    }

    updateStatsDisplay() {
        document.getElementById('threatsBlocked').textContent = this.stats.threatsBlocked;
        document.getElementById('pagesScanned').textContent = this.stats.pagesScanned;
        document.getElementById('riskReduction').textContent = this.stats.riskReduction + '%';
    }

    async saveStats() {
        try {
            await chrome.storage.local.set({ stats: this.stats });
        } catch (error) {
            console.error('Failed to save stats:', error);
        }
    }

    addActivityEntry(riskScore, threatCount) {
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });

        const activity = {
            timestamp: now.toISOString(),
            url: this.currentTab.url,
            title: this.currentTab.title,
            riskScore: riskScore,
            threatCount: threatCount,
            timeString: timeString
        };

        this.addToActivityDisplay(activity);
        this.saveActivity(activity);
    }

    addToActivityDisplay(activity) {
        const activityList = document.getElementById('activityList');

        // Remove "no activity" message if present
        const noActivity = activityList.querySelector('.no-activity');
        if (noActivity) {
            noActivity.remove();
        }

        const activityItem = document.createElement('div');
        activityItem.className = 'activity-item';

        const riskClass = activity.riskScore < 30 ? 'safe' : 
                         activity.riskScore < 70 ? 'warning' : 'danger';

        activityItem.innerHTML = `
            <div>
                <strong>${activity.title.length > 30 ? 
                    activity.title.substring(0, 30) + '...' : 
                    activity.title}</strong>
                <div style="color: ${riskClass === 'safe' ? '#4caf50' : 
                                   riskClass === 'warning' ? '#ff9800' : '#f44336'}">
                    Risk: ${Math.round(activity.riskScore)}${activity.threatCount > 0 ? 
                        ` (${activity.threatCount} threats)` : ''}
                </div>
            </div>
            <div class="activity-time">${activity.timeString}</div>
        `;

        activityList.insertBefore(activityItem, activityList.firstChild);

        // Keep only last 5 entries
        const items = activityList.querySelectorAll('.activity-item');
        Array.from(items).slice(5).forEach(item => item.remove());
    }

    updateActivityDisplay(recentActivity) {
        if (!recentActivity || recentActivity.length === 0) return;

        recentActivity.slice(-5).reverse().forEach(activity => {
            this.addToActivityDisplay(activity);
        });
    }

    async saveActivity(activity) {
        try {
            const result = await chrome.storage.local.get(['recentActivity']);
            let activities = result.recentActivity || [];

            activities.push(activity);

            // Keep only last 50 activities
            if (activities.length > 50) {
                activities = activities.slice(-50);
            }

            await chrome.storage.local.set({ recentActivity: activities });
        } catch (error) {
            console.error('Failed to save activity:', error);
        }
    }

    async updateSetting(key, value) {
        try {
            const result = await chrome.storage.local.get(['settings']);
            const settings = result.settings || {};

            settings[key] = value;

            await chrome.storage.local.set({ settings });

            // Notify content script of setting change
            if (this.currentTab) {
                chrome.tabs.sendMessage(this.currentTab.id, {
                    action: 'updateSettings',
                    settings: settings
                });
            }

        } catch (error) {
            console.error('Failed to update setting:', error);
        }
    }

    applySettings(settings) {
        if (settings.realTimeProtection !== undefined) {
            document.getElementById('realTimeProtection').checked = settings.realTimeProtection;
        }

        if (settings.notificationsEnabled !== undefined) {
            document.getElementById('notificationsEnabled').checked = settings.notificationsEnabled;
        }

        if (settings.sensitivityLevel) {
            document.getElementById('sensitivityLevel').value = settings.sensitivityLevel;
        }
    }

    reportFalsePositive() {
        // Create feedback for false positive
        const feedback = {
            timestamp: new Date().toISOString(),
            url: this.currentTab.url,
            riskScore: this.riskScore,
            threats: this.threats,
            userFeedback: 'false_positive'
        };

        // Save feedback for federated learning
        this.saveFeedback(feedback);

        // Show confirmation
        this.showNotification('Thank you! Your feedback helps improve SentinelAI.', 'success');
    }

    async saveFeedback(feedback) {
        try {
            const result = await chrome.storage.local.get(['userFeedback']);
            const feedbackList = result.userFeedback || [];

            feedbackList.push(feedback);

            await chrome.storage.local.set({ userFeedback: feedbackList });
        } catch (error) {
            console.error('Failed to save feedback:', error);
        }
    }

    openLearnMore() {
        chrome.tabs.create({
            url: 'https://github.com/your-username/sentinelai-extension'
        });
    }

    showError(message) {
        this.showNotification(message, 'error');

        const riskLabel = document.getElementById('riskLabel');
        riskLabel.textContent = 'Error';
        riskLabel.style.color = '#f44336';
    }

    showNotification(message, type = 'info') {
        // Create temporary notification element
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 10px;
            left: 50%;
            transform: translateX(-50%);
            background: ${type === 'error' ? '#f44336' : 
                        type === 'success' ? '#4caf50' : '#2196f3'};
            color: white;
            padding: 10px 20px;
            border-radius: 6px;
            font-size: 12px;
            z-index: 1000;
            animation: slideInOut 3s ease-in-out;
        `;
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SentinelAIPopup();
});

// Add CSS for notification animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInOut {
        0% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
        15% { opacity: 1; transform: translateX(-50%) translateY(0); }
        85% { opacity: 1; transform: translateX(-50%) translateY(0); }
        100% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
    }
`;
document.head.appendChild(style);