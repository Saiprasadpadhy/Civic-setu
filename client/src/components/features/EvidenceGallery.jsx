import { useState } from 'react';
import { Image as ImageIcon, Calendar, User, Eye, X } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';

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

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {evidence.map((item, idx) => (
          <div
            key={idx}
            className="group rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col"
          >
            {/* Image Preview */}
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
                  variant={item.evidenceType === 'after' ? 'success' : 'primary'}
                  size="sm"
                  className="uppercase font-bold tracking-wider"
                >
                  {item.evidenceType || 'Evidence'}
                </Badge>
              </div>
            </div>

            {/* Info */}
            <div className="p-4 flex-1 flex flex-col justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900 line-clamp-1">
                  {item.caption || 'Resolution Inspection Photo'}
                </p>
                {item.notes && (
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.notes}</p>
                )}
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {item.uploadedById?.name || 'Officer'}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ''}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Enlarged modal */}
      <Modal
        isOpen={!!selectedImage}
        onClose={() => setSelectedImage(null)}
        title={selectedImage?.caption || 'Evidence Preview'}
        maxWidth="max-w-2xl"
      >
        {selectedImage && (
          <div className="space-y-3">
            <div className="rounded-xl overflow-hidden max-h-[70vh] bg-slate-900 flex items-center justify-center">
              <img
                src={selectedImage.url}
                alt="Enlarged Evidence"
                className="max-h-[65vh] w-auto object-contain rounded"
              />
            </div>
            {selectedImage.notes && (
              <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                {selectedImage.notes}
              </p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
