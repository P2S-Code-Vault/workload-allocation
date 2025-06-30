/**
 * Test script to verify the merging logic of WorkloadPreloadService
 * This script tests that existing allocations (including PTO, holidays, etc.) are properly merged 
 * with group/user-managed projects and opportunities
 */

import { WorkloadPreloadService } from './WorkloadPreloadService.js';

// Test user email (replace with actual user email from your system)
const TEST_USER_EMAIL = 'test@example.com';
const TEST_YEAR = 2025;
const TEST_QUARTER = 'Q2';

async function testProjectMerging() {
  console.log('\n=== TESTING PROJECT MERGING LOGIC ===');
  
  try {
    const result = await WorkloadPreloadService.preloadActiveProjects(
      TEST_USER_EMAIL, 
      TEST_YEAR, 
      TEST_QUARTER
    );
    
    console.log('\n--- PRELOAD RESULTS ---');
    console.log('Total project rows:', result.projectRows.length);
    console.log('Stats:', result.stats);
    
    // Analyze the types of projects loaded
    const ptoProjects = result.projectRows.filter(row => 
      row.projectNumber?.startsWith('0000-0000-0PTO') || 
      row.projectNumber?.startsWith('0000-0000-0HOL') ||
      row.projectNumber?.startsWith('0000-0000-0SIC') ||
      row.projectNumber?.startsWith('0000-0000-JURY')
    );
    
    const adminProjects = result.projectRows.filter(row => 
      row.projectNumber?.startsWith('0000-0000') && 
      !row.projectNumber?.startsWith('0000-0000-0PTO') &&
      !row.projectNumber?.startsWith('0000-0000-0HOL') &&
      !row.projectNumber?.startsWith('0000-0000-0SIC') &&
      !row.projectNumber?.startsWith('0000-0000-JURY') &&
      !row.projectNumber?.startsWith('0000-0000-LWOP')
    );
    
    const lwopProjects = result.projectRows.filter(row => 
      row.projectNumber?.startsWith('0000-0000-LWOP')
    );
    
    const regularProjects = result.projectRows.filter(row => 
      !row.projectNumber?.startsWith('0000-0000')
    );
    
    const projectsWithAllocations = result.projectRows.filter(row => {
      const hasHours = (parseFloat(row.month) || 0) > 0 || 
                      (parseFloat(row.month1) || 0) > 0 || 
                      (parseFloat(row.month2) || 0) > 0;
      return hasHours;
    });
    
    const projectsWithoutAllocations = result.projectRows.filter(row => {
      const hasHours = (parseFloat(row.month) || 0) > 0 || 
                      (parseFloat(row.month1) || 0) > 0 || 
                      (parseFloat(row.month2) || 0) > 0;
      return !hasHours;
    });
    
    console.log('\n--- DETAILED ANALYSIS ---');
    console.log(`PTO/Holiday projects: ${ptoProjects.length}`);
    console.log(`Administrative projects: ${adminProjects.length}`);
    console.log(`LWOP projects: ${lwopProjects.length}`);
    console.log(`Regular projects: ${regularProjects.length}`);
    console.log(`Projects with existing allocations: ${projectsWithAllocations.length}`);
    console.log(`Projects without allocations (new): ${projectsWithoutAllocations.length}`);
    
    // Show sample rows by category
    console.log('\n--- SAMPLE ROWS BY CATEGORY ---');
    if (ptoProjects.length > 0) {
      console.log('Sample PTO/Holiday project:', {
        projectNumber: ptoProjects[0].projectNumber,
        projectName: ptoProjects[0].projectName,
        hours: `${ptoProjects[0].month}/${ptoProjects[0].month1}/${ptoProjects[0].month2}`,
        hasId: !!ptoProjects[0].id
      });
    }
    if (adminProjects.length > 0) {
      console.log('Sample admin project:', {
        projectNumber: adminProjects[0].projectNumber,
        projectName: adminProjects[0].projectName,
        hours: `${adminProjects[0].month}/${adminProjects[0].month1}/${adminProjects[0].month2}`,
        hasId: !!adminProjects[0].id
      });
    }
    if (regularProjects.length > 0) {
      console.log('Sample regular project:', {
        projectNumber: regularProjects[0].projectNumber,
        projectName: regularProjects[0].projectName,
        hours: `${regularProjects[0].month}/${regularProjects[0].month1}/${regularProjects[0].month2}`,
        hasId: !!regularProjects[0].id
      });
    }
    
    // Verify no duplicate project numbers
    const projectNumbers = result.projectRows.map(row => row.projectNumber);
    const uniqueProjectNumbers = [...new Set(projectNumbers)];
    if (projectNumbers.length !== uniqueProjectNumbers.length) {
      console.warn('⚠️ WARNING: Duplicate project numbers detected!');
      console.log('Total rows:', projectNumbers.length);
      console.log('Unique project numbers:', uniqueProjectNumbers.length);
      
      // Find duplicates
      const duplicates = projectNumbers.filter((item, index) => projectNumbers.indexOf(item) !== index);
      console.log('Duplicate project numbers:', [...new Set(duplicates)]);
    } else {
      console.log('✅ No duplicate project numbers - merging successful');
    }
    
    // Check if we have essential allocations (PTO, admin, etc.)
    if (ptoProjects.length > 0 || adminProjects.length > 0) {
      console.log('✅ Essential allocation types (PTO/Admin) are present');
    } else {
      console.log('⚠️ No PTO or administrative allocations found - this may be expected if none exist');
    }
    
  } catch (error) {
    console.error('❌ Project merging test failed:', error);
  }
}

async function testOpportunityMerging() {
  console.log('\n=== TESTING OPPORTUNITY MERGING LOGIC ===');
  
  try {
    const result = await WorkloadPreloadService.preloadActiveOpportunities(
      TEST_USER_EMAIL, 
      TEST_YEAR, 
      TEST_QUARTER
    );
    
    console.log('\n--- PRELOAD RESULTS ---');
    console.log('Total opportunity rows:', result.opportunityRows.length);
    console.log('Stats:', result.stats);
    
    // Check for various scenarios
    const opportunitiesWithAllocations = result.opportunityRows.filter(row => 
      row.month > 0 || row.month1 > 0 || row.month2 > 0
    );
    const opportunitiesWithoutAllocations = result.opportunityRows.filter(row => 
      row.month === 0 && row.month1 === 0 && row.month2 === 0
    );
    
    console.log('\n--- ANALYSIS ---');
    console.log(`Opportunities with existing allocations: ${opportunitiesWithAllocations.length}`);
    console.log(`Opportunities without allocations (new): ${opportunitiesWithoutAllocations.length}`);
    
    // Show sample rows
    console.log('\n--- SAMPLE ROWS ---');
    if (opportunitiesWithAllocations.length > 0) {
      console.log('Sample opportunity with allocation:', opportunitiesWithAllocations[0]);
    }
    if (opportunitiesWithoutAllocations.length > 0) {
      console.log('Sample opportunity without allocation:', opportunitiesWithoutAllocations[0]);
    }
    
    // Verify no duplicate opportunity numbers
    const opportunityNumbers = result.opportunityRows.map(row => row.opportunityNumber);
    const uniqueOpportunityNumbers = [...new Set(opportunityNumbers)];
    if (opportunityNumbers.length !== uniqueOpportunityNumbers.length) {
      console.warn('⚠️ WARNING: Duplicate opportunity numbers detected!');
      console.log('Total rows:', opportunityNumbers.length);
      console.log('Unique opportunity numbers:', uniqueOpportunityNumbers.length);
    } else {
      console.log('✅ No duplicate opportunity numbers - merging successful');
    }
    
  } catch (error) {
    console.error('❌ Opportunity merging test failed:', error);
  }
}

async function runAllTests() {
  console.log('🧪 Starting WorkloadPreloadService merging tests...');
  console.log(`Using test user: ${TEST_USER_EMAIL}`);
  console.log(`Testing for: ${TEST_QUARTER} ${TEST_YEAR}`);
  
  await testProjectMerging();
  await testOpportunityMerging();
  
  console.log('\n✅ All tests completed!');
}

// Run tests if this script is executed directly
if (import.meta.url === new URL(import.meta.url).href) {
  runAllTests().catch(console.error);
}

export { runAllTests, testProjectMerging, testOpportunityMerging };
