import React from 'react';

interface CalendarHeaderProps {
   month: Date;
   onPrev: () => void;
   onNext: () => void;
}

export const CalendarHeader: React.FC<CalendarHeaderProps> = ({ month, onPrev, onNext }) => {
   const label = month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
   return (
      <div className="d-flex align-items-center justify-content-between mb-2">
         <div className="btn-group">
            <button className="btn btn-sm btn-outline-secondary" onClick={onPrev}>◀</button>
            <button className="btn btn-sm btn-outline-secondary" onClick={onNext}>▶</button>
         </div>
         <h5 className="mb-0">{label}</h5>
         <div style={{ width: 82 }} />
      </div>
   );
};
