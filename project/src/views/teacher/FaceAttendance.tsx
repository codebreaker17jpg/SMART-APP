import { useState, useEffect, useRef, useCallback } from 'react';
import { Camera, StopCircle, Users, CheckCircle, AlertCircle, ScanFace, UserCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, Subject } from '../../lib/supabase';
import * as faceapi from 'face-api.js';

// ── Types ────────────────────────────────────────────────────────────

interface EnrolledStudent {
  id: string;
  name: string;
  descriptor: Float32Array;
}

interface RecognisedStudent {
  id: string;
  name: string;
  confidence: number;
  markedAt: string;
}

const MATCH_THRESHOLD = 0.6; // Euclidean distance threshold (lower = stricter)
const DETECTION_INTERVAL_MS = 400;

// ── Component ────────────────────────────────────────────────────────

export function FaceAttendance() {
  const { currentUser } = useAuth();

  // Subject / session state
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionActive, setSessionActive] = useState(false);

  // Face detection state
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [enrolledStudents, setEnrolledStudents] = useState<EnrolledStudent[]>([]);
  const [recognisedStudents, setRecognisedStudents] = useState<RecognisedStudent[]>([]);
  const [error, setError] = useState('');


  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectionLoopRef = useRef<number | null>(null);
  const markedIdsRef = useRef<Set<string>>(new Set());

  // ── Load subjects ──────────────────────────────────────────────────

  useEffect(() => {
    if (currentUser) loadSubjects();
  }, [currentUser]);

  async function loadSubjects() {
    if (!currentUser) return;
    try {
      const { data } = await supabase
        .from('subjects')
        .select('*')
        .eq('teacher_id', currentUser.id)
        .order('name');
      if (data) {
        setSubjects(data);
        if (data.length > 0) setSelectedSubject(data[0].id);
      }
    } catch (err) {
      console.error('Error loading subjects:', err);
    }
  }

  // ── Load face-api.js models ────────────────────────────────────────

  async function loadModels() {
    if (modelsLoaded) return;
    setLoadingModels(true);
    try {
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
        faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
        faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
      ]);
      setModelsLoaded(true);
    } catch (err) {
      console.error('Failed to load face models:', err);
      setError('Failed to load face detection models. Check that /public/models/ exists.');
    } finally {
      setLoadingModels(false);
    }
  }

  // ── Fetch enrolled student descriptors ─────────────────────────────

  async function loadEnrolledStudents(_subjectId: string) {
    // Get students who are enrolled in this subject's department + semester
    // For simplicity, we fetch ALL students with a face_descriptor
    try {
      const { data, error: fetchErr } = await supabase
        .from('students')
        .select('id, name, face_descriptor')
        .not('face_descriptor', 'is', null);

      if (fetchErr) throw fetchErr;

      const enrolled: EnrolledStudent[] = (data || [])
        .filter((s: any) => s.face_descriptor && Array.isArray(s.face_descriptor) && s.face_descriptor.length === 128)
        .map((s: any) => ({
          id: s.id,
          name: s.name,
          descriptor: new Float32Array(s.face_descriptor),
        }));

      setEnrolledStudents(enrolled);
      return enrolled;
    } catch (err) {
      console.error('Error loading enrolled students:', err);
      setError('Failed to load student face data.');
      return [];
    }
  }

  // ── Start camera ───────────────────────────────────────────────────

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Camera access denied:', err);
      setError('Camera access is required for face attendance.');
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
  }

  // ── Face detection loop ────────────────────────────────────────────

  const runDetectionLoop = useCallback(
    (students: EnrolledStudent[], activeSessionId: string) => {
      if (!videoRef.current || !canvasRef.current) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;

      async function detect() {
        if (!video || video.paused || video.ended || !canvas) return;

        // Match canvas to video dimensions
        const displaySize = { width: video.videoWidth, height: video.videoHeight };
        if (displaySize.width === 0) {
          detectionLoopRef.current = window.setTimeout(detect, DETECTION_INTERVAL_MS);
          return;
        }
        faceapi.matchDimensions(canvas, displaySize);

        try {
          const detections = await faceapi
            .detectAllFaces(video, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
            .withFaceLandmarks()
            .withFaceDescriptors();

          const resized = faceapi.resizeResults(detections, displaySize);

          // Clear canvas
          const ctx = canvas.getContext('2d');
          if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);

          // Draw detections and match
          for (const detection of resized) {
            const box = detection.detection.box;
            let bestMatch: { student: EnrolledStudent; distance: number } | null = null;

            for (const student of students) {
              const distance = faceapi.euclideanDistance(
                Array.from(detection.descriptor),
                Array.from(student.descriptor)
              );
              if (distance < MATCH_THRESHOLD && (!bestMatch || distance < bestMatch.distance)) {
                bestMatch = { student, distance };
              }
            }

            if (ctx) {
              if (bestMatch) {
                // Recognised — green box
                const confidence = Math.round((1 - bestMatch.distance) * 100);
                ctx.strokeStyle = '#22c55e';
                ctx.lineWidth = 3;
                ctx.strokeRect(box.x, box.y, box.width, box.height);

                // Label
                const label = `${bestMatch.student.name} (${confidence}%)`;
                ctx.fillStyle = '#22c55e';
                ctx.fillRect(box.x, box.y - 28, ctx.measureText(label).width + 16, 28);
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 14px Inter, sans-serif';
                ctx.fillText(label, box.x + 8, box.y - 8);

                // Mark attendance (if not already done this session)
                if (!markedIdsRef.current.has(bestMatch.student.id)) {
                  markedIdsRef.current.add(bestMatch.student.id);
                  markAttendance(bestMatch.student, activeSessionId, 1 - bestMatch.distance);
                }
              } else {
                // Unknown — amber box
                ctx.strokeStyle = '#f59e0b';
                ctx.lineWidth = 2;
                ctx.strokeRect(box.x, box.y, box.width, box.height);

                const unknownLabel = 'Unknown';
                ctx.fillStyle = '#f59e0b';
                ctx.fillRect(box.x, box.y - 28, ctx.measureText(unknownLabel).width + 16, 28);
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 14px Inter, sans-serif';
                ctx.fillText(unknownLabel, box.x + 8, box.y - 8);
              }
            }
          }
        } catch (err) {
          console.error('Detection error:', err);
        }

        detectionLoopRef.current = window.setTimeout(detect, DETECTION_INTERVAL_MS);
      }

      detect();
    },
    []
  );

  // ── Mark attendance in DB ──────────────────────────────────────────

  async function markAttendance(student: EnrolledStudent, activeSessionId: string, confidence: number) {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Check for existing attendance today (client-side safety net)
      const { data: existing } = await supabase
        .from('attendance_records')
        .select('id')
        .eq('student_id', student.id)
        .eq('subject_id', selectedSubject)
        .eq('class_date', today);

      if (existing && existing.length > 0) return;

      // Insert attendance
      const { error: insertErr } = await supabase
        .from('attendance_records')
        .insert({
          student_id: student.id,
          subject_id: selectedSubject,
          class_date: today,
          status: 'present',
          marked_by: currentUser?.id,
          verification_method: 'face',
          session_id: activeSessionId,
        });

      if (insertErr) {
        console.error('Failed to mark attendance:', insertErr);
        return;
      }

      setRecognisedStudents(prev => [
        ...prev,
        {
          id: student.id,
          name: student.name,
          confidence: Math.round(confidence * 100),
          markedAt: new Date().toLocaleTimeString(),
        },
      ]);
    } catch (err) {
      console.error('Error marking attendance:', err);
    }
  }

  // ── Start session ──────────────────────────────────────────────────

  async function startSession() {
    if (!selectedSubject || !currentUser) return;
    setError('');

    // Load models first
    await loadModels();
    if (!modelsLoaded && !loadingModels) return; // models failed

    // Deactivate old sessions
    await supabase
      .from('live_sessions')
      .update({ is_active: false })
      .eq('teacher_id', currentUser.id)
      .eq('is_active', true);

    // Create a new live session
    const code = `FACE-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 2);

    try {
      const { data, error: sessionErr } = await supabase
        .from('live_sessions')
        .insert({
          subject_id: selectedSubject,
          teacher_id: currentUser.id,
          qr_code: code,
          expires_at: expiresAt.toISOString(),
          is_active: true,
        })
        .select()
        .single();

      if (sessionErr) throw sessionErr;
      if (!data) throw new Error('No session returned');

      setSessionId(data.id);
      setSessionActive(true);
      setRecognisedStudents([]);
      markedIdsRef.current.clear();

      // Load enrolled students
      const enrolled = await loadEnrolledStudents(selectedSubject);

      if (enrolled.length === 0) {
        setError('No students have enrolled their face yet. Students must complete Face Enrollment first.');
      }

      // Start camera and detection
      await startCamera();

      // Wait for video to be ready
      if (videoRef.current) {
        videoRef.current.addEventListener('loadeddata', () => {
          runDetectionLoop(enrolled, data.id);
        }, { once: true });
      }
    } catch (err) {
      console.error('Error starting face session:', err);
      setError('Failed to start face attendance session.');
    }
  }

  // ── Stop session ───────────────────────────────────────────────────

  async function stopSession() {
    // Stop detection loop
    if (detectionLoopRef.current) {
      clearTimeout(detectionLoopRef.current);
      detectionLoopRef.current = null;
    }

    // Clear canvas
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }

    // Stop camera
    stopCamera();

    // Deactivate session in DB
    if (sessionId) {
      await supabase
        .from('live_sessions')
        .update({ is_active: false })
        .eq('id', sessionId);
    }

    setSessionActive(false);
    setSessionId(null);
  }

  // ── Cleanup on unmount ─────────────────────────────────────────────

  useEffect(() => {
    return () => {
      if (detectionLoopRef.current) clearTimeout(detectionLoopRef.current);
      stopCamera();
    };
  }, []);

  // ── Derived data ───────────────────────────────────────────────────

  const selectedSubjectData = subjects.find(s => s.id === selectedSubject);

  // ── Render ─────────────────────────────────────────────────────────

  return (
    <div className="max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Face Recognition Attendance</h1>
        <p className="text-slate-600">
          Automatically mark attendance by recognising student faces in real-time
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left: Camera Feed ──────────────────────────────────────── */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
            {/* Controls bar */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Select Subject</label>
                <select
                  value={selectedSubject}
                  onChange={e => setSelectedSubject(e.target.value)}
                  disabled={sessionActive}
                  className="px-4 py-2 rounded-xl border-2 border-slate-200 focus:border-teal-500 focus:outline-none disabled:bg-slate-100 disabled:cursor-not-allowed text-sm"
                >
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>

              {sessionActive ? (
                <button
                  onClick={stopSession}
                  className="flex items-center gap-2 px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-colors"
                >
                  <StopCircle className="w-5 h-5" />
                  Stop Attendance
                </button>
              ) : (
                <button
                  onClick={startSession}
                  disabled={!selectedSubject || loadingModels}
                  className="flex items-center gap-2 px-5 py-2.5 bg-teal-500 hover:bg-teal-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors"
                >
                  {loadingModels ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Loading AI...
                    </>
                  ) : (
                    <>
                      <Camera className="w-5 h-5" />
                      Start Face Attendance
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Camera view */}
            <div className="relative aspect-video bg-slate-900 flex items-center justify-center">
              {sessionActive ? (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full"
                  />
                  {/* Live indicator */}
                  <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full">
                    <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-white text-sm font-medium">LIVE</span>
                  </div>
                  {/* Enrolled count */}
                  <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full">
                    <Users className="w-4 h-4 text-white" />
                    <span className="text-white text-sm">{enrolledStudents.length} enrolled faces</span>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center text-slate-500">
                  <ScanFace className="w-24 h-24 mb-4 text-slate-400" />
                  <p className="text-lg font-medium">Camera Inactive</p>
                  <p className="text-sm text-slate-400 mt-1">Select a subject and start face attendance</p>
                </div>
              )}
            </div>
          </div>

          {/* Subject info */}
          {selectedSubjectData && (
            <div className="mt-4 bg-blue-50 rounded-xl p-4 border border-blue-200">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div>
                  <p className="text-blue-700">Subject</p>
                  <p className="font-semibold text-blue-900">{selectedSubjectData.name}</p>
                </div>
                <div>
                  <p className="text-blue-700">Code</p>
                  <p className="font-semibold text-blue-900">{selectedSubjectData.code}</p>
                </div>
                <div>
                  <p className="text-blue-700">Department</p>
                  <p className="font-semibold text-blue-900">{selectedSubjectData.department}</p>
                </div>
                <div>
                  <p className="text-blue-700">Total Classes</p>
                  <p className="font-semibold text-blue-900">{selectedSubjectData.total_classes}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Right: Recognised Students Panel ───────────────────────── */}
        <div className="space-y-4">
          {/* Stats */}
          <div className="bg-white rounded-2xl p-5 shadow-lg border border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 mb-3">Session Stats</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
                <div className="flex items-center gap-2 text-green-700">
                  <UserCheck className="w-5 h-5" />
                  <span className="text-sm font-medium">Marked Present</span>
                </div>
                <span className="text-2xl font-bold text-green-700">{recognisedStudents.length}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-2 text-slate-600">
                  <Users className="w-5 h-5" />
                  <span className="text-sm font-medium">Enrolled Faces</span>
                </div>
                <span className="text-xl font-bold text-slate-700">{enrolledStudents.length}</span>
              </div>

              {sessionActive && (
                <div className="flex items-center gap-2 p-3 bg-teal-50 rounded-xl text-teal-700">
                  <div className="w-2 h-2 bg-teal-500 rounded-full animate-pulse" />
                  <span className="text-sm">Scanning every {DETECTION_INTERVAL_MS}ms</span>
                </div>
              )}
            </div>
          </div>

          {/* Recognised students list */}
          <div className="bg-white rounded-2xl p-5 shadow-lg border border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 mb-3">Recognised Students</h2>

            {recognisedStudents.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <ScanFace className="w-12 h-12 mx-auto mb-2" />
                <p className="text-sm">
                  {sessionActive ? 'Waiting for faces...' : 'No students recognised yet'}
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {recognisedStudents.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center gap-3 p-3 bg-green-50 border border-green-100 rounded-xl animate-fade-in"
                  >
                    <div className="w-9 h-9 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 text-sm truncate">{student.name}</p>
                      <p className="text-xs text-slate-500">
                        {student.confidence}% match · {student.markedAt}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info card */}
          <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
            <h3 className="font-semibold text-amber-900 text-sm mb-1">How it works</h3>
            <ul className="text-xs text-amber-800 space-y-1">
              <li>• Students must enroll via <strong>Face Enrollment</strong> first</li>
              <li>• Match threshold: {Math.round((1 - MATCH_THRESHOLD) * 100)}% confidence</li>
              <li>• Each student is marked once per session</li>
              <li>• No face images are stored — only mathematical embeddings</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
