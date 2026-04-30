import React from 'react';

interface PersonLegendProps {
   people: { id: string; name: string; color: string; active: boolean }[];
}

export const PersonLegend: React.FC<PersonLegendProps> = ({ people }) => {
   if (!people.length) return null;
   return (
      <div className="card mb-3">
         <div className="card-body py-2">
            <div className="d-flex flex-wrap gap-3 align-items-center">
               {people.map(p => (
                  <div key={p.id} className="d-flex align-items-center gap-1 small" style={{ opacity: p.active ? 1 : 0.4 }}>
                     <span style={{ width: 14, height: 14, background: p.color, display: 'inline-block', borderRadius: 4, border: '1px solid #0002' }} />
                     <span>{p.name}</span>
                  </div>
               ))}
            </div>
         </div>
      </div>
   );
};