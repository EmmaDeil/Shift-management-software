type Props = {
   shiftHours: number;
   maxDayHours: number;
   maxWeekHours: number;
   maxMonthHours: number;
   excludeWeekends: boolean;
   companyName: string;
   logoDataUrl: string | null;
   onChange: (patch: Partial<Omit<Props, 'onChange'>>) => void;
};

export default function ScheduleConfig({ shiftHours, maxDayHours, maxWeekHours, maxMonthHours, excludeWeekends, companyName, logoDataUrl, onChange }: Props) {
   return (
      <div className="card mb-3">
         <div className="card-header">Scheduling Rules</div>
         <div className="card-body">
            <div className="row g-3">
               <div className="col-12 col-md-6">
                  <label className="form-label">Company Name (for header/PDF)</label>
                  <input type="text" className="form-control" value={companyName}
                     onChange={e => onChange({ companyName: e.target.value })} />
               </div>
               <div className="col-12 col-md-6">
                  <label className="form-label">Logo (PNG/JPEG, small)</label>
                  <input type="file" accept="image/png,image/jpeg" className="form-control"
                     onChange={async e => {
                        const file = e.target.files?.[0];
                        if (!file) return onChange({ logoDataUrl: null });
                        const reader = new FileReader();
                        reader.onload = () => onChange({ logoDataUrl: reader.result as string });
                        reader.readAsDataURL(file);
                     }} />
                  {logoDataUrl && (
                     <div className="mt-2"><img src={logoDataUrl} alt="logo" style={{ maxHeight: 32 }} /></div>
                  )}
               </div>
               <div className="col-6 col-md-3">
                  <label className="form-label">Hours per shift</label>
                  <input type="number" className="form-control" min={0} value={shiftHours}
                     onChange={e => onChange({ shiftHours: Number(e.target.value) })} />
               </div>
               <div className="col-6 col-md-3">
                  <label className="form-label">Max hours/day</label>
                  <input type="number" className="form-control" min={0} value={maxDayHours}
                     onChange={e => onChange({ maxDayHours: Number(e.target.value) })} />
               </div>
               <div className="col-6 col-md-3">
                  <label className="form-label">Max hours/week</label>
                  <input type="number" className="form-control" min={0} value={maxWeekHours}
                     onChange={e => onChange({ maxWeekHours: Number(e.target.value) })} />
               </div>
               <div className="col-6 col-md-3">
                  <label className="form-label">Max hours/month</label>
                  <input type="number" className="form-control" min={0} value={maxMonthHours}
                     onChange={e => onChange({ maxMonthHours: Number(e.target.value) })} />
               </div>
            </div>
            <div className="form-check form-switch mt-3">
               <input className="form-check-input" type="checkbox" id="excludeWeekends"
                  checked={excludeWeekends}
                  onChange={e => onChange({ excludeWeekends: e.target.checked })} />
               <label className="form-check-label" htmlFor="excludeWeekends">Exclude Saturdays and Sundays in auto-assign</label>
            </div>
         </div>
      </div>
   );
}
