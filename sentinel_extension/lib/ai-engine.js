// SentinelAI Engine - Complete with Blacklist and Whitelist Checks and Detailed Debug Logging

class SentinelAIEngine {
  constructor() {
    this.threatDatabase = null;
    this.blacklist = new Set();
    this.whitelist = new Set([
      'google.com',
      'flipkart.com',
      'amazon.in',
      'amazon.com',
      'youtube.com',
      'meta.com',
      'github.com'
    ]);
    this.initialized = false;

    this.minThreatsForMediumRisk = 2;
    this.minThreatsForHighRisk = 3;

    this.phishingIndicators = [
      'login', 'signin', 'account', 'verify', 'update',
      'security', 'password', 'confirm', 'urgent', 'alert',
      'suspend', 'limited time', 'win', 'prize', 'offer',
      'congratulations', 'invoice', 'payment', 'transfer',
      'wire', 'ceo request', 'request payment'
    ];

    // Initialize asynchronously
    this.initialize();
  }

  async initialize() {
    try {
      await this.loadThreatDatabase();
      await this.loadBlacklist();

      this.initialized = true;
      console.log('✅ SentinelAI Engine initialized');
    } catch (error) {
      console.error('Failed to initialize AI engine:', error);
    }
  }

  async loadThreatDatabase() {
    try {
      const response = await fetch(chrome.runtime.getURL('assets/models/threat-patterns.json'));
      this.threatDatabase = await response.json();
      console.log('Threat database loaded');
    } catch (error) {
      console.error('Failed to load threat patterns:', error);
      this.threatDatabase = { patterns: {}, categories: {} };
    }
  }

  async loadBlacklist() {
    try {
      const response = await fetch(chrome.runtime.getURL('assets/models/blacklist.json'));
      const data = await response.json();
      this.blacklist = new Set();

      data.domains.forEach(domain => {
        const normalized = domain.toLowerCase().replace(/^www\./, '');
        this.blacklist.add(normalized);
      });

      console.log(`[Blacklist] Loaded ${this.blacklist.size} domains.`);
    } catch (error) {
      console.warn('[Blacklist] Failed to load blacklist:', error);
      this.blacklist = new Set();
    }
  }

  extractDomain(url) {
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname.toLowerCase().replace(/^www\./, '');
      return domain;
    } catch {
      return '';
    }
  }

  async analyzeContent(data) {
    if (!this.initialized) await this.initialize();

    if (!data || !data.url) {
      console.warn('[analyzeContent] Missing URL');
      return this.emptyResult();
    }

    const domain = this.extractDomain(data.url);

    console.log(`[analyzeContent] Analyzing URL: ${data.url}`);
    console.log(`[analyzeContent] Extracted domain: ${domain}`);
    console.log(`[analyzeContent] Blacklist size: ${this.blacklist.size}`);
    console.log(`[analyzeContent] Is blacklisted domain: ${this.blacklist.has(domain)}`);

    if (this.blacklist.has(domain)) {
      console.warn(`[analyzeContent] BLACKLIST HIT: ${domain}, assigning max risk`);
      return this.highRiskResult(domain);
    }

    if (this.whitelist.has(domain)) {
      console.log(`[analyzeContent] Domain "${domain}" is whitelisted.`);
      return this.analyzeForWhitelistDomain(data);
    }

    return this.fullScan(data);
  }

  async analyzeForWhitelistDomain(data) {
    let riskScore = 0;
    const detectedThreats = [];
    let triggerCount = 0;

    const text = (data.text || '').toLowerCase();
    const phishingHits = this.phishingIndicators.filter(word => text.includes(word));

    if (phishingHits.length > 0) {
      triggerCount += 1;
      riskScore += 10 * phishingHits.length;
      detectedThreats.push({
        type: 'whitelist_phrases',
        description: `Phishing-like words on whitelist site: ${phishingHits.join(', ')}`
      });
    }

    if (data.forms && data.forms.length > 0) {
      const insecureForms = data.forms.filter(form => {
        const fdomain = this.extractDomain(form.action);
        return fdomain !== this.extractDomain(data.url) || !form.action.startsWith('https://');
      });

      if (insecureForms.length > 0) {
        triggerCount += 1;
        riskScore += 20 * insecureForms.length;
        detectedThreats.push({
          type: 'whitelist_insecure_forms',
          description: `${insecureForms.length} insecure form(s) on whitelist site`
        });
      }
    }

    if (data.links && data.links.length > 0) {
      const suspiciousLinks = data.links.filter(link => {
        const ldomain = this.extractDomain(link.href);
        return ldomain && ldomain !== this.extractDomain(data.url) && !this.whitelist.has(ldomain);
      });

      if (suspiciousLinks.length > 5) {
        triggerCount += 1;
        riskScore += 10 * suspiciousLinks.length;
        detectedThreats.push({
          type: 'whitelist_suspicious_links',
          description: `Multiple external suspicious links (${suspiciousLinks.length}) on whitelist site`
        });
      }
    }

    if (triggerCount >= this.minThreatsForMediumRisk) {
      riskScore = Math.min(riskScore, 50);
    } else {
      riskScore = Math.min(riskScore, 20);
    }

    return {
      riskScore,
      threats: detectedThreats,
      confidence: 70,
      timestamp: new Date().toISOString()
    };
  }

  highRiskResult(domain) {
    return {
      riskScore: 100,
      threats: [{ type: 'blacklisted_domain', description: `Domain ${domain} is known phishing/malicious.` }],
      confidence: 100,
      timestamp: new Date().toISOString()
    };
  }

  async fullScan(data) {
    let riskScore = 0;
    const detectedThreats = [];

    if (data.text) {
      const textResults = this.analyzeTextContent(data.text);
      riskScore += textResults.score;
      detectedThreats.push(...textResults.threats);
    }

    const domain = this.extractDomain(data.url);
    if (domain) {
      const domainResults = this.analyzeDomain(domain);
      riskScore += domainResults.score;
      detectedThreats.push(...domainResults.threats);
    }

    if (data.forms && data.forms.length > 0) {
      const formResults = this.analyzeForms(data.forms, domain);
      riskScore += formResults.score;
      detectedThreats.push(...formResults.threats);
    }

    if (data.links && data.links.length > 0) {
      const linkResults = this.analyzeLinks(data.links, domain);
      riskScore += linkResults.score;
      detectedThreats.push(...linkResults.threats);
    }

    if (data.images && data.images.length > 0) {
      const imageResults = this.analyzeImages(data.images);
      riskScore += imageResults.score;
      detectedThreats.push(...imageResults.threats);
    }

    const distinctThreatTypes = new Set(detectedThreats.map(t => t.type));

    if (riskScore > 50 && distinctThreatTypes.size < this.minThreatsForHighRisk) {
      riskScore = 40 + (riskScore - 50) * 0.5;
    }

    riskScore = Math.min(riskScore, 100);

    return {
      riskScore,
      threats: detectedThreats,
      confidence: 75,
      timestamp: new Date().toISOString()
    };
  }

  analyzeTextContent(text) {
    const scorePerIndicator = 15;
    const threats = [];
    const lowerText = text.toLowerCase();
    let score = 0;

    const indicators = [
      { keyword: 'urgent', desc: 'Use of urgency to pressure user' },
      { keyword: 'verify your account', desc: 'Account verification prompt' },
      { keyword: 'suspend', desc: 'Account suspension claim' },
      { keyword: 'wire transfer', desc: 'Financial request' },
      { keyword: 'ceo request', desc: 'Authority impersonation' },
      { keyword: 'password', desc: 'Credential stealer' },
      { keyword: 'limited time offer', desc: 'Limited time threat' }
    ];

    indicators.forEach(ind => {
      if(lowerText.includes(ind.keyword)){
        score += scorePerIndicator;
        threats.push({
          type: this.keywordToThreatType(ind.keyword),
          description: ind.desc
        });
      }
    });

    return { score, threats };
  }

  keywordToThreatType(keyword) {
    switch (keyword) {
      case 'ceo request': return 'authority_impersonation';
      case 'wire transfer': return 'financial_fraud';
      case 'password': return 'credential_harvesting';
      case 'urgent': return 'urgency';
      default: return 'suspicious_phrase';
    }
  }

  analyzeDomain(domain) {
    let score = 0;
    const threats = [];

    if (domain.length > 40) {
      score += 10;
      threats.push({ type: 'long_domain', description: 'Domain name unusually long' });
    }

    const suspiciousTLDs = ['.tk', '.ml', '.cf', '.ga'];
    if (suspiciousTLDs.some(tld => domain.endsWith(tld))) {
      score += 20;
      threats.push({ type: 'suspicious_tld', description: 'Suspicious top-level domain' });
    }

    if (/[0-9]{3,}/.test(domain)) {
      score += 10;
      threats.push({ type: 'numeric_domain', description: 'Unusual numeral pattern in domain' });
    }

    return { score, threats };
  }

  analyzeForms(forms, pageDomain) {
    let score = 0;
    const threats = [];

    forms.forEach(form => {
      try {
        const formDomain = this.extractDomain(form.action);
        if (formDomain !== pageDomain || !form.action.startsWith('https://')) {
          score += 30;
          threats.push({ type: 'suspicious_form', description: 'Form submits externally or insecurely' });
        }

        const sensitiveInputs = form.inputs.filter(i =>
          ['password', 'email', 'creditcard', 'ssn'].includes(i.type.toLowerCase()) ||
          (i.name && /(password|email|creditcard|ssn|cvv|pin)/i.test(i.name))
        );

        if (sensitiveInputs.length > 0) {
          score += sensitiveInputs.length * 15;
          threats.push({ type: 'credential_harvesting', description: `${sensitiveInputs.length} sensitive form fields` });
        }
      } catch {}
    });

    return { score, threats };
  }

  analyzeLinks(links, pageDomain) {
    let score = 0;
    const threats = [];

    const externalLinks = links.filter(link => {
      const domain = this.extractDomain(link.href);
      return domain && domain !== pageDomain;
    });

    if (externalLinks.length > 5) {
      score += externalLinks.length * 5;
      threats.push({ type: 'suspicious_links', description: `${externalLinks.length} external links detected` });
    }

    return { score, threats };
  }

  analyzeImages(images) {
    let score = 0;
    const threats = [];

    // Placeholder - can be extended with real CV detection

    return { score, threats };
  }

  emptyResult() {
    return {
      riskScore: 0,
      threats: [],
      confidence: 100,
      timestamp: new Date().toISOString()
    };
  }
}

export default SentinelAIEngine;
