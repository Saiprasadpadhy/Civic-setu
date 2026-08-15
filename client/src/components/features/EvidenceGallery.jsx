import { useState } from 'react';
import { Image as ImageIcon, Calendar, User, Eye, FileText, Download, ExternalLink } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

export function EvidenceGallery({ evidence = [], title = 'Resolution Evidence', className = '' }) {
  const [selectedImage, setSelectedImage] = useState(null);

  if (!evidence.length) {
    return (
      <div className="p-6 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
        <ImageIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
        <p className="text-xs text-slate-500 font-medium">No resolution evidence uploaded yet.</p>
      </div>
    );
  }

  const isDocument = (item) => {
    return (
      item.evidenceType === 'document' ||
      item.mimeType?.includes('pdf') ||
      item.mimeType?.includes('document') ||
      item.url?.endsWith('.pdf') ||
      item.url?.endsWith('.doc') ||
      item.url?.endsWith('.docx')
    );
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {evidence.map((item, idx) => {
          const doc = isDocument(item);

          return (
            <div
              key={item._id || idx}
              className="group rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col"
            >
              {/* Preview Box */}
              {doc ? (
                <div className="h-44 w-full relative bg-gradient-to-br from-slate-100 to-indigo-50 flex flex-col items-center justify-center p-4 text-center border-b border-slate-100">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-2 shadow-sm">
                    <FileText className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-bold text-slate-800 line-clamp-1">
                    {item.caption || 'Resolution Document'}
                  </p>
                  <span className="text-[10px] text-slate-400 mt-0.5">Formal Verification Report</span>

                  <div className="absolute top-2 left-2">
                    <Badge variant="purple" size="sm" className="uppercase font-bold tracking-wider">
                      Document
                    </Badge>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => setSelectedImage(item)}
                  className="h-44 w-full relative bg-slate-100 cursor-pointer overflow-hidden"
                >
                  <img
                    src={item.url}
                    alt={item.caption || `Evidence ${idx + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65';
                    }}
                  />
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-2 font-medium text-xs">
                    <Eye className="w-4 h-4" />
                    Click to Enlarge
                  </div>
                  <div className="absolute top-2 left-2">
                    <Badge
                      variant={item.evidenceType === 'after' ? 'success' : item.evidenceType === 'before' ? 'amber' : 'primary'}
                      size="sm"
                      className="uppercase font-bold tracking-wider"
                    >
                      {item.evidenceType || 'Evidence'}
                    </Badge>
                  </div>
                </div>
              )}

              {/* Info Details */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900 line-clamp-1">
                    {item.caption || (doc ? 'Resolution Certificate' : 'Inspection Photo')}
                  </p>
                  {item.notes && (
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed bg-slate-50 p-2 rounded-lg border border-slate-100">
                      {item.notes}
                    </p>
                  )}
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1 font-medium text-slate-600">
                    <User className="w-3 h-3 text-slate-400" />
                    {item.uploadedById?.name || 'Officer'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {item.createdAt ? new Date(item.createdAt).toLocaleString() : ''}
                  </span>
                </div>

                {doc && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2.5 inline-flex items-center justify-center gap-1.5 w-full py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Open Document
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Enlarged Modal for Photo inspection */}
      <Modal
        isOpen={!!selectedImage}
        onClose={() => setSelectedImage(null)}
        title={selectedImage?.caption || 'Resolution Evidence Inspection'}
        maxWidth="max-w-2xl"
      >
        {selectedImage && (
          <div className="space-y-4">
            <div className="rounded-2xl overflow-hidden max-h-[70vh] bg-slate-950 flex items-center justify-center shadow-inner">
              <img
                src={selectedImage.url}
                alt="Enlarged Evidence"
                className="max-h-[65vh] w-auto object-contain rounded"
              />
            </div>
            {selectedImage.notes && (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-xs font-bold text-slate-900 uppercase tracking-wide">Officer Remarks</p>
                <p className="text-xs text-slate-700 mt-1 leading-relaxed">{selectedImage.notes}</p>
              </div>
            )}
            <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100">
              <span>Uploaded by: <strong className="text-slate-700">{selectedImage.uploadedById?.name || 'Officer'}</strong></span>
              <span>Timestamp: <strong className="text-slate-700">{new Date(selectedImage.createdAt).toLocaleString()}</strong></span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
