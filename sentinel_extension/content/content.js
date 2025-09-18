// SentinelAI Content Script
class SentinelAIContentScript {
    constructor() {
        this.isInitialized = false;
        this.isScanning = false;
        this.lastScanTime = 0;
        this.currentAnalysis = null;
        this.observer = null;
        this.uiElements = {};
        this.settings = {
            realTimeProtection: true,
            notificationsEnabled: true,
            sensitivityLevel: 'medium'
        };

        this.initialize();
    }

    async initialize() {
        try {
            console.log('🛡️ SentinelAI Content Script Initializing...');

            // Don't run on extension pages
            if (window.location.protocol === 'chrome-extension:' || 
                window.location.protocol === 'moz-extension:') {
                return;
            }

            // Wait for DOM to be ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.setup());
            } else {
                this.setup();
            }

        } catch (error) {
            console.error('❌ SentinelAI initialization failed:', error);
        }
    }

    async setup() {
        try {
            // Load settings
            await this.loadSettings();

            // Set up UI elements
            this.setupUI();

            // Set up message listeners
            this.setupMessageListeners();

            // Start monitoring if real-time protection is enabled
            if (this.settings.realTimeProtection) {
                this.startMonitoring();
            }

            // Perform initial scan
            this.scheduleInitialScan();

            this.isInitialized = true;
            console.log('✅ SentinelAI Content Script Ready');

        } catch (error) {
            console.error('❌ Setup failed:', error);
        }
    }

    setupMessageListeners() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            this.handleMessage(request, sender, sendResponse);
            return true; // Keep message channel open
        });
    }

    async handleMessage(request, sender, sendResponse) {
        try {
            switch (request.action) {
                case 'getPageAnalysis':
                    const analysis = await this.getPageAnalysis();
                    sendResponse({ success: true, data: analysis });
                    break;

                case 'forceScan':
                    const scanResult = await this.performFullScan();
                    sendResponse({ success: true, data: scanResult });
                    break;

                case 'updateSettings':
                    this.updateSettings(request.settings);
                    sendResponse({ success: true });
                    break;

                case 'performBackgroundAnalysis':
                    this.performBackgroundAnalysis();
                    sendResponse({ success: true });
                    break;

                default:
                    sendResponse({ success: false, error: 'Unknown action' });
            }
        } catch (error) {
            console.error('Message handling error:', error);
            sendResponse({ success: false, error: error.message });
        }
    }

    setupUI() {
        // Create floating risk indicator
        this.createRiskIndicator();

        // Create warning overlay (hidden by default)
        this.createWarningOverlay();

        // Inject CSS
        this.injectCSS();
    }

    createRiskIndicator() {
        if (document.getElementById('sentinelai-risk-indicator')) return;

        const indicator = document.createElement('div');
        indicator.id = 'sentinelai-risk-indicator';
        indicator.className = 'sentinelai-indicator';
        indicator.innerHTML = `
            <div class="sentinelai-icon">🛡️</div>
            <div class="sentinelai-score">--</div>
        `;

        indicator.addEventListener('click', () => this.showDetailedAnalysis());

        document.body.appendChild(indicator);
        this.uiElements.indicator = indicator;
    }

    createWarningOverlay() {
        if (document.getElementById('sentinelai-warning-overlay')) return;

        const overlay = document.createElement('div');
        overlay.id = 'sentinelai-warning-overlay';
        overlay.className = 'sentinelai-overlay';
        overlay.style.display = 'none';

        overlay.innerHTML = `
            <div class="sentinelai-warning-content">
                <div class="sentinelai-warning-header">
                    <div class="sentinelai-warning-icon">🚨</div>
                    <h2>Security Warning</h2>
                    <button class="sentinelai-close-btn" onclick="this.closest('.sentinelai-overlay').style.display='none'">×</button>
                </div>
                <div class="sentinelai-warning-body">
                    <p class="sentinelai-warning-message"></p>
                    <div class="sentinelai-threat-list"></div>
                </div>
                <div class="sentinelai-warning-footer">
                    <button class="sentinelai-btn sentinelai-btn-danger" onclick="window.history.back()">Go Back</button>
                    <button class="sentinelai-btn sentinelai-btn-secondary" onclick="this.closest('.sentinelai-overlay').style.display='none'">Continue Anyway</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
        this.uiElements.overlay = overlay;
    }

    injectCSS() {
        if (document.getElementById('sentinelai-styles')) return;

        const style = document.createElement('style');
        style.id = 'sentinelai-styles';
        style.textContent = `
            .sentinelai-indicator {
                position: fixed;
                top: 20px;
                right: 20px;
                width: 60px;
                height: 60px;
                background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
                border-radius: 50%;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                z-index: 10000;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                transition: all 0.3s ease;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }

            .sentinelai-indicator:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(0,0,0,0.2);
            }

            .sentinelai-indicator.warning {
                background: linear-gradient(135deg, #FF9800 0%, #F57F17 100%);
            }

            .sentinelai-indicator.danger {
                background: linear-gradient(135deg, #F44336 0%, #D32F2F 100%);
                animation: pulse-danger 2s infinite;
            }

            .sentinelai-indicator.scanning {
                animation: pulse-scan 1.5s infinite;
            }

            @keyframes pulse-danger {
                0%, 100% { box-shadow: 0 4px 12px rgba(244, 67, 54, 0.3); }
                50% { box-shadow: 0 4px 20px rgba(244, 67, 54, 0.6); }
            }

            @keyframes pulse-scan {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.7; }
            }

            .sentinelai-icon {
                font-size: 16px;
                margin-bottom: 2px;
            }

            .sentinelai-score {
                font-size: 10px;
                font-weight: bold;
                color: white;
            }

            .sentinelai-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                z-index: 10001;
                display: flex;
                align-items: center;
                justify-content: center;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }

            .sentinelai-warning-content {
                background: white;
                border-radius: 12px;
                max-width: 500px;
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            }

            .sentinelai-warning-header {
                display: flex;
                align-items: center;
                padding: 24px 24px 16px;
                border-bottom: 1px solid #eee;
                background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%);
            }

            .sentinelai-warning-icon {
                font-size: 24px;
                margin-right: 12px;
            }

            .sentinelai-warning-header h2 {
                flex: 1;
                margin: 0;
                font-size: 20px;
                font-weight: 600;
                color: #d32f2f;
            }

            .sentinelai-close-btn {
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
                color: #666;
                padding: 0;
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: background 0.2s;
            }

            .sentinelai-close-btn:hover {
                background: rgba(0,0,0,0.1);
            }

            .sentinelai-warning-body {
                padding: 24px;
            }

            .sentinelai-warning-message {
                font-size: 16px;
                line-height: 1.5;
                color: #333;
                margin: 0 0 16px;
            }

            .sentinelai-threat-list {
                background: #f5f5f5;
                border-radius: 8px;
                padding: 16px;
            }

            .sentinelai-threat-item {
                display: flex;
                align-items: flex-start;
                margin-bottom: 12px;
                padding: 12px;
                background: white;
                border-radius: 6px;
                border-left: 4px solid #f44336;
            }

            .sentinelai-threat-item:last-child {
                margin-bottom: 0;
            }

            .sentinelai-threat-icon {
                font-size: 16px;
                margin-right: 12px;
                margin-top: 2px;
            }

            .sentinelai-threat-details h4 {
                margin: 0 0 4px;
                font-size: 14px;
                font-weight: 600;
                color: #d32f2f;
            }

            .sentinelai-threat-details p {
                margin: 0;
                font-size: 13px;
                color: #666;
                line-height: 1.4;
            }

            .sentinelai-warning-footer {
                display: flex;
                gap: 12px;
                padding: 16px 24px 24px;
                justify-content: flex-end;
            }

            .sentinelai-btn {
                padding: 12px 24px;
                border: none;
                border-radius: 6px;
                font-weight: 600;
                font-size: 14px;
                cursor: pointer;
                transition: all 0.2s;
            }

            .sentinelai-btn-danger {
                background: #f44336;
                color: white;
            }

            .sentinelai-btn-danger:hover {
                background: #d32f2f;
            }

            .sentinelai-btn-secondary {
                background: transparent;
                color: #666;
                border: 1px solid #ddd;
            }

            .sentinelai-btn-secondary:hover {
                background: #f5f5f5;
            }

            .sentinelai-inline-warning {
                background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
                border: 1px solid #ffc107;
                border-radius: 8px;
                padding: 12px 16px;
                margin: 16px 0;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }

            .sentinelai-inline-warning-header {
                display: flex;
                align-items: center;
                margin-bottom: 8px;
            }

            .sentinelai-inline-warning-icon {
                font-size: 16px;
                margin-right: 8px;
            }

            .sentinelai-inline-warning-title {
                font-weight: 600;
                color: #856404;
                margin: 0;
            }

            .sentinelai-inline-warning-message {
                font-size: 14px;
                color: #856404;
                margin: 0;
                line-height: 1.4;
            }
        `;

        document.head.appendChild(style);
    }

    async loadSettings() {
        try {
            const result = await chrome.storage.local.get(['settings']);
            if (result.settings) {
                this.settings = { ...this.settings, ...result.settings };
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
        }
    }

    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };

        if (newSettings.realTimeProtection !== undefined) {
            if (newSettings.realTimeProtection && !this.observer) {
                this.startMonitoring();
            } else if (!newSettings.realTimeProtection && this.observer) {
                this.stopMonitoring();
            }
        }
    }

    startMonitoring() {
        if (this.observer) return;

        // Monitor DOM changes
        this.observer = new MutationObserver((mutations) => {
            const shouldScan = mutations.some(mutation => {
                return mutation.type === 'childList' && 
                       mutation.addedNodes.length > 0 &&
                       Array.from(mutation.addedNodes).some(node => 
                           node.nodeType === Node.ELEMENT_NODE &&
                           (node.tagName === 'FORM' || 
                            node.querySelector && 
                            node.querySelector('form, a[href], input[type="password"]'))
                       );
            });

            if (shouldScan) {
                this.debouncedScan();
            }
        });

        this.observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        console.log('👁️ Real-time monitoring started');
    }

    stopMonitoring() {
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
            console.log('👁️ Real-time monitoring stopped');
        }
    }

    debouncedScan = utils.debounce(() => {
        if (!this.isScanning && this.settings.realTimeProtection) {
            this.performQuickScan();
        }
    }, 2000);

    scheduleInitialScan() {
        // Wait a bit for page to fully load
        setTimeout(() => {
            this.performQuickScan();
        }, 3000);
    }

    async performQuickScan() {
        if (this.isScanning) return null;

        try {
            this.isScanning = true;
            this.setIndicatorScanning(true);

            const contentData = this.extractPageData();

            // Send to background for analysis
            const response = await chrome.runtime.sendMessage({
                action: 'analyzeContent',
                data: contentData
            });

            if (response.success) {
                this.currentAnalysis = response.result;
                this.updateUI(response.result);
                this.lastScanTime = Date.now();

                return response.result;
            } else {
                console.error('Analysis failed:', response.error);
                return null;
            }

        } catch (error) {
            console.error('Scan failed:', error);
            return null;
        } finally {
            this.isScanning = false;
            this.setIndicatorScanning(false);
        }
    }

    async performFullScan() {
        return await this.performQuickScan();
    }

    async performBackgroundAnalysis() {
        // Silent analysis for background tab monitoring
        const result = await this.performQuickScan();

        if (result && result.riskScore > 70) {
            // High risk detected in background - could trigger notification
            chrome.runtime.sendMessage({
                action: 'reportThreat',
                data: {
                    url: window.location.href,
                    title: document.title,
                    analysis: result,
                    context: 'background_scan'
                }
            });
        }

        return result;
    }

    async getPageAnalysis() {
        // Return current analysis or perform new scan
        if (this.currentAnalysis && (Date.now() - this.lastScanTime) < 30000) {
            return this.currentAnalysis;
        }

        return await this.performQuickScan();
    }

    extractPageData() {
        return {
            url: window.location.href,
            title: document.title,
            text: this.extractVisibleText(),
            links: this.extractLinks(),
            forms: this.extractForms(),
            images: this.extractImages(),
            metadata: this.extractMetadata()
        };
    }

    extractVisibleText() {
        // Get all visible text content
        const textElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, div, td, th, li, a');
        let text = '';

        textElements.forEach(element => {
            const style = window.getComputedStyle(element);
            if (style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0') {
                const elementText = element.textContent || element.innerText;
                if (elementText && elementText.trim()) {
                    text += elementText.trim() + ' ';
                }
            }
        });

        return text.trim();
    }

    extractLinks() {
        return Array.from(document.querySelectorAll('a[href]')).map(link => ({
            href: link.href,
            text: link.textContent.trim(),
            target: link.target || '_self'
        }));
    }

    extractForms() {
        return Array.from(document.querySelectorAll('form')).map(form => ({
            action: form.action || window.location.href,
            method: form.method || 'GET',
            inputs: Array.from(form.querySelectorAll('input')).map(input => ({
                type: input.type,
                name: input.name,
                required: input.required,
                placeholder: input.placeholder
            }))
        }));
    }

    extractImages() {
        return Array.from(document.querySelectorAll('img')).map(img => ({
            src: img.src,
            alt: img.alt,
            width: img.naturalWidth || img.width,
            height: img.naturalHeight || img.height
        }));
    }

    extractMetadata() {
        const meta = {};

        // Extract meta tags
        document.querySelectorAll('meta').forEach(tag => {
            const name = tag.getAttribute('name') || tag.getAttribute('property');
            const content = tag.getAttribute('content');
            if (name && content) {
                meta[name] = content;
            }
        });

        return {
            title: document.title,
            meta: meta,
            domain: window.location.hostname,
            protocol: window.location.protocol,
            timestamp: new Date().toISOString()
        };
    }

    updateUI(analysis) {
        this.updateRiskIndicator(analysis.riskScore);

        if (analysis.riskScore > 70) {
            this.showWarningOverlay(analysis);
        } else if (analysis.riskScore > 30) {
            this.showInlineWarning(analysis);
        }
    }

    updateRiskIndicator(riskScore) {
        const indicator = this.uiElements.indicator;
        const scoreElement = indicator.querySelector('.sentinelai-score');

        if (!indicator || !scoreElement) return;

        // Update score
        scoreElement.textContent = Math.round(riskScore);

        // Update styling
        indicator.className = 'sentinelai-indicator';

        if (riskScore < 30) {
            // Safe - green (default)
        } else if (riskScore < 70) {
            indicator.classList.add('warning');
        } else {
            indicator.classList.add('danger');
        }
    }

    setIndicatorScanning(isScanning) {
        const indicator = this.uiElements.indicator;
        if (!indicator) return;

        if (isScanning) {
            indicator.classList.add('scanning');
        } else {
            indicator.classList.remove('scanning');
        }
    }

    showWarningOverlay(analysis) {
        const overlay = this.uiElements.overlay;
        if (!overlay) return;

        const messageEl = overlay.querySelector('.sentinelai-warning-message');
        const threatListEl = overlay.querySelector('.sentinelai-threat-list');

        messageEl.textContent = `This page has been flagged as potentially dangerous (Risk Score: ${Math.round(analysis.riskScore)}/100). Multiple security threats have been detected.`;

        // Display threats
        threatListEl.innerHTML = '';
        analysis.threats.forEach(threat => {
            const threatEl = document.createElement('div');
            threatEl.className = 'sentinelai-threat-item';

            threatEl.innerHTML = `
                <div class="sentinelai-threat-icon">⚠️</div>
                <div class="sentinelai-threat-details">
                    <h4>${threat.type.replace(/_/g, ' ').toUpperCase()}</h4>
                    <p>${threat.description}</p>
                </div>
            `;

            threatListEl.appendChild(threatEl);
        });

        overlay.style.display = 'flex';
    }

    showInlineWarning(analysis) {
        // Remove existing inline warnings
        document.querySelectorAll('.sentinelai-inline-warning').forEach(el => el.remove());

        // Find a good place to insert warning (after first paragraph or at top of body)
        let insertTarget = document.querySelector('p, h1, h2, .content, main, article');
        if (!insertTarget) {
            insertTarget = document.body.firstElementChild;
        }

        if (!insertTarget) return;

        const warning = document.createElement('div');
        warning.className = 'sentinelai-inline-warning';

        warning.innerHTML = `
            <div class="sentinelai-inline-warning-header">
                <span class="sentinelai-inline-warning-icon">⚠️</span>
                <h4 class="sentinelai-inline-warning-title">Security Advisory</h4>
            </div>
            <p class="sentinelai-inline-warning-message">
                This page contains potentially suspicious content (Risk Score: ${Math.round(analysis.riskScore)}/100). 
                Please verify the authenticity before sharing personal information or clicking links.
            </p>
        `;

        insertTarget.parentNode.insertBefore(warning, insertTarget);
    }

    showDetailedAnalysis() {
        if (!this.currentAnalysis) {
            // Trigger scan if no current analysis
            this.performQuickScan().then(() => {
                if (this.currentAnalysis) {
                    this.displayAnalysisDetails();
                }
            });
        } else {
            this.displayAnalysisDetails();
        }
    }

    displayAnalysisDetails() {
        // This could open the extension popup or show an inline details view
        chrome.runtime.sendMessage({
            action: 'showAnalysisDetails',
            analysis: this.currentAnalysis
        });
    }
}

// Initialize content script when page loads
if (typeof window !== 'undefined' && window.location) {
    console.log('🛡️ SentinelAI Content Script Loading...');
    new SentinelAIContentScript();
}