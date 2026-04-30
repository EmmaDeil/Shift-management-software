import React, { useState } from 'react';
import { useToasts } from './useToasts';
import { useSchedule } from '../hooks/useSchedule';
import { PeopleForm } from './PeopleForm';
import { CalendarHeader } from './calendar/CalendarHeader';
import { CalendarGrid } from './calendar/CalendarGrid';
import { PersonLegend } from './PersonLegend';
import { ExportControls } from './ExportControls';
import { MonthPickerModal } from './MonthPickerModal';
import { PdfPreviewModal } from './PdfPreviewModal';
import ScheduleConfig from './ScheduleConfig';

export const ScheduleBoard: React.FC = () => {
   const {
      people,
      timeSlots,
      assignments,
      days,
      currentMonth,
      addPeopleBulk,
      addTimeSlot,
      removeTimeSlot,
      updateTimeSlot,
      assignPerson,
      autoAssign,
      clearAssignments,
      togglePersonActive,
      nextMonth,
      prevMonth,
      stats,
      exportCSV,
      exportPDF,
      saveCurrentMonth,
      loadMonth,
      isSaving,
      isLoading,
      lastSavedAt,
      months,
      config,
      updateConfig,
   } = useSchedule();

   const [message, setMessage] = useState<string | null>(null);
   const [error, setError] = useState<string | null>(null);
   const { push } = useToasts();
   const [showMonthModal, setShowMonthModal] = useState(false);
   const [showPdfModal, setShowPdfModal] = useState(false);
   const [pdfBytes, setPdfBytes] = useState<ArrayBuffer | null>(null);

   const handleSave = async () => {
      setError(null); setMessage(null);
      try { await saveCurrentMonth(); setMessage('Saved successfully'); push('success', 'Saved successfully'); }
      catch { setError('Save failed (cached locally)'); push('error', 'Save failed (cached locally)'); }
   };

   const handleLoad = async (m: string) => {
      if (!m) return;
      setError(null); setMessage(null);
      const ok = await loadMonth(m);
      if (ok) { setMessage('Loaded schedule'); push('success', 'Loaded schedule'); }
      else { setError('Load failed'); push('error', 'Load failed'); }
   };

   const activePeople = people.filter(p => p.active).map(p => ({ id: p.id, name: p.name, color: p.color }));

   return (
      <div className="schedule-board">
         {/* App header branding */}
         {(config.logoDataUrl || config.companyName) && (
            <div className="d-flex align-items-center gap-2 mb-3">
               {config.logoDataUrl && (
                  <img src={config.logoDataUrl} alt="logo" style={{ height: 32 }} />
               )}
               <h4 className="m-0">{config.companyName}</h4>
            </div>
         )}
         <ScheduleConfig
            shiftHours={config.shiftHours}
            maxDayHours={config.maxDayHours}
            maxWeekHours={config.maxWeekHours}
            maxMonthHours={config.maxMonthHours}
            excludeWeekends={config.excludeWeekends}
            companyName={config.companyName}
            logoDataUrl={config.logoDataUrl}
            onChange={updateConfig}
         />
         <PeopleForm
            onAddPeople={addPeopleBulk}
            onAddSlot={addTimeSlot}
            onRemoveSlot={removeTimeSlot}
            onUpdateSlot={updateTimeSlot}
            onAutoAssign={autoAssign}
            onClear={clearAssignments}
            timeSlots={timeSlots}
            people={people}
            onTogglePerson={togglePersonActive}
         />

         <PersonLegend people={people} />
         <div className="d-flex flex-wrap gap-2 align-items-center mb-3">
            <button className="btn btn-outline-primary btn-sm" disabled={isSaving} onClick={handleSave}>
               {isSaving ? 'Saving...' : 'Save Month'}
            </button>
            <div className="d-flex align-items-center gap-1">
               <select
                  className="form-select form-select-sm"
                  style={{ width: 140 }}
                  disabled={isLoading || months.length === 0}
                  onChange={e => e.target.value && handleLoad(e.target.value)}
                  defaultValue=""
               >
                  <option value="" disabled>Select Month</option>
                  {months.map(m => <option key={m} value={m}>{m}</option>)}
               </select>
               <button className="btn btn-outline-secondary btn-sm" disabled={isLoading} onClick={() => setShowMonthModal(true)}>
                  {isLoading ? 'Loading...' : 'Load (Manual)'}
               </button>
            </div>
            {lastSavedAt && <small className="text-muted">Last saved {new Date(lastSavedAt).toLocaleTimeString()}</small>}
         </div>
         {(message || error) && null}
         <div className="d-flex justify-content-end mb-2">
            <button className="btn btn-sm btn-outline-dark" onClick={() => { setPdfBytes(exportPDF()); setShowPdfModal(true); }}>View PDF</button>
         </div>
         <ExportControls
            stats={stats}
            onExportCSV={() => {
               const csv = exportCSV();
               const blob = new Blob([csv], { type: 'text/csv' });
               const a = document.createElement('a');
               a.href = URL.createObjectURL(blob);
               a.download = 'schedule.csv';
               a.click();
            }}
            onExportPDF={() => {
               const bytes = exportPDF();
               const blob = new Blob([bytes], { type: 'application/pdf' });
               const a = document.createElement('a');
               a.href = URL.createObjectURL(blob);
               a.download = 'schedule.pdf';
               a.click();
            }}
         />

         <MonthPickerModal
            show={showMonthModal}
            onClose={() => setShowMonthModal(false)}
            onConfirm={(m) => { setShowMonthModal(false); handleLoad(m); }}
            initialMonth={''}
         />
         <PdfPreviewModal
            show={showPdfModal}
            onClose={() => setShowPdfModal(false)}
            bytes={pdfBytes}
            title={'Schedule Preview'}
         />

         <div className="card">
            <div className="card-body">
               <CalendarHeader month={currentMonth} onPrev={prevMonth} onNext={nextMonth} />
               <CalendarGrid
                  days={days}
                  slots={timeSlots}
                  assignments={assignments as Record<string, string | null | undefined>}
                  onAssign={assignPerson}
                  activePeople={activePeople}
               />
            </div>
         </div>
      </div>
   );
};
