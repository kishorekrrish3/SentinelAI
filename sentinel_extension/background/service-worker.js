// SentinelAI Background Service Worker
class SentinelAIBackground {
    constructor() {
        this.modelCache = new Map();
        this.threatDatabase = null;
        this.userSettings = {
            realTimeProtection: true,
            notificationsEnabled: true,
            sensitivityLevel: 'medium'
        };

        this.initializeBackground();
        this.setupEventListeners();
    }

    async initializeBackground() {
        try {
            console.log('🛡️ SentinelAI Background Service Worker Starting...');

            // Load threat patterns and models
            await this.loadThreatDatabase();
            await this.loadUserSettings();

            // Set up periodic tasks
            this.setupPeriodicTasks();

            console.log('✅ SentinelAI Background Service Worker Ready');

        } catch (error) {
            console.error('❌ Failed to initialize SentinelAI background:', error);
        }
    }

    setupEventListeners() {
        // Handle messages from content scripts and popup
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            this.handleMessage(request, sender, sendResponse);
            return true; // Keep message channel open for async response
        });

        // Handle extension installation/startup
        chrome.runtime.onInstalled.addListener((details) => {
            this.handleInstallation(details);
        });

        // Handle tab updates for real-time protection
        chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
            if (changeInfo.status === 'complete' && this.userSettings.realTimeProtection) {
                this.scheduleTabAnalysis(tabId, tab);
            }
        });

        // Handle alarms for periodic tasks
        chrome.alarms.onAlarm.addListener((alarm) => {
            this.handleAlarm(alarm);
        });
    }

    async handleMessage(request, sender, sendResponse) {
        try {
            console.log('📨 Received message:', request.action);

            switch (request.action) {
                case 'analyzeContent':
                    const analysisResult = await this.analyzeContent(request.data);
                    sendResponse({ success: true, result: analysisResult });
                    break;

                case 'reportThreat':
                    await this.reportThreat(request.data, sender.tab);
                    sendResponse({ success: true });
                    break;

                case 'updateSettings':
                    await this.updateSettings(request.settings);
                    sendResponse({ success: true });
                    break;

                case 'getFeedback':
                    const feedback = await this.getUserFeedback();
                    sendResponse({ success: true, feedback });
                    break;

                case 'getStats':
                    const stats = await this.getStats();
                    sendResponse({ success: true, stats });
                    break;

                default:
                    sendResponse({ success: false, error: 'Unknown action' });
            }

        } catch (error) {
            console.error('❌ Message handling error:', error);
            sendResponse({ success: false, error: error.message });
        }
    }

    async analyzeContent(contentData) {
        try {
            console.log('🔍 Analyzing content for threats...');

            const analysis = {
                riskScore: 0,
                threats: [],
                recommendations: [],
                analysisDetails: {}
            };

            // Text analysis
            if (contentData.text) {
                const textAnalysis = await this.analyzeText(contentData.text);
                analysis.analysisDetails.text = textAnalysis;
                analysis.riskScore += textAnalysis.riskScore * 0.4; // 40% weight
            }

            // URL analysis
            if (contentData.url) {
                const urlAnalysis = await this.analyzeURL(contentData.url);
                analysis.analysisDetails.url = urlAnalysis;
                analysis.riskScore += urlAnalysis.riskScore * 0.3; // 30% weight
            }

            // Link analysis
            if (contentData.links && contentData.links.length > 0) {
                const linkAnalysis = await this.analyzeLinks(contentData.links);
                analysis.analysisDetails.links = linkAnalysis;
                analysis.riskScore += linkAnalysis.riskScore * 0.2; // 20% weight
            }

            // Form analysis
            if (contentData.forms && contentData.forms.length > 0) {
                const formAnalysis = await this.analyzeForms(contentData.forms);
                analysis.analysisDetails.forms = formAnalysis;
                analysis.riskScore += formAnalysis.riskScore * 0.1; // 10% weight
            }

            // Cap risk score at 100
            analysis.riskScore = Math.min(analysis.riskScore, 100);

            // Compile threats based on analysis
            analysis.threats = this.compileThreats(analysis.analysisDetails);
            analysis.recommendations = this.generateRecommendations(analysis);

            // Apply sensitivity adjustment
            analysis.riskScore = this.applySensitivityAdjustment(analysis.riskScore);

            // Log and potentially notify
            if (analysis.riskScore > 70) {
                this.handleHighRiskDetection(analysis, contentData);
            }

            console.log(`✅ Analysis complete. Risk Score: ${Math.round(analysis.riskScore)}`);
            return analysis;

        } catch (error) {
            console.error('❌ Content analysis failed:', error);
            return {
                riskScore: 0,
                threats: [],
                recommendations: [],
                error: error.message
            };
        }
    }

    async analyzeText(text) {
        const analysis = {
            riskScore: 0,
            threats: [],
            patterns: {}
        };

        if (!text || text.trim().length === 0) {
            return analysis;
        }

        // Suspicious phrases detection
        const suspiciousPatterns = [
            { pattern: /urgent.{0,20}action.{0,20}required/gi, score: 25, type: 'urgency' },
            { pattern: /verify.{0,20}account.{0,20}immediately/gi, score: 30, type: 'verification_scam' },
            { pattern: /suspended.{0,20}account/gi, score: 25, type: 'account_threat' },
            { pattern: /click.{0,10}here.{0,10}now/gi, score: 20, type: 'urgency' },
            { pattern: /congratulations.{0,20}winner/gi, score: 35, type: 'prize_scam' },
            { pattern: /limited.{0,10}time.{0,10}offer/gi, score: 15, type: 'urgency' },
            { pattern: /ceo|cfo|president.{0,50}urgent/gi, score: 40, type: 'authority_impersonation' },
            { pattern: /wire.{0,20}transfer.{0,20}urgent/gi, score: 45, type: 'financial_fraud' },
            { pattern: /update.{0,20}payment.{0,20}information/gi, score: 30, type: 'credential_harvesting' }
        ];

        suspiciousPatterns.forEach(({ pattern, score, type }) => {
            const matches = text.match(pattern);
            if (matches) {
                analysis.riskScore += score * matches.length;
                analysis.threats.push({
                    type: type,
                    pattern: pattern.source,
                    matches: matches.length,
                    score: score * matches.length
                });
                analysis.patterns[type] = (analysis.patterns[type] || 0) + matches.length;
            }
        });

        // Grammar and spelling analysis (basic)
        const grammarIssues = this.detectGrammarIssues(text);
        if (grammarIssues.length > 0) {
            analysis.riskScore += grammarIssues.length * 5;
            analysis.threats.push({
                type: 'grammar_anomalies',
                issues: grammarIssues,
                score: grammarIssues.length * 5
            });
        }

        // Excessive urgency indicators
        const urgencyCount = (text.match(/!/g) || []).length;
        if (urgencyCount > text.length / 50) { // More than 1 exclamation per 50 chars
            analysis.riskScore += 15;
            analysis.threats.push({
                type: 'excessive_urgency',
                count: urgencyCount,
                score: 15
            });
        }

        return analysis;
    }

    async analyzeURL(url) {
        const analysis = {
            riskScore: 0,
            threats: [],
            domain: null,
            protocol: null
        };

        try {
            const urlObj = new URL(url);
            analysis.domain = urlObj.hostname;
            analysis.protocol = urlObj.protocol;

            // Check for suspicious URL patterns
            const suspiciousUrlPatterns = [
                // Subdomain spoofing
                { pattern: /paypal-[a-z0-9]+\.com/i, score: 45, type: 'subdomain_spoofing' },
                { pattern: /amazon-[a-z0-9]+\.com/i, score: 45, type: 'subdomain_spoofing' },
                { pattern: /microsoft-[a-z0-9]+\.com/i, score: 45, type: 'subdomain_spoofing' },
                { pattern: /google-[a-z0-9]+\.com/i, score: 45, type: 'subdomain_spoofing' },

                // Character substitution
                { pattern: /payp[a@]l/i, score: 40, type: 'character_substitution' },
                { pattern: /g[o0][o0]gle/i, score: 40, type: 'character_substitution' },
                { pattern: /microso[f7]t/i, score: 40, type: 'character_substitution' },

                // Suspicious TLDs
                { pattern: /\.(tk|ml|ga|cf)$/i, score: 25, type: 'suspicious_tld' },

                // URL shorteners
                { pattern: /bit\.ly|tinyurl|t\.co|goo\.gl|ow\.ly/i, score: 15, type: 'url_shortener' },

                // IP addresses instead of domains
                { pattern: /https?:\/\/\d+\.\d+\.\d+\.\d+/i, score: 30, type: 'ip_address_url' }
            ];

            suspiciousUrlPatterns.forEach(({ pattern, score, type }) => {
                if (pattern.test(url)) {
                    analysis.riskScore += score;
                    analysis.threats.push({
                        type: type,
                        pattern: pattern.source,
                        score: score
                    });
                }
            });

            // Check domain length (very long domains are often suspicious)
            if (analysis.domain.length > 50) {
                analysis.riskScore += 20;
                analysis.threats.push({
                    type: 'long_domain',
                    length: analysis.domain.length,
                    score: 20
                });
            }

            // Check for HTTPS
            if (analysis.protocol !== 'https:') {
                analysis.riskScore += 10;
                analysis.threats.push({
                    type: 'insecure_protocol',
                    protocol: analysis.protocol,
                    score: 10
                });
            }

        } catch (error) {
            console.error('URL analysis failed:', error);
            analysis.threats.push({
                type: 'invalid_url',
                error: error.message,
                score: 5
            });
            analysis.riskScore += 5;
        }

        return analysis;
    }

    async analyzeLinks(links) {
        const analysis = {
            riskScore: 0,
            threats: [],
            suspiciousLinks: []
        };

        if (!links || links.length === 0) {
            return analysis;
        }

        for (const link of links) {
            try {
                const linkUrl = new URL(link.href);
                const linkText = link.text.toLowerCase();

                // Check for misleading link text
                if (linkText.includes('click here') || linkText.includes('download now')) {
                    analysis.riskScore += 10;
                    analysis.suspiciousLinks.push({
                        href: link.href,
                        text: link.text,
                        reason: 'Generic call-to-action'
                    });
                }

                // Check for external links that claim to be internal
                if (linkText.includes('account') || linkText.includes('settings')) {
                    const currentDomain = new URL(chrome.runtime.getURL('/')).hostname;
                    if (linkUrl.hostname !== currentDomain) {
                        analysis.riskScore += 20;
                        analysis.suspiciousLinks.push({
                            href: link.href,
                            text: link.text,
                            reason: 'External link claiming to be internal'
                        });
                    }
                }

                // Check for shortened URLs
                if (/bit\.ly|tinyurl|t\.co|goo\.gl/.test(link.href)) {
                    analysis.riskScore += 15;
                    analysis.suspiciousLinks.push({
                        href: link.href,
                        text: link.text,
                        reason: 'Shortened URL'
                    });
                }

            } catch (error) {
                // Invalid URL
                analysis.riskScore += 5;
                analysis.suspiciousLinks.push({
                    href: link.href,
                    text: link.text,
                    reason: 'Invalid URL format'
                });
            }
        }

        if (analysis.suspiciousLinks.length > 0) {
            analysis.threats.push({
                type: 'suspicious_links',
                count: analysis.suspiciousLinks.length,
                links: analysis.suspiciousLinks,
                score: analysis.riskScore
            });
        }

        return analysis;
    }

    async analyzeForms(forms) {
        const analysis = {
            riskScore: 0,
            threats: [],
            suspiciousForms: []
        };

        if (!forms || forms.length === 0) {
            return analysis;
        }

        forms.forEach(form => {
            let formRisk = 0;
            const issues = [];

            // Check for password fields without HTTPS
            const hasPasswordField = form.inputs.some(input => input.type === 'password');
            if (hasPasswordField && !form.action.startsWith('https://')) {
                formRisk += 30;
                issues.push('Password field on insecure connection');
            }

            // Check for forms requesting sensitive information
            const sensitiveFields = form.inputs.filter(input => 
                ['password', 'email', 'tel', 'ssn', 'creditcard'].includes(input.type) ||
                ['ssn', 'social', 'credit', 'card', 'cvv', 'pin'].some(keyword => 
                    (input.name || '').toLowerCase().includes(keyword)
                )
            );

            if (sensitiveFields.length > 0) {
                formRisk += sensitiveFields.length * 15;
                issues.push(`Requesting ${sensitiveFields.length} sensitive field(s)`);
            }

            // Check for external form submission
            try {
                const formUrl = new URL(form.action);
                const currentUrl = new URL(location.href);

                if (formUrl.hostname !== currentUrl.hostname) {
                    formRisk += 25;
                    issues.push('Form submits to external domain');
                }
            } catch (error) {
                // Invalid form action URL
                formRisk += 10;
                issues.push('Invalid form action URL');
            }

            if (formRisk > 0) {
                analysis.riskScore += formRisk;
                analysis.suspiciousForms.push({
                    action: form.action,
                    method: form.method,
                    riskScore: formRisk,
                    issues: issues
                });
            }
        });

        if (analysis.suspiciousForms.length > 0) {
            analysis.threats.push({
                type: 'suspicious_forms',
                count: analysis.suspiciousForms.length,
                forms: analysis.suspiciousForms,
                score: analysis.riskScore
            });
        }

        return analysis;
    }

    detectGrammarIssues(text) {
        const issues = [];

        // Common grammar mistakes in phishing emails
        const grammarPatterns = [
            /\byou'?re\s+account\b/gi,  // "you're account" instead of "your account"
            /\bits\s+important/gi,       // "its important" instead of "it's important"
            /\brecieve\b/gi,             // "recieve" instead of "receive"
            /\boccured\b/gi,             // "occured" instead of "occurred"
            /\bseperate\b/gi,            // "seperate" instead of "separate"
            /\bdefinately\b/gi,          // "definately" instead of "definitely"
            /\btommorow\b/gi,            // "tommorow" instead of "tomorrow"
        ];

        grammarPatterns.forEach(pattern => {
            const matches = text.match(pattern);
            if (matches) {
                issues.push(...matches);
            }
        });

        return issues;
    }

    compileThreats(analysisDetails) {
        const threats = [];

        Object.values(analysisDetails).forEach(analysis => {
            if (analysis.threats) {
                threats.push(...analysis.threats.map(threat => ({
                    type: threat.type,
                    description: this.getThreatDescription(threat.type),
                    severity: this.getThreatSeverity(threat.score),
                    score: threat.score
                })));
            }
        });

        // Remove duplicates and sort by severity
        const uniqueThreats = threats.filter((threat, index, array) => 
            array.findIndex(t => t.type === threat.type) === index
        );

        return uniqueThreats.sort((a, b) => b.score - a.score);
    }

    getR

    generateRecommendations(analysis) {
        const recommendations = [];

        if (analysis.riskScore > 70) {
            recommendations.push('🚨 HIGH RISK: Do not interact with this content');
            recommendations.push('🔒 Verify sender through alternative communication method');
            recommendations.push('📞 Contact organization directly using official contact information');
        } else if (analysis.riskScore > 30) {
            recommendations.push('⚠️ CAUTION: Verify content authenticity before taking action');
            recommendations.push('🔍 Look for spelling and grammar errors');
            recommendations.push('🌐 Check URL carefully for suspicious elements');
        } else {
            recommendations.push('✅ Content appears safe, but stay vigilant');
            recommendations.push('🛡️ Continue practicing safe browsing habits');
        }

        // Add specific recommendations based on detected threats
        analysis.threats.forEach(threat => {
            switch (threat.type) {
                case 'authority_impersonation':
                    recommendations.push('👤 Verify executive requests through official channels');
                    break;
                case 'financial_fraud':
                    recommendations.push('💰 Never make financial transactions based on email requests');
                    break;
                case 'credential_harvesting':
                    recommendations.push('🔐 Do not enter login credentials from email links');
                    break;
                case 'suspicious_links':
                    recommendations.push('🔗 Hover over links to see destination before clicking');
                    break;
            }
        });

        return [...new Set(recommendations)]; // Remove duplicates
    }

    applySensitivityAdjustment(baseScore) {
        const multipliers = {
            'low': 0.8,
            'medium': 1.0,
            'high': 1.2
        };

        const multiplier = multipliers[this.userSettings.sensitivityLevel] || 1.0;
        return Math.min(baseScore * multiplier, 100);
    }

    async handleHighRiskDetection(analysis, contentData) {
        // Show notification if enabled
        if (this.userSettings.notificationsEnabled) {
            chrome.notifications.create({
                type: 'basic',
                iconUrl: 'assets/icons/warning.png',
                title: '🛡️ SentinelAI Security Alert',
                message: `High-risk content detected (${Math.round(analysis.riskScore)}/100). Exercise extreme caution.`,
                buttons: [
                    { title: 'View Details' },
                    { title: 'Report False Positive' }
                ]
            });
        }

        // Log the incident
        await this.logSecurityIncident(analysis, contentData);
    }

    async logSecurityIncident(analysis, contentData) {
        try {
            const incident = {
                timestamp: new Date().toISOString(),
                url: contentData.url,
                title: contentData.title,
                riskScore: analysis.riskScore,
                threats: analysis.threats,
                userAgent: navigator.userAgent
            };

            const result = await chrome.storage.local.get(['securityIncidents']);
            const incidents = result.securityIncidents || [];

            incidents.push(incident);

            // Keep only last 100 incidents
            if (incidents.length > 100) {
                incidents.splice(0, incidents.length - 100);
            }

            await chrome.storage.local.set({ securityIncidents: incidents });

        } catch (error) {
            console.error('Failed to log security incident:', error);
        }
    }

    setupPeriodicTasks() {
        // Update threat database daily
        chrome.alarms.create('updateThreatDatabase', {
            delayInMinutes: 1440, // 24 hours
            periodInMinutes: 1440
        });

        // Clean old data weekly
        chrome.alarms.create('cleanOldData', {
            delayInMinutes: 10080, // 7 days
            periodInMinutes: 10080
        });
    }

    async handleAlarm(alarm) {
        switch (alarm.name) {
            case 'updateThreatDatabase':
                await this.updateThreatDatabase();
                break;
            case 'cleanOldData':
                await this.cleanOldData();
                break;
        }
    }

    async loadThreatDatabase() {
        try {
            // Load from local storage first
            const result = await chrome.storage.local.get(['threatDatabase']);

            if (result.threatDatabase) {
                this.threatDatabase = result.threatDatabase;
                console.log('📚 Threat database loaded from storage');
            } else {
                // Load default threat patterns
                const response = await fetch(chrome.runtime.getURL('assets/models/threat-patterns.json'));
                this.threatDatabase = await response.json();

                // Save to storage
                await chrome.storage.local.set({ threatDatabase: this.threatDatabase });
                console.log('📚 Default threat database loaded');
            }

        } catch (error) {
            console.error('Failed to load threat database:', error);
            this.threatDatabase = { patterns: [], version: '1.0.0' };
        }
    }

    async loadUserSettings() {
        try {
            const result = await chrome.storage.local.get(['settings']);

            if (result.settings) {
                this.userSettings = { ...this.userSettings, ...result.settings };
                console.log('⚙️ User settings loaded');
            }

        } catch (error) {
            console.error('Failed to load user settings:', error);
        }
    }

    async updateSettings(newSettings) {
        this.userSettings = { ...this.userSettings, ...newSettings };

        try {
            await chrome.storage.local.set({ settings: this.userSettings });
            console.log('⚙️ Settings updated');
        } catch (error) {
            console.error('Failed to save settings:', error);
        }
    }

    scheduleTabAnalysis(tabId, tab) {
        // Guard against missing tab or url
        if (!tab || !tab.url || typeof tab.url !== 'string') {
            console.warn('scheduleTabAnalysis skipped due to invalid tab or URL', tab);
            return;
        }

        // Skip analysis for internal pages and extensions
        if (tab.url.startsWith('chrome://') ||
            tab.url.startsWith('chrome-extension://') ||
            tab.url.startsWith('moz-extension://')) {
            return;
        }

        // Debounced analysis to avoid excessive processing
        setTimeout(() => {
            chrome.tabs.sendMessage(tabId, {
            action: 'performBackgroundAnalysis'
            }).catch(() => {
            // Content script not ready yet, ignore
            });
        }, 2000);
        }


    async handleInstallation(details) {
        if (details.reason === 'install') {
            console.log('🎉 SentinelAI installed for the first time');

            // Set up initial data
            await this.initializeUserData();

            // Show welcome notification
            chrome.notifications.create({
                type: 'basic',
                iconUrl: 'assets/icons/icon48.png',
                title: '🛡️ SentinelAI Activated',
                message: 'Your browser is now protected against social engineering attacks!'
            });

            // Open welcome page
            chrome.tabs.create({
                url: chrome.runtime.getURL('popup/popup.html')
            });

        } else if (details.reason === 'update') {
            console.log('🔄 SentinelAI updated to version', chrome.runtime.getManifest().version);
            await this.handleUpdate(details);
        }
    }

    async initializeUserData() {
        const initialData = {
            stats: {
                threatsBlocked: 0,
                pagesScanned: 0,
                riskReduction: 0
            },
            settings: this.userSettings,
            installDate: new Date().toISOString(),
            recentActivity: [],
            securityIncidents: [],
            userFeedback: []
        };

        try {
            await chrome.storage.local.set(initialData);
            console.log('✅ Initial user data set up');
        } catch (error) {
            console.error('Failed to initialize user data:', error);
        }
    }

    async handleUpdate(details) {
        // Handle extension updates
        console.log(`Updating from ${details.previousVersion} to ${chrome.runtime.getManifest().version}`);

        // Migrate data if needed
        // ... migration logic would go here
    }

    async cleanOldData() {
        try {
            const result = await chrome.storage.local.get([
                'recentActivity', 'securityIncidents', 'userFeedback'
            ]);

            const now = new Date();
            const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));

            // Clean old activity (keep last 30 days)
            if (result.recentActivity) {
                const recentActivity = result.recentActivity.filter(activity => 
                    new Date(activity.timestamp) > thirtyDaysAgo
                );
                await chrome.storage.local.set({ recentActivity });
            }

            // Clean old incidents (keep last 30 days)
            if (result.securityIncidents) {
                const securityIncidents = result.securityIncidents.filter(incident => 
                    new Date(incident.timestamp) > thirtyDaysAgo
                );
                await chrome.storage.local.set({ securityIncidents });
            }

            console.log('🧹 Old data cleaned up');

        } catch (error) {
            console.error('Failed to clean old data:', error);
        }
    }

    getThreatDescription(threatType) {
        const descriptions = {
            'urgency': 'Excessive urgency tactics to pressure quick action',
            'verification_scam': 'Fake account verification request',
            'account_threat': 'False claims about account suspension or issues',
            'prize_scam': 'Fake prize or lottery winning notification',
            'authority_impersonation': 'Impersonation of authority figures or executives',
            'financial_fraud': 'Request for financial transactions or wire transfers',
            'credential_harvesting': 'Attempt to steal login credentials',
            'subdomain_spoofing': 'Use of deceptive subdomains to mimic legitimate sites',
            'character_substitution': 'Character substitution to mimic legitimate domains',
            'suspicious_tld': 'Use of suspicious top-level domains',
            'url_shortener': 'Use of URL shortening services to hide destination',
            'ip_address_url': 'Direct IP address instead of domain name',
            'suspicious_links': 'Links with misleading or suspicious characteristics',
            'suspicious_forms': 'Forms requesting sensitive information unsecurely',
            'grammar_anomalies': 'Unusual grammar or spelling errors',
            'excessive_urgency': 'Excessive use of urgency indicators'
        };

        return descriptions[threatType] || 'Unknown threat pattern detected';
    }

    getThreatSeverity(score) {
        if (score >= 40) return 'High';
        if (score >= 20) return 'Medium';
        return 'Low';
    }
}

// Initialize the background service worker
console.log('🚀 SentinelAI Background Service Worker Loading...');
new SentinelAIBackground();