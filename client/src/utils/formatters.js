/**
 * Formatting utilities for Admin Frontend
 */

/**
 * Strips all non-numeric characters except for decimal points
 * and prevents negative signs.
 */
export const cleanAmount = (val, allowNegative = false) => {
  if (!val && val !== 0) return "";
  const str = val.toString();
  // If we allow negative, keep the first '-' if it's at the start
  if (allowNegative) {
    const isNegative = str.startsWith("-");
    const cleaned = str.replace(/[^-0-9.]/g, "");
    // Ensure '-' only at the start
    const result = (isNegative ? "-" : "") + cleaned.replace(/-/g, "");
    return result;
  }
  // Original logic: remove all non-numeric and leading '-'
  return str.replace(/[^-0-9.]/g, "").replace(/-/g, "");
};

/**
 * Formats a number with thousand separators.
 * Safely handles strings and numbers.
 */
export const formatCurrency = (num, allowNegative = false) => {
  if (num === null || num === undefined || num === '') return "";
  const cleaned = cleanAmount(num, allowNegative);
  if (cleaned === "-") return "-";
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
