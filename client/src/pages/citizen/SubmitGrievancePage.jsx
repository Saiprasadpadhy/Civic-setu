import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { ROUTES, CATEGORIES, LANGUAGES } from '../../constants';
import * as refApi from '../../api/reference';
import * as aiApi from '../../api/ai';
import * as grievanceApi from '../../api/grievances';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { ErrorAlert } from '../../components/ui/ErrorAlert';
import { VoiceInput } from '../../components/features/VoiceInput';
import { LocationPicker } from '../../components/features/LocationPicker';
import { ImageUploader } from '../../components/features/ImageUploader';
import { AIPreviewCard } from '../../components/features/AIPreviewCard';
import { DuplicateWarning } from '../../components/features/DuplicateWarning';
import {
  Send,
  Sparkles,
  Globe,
  MapPin,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  FileText,
} from 'lucide-react';

export default function SubmitGrievancePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('pothole');
  const [wardId, setWardId] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [latitude, setLatitude] = useState(20.2961);
  const [longitude, setLongitude] = useState(85.8245);
  const [locationAddress, setLocationAddress] = useState('');
  const [images, setImages] = useState([]);

  // Async & AI state
  const [wards, setWards] = useState([]);
  const [aiPreview, setAiPreview] = useState(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const debounceTimeoutRef = useRef(null);

  // Fetch reference wards
  useEffect(() => {
    refApi.getWards().then((res) => {
      setWards(res);
      if (res.length > 0) {
        setWardId(res[0]._id);
        if (res[0].center?.coordinates?.length === 2) {
          setLongitude(res[0].center.coordinates[0]);
          setLatitude(res[0].center.coordinates[1]);
        }
      }
    }).catch(() => {});
  }, []);

  // Trigger live AI preview when title/description or image changes
  const triggerAiPreview = useCallback((currentTitle, currentDesc, currentWardId, currentLat, currentLng, currentImages) => {
    if (!currentTitle || currentTitle.trim().length < 5) {
      setAiPreview(null);
      return;
    }

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(async () => {
      setLoadingAi(true);
      try {
        const previewPayload = {
          title: currentTitle.trim(),
          description: (currentDesc || currentTitle).trim(),
          wardId: currentWardId || undefined,
          latitude: Number(currentLat),
          longitude: Number(currentLng),
          imageUrl: currentImages?.[0]?.url || undefined,
          mimeType: currentImages?.[0]?.mimeType || undefined,
        };

        const result = await aiApi.previewAiAnalysis(previewPayload);
        if (result && result.aiStatus === 'completed') {
          setAiPreview(result);
          if (result.textAnalysis?.category && !category) {
            setCategory(result.textAnalysis.category);
          }
        }
      } catch (err) {
        console.warn('AI Preview background error:', err);
      } finally {
        setLoadingAi(false);
      }
    }, 800);
  }, [category]);

  const handleTitleChange = (val) => {
    setTitle(val);
    triggerAiPreview(val, description, wardId, latitude, longitude, images);
  };

  const handleDescChange = (val) => {
    setDescription(val);
    triggerAiPreview(title, val, wardId, latitude, longitude, images);
  };

  const handleVoiceTranscript = (transcript) => {
    if (!title) {
      setTitle(transcript);
      triggerAiPreview(transcript, description, wardId, latitude, longitude, images);
    } else {
      const updated = description ? `${description} ${transcript}` : transcript;
      setDescription(updated);
      triggerAiPreview(title, updated, wardId, latitude, longitude, images);
    }
  };

  const handleLocationChange = ({ latitude: lat, longitude: lng, addressText }) => {
    setLatitude(lat);
    setLongitude(lng);
    if (addressText) setLocationAddress(addressText);
    triggerAiPreview(title, description, wardId, lat, lng, images);
  };

  const handleImagesChange = (newImages) => {
    setImages(newImages);
    triggerAiPreview(title, description, wardId, latitude, longitude, newImages);
  };

  const handleWardChange = (e) => {
    const newWardId = e.target.value;
    setWardId(newWardId);
    const selectedWard = wards.find((w) => w._id === newWardId);
    if (selectedWard?.center?.coordinates?.length === 2) {
      setLongitude(selectedWard.center.coordinates[0]);
      setLatitude(selectedWard.center.coordinates[1]);
    }
    triggerAiPreview(title, description, newWardId, latitude, longitude, images);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !wardId) {
      setError('Please provide a title, description, and select a ward.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        category: category || 'pothole',
        wardId,
        latitude: Number(latitude),
        longitude: Number(longitude),
        location: locationAddress.trim() || undefined,
        images: images.map((img) => ({
          url: img.url,
          mimeType: img.mimeType || 'image/jpeg',
          caption: img.caption || undefined,
        })),
      };

      const created = await grievanceApi.createGrievance(payload);
      if (created?._id) {
        navigate(`/citizen/grievances/${created._id}`, { replace: true });
      } else {
        navigate(ROUTES.CITIZEN_MY_GRIEVANCES, { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to submit grievance');
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Page Header */}
      <div>
        <span className="text-xs uppercase font-bold tracking-widest text-blue-600">
          Smart Intake Flow
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display mt-1">
          Submit a Civic Grievance
        </h1>
        <p className="text-sm text-slate-500 mt-1 max-w-2xl">
          Report road damage, streetlight outages, garbage overflows, or water supply leaks.
          Gemini AI will automatically triage, categorize, and score priority in real time.
        </p>
      </div>

      {error && <ErrorAlert message={error} />}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Input Form (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Language & Voice Intake Box */}
          <Card className="p-5 bg-white border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-bold text-slate-900 font-display">
                  1. Choose Input Language & Voice
                </span>
              </div>

              {/* Language Pills */}
              <div className="flex items-center gap-1.5">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => setSelectedLanguage(lang.code)}
                    className={`
                      px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all
                      ${
                        selectedLanguage === lang.code
                          ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }
                    `}
                  >
                    <span>{lang.flag}</span>
                    <span>{lang.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Voice Input Microphone Component */}
            <VoiceInput
              selectedLanguage={selectedLanguage}
              onTranscript={handleVoiceTranscript}
            />
          </Card>

          {/* Core Grievance Fields */}
          <Card className="p-6 bg-white border-slate-200 shadow-sm space-y-5">
            <h3 className="text-base font-bold text-slate-900 font-display flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              2. Complaint Information
            </h3>

            <Input
              label="Issue Title *"
              placeholder="e.g. Large pothole near college gate / सड़क पर गड्ढा / ବଡ଼ ଗାଡ଼"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              required
            />

            <Textarea
              label="Detailed Description *"
              rows={4}
              placeholder="Describe the issue, hazards, duration, landmarks..."
              value={description}
              onChange={(e) => handleDescChange(e.target.value)}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Ward / Neighborhood *"
                value={wardId}
                onChange={handleWardChange}
                required
              >
                {wards.map((w) => (
                  <option key={w._id} value={w._id}>
                    {w.name} ({w.code})
                  </option>
                ))}
              </Select>

              <Select
                label="Category (AI Auto-refines)"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </Select>
            </div>

            <Input
              label="Address / Street Landmark (Optional)"
              placeholder="e.g. Near Main Gate, Opp. SBI ATM"
              value={locationAddress}
              onChange={(e) => setLocationAddress(e.target.value)}
            />
          </Card>

          {/* Interactive Location Pinning */}
          <LocationPicker
            latitude={latitude}
            longitude={longitude}
            addressText={locationAddress}
            onLocationChange={handleLocationChange}
          />

          {/* Image Upload */}
          <Card className="p-6 bg-white border-slate-200 shadow-sm">
            <ImageUploader
              images={images}
              onChange={handleImagesChange}
              maxImages={3}
            />
          </Card>

          {/* Submission Button */}
          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={submitting}
              icon={Send}
              className="w-full py-4 text-base font-bold shadow-lg shadow-blue-500/25"
            >
              Submit Grievance to Municipal Triage
            </Button>
          </div>
        </div>

        {/* Right Column: Real-Time AI Intelligence & Duplicate Radar (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* AI Preview Card */}
          <div className="sticky top-20 space-y-6">
            <AIPreviewCard
              previewData={aiPreview}
              loading={loadingAi}
            />

            {/* Duplicate Candidate Warning */}
            <DuplicateWarning
              duplicateReport={aiPreview?.duplicatePreview}
            />

            {/* Instructions helper */}
            <Card className="p-5 bg-blue-50/40 border-blue-100 text-xs text-slate-600 space-y-2">
              <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-blue-600" />
                How AI Assist Works
              </h4>
              <p className="leading-relaxed">
                As you type or speak, Gemini evaluates your text in real time. It normalizes native Indic script, detects the responsible municipal department, and calculates a transparent priority score based on public safety.
              </p>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
