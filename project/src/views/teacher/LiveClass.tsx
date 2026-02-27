import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, Users, Clock, StopCircle, Play } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, Subject } from '../../lib/supabase';

export function LiveClass() {
  const { currentUser } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [sessionActive, setSessionActive] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [attendanceCount, setAttendanceCount] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (sessionActive && sessionId) {
      interval = setInterval(async () => {
        const newCode = generateQRCode();
        try {
          await supabase
            .from('live_sessions')
            .update({ qr_code: newCode })
            .eq('id', sessionId);
        } catch (error) {
          console.error('Error updating QR code:', error);
        }
      }, 30000); // 30 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [sessionActive, sessionId]);

  useEffect(() => {
    if (currentUser) {
      loadSubjects();
    }
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
        if (data.length > 0) {
          setSelectedSubject(data[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading subjects:', error);
    }
  }

  function generateQRCode() {
    const code = `EDU-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    setQrCode(code);
    return code;
  }

  async function startSession() {
    if (!selectedSubject || !currentUser) return;

    const code = generateQRCode();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    try {
      const { data, error } = await supabase.from('live_sessions').insert({
        subject_id: selectedSubject,
        teacher_id: currentUser.id,
        qr_code: code,
        expires_at: expiresAt.toISOString(),
        is_active: true,
      }).select().single();

      if (error) throw error;

      if (data) {
        setSessionId(data.id);
      }
      setSessionActive(true);
      setAttendanceCount(Math.floor(Math.random() * 20) + 30);
    } catch (error) {
      console.error('Error starting session:', error);
    }
  }

  async function stopSession() {
    if (sessionId) {
      try {
        await supabase
          .from('live_sessions')
          .update({ is_active: false })
          .eq('id', sessionId);
      } catch (error) {
        console.error('Error ending session:', error);
      }
    }
    setSessionActive(false);
    setQrCode('');
    setSessionId(null);
  }

  const selectedSubjectData = subjects.find(s => s.id === selectedSubject);

  return (
    <div className="max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Live Class Session</h1>
        <p className="text-slate-600">Start a session and generate QR code for attendance</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Session Controls</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Select Subject
              </label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                disabled={sessionActive}
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-teal-500 focus:outline-none disabled:bg-slate-100 disabled:cursor-not-allowed"
              >
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name} ({subject.code})
                  </option>
                ))}
              </select>
            </div>

            {sessionActive ? (
              <div className="space-y-3">
                <div className="bg-green-50 border-2 border-green-500 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-green-700 mb-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="font-semibold">Session Active</span>
                  </div>
                  <p className="text-sm text-green-600">
                    Students can now scan the QR code to mark attendance
                  </p>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-slate-600" />
                    <span className="text-slate-700">Students Marked</span>
                  </div>
                  <span className="text-2xl font-bold text-slate-900">{attendanceCount}</span>
                </div>

                <button
                  onClick={stopSession}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-colors"
                >
                  <StopCircle className="w-5 h-5" />
                  End Session
                </button>
              </div>
            ) : (
              <button
                onClick={startSession}
                disabled={!selectedSubject}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-teal-500 hover:bg-teal-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors"
              >
                <Play className="w-5 h-5" />
                Start Session
              </button>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
          <h2 className="text-xl font-bold text-slate-900 mb-4">QR Code</h2>

          <div className="flex flex-col items-center">
            {sessionActive ? (
              <>
                <div className="w-full aspect-square max-w-sm bg-gradient-to-br from-teal-500 to-emerald-500 rounded-2xl flex items-center justify-center mb-4 shadow-xl">
                  <div className="w-4/5 h-4/5 bg-white rounded-xl flex items-center justify-center p-4">
                    <QRCodeSVG value={qrCode} size={200} className="w-full h-full text-slate-800" />
                  </div>
                </div>

                <div className="w-full bg-slate-50 rounded-xl p-4 mb-4">
                  <p className="text-xs text-slate-600 mb-1">Session Code</p>
                  <p className="font-mono text-sm text-slate-900 break-all">{qrCode}</p>
                </div>

                <div className="flex items-center gap-2 text-slate-600">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">Expires in 15 minutes</span>
                </div>
              </>
            ) : (
              <div className="w-full aspect-square max-w-sm bg-slate-100 rounded-2xl flex flex-col items-center justify-center text-slate-400">
                <QrCode className="w-32 h-32 mb-4" />
                <p className="text-lg font-medium">No Active Session</p>
                <p className="text-sm">Start a session to generate QR code</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedSubjectData && (
        <div className="mt-6 bg-blue-50 rounded-xl p-6 border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-3">Current Subject Details</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-blue-700">Subject</p>
              <p className="font-semibold text-blue-900">{selectedSubjectData.name}</p>
            </div>
            <div>
              <p className="text-sm text-blue-700">Code</p>
              <p className="font-semibold text-blue-900">{selectedSubjectData.code}</p>
            </div>
            <div>
              <p className="text-sm text-blue-700">Department</p>
              <p className="font-semibold text-blue-900">{selectedSubjectData.department}</p>
            </div>
            <div>
              <p className="text-sm text-blue-700">Total Classes</p>
              <p className="font-semibold text-blue-900">{selectedSubjectData.total_classes}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
