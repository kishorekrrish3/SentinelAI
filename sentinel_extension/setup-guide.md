# SentinelAI Complete Setup Guide

This guide will walk you through setting up SentinelAI from scratch to a fully working browser extension.

## 📋 Prerequisites

### Required Software
- **Google Chrome** (version 88 or higher)
- **Text Editor** (VS Code, Sublime Text, or any editor)
- **Git** (optional, for version control)

### System Requirements
- **Operating System**: Windows 10+, macOS 10.14+, or Linux
- **RAM**: Minimum 4GB (8GB recommended)
- **Storage**: 50MB free space

## 🚀 Quick Start (5 Minutes)

### Step 1: Download the Extension
1. Download the `sentinelai-extension` folder to your computer
2. Extract if it's in a ZIP file
3. Note the location of the folder

### Step 2: Enable Chrome Developer Mode
1. Open Google Chrome
2. Navigate to `chrome://extensions/`
3. Toggle "Developer mode" ON (top right corner)
4. You should see additional buttons appear

### Step 3: Load the Extension
1. Click "Load unpacked" button
2. Navigate to and select the `sentinelai-extension` folder
3. Click "Open" or "Select Folder"
4. The extension should appear in your extensions list

### Step 4: Verify Installation
1. Look for the 🛡️ SentinelAI icon in your Chrome toolbar
2. Visit any website (e.g., https://example.com)
3. You should see a floating shield icon on the page
4. Click the extension icon to open the dashboard

**🎉 Congratulations! SentinelAI is now protecting your browser.**

## 🔧 Detailed Setup Instructions

### Chrome Extension Loading

#### Method 1: Load Unpacked (Recommended for Development)
```bash
# 1. Open Chrome
# 2. Go to chrome://extensions/
# 3. Enable Developer mode
# 4. Click "Load unpacked"
# 5. Select sentinelai-extension folder
```

#### Method 2: Pack as CRX (For Distribution)
```bash
# 1. In chrome://extensions/
# 2. Click "Pack extension"
# 3. Select sentinelai-extension folder as root
# 4. Leave private key field empty (first time)
# 5. Chrome will create .crx and .pem files
```

### Extension Permissions Setup

When you first load SentinelAI, Chrome will request these permissions:

1. **Read and change data on all websites**
   - Required for: Content analysis and threat detection
   - Usage: Analyzes page content for security threats

2. **Display notifications**
   - Required for: Security alerts
   - Usage: Shows warnings for high-risk content

3. **Store unlimited amount of client-side data**
   - Required for: Settings and statistics storage
   - Usage: Saves your preferences and protection history

**Click "Allow" for all permissions to enable full functionality.**

## 🎛️ Configuration Options

### Basic Settings (Popup Interface)
Access via extension icon → Settings section:

- **Real-time Protection**: `✓ Enabled` (recommended)
- **Security Notifications**: `✓ Enabled` (recommended)  
- **Sensitivity Level**: `Medium` (recommended)

### Advanced Configuration

#### Customizing Threat Patterns
Edit `assets/models/threat-patterns.json`:

```json
{
  "patterns": {
    "phishing_phrases": [
      {
        "pattern": "your custom phrase",
        "weight": 25,
        "category": "custom_category",
        "description": "Description of the threat"
      }
    ]
  }
}
```

#### Adding Custom Domains to Watch
Edit `assets/models/logo-database.json`:

```json
{
  "brands": [
    {
      "name": "YourCompany",
      "domains": ["yourcompany.com"],
      "similarity_threshold": 0.85,
      "common_spoofs": ["your-company", "yourcompany-secure"]
    }
  ]
}
```

## 🧪 Testing the Installation

### Functional Tests

#### Test 1: Basic Detection
1. Visit a test page with suspicious content
2. Look for risk indicator changes
3. Check dashboard for threat details

#### Test 2: Settings Persistence
1. Change sensitivity to "High"
2. Refresh browser
3. Verify setting is maintained

#### Test 3: Real-time Protection
1. Navigate between different websites
2. Observe risk score changes
3. Check activity log in dashboard

#### Test 4: Manual Scanning
1. Click "🔍 Scan Current Page"
2. Verify scanning animation
3. Check for analysis results

### Test URLs (Safe for Testing)
```
# Low risk sites:
https://google.com
https://github.com

# Medium risk simulation (add suspicious query parameters):
https://example.com?urgent=true&verify=account

# Create test HTML file with suspicious content:
<html><body><h1>URGENT: Verify your account immediately!</h1></body></html>
```

## 🐛 Troubleshooting

### Common Issues and Solutions

#### Issue: Extension Not Loading
**Symptoms**: Extension doesn't appear in chrome://extensions/
**Solutions**:
1. Ensure Developer mode is enabled
2. Check folder structure is correct
3. Verify manifest.json exists and is valid
4. Restart Chrome and try again

#### Issue: No Risk Indicator Visible
**Symptoms**: Shield icon doesn't appear on webpages
**Solutions**:
1. Check if content script loaded (F12 → Console)
2. Disable other extensions that might conflict
3. Refresh the webpage
4. Check if site is in extension's blocked list

#### Issue: Dashboard Won't Open
**Symptoms**: Clicking extension icon does nothing
**Solutions**:
1. Right-click extension icon → Inspect popup
2. Check for JavaScript errors in popup console
3. Verify popup.html file exists and is correct
4. Clear extension data and restart

#### Issue: High Resource Usage
**Symptoms**: Browser becomes slow after installing
**Solutions**:
1. Reduce sensitivity level to "Low"
2. Disable real-time protection temporarily
3. Clear old data: Extension popup → Settings
4. Close unused tabs to free memory

#### Issue: Notifications Not Showing
**Symptoms**: No security alerts appear
**Solutions**:
1. Check Chrome notification permissions
2. Enable notifications in extension settings
3. Verify notification permission in chrome://settings/content/notifications
4. Test with high-risk content

### Debug Mode

#### Enable Extended Logging
Add to `manifest.json`:
```json
{
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'"
  }
}
```

#### Console Commands for Testing
```javascript
// In browser console (F12):

// Force scan current page
chrome.runtime.sendMessage({action: 'forceScan'});

// Check extension storage
chrome.storage.local.get(null, console.log);

// Clear all extension data
chrome.storage.local.clear();

// Test threat detection
console.log(new SentinelAIEngine());
```

#### Service Worker Debugging
1. Go to `chrome://extensions/`
2. Find SentinelAI extension
3. Click "service worker" link
4. Check console for background errors

## 📊 Performance Optimization

### Recommended Settings by Device

#### High-End Devices (8GB+ RAM)
- Real-time Protection: ✓ Enabled
- Sensitivity Level: High
- All notifications: ✓ Enabled

#### Mid-Range Devices (4-8GB RAM)
- Real-time Protection: ✓ Enabled
- Sensitivity Level: Medium
- Critical notifications only

#### Low-End Devices (<4GB RAM)
- Real-time Protection: Manual only
- Sensitivity Level: Low
- Essential notifications only

### Memory Management
The extension automatically:
- Cleans old data after 30 days
- Limits activity history to 50 entries
- Compresses stored analysis results
- Uses efficient debouncing for scans

## 🔒 Security Considerations

### Data Privacy
- All analysis occurs locally on your device
- No personal data is transmitted externally
- Settings stored only in local browser storage
- Activity logs kept locally with automatic cleanup

### Network Security
- Extension makes no external network requests
- All threat patterns loaded from local files
- No telemetry or analytics collection
- Updates require manual installation

### Browser Isolation
- Runs in Chrome's sandboxed environment
- Cannot access other extensions' data
- Limited to declared permissions only
- Isolated from system-level access

## 📈 Usage Analytics (Local Only)

### Viewing Your Statistics
Access via extension popup → Statistics section:

- **Threats Blocked**: Number of high-risk pages detected
- **Pages Scanned**: Total pages analyzed
- **Risk Reduction**: Calculated protection percentage
- **Recent Activity**: Last 10 security events

### Exporting Data
```javascript
// Run in browser console to export your data:
chrome.storage.local.get(null, (data) => {
  const exportData = JSON.stringify(data, null, 2);
  console.log(exportData);
  // Copy from console to save
});
```

## 🔄 Updates and Maintenance

### Manual Updates
1. Download new version files
2. Replace old extension folder
3. Go to chrome://extensions/
4. Click reload (🔄) button for SentinelAI
5. Verify new version loaded

### Automatic Cleanup
The extension automatically:
- Removes data older than 30 days
- Optimizes storage weekly
- Updates threat patterns when available
- Maintains performance metrics

### Backup Settings
```javascript
// Backup your settings:
chrome.storage.local.get(['settings'], (result) => {
  console.log('Settings backup:', JSON.stringify(result.settings));
});

// Restore settings:
chrome.storage.local.set({
  settings: {/* your backup data */}
});
```

## 🆘 Getting Help

### Self-Diagnosis Checklist
- [ ] Chrome version 88+ installed
- [ ] Developer mode enabled
- [ ] Extension folder structure correct
- [ ] No JavaScript console errors
- [ ] Permissions granted
- [ ] Real-time protection enabled

### Log Collection
For support, collect these logs:
1. Extension console logs (service worker)
2. Content script logs (webpage F12)
3. Popup logs (right-click popup → inspect)
4. Extension settings export

### Reporting Issues
When reporting problems, include:
- Chrome version
- Operating system
- Extension version
- Steps to reproduce
- Console error messages
- Screenshots if applicable

## 🎓 Advanced Usage

### Custom Threat Detection
Create custom detection rules by modifying threat patterns:

```json
{
  "custom_patterns": [
    {
      "pattern": "your-company-name",
      "weight": 30,
      "category": "brand_impersonation",
      "description": "Potential impersonation of your company"
    }
  ]
}
```

### Enterprise Deployment
For organizational deployment:

1. **Centralized Configuration**:
   - Pre-configure settings in manifest
   - Deploy via Group Policy
   - Lock sensitive settings

2. **Custom Branding**:
   - Replace icons in assets/icons/
   - Modify popup branding
   - Add company-specific threat patterns

3. **Monitoring Integration**:
   - Extract logs programmatically
   - Integrate with SIEM systems
   - Generate security reports

---

## 🏆 Success Metrics

After successful setup, you should see:
- ✅ Extension loads without errors
- ✅ Risk indicator appears on all websites
- ✅ Dashboard opens and displays data
- ✅ Settings persist between sessions
- ✅ Notifications work for high-risk content
- ✅ Performance remains smooth

**🎉 You're now protected by SentinelAI!**

---

*For additional support, check the README.md file or create an issue on the project repository.*
