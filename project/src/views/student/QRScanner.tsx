import { useState, useRef, useEffect } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { QrCode, CheckCircle, XCircle, Camera, ScanFace } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import * as faceapi from 'face-api.js';

export function QRScanner() {
  const { currentUser } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<'success' | 'error' | 'verifying_face' | null>(null);
  const [faceMatchStatus, setFaceMatchStatus] = useState<'idle' | 'scanning' | 'match' | 'mismatch'>('idle');
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [pendingSession, setPendingSession] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState('Invalid QR code or session expired. Please try again.');

  useEffect(() => {
    if (currentUser?.face_descriptor) {
      Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
        faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
        faceapi.nets.faceRecognitionNet.loadFromUri('/models')
      ]).then(() => setModelsLoaded(true))
        .catch(err => console.error("Face models failed to load:", err));
    }
  }, [currentUser]);

  const handleScan = async (detectedCodes: any[]) => {
    if (detectedCodes.length === 0 || !currentUser) return;

    // Stop scanning once we get a code
    setScanning(false);

    const qrText = detectedCodes[0].rawValue;

    try {
      // 1. Validate the live session
      const { data: session, error: sessionError } = await supabase
        .from('live_sessions')
        .select('*')
        .eq('qr_code', qrText)
        .eq('is_active', true)
        .single();

      if (sessionError || !session) {
        setErrorMessage("This QR code is invalid or the session has expired.");
        setScanResult('error');
        return;
      }

      const today = new Date().toISOString().split('T')[0];

      // 2. Prevent duplicate markings for the same day and subject
      const { data: existingAttendance } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('student_id', currentUser.id)
        .eq('subject_id', session.subject_id)
        .eq('class_date', today)
        .single();

      if (existingAttendance) {
        setErrorMessage("You have already marked attendance for this class today!");
        setScanResult('error');
        return;
      }

      // If user has a face enrolled, trigger face verification step
      if (currentUser.face_descriptor) {
        setPendingSession(session);
        setScanResult('verifying_face');
        startCamera();
        return;
      }

      // 3. Mark Attendance (Legacy bypass if no face enrolled)
      const { error: insertError } = await supabase.from('attendance_records').insert({
        student_id: currentUser.id,
        subject_id: session.subject_id,
        class_date: today,
        status: 'present',
        marked_by: currentUser.id
      });

      if (insertError) throw insertError;

      setScanResult('success');
    } catch (err) {
      console.error('Error scanning QR:', err);
      setErrorMessage("An unexpected error occurred. Please try again.");
      setScanResult('error');
    }
  };

  const markAttendance = async (session: any) => {
    if (!currentUser) return;
    try {
      const today = new Date().toISOString().split('T')[0];
      const { error: insertError } = await supabase.from('attendance_records').insert({
        student_id: currentUser.id,
        subject_id: session.subject_id,
        class_date: today,
        status: 'present',
        marked_by: currentUser.id
      });

      if (insertError) throw insertError;
      setScanResult('success');
    } catch (err) {
      console.error('Error marking attendance:', err);
      setErrorMessage("Failed to save attendance record.");
      setScanResult('error');
    }
  };

  const startCamera = () => {
    navigator.mediaDevices.getUserMedia({ video: {} })
      .then(stream => {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch(err => {
        console.error("Camera access denied:", err);
        setErrorMessage("Camera access is required for face verification.");
        setScanResult('error');
      });
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // Cleanup on unmount or when transitioning away from scanning
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const verifyFace = async () => {
    if (!videoRef.current || !currentUser?.face_descriptor || !pendingSession) return;

    setFaceMatchStatus('scanning');
    setErrorMessage('');

    try {
      await new Promise(resolve => setTimeout(resolve, 800)); // stabilization time

      const detection = await faceapi.detectSingleFace(videoRef.current)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        throw new Error("No face detected. Please look directly at the camera.");
      }

      const distance = faceapi.euclideanDistance(
        new Float32Array(currentUser.face_descriptor),
        detection.descriptor
      );

      // 0.55 is a solid threshold for the 128-point face network
      if (distance <= 0.55) {
        setFaceMatchStatus('match');
        stopCamera();
        await markAttendance(pendingSession);
      } else {
        setFaceMatchStatus('mismatch');
        setErrorMessage("Face does not match the enrolled student.");
      }
    } catch (err: any) {
      setFaceMatchStatus('mismatch');
      setErrorMessage(err.message || "Face verification failed. Please try again.");
    }
  };

  const startScanning = () => {
    setScanResult(null);
    setFaceMatchStatus('idle');
    setScanning(true);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">QR Attendance Scanner</h1>
        <p className="text-slate-600">Scan the QR code displayed by your teacher to mark attendance</p>
      </div>

      <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200">
        <div className="flex flex-col items-center">
          <div className="relative mb-8 w-72 h-72 mx-auto">
            <div
              className={`w-full h-full rounded-2xl flex items-center justify-center transition-all overflow-hidden ${scanning
                ? 'bg-slate-900 border-4 border-blue-500'
                : scanResult === 'success'
                  ? 'bg-gradient-to-br from-green-500 to-emerald-500'
                  : scanResult === 'error'
                    ? 'bg-gradient-to-br from-red-500 to-orange-500'
                    : 'bg-slate-100'
                }`}
            >
              {scanning ? (
                <div className="w-full h-full relative">
                  <Scanner
                    onScan={handleScan}
                    components={{
                      onOff: false,
                      torch: false,
                      zoom: false,
                      finder: true
                    }}
                    styles={{
                      container: { width: '100%', height: '100%' }
                    }}
                  />
                </div>
              ) : scanResult === 'verifying_face' ? (
                <div className="w-full h-full relative bg-slate-100 flex items-center justify-center">
                  {!modelsLoaded ? (
                    <div className="flex flex-col items-center justify-center text-slate-500 w-full h-full bg-slate-100 absolute inset-0 z-10">
                      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                      <p className="text-sm">Loading Face AI...</p>
                    </div>
                  ) : null}
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className={`w-full h-full object-cover transition-opacity duration-300 ${faceMatchStatus === 'scanning' ? 'opacity-50 grayscale' : 'opacity-100'}`}
                  />
                  {faceMatchStatus === 'scanning' && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <ScanFace className="w-16 h-16 text-blue-500 animate-pulse" />
                    </div>
                  )}
                </div>
              ) : scanResult === 'success' ? (
                <CheckCircle className="w-32 h-32 text-white" />
              ) : scanResult === 'error' ? (
                <XCircle className="w-32 h-32 text-white" />
              ) : (
                <QrCode className="w-32 h-32 text-slate-400" />
              )}
            </div>

            {scanResult === 'success' && (
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-green-600 mb-2">Attendance Marked!</h3>
                <p className="text-slate-600">You've been marked present for this class</p>
              </div>
            )}

            {scanResult === 'error' && (
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-red-600 mb-2">Failed</h3>
                <p className="text-slate-600">{errorMessage}</p>
              </div>
            )}

            {scanResult === 'verifying_face' && faceMatchStatus !== 'match' && (
              <div className="text-center mb-6 px-4">
                <h3 className="text-xl font-bold text-blue-600 mb-2">Verify Identity</h3>
                <p className="text-slate-600 text-sm mb-4">
                  {faceMatchStatus === 'mismatch' ? <span className="text-red-500">{errorMessage}</span> : "Please look at the camera to verify your attendance."}
                </p>
                <button
                  onClick={verifyFace}
                  disabled={!modelsLoaded || faceMatchStatus === 'scanning'}
                  className={`px-6 py-3 w-full font-semibold text-white shadow-md rounded-xl transition-all flex items-center justify-center gap-2 ${!modelsLoaded || faceMatchStatus === 'scanning' ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                >
                  <Camera className="w-5 h-5" />
                  {faceMatchStatus === 'scanning' ? 'Verifying...' : 'Verify Face'}
                </button>
              </div>
            )}

            {!scanResult && !scanning && (
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold text-slate-900 mb-2">Ready to Scan</h3>
                <p className="text-slate-600">Click the button below to scan the QR code</p>
              </div>
            )}

            {!scanResult && (
              <button
                onClick={startScanning}
                disabled={scanning}
                className={`px-8 py-4 rounded-xl font-semibold text-white shadow-lg transition-all ${scanning
                  ? 'bg-slate-400 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600 hover:shadow-xl'
                  }`}
              >
                {scanning ? 'Scanning...' : 'Scan QR Code'}
              </button>
            )}

            {(scanResult === 'success' || scanResult === 'error') && (
              <button
                onClick={startScanning}
                className={`px-8 py-4 rounded-xl font-semibold text-white shadow-lg transition-all ${scanResult === 'error' ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
                  }`}
              >
                Scan Another QR Code
              </button>
            )}
          </div>
        </div>

        <div className="mt-8 bg-blue-50 rounded-xl p-6 border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-2">How to use:</h3>
          <ol className="list-decimal list-inside space-y-2 text-blue-800">
            <li>Make sure you're in the classroom when the teacher starts the session</li>
            <li>Click the "Scan QR Code" button</li>
            <li>Point your camera at the QR code displayed by the teacher</li>
            <li>Your attendance will be marked automatically</li>
          </ol>
        </div>

        <style>{`
          @keyframes scan {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(256px); }
          }
        `}</style>
      </div>
    </div>
  );
}
