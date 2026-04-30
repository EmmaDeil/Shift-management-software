import React from 'react';

interface ExportControlsProps {
   onExportCSV: () => void;
   onExportPDF: () => void;
   stats: { name: string; shifts: number; hours: number; overHours: number }[];
}

export const ExportControls: React.FC<ExportControlsProps> = ({ onExportCSV, onExportPDF, stats }) => {
   return (
      <div className="card mb-3">
         <div className="card-body">
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
               <h5 className="mb-0">Export & Stats</h5>
               <div className="btn-group">
                  <button className="btn btn-sm btn-outline-primary" onClick={onExportCSV}>Export CSV</button>
                  <button className="btn btn-sm btn-outline-secondary" onClick={onExportPDF}>Export PDF</button>
               </div>
            </div>
            <div className="table-responsive">
               <table className="table table-sm table-bordered align-middle mb-0">
                  <thead className="table-light">
                     <tr>
                        <th>Person</th>
                        <th>Shifts</th>
                        <th>Hours</th>
                        <th>Over Hours</th>
                     </tr>
                  </thead>
                  <tbody>
                     {stats.map(s => (
                        <tr key={s.name} className={s.overHours > 0 ? 'table-warning' : ''}>
                           <td>{s.name}</td>
                           <td>{s.shifts}</td>
                           <td>{s.hours}</td>
                           <td>{s.overHours > 0 ? s.overHours : '-'}</td>
                        </tr>
                     ))}
                     {stats.length === 0 && (
                        <tr><td colSpan={4} className="text-center text-muted">No data</td></tr>
                     )}
                  </tbody>
               </table>
            </div>
         </div>
      </div>
   );
};
