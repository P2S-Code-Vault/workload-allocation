// Test the opportunities preloading logic with sample data
const sampleOpportunityData = {
  "user": {
    "contact_id": 24,
    "full_name": "Guo, Mia",
    "group_name": "01 SL G81 -01",
    "group_manager": "Mercado, Bryant",
    "labor_category": "Commissioning Grade 05",
    "is_group_manager": false,
    "group_no": 81,
    "email": "Mia.Guo@p2sinc.com"
  },
  "group_opportunities": [
    {
      "opportunity_id": "006XX000004YYYY",
      "opportunity_name": "Sample Group Opportunity 1",
      "opportunity_number": "OPP-2025-001",
      "proposal_champion": "John Doe",
      "estimated_fee": 150000,
      "status": "Active"
    },
    {
      "opportunity_id": "006XX000004ZZZZ",
      "opportunity_name": "Sample Group Opportunity 2", 
      "opportunity_number": "OPP-2025-002",
      "proposal_champion": "Jane Smith",
      "estimated_fee": 75000,
      "status": "Active"
    }
  ],
  "user_managed_opportunities": [
    {
      "opportunity_id": "006XX000004AAAA",
      "opportunity_name": "User Managed Opportunity 1",
      "opportunity_number": "OPP-2025-003",
      "proposal_champion": "Guo, Mia",
      "estimated_fee": 50000,
      "status": "Active"
    }
  ]
};

// Simulate the logic
const userOpportunities = new Set();
const groupOpportunities = new Set();

// Add user's group opportunities
if (sampleOpportunityData.group_opportunities && Array.isArray(sampleOpportunityData.group_opportunities)) {
  sampleOpportunityData.group_opportunities.forEach(opportunity => {
    groupOpportunities.add(opportunity.opportunity_number);
  });
}

// Add user's individual managed opportunities if available
if (sampleOpportunityData.user_managed_opportunities && Array.isArray(sampleOpportunityData.user_managed_opportunities)) {
  sampleOpportunityData.user_managed_opportunities.forEach(opportunity => {
    userOpportunities.add(opportunity.opportunity_number);
  });
}

console.log(`Found ${userOpportunities.size} user opportunities:`, Array.from(userOpportunities));
console.log(`Found ${groupOpportunities.size} group opportunities:`, Array.from(groupOpportunities));

// Simulate creating opportunity rows
const opportunityRows = [];

// Add user managed opportunities
sampleOpportunityData.user_managed_opportunities.forEach(opportunity => {
  opportunityRows.push({
    opportunityNumber: opportunity.opportunity_number,
    opportunityName: opportunity.opportunity_name,
    proposalChampion: opportunity.proposal_champion,
    estimatedFee: opportunity.estimated_fee,
    type: 'user_managed'
  });
});

// Add group opportunities (filtered to avoid duplicates)
const groupOpportunitiesToAdd = sampleOpportunityData.group_opportunities
  .filter(opportunity => !userOpportunities.has(opportunity.opportunity_number));

groupOpportunitiesToAdd.forEach(opportunity => {
  opportunityRows.push({
    opportunityNumber: opportunity.opportunity_number,
    opportunityName: opportunity.opportunity_name,
    proposalChampion: opportunity.proposal_champion,
    estimatedFee: opportunity.estimated_fee,
    type: 'group'
  });
});

console.log(`Total opportunity rows: ${opportunityRows.length}`);
console.log('Opportunity rows:', opportunityRows);
