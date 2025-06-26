// Test script to verify the WorkloadPreloadService
import { WorkloadPreloadService } from './WorkloadPreloadService.js';

async function testPreloadService() {
  const testEmail = 'jonathan.herrera@p2sinc.com';
  const year = 2025;
  const quarter = 'Q2';
  
  console.log('Testing WorkloadPreloadService...');
  console.log(`Email: ${testEmail}, Year: ${year}, Quarter: ${quarter}`);
  
  try {
    const result = await WorkloadPreloadService.preloadActiveProjects(testEmail, year, quarter);
    console.log('SUCCESS: Preload service returned data:', result);
  } catch (error) {
    console.error('ERROR: Preload service failed:', error);
  }
}

// Run the test
testPreloadService();
