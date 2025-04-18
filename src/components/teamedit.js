import React, { useEffect } from 'react';
import { MainContent } from '../App'; // Assuming MainContent is exported from App.js

const TeamEdit = ({ memberEmail }) => {
  useEffect(() => {
    if (window && typeof window.selectTeamMemberByEmail === 'function') {
      window.selectTeamMemberByEmail(memberEmail);
    }
  }, [memberEmail]);

  return <MainContent forceSelectEmail={memberEmail} />;
};

export default TeamEdit;