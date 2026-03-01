import { useState, useRef, useCallback } from 'react';
import {
    UserPlus,
    Upload,
    CheckCircle,
    XCircle,
    FileSpreadsheet,
    Loader2,
    AlertTriangle,
    Users,
    GraduationCap,
    Briefcase,
    X,
} from 'lucide-react';

const API_BASE = 'http://localhost:8000';

type Role = 'student' | 'teacher';

interface FormData {
    name: string;
    email: string;
    password: string;
    roll_number: string;
    subject_major: string;
    department: string;
}

interface BulkResult {
    row: number;
    email: string;
    success: boolean;
    message: string;
}

interface BulkResponse {
    total: number;
    succeeded: number;
    failed: number;
    results: BulkResult[];
}

const initialForm: FormData = {
    name: '',
    email: '',
    password: '',
    roll_number: '',
    subject_major: '',
    department: '',
};

export function SystemAdminPortal() {
    const [activeTab, setActiveTab] = useState<'single' | 'bulk'>('single');
    const [role, setRole] = useState<Role>('student');
    const [form, setForm] = useState<FormData>(initialForm);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

    // Bulk upload state
    const [dragActive, setDragActive] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [bulkLoading, setBulkLoading] = useState(false);
    const [bulkResult, setBulkResult] = useState<BulkResponse | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    // ── Single User Creation ─────────────────────────────────────────────

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setResult(null);

        const payload: any = {
            email: form.email,
            password: form.password,
            role,
            name: form.name,
        };

        if (role === 'student') {
            payload.roll_number = form.roll_number;
            payload.subject_major = form.subject_major;
        } else {
            payload.department = form.department;
        }

        try {
            const res = await fetch(`${API_BASE}/api/v1/admin/users/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (res.ok) {
                setResult({ success: true, message: data.message });
                setForm(initialForm);
            } else {
                setResult({ success: false, message: data.detail || 'Creation failed.' });
            }
        } catch (err) {
            setResult({ success: false, message: 'Network error — is the backend running?' });
        } finally {
            setLoading(false);
        }
    };

    // ── Bulk CSV Upload ──────────────────────────────────────────────────

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
        else if (e.type === 'dragleave') setDragActive(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files?.[0]) {
            setSelectedFile(e.dataTransfer.files[0]);
            setBulkResult(null);
        }
    }, []);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            setSelectedFile(e.target.files[0]);
            setBulkResult(null);
        }
    };

    const handleBulkUpload = async () => {
        if (!selectedFile) return;
        setBulkLoading(true);
        setBulkResult(null);

        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            const res = await fetch(`${API_BASE}/api/v1/admin/users/bulk?role=${role}`, {
                method: 'POST',
                body: formData,
            });
            const data: BulkResponse = await res.json();
            setBulkResult(data);
        } catch {
            setBulkResult({ total: 0, succeeded: 0, failed: 0, results: [{ row: 0, email: '', success: false, message: 'Network error — is the backend running?' }] });
        } finally {
            setBulkLoading(false);
        }
    };

    // ── Render ───────────────────────────────────────────────────────────

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 mb-2 flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl text-white shadow-lg shadow-violet-200">
                        <Users className="w-7 h-7" />
                    </div>
                    User Management
                </h1>
                <p className="text-slate-500">Onboard students and teachers to the EduTrack platform</p>
            </div>

            {/* Role Toggle */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-2 mb-6 inline-flex gap-1">
                <button
                    onClick={() => { setRole('student'); setResult(null); setBulkResult(null); }}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${role === 'student'
                        ? 'bg-blue-500 text-white shadow-md shadow-blue-200'
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                        }`}
                >
                    <GraduationCap className="w-4 h-4" />
                    Student
                </button>
                <button
                    onClick={() => { setRole('teacher'); setResult(null); setBulkResult(null); }}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${role === 'teacher'
                        ? 'bg-teal-500 text-white shadow-md shadow-teal-200'
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                        }`}
                >
                    <Briefcase className="w-4 h-4" />
                    Teacher
                </button>
            </div>

            {/* Tab Switcher */}
            <div className="flex gap-4 mb-6">
                <button
                    onClick={() => setActiveTab('single')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border ${activeTab === 'single'
                        ? 'border-slate-300 bg-white text-slate-900 shadow-sm'
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                        }`}
                >
                    <UserPlus className="w-4 h-4" />
                    Create Single User
                </button>
                <button
                    onClick={() => setActiveTab('bulk')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border ${activeTab === 'bulk'
                        ? 'border-slate-300 bg-white text-slate-900 shadow-sm'
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                        }`}
                >
                    <Upload className="w-4 h-4" />
                    Bulk CSV Upload
                </button>
            </div>

            {/* ── Single User Form ──────────────────────────────────────────── */}
            {activeTab === 'single' && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                    <h2 className="text-lg font-semibold text-slate-800 mb-6">
                        New {role === 'student' ? 'Student' : 'Teacher'} Account
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Name */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
                            <input
                                id="user-name"
                                type="text"
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                required
                                placeholder="e.g. Arjun Singh"
                                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            />
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                            <input
                                id="user-email"
                                type="email"
                                name="email"
                                value={form.email}
                                onChange={handleChange}
                                required
                                placeholder="e.g. arjun@university.edu"
                                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                            <input
                                id="user-password"
                                type="password"
                                name="password"
                                value={form.password}
                                onChange={handleChange}
                                required
                                minLength={6}
                                placeholder="Minimum 6 characters"
                                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            />
                        </div>

                        {/* Role-specific fields */}
                        {role === 'student' ? (
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Roll Number</label>
                                        <input
                                            id="user-roll-number"
                                            type="text"
                                            name="roll_number"
                                            value={form.roll_number}
                                            onChange={handleChange}
                                            placeholder="e.g. PUN-071"
                                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Subject Major</label>
                                        <input
                                            id="user-subject-major"
                                            type="text"
                                            name="subject_major"
                                            value={form.subject_major}
                                            onChange={handleChange}
                                            placeholder="e.g. Computer Science"
                                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                        />
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Department</label>
                                <input
                                    id="user-department"
                                    type="text"
                                    name="department"
                                    value={form.department}
                                    onChange={handleChange}
                                    placeholder="e.g. Computer Science"
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                />
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white shadow-lg transition-all ${role === 'student'
                                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 shadow-blue-200'
                                : 'bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 shadow-teal-200'
                                } ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {loading ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</>
                            ) : (
                                <><UserPlus className="w-4 h-4" /> Create {role === 'student' ? 'Student' : 'Teacher'}</>
                            )}
                        </button>
                    </form>

                    {/* Result banner */}
                    {result && (
                        <div className={`mt-6 flex items-start gap-3 p-4 rounded-xl border ${result.success
                            ? 'bg-green-50 border-green-200 text-green-800'
                            : 'bg-red-50 border-red-200 text-red-800'
                            }`}>
                            {result.success
                                ? <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                                : <XCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />}
                            <p className="text-sm">{result.message}</p>
                        </div>
                    )}
                </div>
            )}

            {/* ── Bulk CSV Upload ───────────────────────────────────────────── */}
            {activeTab === 'bulk' && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                    <h2 className="text-lg font-semibold text-slate-800 mb-2">
                        Bulk Upload {role === 'student' ? 'Students' : 'Teachers'}
                    </h2>
                    <p className="text-sm text-slate-500 mb-6">
                        Upload a CSV file to create multiple accounts at once.
                    </p>

                    {/* CSV format guide */}
                    <div className="bg-slate-50 rounded-xl p-4 mb-6 border border-slate-200">
                        <p className="text-xs font-semibold text-slate-600 mb-2 flex items-center gap-1.5">
                            <FileSpreadsheet className="w-3.5 h-3.5" />
                            Expected CSV columns
                        </p>
                        <code className="text-xs text-slate-700 font-mono">
                            {role === 'student'
                                ? 'name, email, password, roll_number, subject_major'
                                : 'name, email, password, department'}
                        </code>
                    </div>

                    {/* Drop zone */}
                    <div
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`relative cursor-pointer border-2 border-dashed rounded-2xl p-10 text-center transition-all ${dragActive
                            ? 'border-blue-400 bg-blue-50/50'
                            : selectedFile
                                ? 'border-green-300 bg-green-50/30'
                                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                            }`}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".csv"
                            onChange={handleFileSelect}
                            className="hidden"
                        />

                        {selectedFile ? (
                            <div className="flex flex-col items-center gap-3">
                                <div className="p-3 bg-green-100 rounded-xl">
                                    <FileSpreadsheet className="w-8 h-8 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-900">{selectedFile.name}</p>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        {(selectedFile.size / 1024).toFixed(1)} KB — click or drop another to replace
                                    </p>
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setSelectedFile(null); setBulkResult(null); }}
                                    className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1"
                                >
                                    <X className="w-3 h-3" /> Remove
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-3">
                                <div className="p-3 bg-slate-100 rounded-xl">
                                    <Upload className="w-8 h-8 text-slate-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-700">Drag & drop your CSV file here</p>
                                    <p className="text-xs text-slate-400 mt-1">or click to browse</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Upload button */}
                    {selectedFile && !bulkResult && (
                        <button
                            onClick={handleBulkUpload}
                            disabled={bulkLoading}
                            className={`mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white shadow-lg transition-all ${role === 'student'
                                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 shadow-blue-200'
                                : 'bg-gradient-to-r from-teal-500 to-emerald-500 shadow-teal-200'
                                } ${bulkLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {bulkLoading
                                ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                                : <><Upload className="w-4 h-4" /> Upload & Create Users</>}
                        </button>
                    )}

                    {/* Bulk results */}
                    {bulkResult && (
                        <div className="mt-6 space-y-4">
                            {/* Summary bar */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="bg-slate-50 rounded-xl p-4 text-center border border-slate-200">
                                    <p className="text-2xl font-bold text-slate-800">{bulkResult.total}</p>
                                    <p className="text-xs text-slate-500 mt-1">Total</p>
                                </div>
                                <div className="bg-green-50 rounded-xl p-4 text-center border border-green-200">
                                    <p className="text-2xl font-bold text-green-600">{bulkResult.succeeded}</p>
                                    <p className="text-xs text-green-600 mt-1">Succeeded</p>
                                </div>
                                <div className={`rounded-xl p-4 text-center border ${bulkResult.failed > 0 ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
                                    <p className={`text-2xl font-bold ${bulkResult.failed > 0 ? 'text-red-600' : 'text-slate-400'}`}>{bulkResult.failed}</p>
                                    <p className={`text-xs mt-1 ${bulkResult.failed > 0 ? 'text-red-600' : 'text-slate-400'}`}>Failed</p>
                                </div>
                            </div>

                            {/* Detail rows */}
                            <div className="border border-slate-200 rounded-xl overflow-hidden">
                                <div className="max-h-64 overflow-y-auto">
                                    {bulkResult.results.map((r, i) => (
                                        <div
                                            key={i}
                                            className={`flex items-center gap-3 px-4 py-3 text-sm border-b last:border-b-0 ${r.success ? 'bg-white' : 'bg-red-50/30'}`}
                                        >
                                            {r.success
                                                ? <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                                                : <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />}
                                            <span className="font-medium text-slate-700 w-16 shrink-0">Row {r.row}</span>
                                            <span className="text-slate-500 truncate flex-1">{r.email}</span>
                                            <span className={`text-xs ${r.success ? 'text-green-600' : 'text-red-600'}`}>
                                                {r.message}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Upload another */}
                            <button
                                onClick={() => { setSelectedFile(null); setBulkResult(null); }}
                                className="text-sm text-slate-500 hover:text-slate-700 underline"
                            >
                                Upload another file
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
