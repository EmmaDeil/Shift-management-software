import React, { useState } from 'react';

interface PeopleFormProps {
   onAddPeople: (raw: string) => void;
   onAddSlot: (id: string, label: string) => void;
   onRemoveSlot: (id: string) => void;
   onUpdateSlot: (id: string, patch: { id?: string; label?: string }) => boolean;
   onAutoAssign: () => void;
   onClear: () => void;
   timeSlots: { id: string; label: string }[];
   people: { id: string; name: string; active: boolean }[];
   onTogglePerson: (id: string) => void;
}

export const PeopleForm: React.FC<PeopleFormProps> = ({
   onAddPeople,
   onAddSlot,
   onRemoveSlot,
   onAutoAssign,
   onClear,
   timeSlots,
   people,
   onTogglePerson,
   onUpdateSlot,
}) => {
   const [names, setNames] = useState('');
   const [slotId, setSlotId] = useState('');
   const [slotLabel, setSlotLabel] = useState('');

   return (
      <div className="card mb-3">
         <div className="card-body">
            <h5 className="card-title">Setup</h5>
            <div className="row g-3">
               <div className="col-md-6">
                  <label className="form-label">Add People (comma or line separated)</label>
                  <textarea
                     className="form-control"
                     rows={3}
                     value={names}
                     onChange={e => setNames(e.target.value)}
                     placeholder={"Alice, Bob,\nCharlie"}
                  />
                  <button
                     className="btn btn-sm btn-primary mt-2"
                     onClick={() => { onAddPeople(names); setNames(''); }}
                     disabled={!names.trim()}
                  >Add People</button>
               </div>
               <div className="col-md-6">
                  <label className="form-label">Add Time Slot</label>
                  <div className="input-group mb-2">
                     <input
                        type="text"
                        className="form-control"
                        placeholder="slot-id (e.g. evening)"
                        value={slotId}
                        onChange={e => setSlotId(e.target.value)}
                     />
                     <input
                        type="text"
                        className="form-control"
                        placeholder="Slot Label"
                        value={slotLabel}
                        onChange={e => setSlotLabel(e.target.value)}
                     />
                     <button
                        className="btn btn-outline-secondary"
                        onClick={() => { onAddSlot(slotId.trim(), slotLabel.trim()); setSlotId(''); setSlotLabel(''); }}
                        disabled={!slotId.trim() || !slotLabel.trim()}
                     >Add</button>
                  </div>
                  <div className="d-flex flex-column gap-2">
                     {timeSlots.map(ts => (
                        <SlotRow key={ts.id} ts={ts} onRemove={onRemoveSlot} onUpdate={onUpdateSlot} />
                     ))}
                  </div>
               </div>
               <div className="col-12">
                  <label className="form-label">People (toggle active)</label>
                  <div className="d-flex flex-wrap gap-2">
                     {people.map(p => (
                        <button
                           key={p.id}
                           type="button"
                           className={`btn btn-sm ${p.active ? 'btn-success' : 'btn-outline-secondary'}`}
                           onClick={() => onTogglePerson(p.id)}
                        >{p.name}</button>
                     ))}
                  </div>
               </div>
               <div className="col-12 d-flex gap-2 flex-wrap">
                  <button className="btn btn-warning" onClick={onAutoAssign}>Auto Assign</button>
                  <button className="btn btn-outline-danger" onClick={onClear}>Clear Assignments</button>
               </div>
            </div>
         </div>
      </div>
   );
};

const SlotRow: React.FC<{
   ts: { id: string; label: string };
   onRemove: (id: string) => void;
   onUpdate: (id: string, patch: { id?: string; label?: string }) => boolean;
}> = ({ ts, onRemove, onUpdate }) => {
   const [editing, setEditing] = useState(false);
   const [id, setId] = useState(ts.id);
   const [label, setLabel] = useState(ts.label);
   const isBuiltin = ['morning', 'afternoon'].includes(ts.id);
   const reset = () => { setId(ts.id); setLabel(ts.label); setEditing(false); };
   const save = () => {
      if (!id.trim() || !label.trim()) return;
      const ok = onUpdate(ts.id, { id: id.trim(), label: label.trim() });
      if (!ok) {
         alert('Slot ID already exists. Choose a unique slot-id.');
         return;
      }
      setEditing(false);
   };
   return (
      <div className="border rounded p-2 d-flex align-items-center gap-2">
         {editing ? (
            <>
               <input className="form-control form-control-sm" style={{ maxWidth: 180 }} value={id} onChange={e => setId(e.target.value)} placeholder="slot-id" />
               <input className="form-control form-control-sm" style={{ maxWidth: 220 }} value={label} onChange={e => setLabel(e.target.value)} placeholder="Slot Label" />
               <button className="btn btn-sm btn-primary" onClick={save} disabled={!id.trim() || !label.trim()}>Save</button>
               <button className="btn btn-sm btn-secondary" onClick={reset}>Cancel</button>
            </>
         ) : (
            <>
               <span className="badge bg-light text-dark border">{ts.label} <small className="text-muted">({ts.id})</small></span>
               <button className="btn btn-sm btn-outline-primary" onClick={() => setEditing(true)}>Edit</button>
               {!isBuiltin && (
                  <button className="btn btn-sm btn-outline-danger" onClick={() => onRemove(ts.id)}>Remove</button>
               )}
            </>
         )}
      </div>
   );
};
