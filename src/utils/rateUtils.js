import { RateSchedule } from '../services/RateSchedule';
import { StaffService } from '../services/StaffService';

/**
 * Get the hourly rate for a user based on their labor category
 * @param {Object} userDetails - User details object with email and labor_category
 * @returns {Promise<number>} - The hourly rate for the user
 */
export async function getUserRate(userDetails) {
  try {
    let laborCategory = userDetails?.labor_category;
    
    // If labor category is not in userDetails, try to get it from StaffService
    if (!laborCategory && userDetails?.email) {
      try {
        const staffData = await StaffService.loadStaffData();
        const staffMember = StaffService.getUserByEmail(staffData, userDetails.email);
        laborCategory = staffMember?.laborCategory;
      } catch (error) {
        console.warn('Failed to get labor category from StaffService:', error);
      }
    }
    
    if (!laborCategory) {
      console.warn('No labor category found for user, using default rate');
      return 0; // Return 0 if no labor category found
    }
    
    // Get rate from RateSchedule
    const rate = RateSchedule[laborCategory.toUpperCase()] || RateSchedule[laborCategory];
    
    if (rate === undefined) {
      console.warn(`No rate found for labor category: ${laborCategory}`);
      return 0;
    }
    
    return rate;
  } catch (error) {
    console.error('Error getting user rate:', error);
    return 0;
  }
}

/**
 * Calculate projected fee based on total hours and user's rate
 * @param {number} totalHours - Sum of month + month1 + month2
 * @param {number} rate - Hourly rate
 * @returns {number} - Calculated projected fee
 */
export function calculateProjectedFee(totalHours, rate) {
  if (!totalHours || !rate) {
    return 0;
  }
  return totalHours * rate;
}

/**
 * Format currency for display
 * @param {number} amount - Amount to format
 * @returns {string} - Formatted currency string
 */
export function formatCurrency(amount) {
  const numAmount = parseFloat(amount) || 0;
  // If the amount is less than 0.50, display as $0 to avoid rounding to $1
  if (numAmount < 0.50) {
    return '$0';
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numAmount);
}
