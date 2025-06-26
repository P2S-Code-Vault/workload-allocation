// Test file for WorkloadPreloadService
// This is for testing the new preload functionality

import { WorkloadPreloadService } from './WorkloadPreloadService';

async function testPreloadService() {
  try {
    console.log('Testing WorkloadPreloadService...');
    
    // Test with the example user from the curl request
    const testEmail = 'jonathan.herrera@p2sinc.com';
    const testYear = 2025;
    const testQuarter = 'Q2';
    
    console.log(`Testing preload for ${testEmail} in ${testQuarter} ${testYear}`);
    
    const result = await WorkloadPreloadService.preloadActiveProjects(testEmail, testYear, testQuarter);
    
    console.log('Preload test result:', result);
    console.log('Project rows count:', result.projectRows?.length || 0);
    console.log('Stats:', result.stats);
    
    return result;
  } catch (error) {
    console.error('Test failed:', error);
    throw error;
  }
}

// Export for use in development/testing
export { testPreloadService };
