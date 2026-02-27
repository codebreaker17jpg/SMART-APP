import { useEffect, useRef, useState } from 'react';
import { Camera, CheckCircle, Upload, ScanFace, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import * as faceapi from 'face-api.js';

export function FaceEnrollment() {
    const { currentUser } = useAuth();
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [loadingModels, setLoadingModels] = useState(true);
    const [status, setStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        loadModels();
    }, []);

    async function loadModels() {
        try {
            await Promise.all([
                faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
                faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
                faceapi.nets.faceRecognitionNet.loadFromUri('/models')
            ]);
            setLoadingModels(false);
            startVideo();
        } catch (err) {
            console.error('Failed to load models:', err);
            setErrorMessage('Failed to load face detection models. Please check your connection.');
            setStatus('error');
        }
    }

    const startVideo = () => {
        navigator.mediaDevices.getUserMedia({ video: {} })
            .then(stream => {
                streamRef.current = stream;
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            })
            .catch(err => {
                console.error("Camera access denied:", err);
                setErrorMessage("Camera access is required for face enrollment.");
                setStatus('error');
            });
    };

    const stopVideo = () => {
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

    // Cleanup camera track on unmount
    useEffect(() => {
        return () => {
            stopVideo();
        };
    }, []);

    const captureAndEnroll = async () => {
        if (!videoRef.current || !currentUser) return;

        setStatus('scanning');
        setErrorMessage('');

        try {
            // Small delay to let user stabilize
            await new Promise(resolve => setTimeout(resolve, 1000));

            const detection = await faceapi.detectSingleFace(videoRef.current)
                .withFaceLandmarks()
                .withFaceDescriptor();

            if (!detection) {
                throw new Error("No face detected. Please ensure your face is clearly visible in the frame.");
            }

            // The descriptor is a Float32Array of 128 elements
            const descriptorArray = Array.from(detection.descriptor);

            const { error } = await supabase
                .from('students')
                .update({ face_descriptor: descriptorArray })
                .eq('id', currentUser.id);

            if (error) throw error;

            setStatus('success');
            stopVideo();
        } catch (err: any) {
            console.error("Enrollment error:", err);
            setErrorMessage(err.message || 'An unexpected error occurred during face scan.');
            setStatus('error');
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 mb-2">Face Enrollment</h1>
                <p className="text-slate-600">Register your face to enable quick and secure attendance marking.</p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200">
                <div className="flex flex-col items-center">

                    <div className="relative mb-8 w-full max-w-sm aspect-[4/3] bg-slate-100 rounded-2xl overflow-hidden flex items-center justify-center">
                        {loadingModels ? (
                            <div className="flex flex-col items-center text-slate-500">
                                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                                Initializing Face AI...
                            </div>
                        ) : status === 'success' ? (
                            <div className="bg-green-50 w-full h-full flex flex-col items-center justify-center text-green-600 p-6 text-center">
                                <CheckCircle className="w-20 h-20 mb-4" />
                                <h3 className="text-xl font-bold">Enrollment Complete!</h3>
                                <p className="text-green-700 mt-2">Your face data has been securely saved.</p>
                            </div>
                        ) : (
                            <video
                                ref={videoRef}
                                autoPlay
                                muted
                                playsInline
                                className={`w-full h-full object-cover transition-opacity duration-300 ${status === 'scanning' ? 'opacity-50 grayscale' : 'opacity-100'}`}
                            />
                        )}

                        {status === 'scanning' && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <ScanFace className="w-16 h-16 text-blue-500 animate-pulse" />
                            </div>
                        )}
                    </div>

                    {status === 'error' && (
                        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl flex gap-3 text-left w-full max-w-sm">
                            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <p className="text-sm">{errorMessage}</p>
                        </div>
                    )}

                    {!loadingModels && status !== 'success' && (
                        <button
                            onClick={captureAndEnroll}
                            disabled={status === 'scanning'}
                            className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-md transition-colors flex items-center gap-2"
                        >
                            <Camera className="w-5 h-5" />
                            {status === 'scanning' ? 'Scanning Face...' : 'Capture & Save'}
                        </button>
                    )}

                    {status === 'success' && (
                        <button
                            onClick={() => {
                                setStatus('idle');
                                startVideo();
                            }}
                            className="px-8 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors flex items-center gap-2"
                        >
                            <Upload className="w-5 h-5" />
                            Re-enroll Face
                        </button>
                    )}

                </div>
            </div>

            <div className="mt-8 bg-blue-50 rounded-xl p-6 border border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-2">Privacy Note</h3>
                <p className="text-blue-800 text-sm">
                    Your face image is never saved or transmitted. We only extract and store a mathematical representation (a list of numbers) that cannot be reverse-engineered into an image. This data is securely stored and exclusively used for attendance verification.
                </p>
            </div>

        </div>
    );
}
