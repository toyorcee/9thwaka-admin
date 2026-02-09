import { useState, useEffect, useRef } from 'react';

/**
 * Hook for handling number inputs without cursor jumping
 * Uses local state that only syncs with parent state on blur
 */
export const useNumberInput = (initialValue) => {
  const [localValue, setLocalValue] = useState(initialValue || '');
  const inputRef = useRef(null);

  useEffect(() => {
    setLocalValue(initialValue || '');
  }, [initialValue]);

  const handleChange = (e) => {
    setLocalValue(e.target.value);
  };

  const handleBlur = (onBlurCallback) => (e) => {
    if (onBlurCallback) {
      onBlurCallback(e.target.value);
    }
  };

  return {
    value: localValue,
    onChange: handleChange,
    onBlur: handleBlur,
    ref: inputRef,
  };
};

/**
 * Format number with thousand separators
 */
export const formatNumber = (num) => {
  if (!num && num !== 0) return '';
  return Number(num).toLocaleString();
};

/**
 * Parse formatted number string back to number
 */
export const parseNumber = (str) => {
  if (!str) return '';
  return str.replace(/,/g, '');
};
