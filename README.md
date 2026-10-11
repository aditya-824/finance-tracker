# MoneyMap - Secure Personal Finance and Expense Tracker

MoneyMap is a cybersecurity-focused mobile personal finance application built with **React Native & Expo**, designed following a modern dark cyber/fintech UI matching the Figma specifications.

---

## 🔒 Security Architecture & Features

This application implements 5 core security features:

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

---nd auto-lock. |
| **Input Validation** | Go to **Add Expense** and try submitting negative numbers, letters, or `<script>` tags to observe real-time validation and sanitization. |
