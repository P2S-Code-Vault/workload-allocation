// components/TeamMemberPanel.js
import React, { useState } from 'react';
import './TeamMemberPanel.css';

const TeamMemberPanel = ({ member, allocations, onUpdate, disabled }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({});
  
  // Group allocations by type
  const groupedAllocations = {
    direct: allocations.filter(a => {
      const projId = a.proj_id || a.project_number || '';
      return projId && !projId.startsWith('0000-0000');
    }),
    pto: allocations.filter(a => {
      const projId = a.proj_id || a.project_number || '';
      return projId && (projId.startsWith('0000-0000-0PTO') || projId.startsWith('0000-0000-0HOL'));
    }),
    lwop: allocations.filter(a => {
      const projId = a.proj_id || a.project_number || '';
      return projId && projId.startsWith('0000-0000-LWOP');
    }),
    indirect: allocations.filter(a => {
      const projId = a.proj_id || a.project_number || '';
      return projId && projId.startsWith('0000-0000') && 
        !projId.startsWith('0000-0000-0PTO') && 
        !projId.startsWith('0000-0000-0HOL') &&
        !projId.startsWith('0000-0000-LWOP');
    })
  };
  
  // Calculate totals
  const totals = {
    direct: groupedAllocations.direct.reduce((sum, a) => sum + parseFloat(a.hours || a.ra_hours || 0), 0),
    pto: groupedAllocations.pto.reduce((sum, a) => sum + parseFloat(a.hours || a.ra_hours || 0), 0),
    lwop: groupedAllocations.lwop.reduce((sum, a) => sum + parseFloat(a.hours || a.ra_hours || 0), 0),
    indirect: groupedAllocations.indirect.reduce((sum, a) => sum + parseFloat(a.hours || a.ra_hours || 0), 0),
    get total() {
      return this.direct + this.pto + this.lwop + this.indirect;
    },
    get ratioB() {
      const denominator = this.total - this.pto - this.lwop;
      return denominator > 0 ? this.direct / denominator : 0;
    }
  };
  
  // Format numbers
  const formatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  });
  
  const formatPercent = value => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(value);
  };
  
  const handleEdit = (alloc) => {
    setEditingId(alloc.ra_id);
    setEditValues({
      hours: alloc.hours || alloc.ra_hours,
      remarks: alloc.remarks || alloc.ra_remarks || ''
    });
  };
  
  const handleUpdate = (alloc) => {
    if (!editValues.hours || isNaN(parseFloat(editValues.hours))) {
      alert('Please enter a valid number of hours');
      return;
    }
    
    onUpdate([{
      ra_id: alloc.ra_id,
      hours: parseFloat(editValues.hours),
      remarks: editValues.remarks
    }]);
    
    setEditingId(null);
  };
  
  const handleCancel = () => {
    setEditingId(null);
    setEditValues({});
  };
  
  return (
    <div className={`team-member-panel ${isExpanded ? 'expanded' : ''}`}>
      <div className="member-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="member-info">
          <h4>{member.name}</h4>
          <div className="member-details">
            <span>{member.labor_category}</span>
            <span>{member.email}</span>
          </div>
        </div>
        <div className="member-metrics">
          <div className="metric">
            <span className="metric-label">Direct:</span>
            <span className="metric-value">{formatter.format(totals.direct)}</span>
          </div>
          <div className="metric">
            <span className="metric-label">PTO:</span>
            <span className="metric-value">{formatter.format(totals.pto)}</span>
          </div>
          <div className="metric">
            <span className="metric-label">Total:</span>
            <span className="metric-value">{formatter.format(totals.total)}</span>
          </div>
          <div className="metric">
            <span className="metric-label">Ratio B:</span>
            <span className="metric-value">{formatPercent(totals.ratioB)}</span>
          </div>
        </div>
        <div className="expand-indicator">
          <i className={`arrow ${isExpanded ? 'up' : 'down'}`}></i>
        </div>
      </div>
      
      {isExpanded && (
        <div className="allocations-container">
          {allocations.length === 0 ? (
            <div className="no-allocations">No allocations for this week</div>
          ) : (
            <table className="allocations-table">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Name</th>
                  <th>Hours</th>
                  <th>Remarks</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {/* Direct Project Allocations */}
                {groupedAllocations.direct.map(alloc => (
                  <tr key={alloc.ra_id}>
                    <td>{alloc.proj_id || alloc.project_number}</td>
                    <td>{alloc.project_name || ''}</td>
                    <td>
                      {editingId === alloc.ra_id ? (
                        <input
                          type="number"
                          value={editValues.hours}
                          onChange={e => setEditValues({...editValues, hours: e.target.value})}
                          min="0"
                          step="0.5"
                        />
                      ) : (
                        formatter.format(alloc.hours || alloc.ra_hours || 0)
                      )}
                    </td>
                    <td>
                      {editingId === alloc.ra_id ? (
                        <input
                          type="text"
                          value={editValues.remarks}
                          onChange={e => setEditValues({...editValues, remarks: e.target.value})}
                        />
                      ) : (
                        alloc.remarks || alloc.ra_remarks || ''
                      )}
                    </td>
                    <td>
                      {editingId === alloc.ra_id ? (
                        <div className="button-group">
                          <button onClick={() => handleUpdate(alloc)} disabled={disabled}>Save</button>
                          <button onClick={handleCancel}>Cancel</button>
                        </div>
                      ) : (
                        <button onClick={() => handleEdit(alloc)} disabled={disabled}>Edit</button>
                      )}
                    </td>
                  </tr>
                ))}
                
                {/* Add similar sections for PTO, LWOP, and Indirect, with section headers */}
                {groupedAllocations.pto.length > 0 && (
                  <>
                    <tr className="section-header">
                      <td colSpan="5">PTO/Holiday</td>
                    </tr>
                    {groupedAllocations.pto.map(alloc => (
                      <tr key={alloc.ra_id}>
                        <td>{alloc.proj_id || alloc.project_number}</td>
                        <td>{alloc.project_name || ''}</td>
                        <td>{formatter.format(alloc.hours || alloc.ra_hours || 0)}</td>
                        <td>{alloc.remarks || alloc.ra_remarks || ''}</td>
                        <td>
                          <button onClick={() => handleEdit(alloc)} disabled={disabled}>Edit</button>
                        </td>
                      </tr>
                    ))}
                  </>
                )}
                
                {/* LWOP Section */}
                {groupedAllocations.lwop.length > 0 && (
                  <>
                    <tr className="section-header">
                      <td colSpan="5">LWOP</td>
                    </tr>
                    {groupedAllocations.pto.map(alloc => (
                      <tr key={alloc.ra_id}>
                        <td>{alloc.proj_id || alloc.project_number}</td>
                        <td>{alloc.project_name || ''}</td>
                        <td>{formatter.format(alloc.hours || alloc.ra_hours || 0)}</td>
                        <td>{alloc.remarks || alloc.ra_remarks || ''}</td>
                        <td>
                          <button onClick={() => handleEdit(alloc)} disabled={disabled}>Edit</button>
                        </td>
                      </tr>
                    ))}
                  </>
                )}
                
                {/* Indirect Section */}
                {groupedAllocations.indirect.length > 0 && (
                  <>
                    <tr className="section-header">
                      <td colSpan="5">Indirect Hours</td>
                    </tr>
                    {groupedAllocations.pto.map(alloc => (
                      <tr key={alloc.ra_id}>
                        <td>{alloc.proj_id || alloc.project_number}</td>
                        <td>{alloc.project_name || ''}</td>
                        <td>{formatter.format(alloc.hours || alloc.ra_hours || 0)}</td>
                        <td>{alloc.remarks || alloc.ra_remarks || ''}</td>
                        <td>
                          <button onClick={() => handleEdit(alloc)} disabled={disabled}>Edit</button>
                        </td>
                      </tr>
                    ))}
                  </>
                )}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default TeamMemberPanel;