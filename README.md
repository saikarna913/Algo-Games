Copy this and paste directly into your **README.md**:

---

# 🚀 Alg Games — Setup Guide

## 📦 Prerequisites

Before running the project, make sure you have:

* **Node.js** (LTS version recommended)
* **npm** (comes with Node.js)
* **Expo Go app** installed on your mobile device
* **Expo CLI** installed
* An **Expo account** → [https://expo.dev/signup](https://expo.dev/signup)

Install Expo CLI (if not installed):

```bash
npm install -g expo-cli
```

---

## 📥 Installation

### 1. Clone the repository

```bash
git clone <repo-url>
```

---

### 2. Navigate to project directory

```bash
cd Alg-games
```

---

### 3. Install dependencies

```bash
npm install
```

---

## ▶️ Running the Application

### 1. Login to Expo

You must login both on your computer and mobile.

#### Login on your computer (Mac / Terminal)

```bash
npx expo login
```

Enter your Expo account credentials.

#### Login on your mobile

* Install **Expo Go** from Play Store or App Store
* Sign up or log in to your Expo account

---

### 2. Start the development server

```bash
npm start
```

This will start the Expo server and display a **QR code** in the terminal.

---

### 3. Run the app on your phone

* Open **Expo Go** app
* Tap **Scan QR Code**
* Scan the QR code shown in the terminal

The app will load automatically.

---

## 🛠 Troubleshooting

### Reset Expo login

```bash
npx expo logout
npx expo login
```

### Clear cache if app fails to load

```bash
npx expo start --clear
```

### Important

* Ensure your computer and phone are connected to the same WiFi network.

---

