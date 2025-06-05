// Helper function to get current quarter based on current date
export const getQuarterFromMonth = (month) => {
  if (month >= 1 && month <= 3) return 1;
  if (month >= 4 && month <= 6) return 2;
  if (month >= 7 && month <= 9) return 3;
  return 4;
};

// Get current quarter as number (1, 2, 3, 4)
export const getCurrentQuarter = () => {
  const now = new Date();
  return getQuarterFromMonth(now.getMonth() + 1);
};

// Get current quarter as string ("Q1", "Q2", "Q3", "Q4")
export const getCurrentQuarterString = () => {
  return `Q${getCurrentQuarter()}`;
};

// Get current year
export const getCurrentYear = () => {
  return new Date().getFullYear();
};

// Helper function to get months for a quarter
export const getQuarterMonths = (quarter) => {
  const quarterMap = {
    1: [1, 2, 3],
    2: [4, 5, 6],
    3: [7, 8, 9],
    4: [10, 11, 12]
  };
  return quarterMap[quarter] || [1, 2, 3];
};

// Helper function to get zero-indexed months for a quarter (for Date objects)
export const getQuarterMonthsZeroIndexed = (quarter) => {
  const quarterMap = {
    1: [0, 1, 2],
    2: [3, 4, 5],
    3: [6, 7, 8],
    4: [9, 10, 11]
  };
  return quarterMap[quarter] || [0, 1, 2];
};
