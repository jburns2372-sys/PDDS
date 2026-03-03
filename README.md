# PatriotLink | PDDS Official App

Dugong Dakilang Samahan. Isang App, Isang Layunin.

This is the official tactical platform for the members of the **Federalismo ng Dugong Dakilang Samahan (PDDS)**, designed for national mobilization, civic oversight, and transparent governance.

## 🛠️ Development & Environment Setup

### 1. Firebase Authentication
To authenticate your workstation with the PDDS Firebase project in a non-interactive environment, execute the following command:
```bash
firebase login --no-localhost
```
Follow the URL provided in the terminal to authorize your access.

### 2. Installation
Initialize the secure development environment:
```bash
npm install
```

### 3. Local Development
Start the application shell:
```bash
npm run dev
```

### 4. Genkit AI Strategy
To launch the Genkit developer interface for AI flow testing:
```bash
npm run genkit:dev
```

## 🚀 Tactical Deployment
This application utilizes Firebase App Hosting and specialized Cloud Functions.

- **Security Rules**: `firebase deploy --only firestore:rules`
- **Cloud Functions**: `firebase deploy --only functions`
- **Storage Rules**: `firebase deploy --only storage`

## 🛡️ Core Tactical Features
- **PatriotHub (The Balangay)**: Secure, jurisdictional strategy rooms for vetted patriots.
- **Bantay Bayan Digital**: GPS-verified civic reporting and accountability ledger.
- **Bayanihan Network**: 5km radius emergency response and SOS signaling.
- **PatriotPondo**: Real-time public financial transparency ledger.
- **Federalismo Academy**: Merit-based leadership training and certification.

---
**SECURITY NOTICE**: This platform handles sensitive jurisdictional data. Ensure all developer environments comply with the party's internal data privacy protocols and RA 10173.

Para sa Dugong Dakilang Samahan! 🇵🇭