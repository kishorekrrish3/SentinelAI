# 🔒 SentinelAI – AI-Powered Social Engineering & Phishing Detection

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Build](https://img.shields.io/badge/build-passing-brightgreen.svg)
![Hackathon](https://img.shields.io/badge/DataQuest%202.0-Project-orange.svg)

> **SentinelAI** is a state-of-the-art **AI-powered security platform and browser extension** designed to detect and prevent **phishing, spam, and social engineering attacks** in real time. It combines advanced **multi-modal AI**, **adaptive learning**, and **educational feedback** to safeguard users across the web.

---

## 📑 Table of Contents

1. [Introduction](#-introduction)
2. [Features](#-features)
3. [Architecture](#-architecture)
4. [Tech Stack](#-tech-stack)
5. [Installation & Setup](#-installation--setup)

   * [Website](#website)
   * [Browser Extension](#browser-extension)
6. [Usage](#-usage)
7. [Project Structure](#-project-structure)
8. [Contributing](#-contributing)
9. [License](#-license)

---

## 📌 Introduction

Social engineering attacks such as **phishing, pre-texting, and business email compromise (BEC)** remain the **#1 cause of global data breaches**. With modern attackers leveraging **AI to generate sophisticated scams**, traditional filters often fail.

**SentinelAI’s mission** is simple:
➡️ Adapt to AI-powered phishing & scams by **fighting them back with AI**.

It delivers:

* **Real-time risk scoring** with confidence levels.
* **Multi-modal threat detection** across text, images, links, and forms.
* **Adaptive learning** to stay ahead of emerging attack vectors.
* **Educational feedback** to strengthen user security awareness.
* **Enterprise integrations** with policy enforcement & compliance reporting.

---

## ⚡ Features

✅ **AI-Driven Detection** – NLP for phishing cues, URL/domain spoofing detection, metadata checks.
✅ **Image Recognition** – Spoofed logo & deceptive image detection (prepared for TF.js integration).
✅ **Risk Scoring Engine** – Calculates risk & confidence scores with category breakdowns.
✅ **Federated Learning** – Privacy-preserving adaptive updates via anonymized insights.
✅ **Predictive GAN Simulations** – Simulates synthetic phishing attacks to stress-test defenses.
✅ **Interactive Dashboards** – Real-time risk scores, alerts, and detailed threat breakdowns.
✅ **User Education** – Gamified modules & feedback for awareness training.
✅ **Enterprise-Ready** – APIs, SSO support, security policies, and compliance reporting.
✅ **Full Website** – Explore docs, dashboards, and installation guides with a modern UI.

---

## 🏗 Architecture

SentinelAI combines **browser extension logic** with a **React-based website**:

* **Browser Extension (Core)**

  * Content Scripts & Service Worker (Manifest V3).
  * AI Engine for text, link, form, and image analysis.
  * Federated Learning Simulation (JSON-based patterns + local aggregation).
  * Chrome APIs for tabs, runtime, storage, notifications.

* **Website**

  * Frontend dashboards for threat visualization.
  * Documentation & user guides.
  * Enterprise modules with integration options.

* **AI Engine (Shared Core)**

  * NLP for phishing phrases, urgency cues, authority patterns.
  * Domain & URL heuristics (spoof detection, TLD checks, IP URLs).
  * Suspicious form and link detection.
  * Confidence-weighted scoring with adaptive model updates.

---

## 🛠 Tech Stack

### 🌐 Website

* [Vite](https://vitejs.dev/) – Lightning-fast build tool.
* [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/).
* [shadcn-ui](https://ui.shadcn.com/) – Component library.
* [Tailwind CSS](https://tailwindcss.com/) – Utility-first CSS.

### 🧩 Browser Extension

* **JavaScript (ES6+)** – Core logic, content/background scripts.
* **Chrome Extension Manifest V3** – Secure extension framework.
* **Chrome APIs** – Tabs, messaging, storage, scripting, notifications.
* **Custom AI Logic** – Heuristic NLP + threat database in JSON.
* **Federated Learning Simulation** – Privacy-preserving model adaptation.
* **Image Analysis (placeholder)** – Future integration with TensorFlow\.js.

---

## 🚀 Installation & Setup

### Website

1. Clone the repo:

   ```bash
   git clone <YOUR_GIT_URL>
   cd <YOUR_PROJECT_NAME>
   ```
2. Install dependencies:

   ```bash
   npm i
   ```
3. Run dev server:

   ```bash
   npm run dev
   ```
4. Open your browser at `http://localhost:5173` (default Vite port).

### Browser Extension

1. Navigate to `chrome://extensions/`.
2. Enable **Developer Mode**.
3. Click **Load unpacked** and select the `extension` folder.
4. The extension is now installed and ready for testing.

---

## 📂 Project Structure

```
SentinelAI/
│── extension/                # Chrome Extension (Manifest V3)
│ ├── background/             # Background Service Worker and scripts
│ │ └── service-worker.js     # Background script handling messages and scanning
│ ├── content/                # Content Scripts injected into web pages
│ │ └── content.js            # Monitors page data and communicates with background
│ ├── popup/                  # Extension popup UI files
│ │ ├── popup.html            # Popup interface HTML
│ │ ├── popup.css             # Popup styling
│ │ └── popup.js              # Popup frontend logic and event handling
│ ├── lib/                    # Core Libraries and AI engine
│ │ ├── ai-engine.js          # AI threat detection engine and scoring logic
│ │ └── utils.js              # Utility helper functions
│ ├── assets/                 # Static assets and JSON models
│ │ ├── icons/                # Extension icon images
│ │ │ ├── icon16.png
│ │ │ ├── icon48.png
│ │ │ └── icon128.png
│ │ ├── models/               # AI models and threat data JSON files
│ │ │ ├── threat-patterns.json
│ │ │ ├── logo-database.json
│ │ │ └── blacklist.json
│ ├── styles/                 # CSS styles for content scripts and extension UI
│ │ └── content.css           # Styles injected with content scripts
│
│── website/                  # React + Vite Frontend
│ ├── src/                    # React source files
│ ├── components/             # Reusable UI components
│ ├── pages/                  # Page routing
│ ├── public/                 # Static assets
│ └── tailwind.config.js      # Tailwind config
│
└── README.md # Documentation
```

---

## 🎯 Usage

* Install the **extension** → browse any website → receive **risk scores, warnings, and details** in real time.
* Open the **SentinelAI dashboard (website)** → view detections, explore “How It Works”, or read enterprise integration docs.
* Enable **educational mode** → learn through gamified modules & phishing simulations.

---

## 🤝 Contributing

We welcome contributions! 🚀

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature-name`).
3. Commit your changes (`git commit -m "Added feature X"`).
4. Push and open a PR.

Please check issues and follow our coding style guidelines before contributing.

---

## 📜 License

This project is licensed under the **MIT License** – see the [LICENSE](LICENSE) file for details.

---
