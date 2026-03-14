/**
 * Formatting utilities for Admin Frontend
 */

/**
 * Strips all non-numeric characters except for decimal points
 * and prevents negative signs.
 */
export const cleanAmount = (val) => {
  if (!val && val !== 0) return "";
  // Allow only digits and a single decimal point, remove everything else (including negative -)
  return val.toString().replace(/[^-0-9.]/g, "").replace(/^-/, "");
};

/**
 * Formats a number with thousand separators.
 * Safely handles strings and numbers.
 */
export const formatCurrency = (num) => {
  if (num === null || num === undefined || num === '') return "";
  const cleaned = cleanAmount(num);
  const parts = cleaned.split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
};

/**
 * Normalizer for non-negative inputs.
 * Strips any negative sign from the value.
 */
export const preventNegative = (val) => {
  if (!val && val !== 0) return val;
  const filtered = val.toString().replace(/-/g, "");
  return filtered;
};

/**
 * Formats percentage values (ensures non-negative)
 */
export const formatPercent = (val) => {
  if (!val && val !== 0) return "";
  return preventNegative(val);
};
