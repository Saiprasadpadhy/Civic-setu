import { useState, useRef } from 'react';
import { UploadCloud, Image as ImageIcon, X, Link as LinkIcon, Check } from 'lucide-react';
import { Button } from '../ui/Button';

export function ImageUploader({ images = [], onChange, maxImages = 3, className = '' }) {
  const [urlInput, setUrlInput] = useState('');
  const [showUrlField, setShowUrlField] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    files.forEach((file) => {
      if (images.length >= maxImages) return;
      const reader = new FileReader();
      reader.onload = () => {
        onChange([
          ...images,
          {
            url: reader.result,
            mimeType: file.type,
            caption: file.name,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = null;
  };

  const handleAddUrl = () => {
    if (!urlInput.trim()) return;
    if (images.length >= maxImages) return;

    onChange([
      ...images,
      {
        url: urlInput.trim(),
        mimeType: 'image/jpeg',
        caption: 'External grievance photo',
      },
    ]);
    setUrlInput('');
    setShowUrlField(false);
  };

  const handleRemove = (index) => {
    onChange(images.filter((_, i) => i !== index));
  };

  const handleCaptionChange = (index, newCaption) => {
    const updated = [...images];
    updated[index] = { ...updated[index], caption: newCaption };
    onChange(updated);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="block text-sm font-semibold text-slate-900 font-display">
          Upload Evidence Images ({images.length}/{maxImages})
        </label>
        <button
          type="button"
          onClick={() => setShowUrlField(!showUrlField)}
          className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
        >
          <LinkIcon className="w-3.5 h-3.5" />
          {showUrlField ? 'Hide URL input' : 'Paste Image URL'}
        </button>
      </div>

      {showUrlField && (
        <div className="flex gap-2 p-3 bg-blue-50/50 rounded-xl border border-blue-100">
          <input
            type="url"
            placeholder="https://example.com/image.jpg"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            className="flex-1 text-xs rounded-lg border border-slate-300 p-2 bg-white"
          />
          <Button size="sm" variant="primary" onClick={handleAddUrl} icon={Check}>
            Add
          </Button>
        </div>
      )}

      {/* Upload Zone */}
      {images.length < maxImages && (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="cursor-pointer border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/30 rounded-2xl p-6 text-center transition-all duration-200 group"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="mx-auto w-12 h-12 rounded-2xl bg-slate-100 group-hover:bg-blue-100 text-slate-500 group-hover:text-blue-600 flex items-center justify-center transition-colors mb-2">
            <UploadCloud className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-slate-800">
            Click to upload photo evidence
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            PNG, JPG, WebP up to 10MB (AI will automatically analyze defects)
          </p>
        </div>
      )}

      {/* Thumbnail previews */}
      {images.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
          {images.map((img, idx) => (
            <div
              key={idx}
              className="relative group rounded-xl border border-slate-200 overflow-hidden bg-slate-50 p-2"
            >
              <div className="h-28 w-full rounded-lg overflow-hidden relative bg-slate-200">
                <img
                  src={img.url}
                  alt={`Evidence ${idx + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65';
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleRemove(idx)}
                  className="absolute top-1 right-1 p-1 bg-slate-900/70 hover:bg-rose-600 text-white rounded-full transition-colors shadow-sm"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <input
                type="text"
                placeholder="Add caption..."
                value={img.caption || ''}
                onChange={(e) => handleCaptionChange(idx, e.target.value)}
                className="mt-2 w-full text-[11px] rounded-lg border border-slate-200 px-2 py-1 bg-white text-slate-700 placeholder-slate-400"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
