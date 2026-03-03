import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, MapPin, BookOpen, CheckCircle, Circle, QrCode, ScanFace, XCircle, Camera } from 'lucide-react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, CurriculumTopic } from '../../lib/supabase';
import * as faceapi from 'face-api.js';

type SubjectSessionProps = {
    subjectId: string;
    subjectName: string;
    subjectCode: string;
    roomNumber: string;
    onBack: () => void;
};

export function SubjectSession({ subjectId, subjectName, subjectCode, roomNumber, onBack }: SubjectSessionProps) {
    const { currentUser } = useAuth();

    // Live session
    const [isLive, setIsLive] = useState(false);

    // Curriculum
    const [topics, setTopics] = useState<CurriculumTopic[]>([]);
    const [loadingTopics, setLoadingTopics] = useState(true);

    // Attendance
    const [attendanceStatus, setAttendanceStatus] = useState<'idle' | 'scanning_qr' | 'scanning_face' | 'verifying' | 'success' | 'error' | 'already_marked'>('idle');
    const [errorMessage, setErrorMessage] = useState('');
    const [modelsLoaded, setModelsLoaded] = useState(false);

    // Refs for scan lock
    const isProcessingRef = useRef(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    // Load face models if user has face enrolled
    useEffect(() => {
        if (currentUser?.face_descriptor) {
            Promise.all([
                faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
                faceapi.nets.faceLandmark68TinyNet.loadFromUri('/models'),
                faceapi.nets.faceRecognitionNet.loadFromUri('/models')
            ]).then(() => setModelsLoaded(true))
                .catch(err => console.error("Face models failed:", err));
        }
    }, [currentUser]);

    // Check live session + realtime
    useEffect(() => {
        checkLiveSession();
        const channel = supabase
            .channel(`live_session_${subjectId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'live_sessions', filter: `subject_id=eq.${subjectId}` }, () => {
                checkLiveSession();
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [subjectId]);

    // Load curriculum topics
    useEffect(() => {
        loadTopics();
    }, [subjectId]);

    // Check if attendance already marked today
    useEffect(() => {
        checkTodayAttendance();
    }, [subjectId, currentUser]);

    // Cleanup camera on unmount
    useEffect(() => {
        return () => { stopCamera(); };
    }, []);

    async function checkLiveSession() {
        const { data } = await supabase
            .from('live_sessions')
            .select('id, qr_code')
            .eq('subject_id', subjectId)
            .eq('is_active', true)
            .limit(1)
            .maybeSingle();

        if (data) {
            setIsLive(true);
        } else {
            setIsLive(false);
        }
    }

    async function checkTodayAttendance() {
        if (!currentUser) return;
        const today = new Date().toISOString().split('T')[0];
        const { data } = await supabase
            .from('attendance_records')
            .select('id')
            .eq('student_id', currentUser.id)
            .eq('subject_id', subjectId)
            .eq('class_date', today)
            .maybeSingle();

        if (data) {
            setAttendanceStatus('already_marked');
        }
    }

    async function loadTopics() {
        setLoadingTopics(true);
        const { data } = await supabase
            .from('curriculum_topics')
            .select('*')
            .eq('subject_id', subjectId)
            .order('order_number');

        if (data) setTopics(data);
        setLoadingTopics(false);
    }

    // ── QR Scan ───────────────────────────────────────────
    const handleQRScan = async (detectedCodes: any[]) => {
        if (detectedCodes.length === 0 || !currentUser || isProcessingRef.current) return;
        isProcessingRef.current = true;
        setAttendanceStatus('verifying');

        const qrText = detectedCodes[0].rawValue;
        try {
            const { data: session } = await supabase
                .from('live_sessions')
                .select('*')
                .eq('qr_code', qrText)
                .eq('is_active', true)
                .eq('subject_id', subjectId)
                .single();

            if (!session) {
                setErrorMessage('Invalid QR code or session has expired.');
                setAttendanceStatus('error');
                return;
            }

            await insertAttendance();
        } catch {
            setErrorMessage('QR verification failed.');
            setAttendanceStatus('error');
        } finally {
            setTimeout(() => { isProcessingRef.current = false; }, 3000);
        }
    };

    // ── Face Verify ───────────────────────────────────────
    function startFaceScan() {
        setAttendanceStatus('scanning_face');
        navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 320 }, height: { ideal: 240 }, facingMode: 'user' }
        })
            .then(stream => {
                streamRef.current = stream;
                if (videoRef.current) videoRef.current.srcObject = stream;
            })
            .catch(() => {
                setErrorMessage('Camera access denied.');
                setAttendanceStatus('error');
            });
    }

    async function verifyFace() {
        if (!videoRef.current || !currentUser?.face_descriptor) return;
        setAttendanceStatus('verifying');

        try {
            // Wait for video to be ready
            const video = videoRef.current!;
            if (video.readyState < 2) {
                await new Promise<void>((resolve) => {
                    video.onloadeddata = () => resolve();
                    setTimeout(resolve, 2000); // fallback timeout
                });
            }

            // Snapshot to small canvas for fast processing
            const canvas = document.createElement('canvas');
            canvas.width = 320;
            canvas.height = 240;
            canvas.getContext('2d')!.drawImage(video, 0, 0, 320, 240);

            const detection = await faceapi.detectSingleFace(
                canvas,
                new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.4 })
            )
                .withFaceLandmarks(true)
                .withFaceDescriptor();

            if (!detection) {
                setErrorMessage('No face detected. Look directly at the camera.');
                setAttendanceStatus('error');
                return;
            }

            const distance = faceapi.euclideanDistance(
                new Float32Array(currentUser.face_descriptor),
                detection.descriptor
            );

            if (distance <= 0.55) {
                stopCamera();
                await insertAttendance();
            } else {
                setErrorMessage('Face does not match enrolled student.');
                setAttendanceStatus('error');
            }
        } catch (err: any) {
            setErrorMessage(err.message || 'Face verification failed.');
            setAttendanceStatus('error');
        }
    }

    async function insertAttendance() {
        if (!currentUser) return;
        const today = new Date().toISOString().split('T')[0];

        const { error } = await supabase.from('attendance_records').insert({
            student_id: currentUser.id,
            subject_id: subjectId,
            class_date: today,
            status: 'present',
            marked_by: currentUser.id,
        });

        if (error) {
            if (error.code === '23505') {
                setAttendanceStatus('already_marked');
            } else {
                setErrorMessage('Failed to save attendance.');
                setAttendanceStatus('error');
            }
        } else {
            setAttendanceStatus('success');
        }
    }

    function stopCamera() {
        streamRef.current?.getTracks().forEach(t => t.stop());
        streamRef.current = null;
        if (videoRef.current) videoRef.current.srcObject = null;
    }

    function resetAttendance() {
        stopCamera();
        isProcessingRef.current = false;
        setAttendanceStatus('idle');
        setErrorMessage('');
    }

    // ── Curriculum helpers ────────────────────────────────
    const completedCount = topics.filter(t => t.status === 'completed').length;
    const progressPercent = topics.length > 0 ? Math.round((completedCount / topics.length) * 100) : 0;
    const currentTopic = topics.find(t => t.status === 'in_progress') || topics.find(t => t.status === 'pending');
    const upcomingTopics = topics.filter(t => t.status !== 'completed').slice(0, 3);

    // Color from code hash
    function getColor(code: string) {
        const colors = [
            'from-blue-600 to-cyan-500',
            'from-teal-600 to-emerald-500',
            'from-violet-600 to-purple-500',
            'from-orange-600 to-red-500',
            'from-pink-600 to-rose-500',
            'from-indigo-600 to-blue-500',
        ];
        const hash = code.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
        return colors[hash % colors.length];
    }

    return (
        <div className="max-w-2xl mx-auto pb-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                        <ArrowLeft className="w-5 h-5 text-slate-600" />
                    </button>
                    <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            {isLive ? 'Live Class' : 'Class Details'}
                        </p>
                        <h1 className="text-xl font-bold text-slate-900">{subjectCode}</h1>
                    </div>
                </div>
                {isLive && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-full">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-xs font-bold text-green-700">LIVE</span>
                    </div>
                )}
            </div>

            {/* Subject Banner */}
            <div className={`bg-gradient-to-br ${getColor(subjectCode)} rounded-2xl p-6 text-white mb-6 shadow-lg`}>
                <h2 className="text-2xl font-bold mb-1">{subjectName}</h2>
                <p className="text-white/80 text-sm mb-4">{subjectCode}</p>
                <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-xl px-4 py-2.5">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm font-medium">Room</span>
                    <span className="font-bold">{roomNumber}</span>
                </div>
            </div>

            {/* Today's Concept */}
            {currentTopic && (
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200 mb-6">
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-amber-50 rounded-xl">
                                <BookOpen className="w-5 h-5 text-amber-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900">Today's Concept</h3>
                                <p className="text-xs text-slate-500">Topic #{currentTopic.order_number}</p>
                            </div>
                        </div>
                        <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">Up Next</span>
                    </div>
                    <h4 className="text-lg font-semibold text-slate-800 mb-1">
                        {subjectName} - {currentTopic.title}
                    </h4>
                    <p className="text-sm text-slate-500">{currentTopic.description}</p>
                </div>
            )}

            {/* Curriculum Progress */}
            {!loadingTopics && topics.length > 0 && (
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200 mb-6">
                    <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-blue-50 rounded-xl">
                                <BookOpen className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900">Curriculum Progress</h3>
                                <p className="text-xs text-slate-500">{completedCount} of {topics.length} topics completed</p>
                            </div>
                        </div>
                        <span className="text-2xl font-bold text-blue-600">{progressPercent}%</span>
                    </div>

                    <div className="mt-4 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div
                            className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full rounded-full transition-all duration-500"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>

                    {upcomingTopics.length > 0 && (
                        <div className="mt-5">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Coming Up</p>
                            <div className="space-y-2.5">
                                {upcomingTopics.map(topic => (
                                    <div key={topic.id} className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-xl">
                                        <span className="text-xs font-mono text-slate-400 w-6">#{topic.order_number}</span>
                                        <span className="text-sm text-slate-700">{subjectName} - {topic.title}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Attendance Section */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
                {attendanceStatus === 'success' || attendanceStatus === 'already_marked' ? (
                    <div className="flex flex-col items-center py-6">
                        <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
                        <h3 className="text-xl font-bold text-green-700 mb-1">You're Marked Present!</h3>
                        <p className="text-sm text-slate-500">Your attendance has been recorded successfully.</p>
                    </div>
                ) : attendanceStatus === 'error' ? (
                    <div className="flex flex-col items-center py-6">
                        <XCircle className="w-16 h-16 text-red-500 mb-4" />
                        <h3 className="text-xl font-bold text-red-700 mb-1">Verification Failed</h3>
                        <p className="text-sm text-slate-500 mb-4">{errorMessage}</p>
                        <button onClick={resetAttendance} className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors">
                            Try Again
                        </button>
                    </div>
                ) : attendanceStatus === 'scanning_qr' ? (
                    <div>
                        <h3 className="font-bold text-slate-900 mb-4 text-center">Scan QR Code</h3>
                        <div className="w-64 h-64 mx-auto rounded-2xl overflow-hidden border-4 border-blue-500 bg-slate-900 mb-4">
                            <Scanner
                                onScan={handleQRScan}
                                onError={(err) => {
                                    setErrorMessage(err instanceof Error ? err.message : String(err));
                                    setAttendanceStatus('error');
                                }}
                                styles={{ container: { width: '100%', height: '100%' } }}
                            />
                        </div>
                        <button onClick={resetAttendance} className="w-full py-2.5 text-slate-600 hover:bg-slate-50 font-medium rounded-xl transition-colors">
                            Cancel
                        </button>
                    </div>
                ) : attendanceStatus === 'scanning_face' ? (
                    <div>
                        <h3 className="font-bold text-slate-900 mb-4 text-center">Face Verification</h3>
                        <div className="w-64 h-64 mx-auto rounded-2xl overflow-hidden border-4 border-blue-500 bg-slate-100 relative mb-4">
                            <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                        </div>
                        <div className="flex gap-3">
                            <button onClick={resetAttendance} className="flex-1 py-2.5 text-slate-600 hover:bg-slate-50 font-medium rounded-xl transition-colors">
                                Cancel
                            </button>
                            <button
                                onClick={verifyFace}
                                disabled={!modelsLoaded}
                                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                            >
                                <Camera className="w-4 h-4" />
                                Verify
                            </button>
                        </div>
                    </div>
                ) : attendanceStatus === 'verifying' ? (
                    <div className="flex flex-col items-center py-8">
                        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
                        <p className="text-slate-600 font-medium">Verifying...</p>
                    </div>
                ) : (
                    /* idle — show mark attendance options */
                    <div>
                        <h3 className="font-bold text-slate-900 mb-1 text-center">Mark Attendance</h3>
                        <p className="text-sm text-slate-500 mb-5 text-center">Choose your verification method</p>
                        {!isLive ? (
                            <div className="text-center py-4">
                                <Circle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                                <p className="text-sm text-slate-400">No live session right now. Attendance can be marked only when the class is live.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => setAttendanceStatus('scanning_qr')}
                                    className="flex flex-col items-center gap-3 p-5 bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 rounded-2xl transition-all group"
                                >
                                    <div className="p-3 bg-blue-100 group-hover:bg-blue-200 rounded-xl transition-colors">
                                        <QrCode className="w-7 h-7 text-blue-600" />
                                    </div>
                                    <span className="font-semibold text-blue-700 text-sm">QR Code</span>
                                </button>
                                {currentUser?.face_descriptor && (
                                    <button
                                        onClick={startFaceScan}
                                        className="flex flex-col items-center gap-3 p-5 bg-violet-50 hover:bg-violet-100 border-2 border-violet-200 rounded-2xl transition-all group"
                                    >
                                        <div className="p-3 bg-violet-100 group-hover:bg-violet-200 rounded-xl transition-colors">
                                            <ScanFace className="w-7 h-7 text-violet-600" />
                                        </div>
                                        <span className="font-semibold text-violet-700 text-sm">Face ID</span>
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
