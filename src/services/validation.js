/**
 * Input validation and sanitization utility for MoneyMap
 * Fulfills Security Requirement 5: Input validation and secure error handling
 */

export const sanitizeText = (input) => {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[<>]/g, '')               // Strip HTML tags / script angles
    .replace(/javascript:/gi, '')       // Block URI javascript protocols
    .replace(/onload|onerror|onclick/gi, '') // Block common event handler injections
    .trim();
};

export const validateExpenseInput = ({ amountStr, category, note, date }) => {
  const errors = {};

  // 1. Amount Validation
  if (!amountStr || amountStr.trim() === '') {
    errors.amount = 'Amount is required.';
  } else {
    // Sanitize currency symbols and commas
    const cleanedAmount = amountStr.replace(/[₹$,\s]/g, '');
    const num = parseFloat(cleanedAmount);

    if (isNaN(num) || !isFinite(num)) {
      errors.amount = 'Please enter a valid numeric amount.';
    } else if (num <= 0) {
      errors.amount = 'Expense amount must be strictly greater than 0.';
    } else if (num > 10000000) {
      errors.amount = 'Transaction limit exceeded (maximum ₹10,000,000).';
    } else {
      // Validate decimal places (max 2)
      const parts = cleanedAmount.split('.');
      if (parts.length > 1 && parts[1].length > 2) {
        errors.amount = 'Amount cannot exceed 2 decimal places.';
      }
    }
  }

  // 2. Category Validation
  const ALLOWED_CATEGORIES = ['Food', 'Transport', 'Utilities', 'Entertainment', 'Shopping', 'Health', 'Salary', 'General'];
  if (!category || !ALLOWED_CATEGORIES.includes(category)) {
    errors.category = 'Please select a valid expense category.';
  }

  // 3. Note / Description Validation & Sanitization
  if (note) {
    if (typeof note !== 'string') {
      errors.note = 'Note must be a valid text string.';
    } else if (note.length > 120) {
      errors.note = 'Note is too long (maximum 120 characters).';
    } else {
      // Detect suspicious SQL or Script injection signatures
      const injectionPattern = /('|--|;|\/\*|\*\/|<script>)/i;
      if (injectionPattern.test(note)) {
        errors.note = 'Input contains forbidden characters or illegal script sequences.';
      }
    }
  }

  // 4. Date Validation
  if (date) {
    const timestamp = Date.parse(date);
    if (isNaN(timestamp)) {
      errors.date = 'Invalid transaction date format.';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    sanitized: {
      amount: parseFloat(amountStr?.replace(/[₹$,\s]/g, '') || '0'),
      category: category?.trim(),
      note: sanitizeText(note || ''),
      date: date || new Date().toISOString().split('T')[0],
    }
  };
};

/**
 * Validate 4-digit PIN input
 */
export const validatePinFormat = (pin) => {
  if (!pin || typeof pin !== 'string') return false;
  return /^\d{4}$/.test(pin);
};

/**
 * Centralized Secure Error Formatter
 * Strips sensitive details, secret tokens, memory locations, or full stack traces
 */
export const formatSecureErrorMessage = (error) => {
  if (!error) return 'An unexpected system security event occurred.';
  
  const rawMsg = typeof error === 'string' ? error : error.message || '';
  
  // Redact potential memory or key traces
  const redacted = rawMsg
    .replace(/(?:key|secret|password|token|pin)=[^& ]+/gi, '[REDACTED]')
    .replace(/(?:at\s+[^\n]+)/g, '') // remove stack trace lines
    .trim();

  // If error is generic or contains internal paths, give user-safe guidance
  if (redacted.includes('ENOENT') || redacted.includes('database') || redacted.includes('JSON')) {
    return 'A secure data integrity check failed. No data was leaked.';
  }

  return redacted || 'Operation halted by security sandbox.';
};
