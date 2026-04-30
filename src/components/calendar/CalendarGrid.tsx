import React from 'react';
import type { TimeSlot } from '../../types';
import { CalendarCell } from './CalendarCell';

interface CalendarGridProps {
   days: string[];
   slots: TimeSlot[];
   assignments: Record<string, string | null | undefined>;
   onAssign: (date: string, slotId: string, personId: string | null) => void;
   activePeople: { id: string; name: string; color: string }[];
}

export const CalendarGrid: React.FC<CalendarGridProps> = ({ days, slots, assignments, onAssign, activePeople }) => {
   return (
      <div className="row g-2">
         {days.map(d => (
            <div className="col-6 col-sm-4 col-md-3 col-lg-2" key={d}>
               <CalendarCell
                  date={d}
                  slots={slots}
                  assignments={assignments}
                  onAssign={onAssign}
                  activePeople={activePeople}
               />
            </div>
         ))}
      </div>
   );
};
