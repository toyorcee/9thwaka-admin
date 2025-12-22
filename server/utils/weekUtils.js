/**
 * Get current week range (Sunday to Saturday)
 * @param {Date} date - Optional date to calculate week range for (defaults to today)
 * @returns {Object} Object with start and end dates of the week
 */
export function getWeekRange(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  const start = new Date(d.setDate(diff));
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  return { start, end };
}

/**
 * Get payment due date (Saturday 11:59 PM - end of the week)
 * @param {Date} weekEnd - End date of the week (Sunday 00:00:00)
 * @returns {Date} Payment due date (Saturday 23:59:59)
 */
export function getPaymentDueDate(weekEnd) {
  const dueDate = new Date(weekEnd);
  // weekEnd is Sunday 00:00:00, so we subtract 1 day to get Saturday
  dueDate.setDate(dueDate.getDate() - 1); // Saturday
  dueDate.setHours(23, 59, 59, 999); // End of Saturday
  return dueDate;
}

/**
 * Get payment grace period deadline (Sunday 11:59 PM - 1 day allowance)
 * @param {Date} weekEnd - End date of the week (Sunday 00:00:00)
 * @returns {Date} Grace period deadline (Sunday 23:59:59)
 */
export function getPaymentGraceDeadline(weekEnd) {
  const graceDeadline = new Date(weekEnd);
  // weekEnd is Sunday 00:00:00, so set to end of Sunday
  graceDeadline.setHours(23, 59, 59, 999); // End of Sunday
  return graceDeadline;
}

