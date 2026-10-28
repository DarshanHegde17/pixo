# 🎮 PIXO - Next-Gen Gaming Arena

A modern, dark gaming-style mobile & web application built with **React Native** and **Expo**, powered by cyber neon aesthetics.

---

## 🚀 Features

* **Gaming Aesthetic**: Deep dark theme (`#050705`), cyberpunk neon green (`#39FF14`) & electric orange (`#FF6A00`) glowing gradients, sleek glassmorphic containers.
* **Branding**: Centered **🎮 PIXO** emblem with Orbitron display typography, dynamic glow & system access indicators.
* **Interactive Form**:
  * Email input with icons and dynamic focus borders.
  * Password input with lock icon and interactive **Show/Hide password toggle**.
  * Dynamic validation errors (non-empty check, valid email format, min-length check).
  * **Login Button** with glowing gradient and loading state.
  * **Quick Demo Fill** button for 1-tap instant credential testing.
  * **Forgot Password?** and **Don't have an account? Register** action triggers.
* **Dummy Authentication**:
  * Instant client-side validation without requiring backend/database connection.
  * Animated **"Login Successful"** modal with welcome message and reset/logout flow.
* **Responsive Layout**: Wrapped in `SafeAreaProvider`, `KeyboardAvoidingView`, and `ScrollView` for seamless Android phone & emulator screen sizing.

---

## 📁 Project Structure

```
d:/demo/
├── assets/                  # App icon, splash screen, adaptive icon
├── src/
│   ├── components/
│   │   ├── CustomButton.js       # Neon gaming gradient action button
│   │   ├── CustomInput.js        # Input field with icons & eye toggle
│   │   ├── GlowingBackground.js  # Ambient gaming gradient & orbs
│   │   ├── LogoHeader.js         # 🎮 SoloPlay badge & headings
│   │   └── SuccessModal.js       # Login Successful celebration modal
│   ├── screens/
│   │   └── LoginScreen.js        # Main Login Screen logic & state
│   ├── theme/
│   │   ├── colors.js             # Theme tokens & neon color palette
│   │   ├── spacing.js            # Spacing & border radius constants
│   │   └── index.js
│   └── utils/
│       └── validation.js         # Email & password validation functions
├── App.js                   # Root component
├── index.js                 # Entry point
├── app.json                 # Expo project configuration
└── package.json             # Project dependencies & scripts
```

---

## 🛠️ How to Run the App

### 1. Install Dependencies
*(Already installed in this workspace, but for a fresh machine)*:
```bash
npm install
```

### 2. Run on Android Studio Emulator
1. Start your Android Emulator in **Android Studio** (Device Manager -> Run AVD).
2. Start the Expo development server:
```bash
npx expo start --android
```
*(Or simply `npm run android`)*

### 3. Alternative Ways to Run:

* **Expo Go (Physical Phone)**:
  ```bash
  npx expo start
  ```
  Scan the QR code using the **Expo Go** app on your Android phone.

* **Web Browser Preview**:
  ```bash
  npx expo start --web
  ```
