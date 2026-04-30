import React, { useEffect, useMemo } from 'react';

export const PdfPreviewModal: React.FC<{
   show: boolean;
   onClose: () => void;
   bytes: ArrayBuffer | null;
   title?: string;
}> = ({ show, onClose, bytes, title }) => {
   const url = useMemo(() => {
      if (!bytes) return null;
      const blob = new Blob([bytes], { type: 'application/pdf' });
      return URL.createObjectURL(blob);
   }, [bytes]);

   useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);

   if (!show) return null;
   return (
      <div className="modal d-block" tabIndex={-1} style={{ background: 'rgba(0,0,0,0.5)' }}>
         <div className="modal-dialog modal-xl" style={{ maxWidth: '90%' }}>
            <div className="modal-content" style={{ height: '90vh' }}>
               <div className="modal-header">
                  <h5 className="modal-title">{title || 'PDF Preview'}</h5>
                  <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button>
               </div>
               <div className="modal-body p-0" style={{ height: '100%' }}>
                  {url ? (
                     <embed src={url} type="application/pdf" style={{ width: '100%', height: '100%', border: 'none' }} />
                  ) : (
                     <div className="p-3 text-muted">No content</div>
                  )}
               </div>
               <div className="modal-footer">
                  {url && (
                     <a className="btn btn-primary" href={url} download="schedule.pdf">Download</a>
                  )}
                  <button type="button" className="btn btn-secondary" onClick={onClose}>Close</button>
               </div>
            </div>
         </div>
      </div>
   );
};
