import React from 'react';
import type { TimeSlot } from '../../types';

interface CalendarCellProps {
   date: string;
   slots: TimeSlot[];
   assignments: Record<string, string | null | undefined>;
   onAssign: (date: string, slotId: string, personId: string | null) => void;
   activePeople: { id: string; name: string; color: string }[];
}

export const CalendarCell: React.FC<CalendarCellProps> = ({ date, slots, assignments, onAssign, activePeople }) => {
   const day = Number(date.split('-')[2]);
   return (
      <div className="border rounded p-1 bg-white d-flex flex-column" style={{ minHeight: 110 }}>
         <div className="fw-semibold small mb-1">{day}</div>
         <div className="d-flex flex-column gap-1 flex-grow-1">
            {slots.map(slot => {
               const key = `${date}_${slot.id}`;
               const personId = assignments[key];
               const person = activePeople.find(p => p.id === personId);
               return (
                  <div key={slot.id} className="d-flex align-items-center gap-1">
                     <span className="badge bg-light text-dark border small" style={{ minWidth: 70 }}>{slot.label}</span>
                     <div className="d-flex align-items-center flex-grow-1 gap-1">
                        <select
                           className="form-select form-select-sm"
                           value={personId || ''}
                           onChange={e => onAssign(date, slot.id, e.target.value || null)}
                        >
                           <option value="">--</option>
                           {activePeople.map(p => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                           ))}
                        </select>
                        {person && (
                           <span
                              className="rounded-circle border"
                              title={person.name}
                              style={{ width: 16, height: 16, background: person.color, display: 'inline-block' }}
                           />
                        )}
                     </div>
                  </div>
               );
            })}
         </div>
      </div>
   );
};
