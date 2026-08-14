import { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Volume2, AlertCircle } from 'lucide-react';
import { LANGUAGES } from '../../constants';

export function VoiceInput({
  selectedLanguage = 'en',
  onTranscript,
  className = '',
}) {
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);

  const currentLangObj = LANGUAGES.find((l) => l.code === selectedLanguage) || LANGUAGES[0];

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore stop error
      }
    }
    setIsListening(false);
    setInterimText('');
  }, []);

  const startListening = () => {
    setError(null);
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError('Voice recognition is not supported in this browser. Please use Chrome/Edge or type manually.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = currentLangObj.speechCode || 'en-IN';
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        let finalTranscript = '';
        let interim = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }

        if (finalTranscript) {
          onTranscript(finalTranscript);
        }
        setInterimText(interim);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setError('Microphone access was denied. Please check your browser permissions.');
        } else {
          setError(`Speech error: ${event.error}`);
        }
        stopListening();
      };

      recognition.onend = () => {
        setIsListening(false);
        setInterimText('');
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Recognition start error:', err);
      setError(err.message);
      setIsListening(false);
    }
  };

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  return (
    <div className={`rounded-2xl border p-4 transition-all duration-200 ${isListening ? 'bg-red-50/50 border-red-200 ring-2 ring-red-200' : 'bg-slate-50 border-slate-200'} ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={isListening ? stopListening : startListening}
            className={`
              p-3 rounded-2xl flex items-center justify-center transition-all duration-200 shadow-md
              ${
                isListening
                  ? 'bg-red-600 text-white animate-pulse shadow-red-500/30'
                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/20'
              }
            `}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-slate-900 font-display">
                {isListening ? 'Listening live...' : 'Speak your complaint'}
              </p>
              <span className="text-xs px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600 font-medium">
                {currentLangObj.name}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {isListening
                ? 'Speak clearly into your microphone'
                : 'Click mic to speak in English, Hindi, or Odia'}
            </p>
          </div>
        </div>

        {isListening && (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-red-100/80 rounded-full text-xs font-semibold text-red-700">
            <Volume2 className="w-4 h-4 animate-bounce text-red-600" />
            Live Mic On
          </div>
        )}
      </div>

      {interimText && (
        <div className="mt-3 p-2.5 bg-white rounded-xl border border-slate-200 text-xs italic text-slate-600">
          "{interimText}"
        </div>
      )}

      {error && (
        <div className="mt-3 flex items-center gap-2 text-xs text-rose-600 font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
}
