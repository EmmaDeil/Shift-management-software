import React, { useState } from 'react';

export const MonthPickerModal: React.FC<{
   show: boolean;
   onClose: () => void;
   onConfirm: (month: string) => void;
   initialMonth?: string;
}> = ({ show, onClose, onConfirm, initialMonth }) => {
   const [month, setMonth] = useState<string>(initialMonth || '');

   if (!show) return null;
   return (
      <div className="modal d-block" tabIndex={-1} style={{ background: 'rgba(0,0,0,0.5)' }}>
         <div className="modal-dialog">
            <div className="modal-content">
               <div className="modal-header">
                  <h5 className="modal-title">Load Month</h5>
                  <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button>
               </div>
               <div className="modal-body">
                  <label className="form-label">Select month</label>
                  <input type="month" className="form-control" value={month} onChange={e => setMonth(e.target.value)} />
               </div>
               <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                  <button type="button" className="btn btn-primary" onClick={() => { if (month) onConfirm(month); }}>Load</button>
               </div>
            </div>
         </div>
      </div>
   );
};
