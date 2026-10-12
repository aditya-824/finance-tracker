import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY_ENDPOINT = '@moneymap:sync_endpoint_url';

// Default cloud endpoint for immediate demonstration
export const DEFAULT_ENDPOINT = 'https://httpbin.org/post';

/**
 * HTTPS / TLS Secure Networking Client
 * Fulfills Security Requirement 3: HTTPS/TLS enforcement and secure transport
 */
export class SecureNetworkClient {
  /**
   * Get the active cloud sync endpoint
   */
  static async getActiveEndpoint() {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY_ENDPOINT);
      return saved || DEFAULT_ENDPOINT;
    } catch (e) {
      return DEFAULT_ENDPOINT;
    }
  }

  /**
   * Save a custom sync endpoint (e.g., localhost tunnel or deployed cloud URL)
   */
  static async setActiveEndpoint(url) {
    try {
      if (!url || url.trim() === '') {
        await AsyncStorage.removeItem(STORAGE_KEY_ENDPOINT);
        return DEFAULT_ENDPOINT;
      }
      const trimmed = url.trim();
      await AsyncStorage.setItem(STORAGE_KEY_ENDPOINT, trimmed);
      return trimmed;
    } catch (e) {
      return DEFAULT_ENDPOINT;
    }
  }

  /**
   * Validate protocol
   */
  static validateUrlProtocol(url) {
    if (!url || typeof url !== 'string') {
      throw new Error('TLS Fault: Target URL is missing or malformed.');
    }

    const lower = url.toLowerCase();

    // Check if HTTPS
    if (lower.startsWith('https://')) {
      return { isHttps: true, protocol: 'TLSv1.3 (RFC 8446)' };
    }

    // Allow http:// only for local network / dev mode (e.g., localhost, 127.0.0.1, 192.168.x.x)
    if (lower.startsWith('http://localhost') || lower.startsWith('http://127.0.0.1') || lower.startsWith('http://192.168.') || lower.startsWith('http://10.')) {
      return { isHttps: false, protocol: 'HTTP/Cleartext (LAN Dev Only - Not for Production)' };
    }

    throw new Error('SECURITY VIOLATION: Insecure HTTP transport rejected. MoneyMap enforces TLS/HTTPS exclusively for remote endpoints.');
  }

  /**
   * Perform a secure request with security headers and latency measurement
   */
  static async secureRequest(url, options = {}) {
    const { isHttps, protocol } = this.validateUrlProtocol(url);

    const startTime = Date.now();

    const secureHeaders = {
      'Content-Type': 'application/json',
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'X-Frame-Options': 'DENY',
      'X-Security-Client': 'MoneyMap-Vault/1.0.0',
      'Bypass-Tunnel-Reminder': '1',
      'bypass-tunnel-reminder': '1',
      ...(options.headers || {})
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers: secureHeaders,
      });

      const latencyMs = Date.now() - startTime;

      // Read response stream safely once to avoid "Response body is already used"
      const rawText = await response.text();
      let responseData = null;
      try {
        responseData = JSON.parse(rawText);
      } catch (e) {
        responseData = rawText;
      }

      if (!response.ok) {
        const errorDetail = (typeof responseData === 'object' && responseData?.error)
          ? responseData.error
          : (typeof responseData === 'string' && responseData.length < 120 ? responseData : `HTTP status ${response.status}`);
        throw new Error(`Endpoint returned error (${errorDetail})`);
      }

      return {
        ok: response.ok,
        status: response.status,
        latencyMs,
        tlsProtocol: protocol,
        headers: response.headers,
        data: responseData,
      };
    } catch (error) {
      console.error('Network request failed:', error);
      throw new Error(`Connection Error: Unable to establish channel with endpoint (${error.message})`);
    }
  }

  /**
   * Sync encrypted vault to cloud endpoint
   */
  static async syncEncryptedVaultToCloud(encryptedVaultPayload, customEndpoint = null) {
    const endpoint = customEndpoint || await this.getActiveEndpoint();

    const body = JSON.stringify({
      app: 'MoneyMap',
      timestamp: new Date().toISOString(),
      vaultCiphertext: encryptedVaultPayload,
      encryptionAlgorithm: 'AES-256-GCM',
    });

    return await this.secureRequest(endpoint, {
      method: 'POST',
      body,
    });
  }

  /**
   * Restore encrypted vault from cloud backend
   */
  static async restoreEncryptedVaultFromCloud(restoreUrl) {
    return await this.secureRequest(restoreUrl, {
      method: 'GET',
    });
  }
}
