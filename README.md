# MoneyMap - Secure Personal Finance and Expense Tracker 🛡️💳

MoneyMap is a cybersecurity-focused mobile personal finance application built with **React Native & Expo**, designed following a modern dark cyber/fintech UI matching the Figma specifications.

---

## 🔒 Security Architecture & Features

This application implements the 5 core security requirements:

### 1. PIN Protection
* **Vault PIN Entry**: Locks user data behind a secure 4-digit PIN lock screen (`PinLockScreen`).
* **Cryptographic PIN Storage**: The PIN is hashed using **SHA-256** combined with a cryptographic salt. Plaintext PINs are never saved to disk.
* **Brute-Force Attack Mitigation**: The app limits failed unlock attempts. After 5 consecutive wrong PIN attempts, a 30-second timed security lockout is enforced.
* **PIN Management**: Users can update their PIN securely under **Vault Security** settings.
* **Default Demo PIN**: `1234`

### 2. Encryption of Sensitive Financial Data
* **AES-256 Storage Encryption**: All user financial records (transactions, balances, budgets, notes) are encrypted using **AES-256** before being written to persistent storage (`AsyncStorage`).
* **In-Memory Decryption**: Data is decrypted solely in memory when the vault is unlocked, and cleared upon session timeout.
* **Ciphertext Inspector**: Under **Vault Security > View Encrypted Storage**, evaluators can view the live raw AES-256 ciphertext directly from storage to confirm that zero unencrypted financial data touches the persistent disk.

### 3. HTTPS/TLS Enforcement & Secure Transport
* **Strict HTTPS Only**: The networking layer (`SecureNetworkClient`) strictly rejects unencrypted `http://` URLs and enforces TLS/HTTPS.
* **Security Headers**: Transports use secure headers (`X-Content-Type-Options: nosniff`, `Cache-Control: no-store`, `X-Security-Client`).
* **Live TLS Handshake Test**: Under **Vault Security > TLS/HTTPS Cloud Sync**, users can perform a live TLS test demonstrating authentic TLS 1.3 handshakes, certificate chain verification, and encrypted transmission metrics.

### 4. Automatic Session Timeout
* **Inactivity Timer**: Tracks user interaction. If inactive for the configured timeout (30 seconds, 1 minute, 2 minutes, or 5 minutes), the vault automatically locks and returns to the PIN screen.
* **Live Countdown Display**: The top bar of the Dashboard displays a live countdown timer showing remaining session seconds, resetting on any user touch.
* **AppState Background Auto-Lock**: When the app is minimized, moved to the background, or task-switched, the vault locks immediately to prevent shoulder surfers and screen preview leaks.

### 5. Input Validation & Secure Error Handling
* **Strict Amount Validation**: Validates that amounts are strictly positive numbers, maximum 2 decimal places, and within reasonable transaction thresholds; prevents `NaN`, negative inputs, and scientific notation abuse.
* **Sanitization against Injections**: Expense notes and inputs are sanitized to strip HTML angle brackets, script payloads (`<script>`, event handlers), and SQL injection patterns.
* **Secure Error Formatting**: Stack traces, database keys, and sensitive tokens are masked and redacted using `formatSecureErrorMessage` before reaching the user UI.

---

## 📱 Screens Overview (Matching Figma Design)

1. **`pin-lock`**: Vault authentication keypad with glowing cyan shield, status indicators, and attempt tracking. Default demo PIN: `1234`.
2. **`dashboard`**: Total Vault Reserve card, monthly limit vs total spent, quick action cards, live auto-lock countdown, and recent transactions. Starts with zero defaults.
3. **`add-expense`**: Fast expense recording with category selectors (Food, Transport, Utilities, Entertainment, Shopping, Health), sanitized note input, and instant AES-256 encryption.
4. **`budget-overview` (Budget Center)**: User-modifiable monthly budget limit, SVG circular spending gauge, and dynamic budget limit alert when spending reaches the target threshold.
5. **`financial-reports` (Analytics)**: Dynamic monthly spending chart, live average daily spending calculation, and real-time category breakdown based purely on user expenses.
6. **`security-settings` (Vault Security)**: Encryption status badge, change PIN modal, auto-lock timeout selector, TLS 1.3 handshake test, ciphertext storage inspector, and 1-tap "Reset Vault to Zero" button.

---

## 🚀 How to Run on iOS (via Expo Go)

### Prerequisites:
1. An iPhone with **Expo Go** installed from the [App Store](https://apps.apple.com/app/expo-go/id982107779).
2. Computer and iPhone connected to the same Wi-Fi network (or use Tunnel mode).

### Step 1: Open the Terminal in the project folder
```bash
cd "moneymap"
```

### Step 2: Start the Expo Development Server
```bash
npx expo start
```
*(If on different Wi-Fi networks or encountering firewall restrictions, run `npx expo start --tunnel`)*

### Step 3: Open on iPhone
1. Open the **Camera app** on your iPhone.
2. Point your camera at the QR code shown in the terminal.
3. Tap the yellow **"Open in Expo Go"** banner that appears.
4. MoneyMap will load immediately!

---

## 🧪 Evaluator / Demo Checklist

| Security Feature | How to Demo in App |
| :--- | :--- |
| **PIN Protection** | Enter `1234` to unlock. Try entering wrong PINs (e.g. `9999`) to observe failed attempt counter and 30s lockout after 5 tries. |
| **Data Encryption** | Go to **Security tab > View Encrypted Storage** to inspect the real raw AES-256 ciphertext stored on device. |
| **HTTPS/TLS** | Go to **Security tab > TLS/HTTPS Cloud Sync** and tap **Test TLS 1.3** to verify secure HTTPS handshake metrics. |
| **Session Timeout** | Notice the countdown timer in the top right of Dashboard (`60s`). Wait 1 minute without touching to see it auto-lock. Minimize the app and return to see instant background auto-lock. |
| **Input Validation** | Go to **Add Expense** and try submitting negative numbers, letters, or `<script>` tags to observe real-time validation and sanitization. |
