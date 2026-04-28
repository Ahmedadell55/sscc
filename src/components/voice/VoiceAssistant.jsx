import React, { useState, useEffect, useRef, useCallback } from 'react';
import styles from './VoiceAssistant.module.css';
// [API] استورد هذا عند الربط:
// import { voiceAPI } from '../../services/api';

const QUICK_CMDS = [
  'أسرع طريق للمنزل',
  'كثافة المرور الآن',
  'أقرب محطة وقود',
  'موعد أفضل للسفر',
];

// ── Web Speech API detection ──────────────────────────
const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition || null;

const MOCK_RESPONSES = {
  'أسرع طريق للمنزل':   'الطريق الأسرع الآن هو الدائري الإقليمي، يوفر لك 8 دقائق عن الطريق العادي.',
  'كثافة المرور الآن':  'ازدحام متوسط على طريق النيل، خفيف على الدائري. التحسن متوقع بعد 30 دقيقة.',
  'أقرب محطة وقود':     'أقرب محطة وقود على بُعد 1.2 كم على يمينك — محطة توتال بشارع الثورة.',
  'موعد أفضل للسفر':   'أفضل وقت للانطلاق بعد 45 دقيقة. ستوفر 12 دقيقة وتقلل استهلاك الوقود 23%.',
};

function getMockResponse(text) {
  const key = Object.keys(MOCK_RESPONSES).find(k => text.includes(k.slice(0, 5)));
  return key
    ? MOCK_RESPONSES[key]
    : 'جارٍ تحليل طلبك... أنصحك بالمسار الأخضر عبر الدائري لتوفير الوقت والوقود.';
}

export default function VoiceAssistant({ onClose }) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript]   = useState('');
  const [response, setResponse]       = useState('');
  const [pulse, setPulse]             = useState(false);
  const [supported, setSupported]     = useState(!!SpeechRecognition);
  const [loading, setLoading]         = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) recognitionRef.current.abort();
    };
  }, []);

  const processQuery = useCallback(async (text) => {
    setLoading(true);
    try {
      // [API] استبدل هذا بـ:
      // const { response } = await voiceAPI.query(text, {});
      // setResponse(response);
      await new Promise(r => setTimeout(r, 700));
      setResponse(getMockResponse(text));
    } catch {
      setResponse('عذراً، حدث خطأ في معالجة طلبك. حاول مرة أخرى.');
    }
    setLoading(false);
  }, []);

  const startListening = useCallback(() => {
    if (!SpeechRecognition) {
      setSupported(false);
      return;
    }
    setTranscript('');
    setResponse('');
    const recognition = new SpeechRecognition();
    recognition.lang = 'ar-SA';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognitionRef.current = recognition;

    recognition.onstart = () => { setIsListening(true); setPulse(true); };
    recognition.onend   = () => { setIsListening(false); setPulse(false); };
    recognition.onerror = (e) => {
      setIsListening(false);
      setPulse(false);
      if (e.error === 'not-allowed') {
        setResponse('يرجى السماح بالوصول للميكروفون من إعدادات المتصفح.');
      }
    };
    recognition.onresult = (e) => {
      const text = e.results[0][0].transcript;
      setTranscript(text);
      processQuery(text);
    };
    recognition.start();
  }, [processQuery]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) recognitionRef.current.stop();
    setIsListening(false);
    setPulse(false);
  }, []);

  const handleQuick = useCallback((cmd) => {
    setTranscript(cmd);
    setResponse('');
    processQuery(cmd);
  }, [processQuery]);

  return (
    <div className={styles.overlay}>
      <div className={styles.panel}>
        <div className={styles.header}>
          <div className={styles.title}>🎙 المساعد الصوتي</div>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>
        <div className={styles.body}>
          {/* Mic */}
          <div className={styles.micWrap}>
            <div className={styles.micRing + (pulse ? ' ' + styles.micRingPulse : '')}>
              <div className={styles.micRing2 + (pulse ? ' ' + styles.micRing2Pulse : '')}>
                <button
                  className={styles.micBtn + (isListening ? ' ' + styles.micBtnActive : '')}
                  onClick={isListening ? stopListening : startListening}
                  title={supported ? 'اضغط للتحدث' : 'المتصفح لا يدعم التعرف على الكلام'}
                >
                  {isListening ? '⏹' : '🎙'}
                </button>
              </div>
            </div>
          </div>

          {!supported && (
            <div className={styles.unsupported}>
              ⚠️ متصفحك لا يدعم التعرف على الكلام. استخدم Chrome أو Edge.
            </div>
          )}

          <div className={styles.status}>
            {isListening
              ? '🔴 جارٍ الاستماع... تحدث الآن'
              : transcript
              ? '✓ تم التعرف على الأمر'
              : supported ? 'اضغط للتحدث' : 'استخدم الأوامر السريعة أدناه'}
          </div>

          {transcript && (
            <div className={styles.transcript}>
              <span className={styles.transcriptLabel}>أنت قلت:</span>
              <span className={styles.transcriptText}>"{transcript}"</span>
            </div>
          )}

          {loading && (
            <div className={styles.response}>
              <span className={styles.responseIcon}>⏳</span>
              <span className={styles.responseText}>جارٍ التحليل...</span>
            </div>
          )}

          {response && !loading && (
            <div className={styles.response}>
              <span className={styles.responseIcon}>🤖</span>
              <span className={styles.responseText}>{response}</span>
            </div>
          )}

          <div className={styles.quickCmds}>
            <div className={styles.quickLabel}>أوامر سريعة</div>
            {QUICK_CMDS.map(cmd => (
              <button key={cmd} className={styles.quickBtn} onClick={() => handleQuick(cmd)}>
                {cmd}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
