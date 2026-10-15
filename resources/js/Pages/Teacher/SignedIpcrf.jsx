import { Head, router, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { useState, useEffect, useRef } from 'react';
import { Upload, FileText, Trash2, CheckCircle, XCircle, Clock, Download, AlertCircle, Info } from 'lucide-react';
import TeacherLayout from '@/Layouts/TeacherLayout';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function SignedIpcrf({ signedIpcrfs, activeConfig, user, outstandingSurveys = [], surveysComplete = true }) {
    const [showUploadForm, setShowUploadForm] = useState(false);
    const [showInfoModal, setShowInfoModal] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        file: null,
        notes: '',
    });

    const alreadySubmitted = activeConfig && signedIpcrfs.some(s =>
        s.school_year === activeConfig.school_year &&
        (s.status === 'submitted' || s.status === 'approved'));

    const canSubmit = activeConfig && !activeConfig.is_locked && surveysComplete && !alreadySubmitted;

    // While surveys are still outstanding, keep checking (on tab focus + a slow
    // interval) so the page updates itself the moment the teacher finishes them
    // in another tab — no manual refresh needed.
    useEffect(() => {
        if (!activeConfig || alreadySubmitted || surveysComplete) return;

        const refresh = () => router.reload({ only: ['outstandingSurveys', 'surveysComplete'] });
        const onVisible = () => { if (document.visibilityState === 'visible') refresh(); };

        window.addEventListener('focus', refresh);
        document.addEventListener('visibilitychange', onVisible);
        const intervalId = setInterval(refresh, 15000);

        return () => {
            window.removeEventListener('focus', refresh);
            document.removeEventListener('visibilitychange', onVisible);
            clearInterval(intervalId);
        };
    }, [activeConfig, alreadySubmitted, surveysComplete]);

    // When the surveys flip to complete, open the upload form automatically
    const prevSurveysComplete = useRef(surveysComplete);
    useEffect(() => {
        if (!prevSurveysComplete.current && surveysComplete && activeConfig && !alreadySubmitted) {
            setShowUploadForm(true);
            toast.success('All required surveys are complete — you can now submit your signed IPCRF.');
        }
        prevSurveysComplete.current = surveysComplete;
    }, [surveysComplete, activeConfig, alreadySubmitted]);

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('teacher.signed-ipcrf.store'), {
            onSuccess: () => {
                reset();
                setShowUploadForm(false);
                toast.success('Signed IPCRF submitted successfully!');
            },
            onError: () => {
                toast.error('Failed to submit signed IPCRF.');
            }
        });
    };

    const handleDelete = (id) => {
        if (confirm('Are you sure you want to remove this submission?')) {
            router.delete(route('teacher.signed-ipcrf.destroy', id), {
                onSuccess: () => {
                    toast.success('Submission removed successfully!');
                },
                onError: () => {
                    toast.error('Failed to remove submission.');
                }
            });
        }
    };

    const getStatusBadge = (status) => {
        const styles = {
            submitted: 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-800 border-blue-300 ring-4 ring-blue-100',
            approved: 'bg-gradient-to-r from-green-50 to-green-100 text-green-800 border-green-300 ring-4 ring-green-100',
            rejected: 'bg-gradient-to-r from-red-50 to-red-100 text-red-800 border-red-300 ring-4 ring-red-100',
            reviewed: 'bg-gradient-to-r from-purple-50 to-purple-100 text-purple-800 border-purple-300 ring-4 ring-purple-100',
        };

        const icons = {
            submitted: <Clock className="h-5 w-5" />,
            approved: <CheckCircle className="h-5 w-5" />,
            rejected: <XCircle className="h-5 w-5" />,
            reviewed: <CheckCircle className="h-5 w-5" />,
        };

        return (
            <span className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-base font-extrabold border-2 shadow-lg ${styles[status]}`}>
                {icons[status]}
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    return (
        <TeacherLayout user={user}>
            <Head title="Signed IPCRF Submission" />
            
            <ToastContainer />

            <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
                {/* Header */}
                <div className="bg-gradient-to-r from-green-600 via-green-500 to-emerald-600 shadow-xl border-b-4 border-green-700 lg:sticky lg:top-0 z-30">
                    <div className="max-w-full px-6 py-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <div className="absolute -inset-2 bg-white/30 rounded-full blur-xl"></div>
                                    <div className="relative bg-white rounded-full p-2 shadow-2xl ring-4 ring-white/50">
                                        <img 
                                            src="/pictures/isat 1.jpg" 
                                            alt="ISAT" 
                                            className="h-16 w-16 rounded-full object-cover"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <h1 className="text-3xl font-extrabold text-white drop-shadow-lg">
                                        Signed IPCRF Submission
                                    </h1>
                                    <p className="text-sm text-green-100 font-semibold mt-1">
                                        {activeConfig ? `Submit your completed IPCRF - SY ${activeConfig.school_year}` : 'IPCRF Submission Portal'}
                                    </p>
                                </div>
                            </div>
                            
                            {/* Info Button */}
                            <button
                                onClick={() => setShowInfoModal(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-xl transition-all duration-200 hover:scale-105 shadow-lg"
                                title="Information"
                            >
                                <Info className="h-5 w-5" />
                                <span className="font-semibold">Info</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                    {/* Surveys Not Complete - blocks submission */}
                    {activeConfig && !activeConfig.is_locked && !alreadySubmitted && !surveysComplete && (
                        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-400 rounded-2xl shadow-xl p-8 mb-6">
                            <div className="flex items-start gap-4">
                                <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <AlertCircle className="h-8 w-8 text-amber-600" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-2xl font-bold text-amber-900 mb-2">Complete Your Surveys First</h3>
                                    <p className="text-lg text-amber-800 leading-relaxed">
                                        You cannot submit your signed IPCRF for <span className="font-bold">SY {activeConfig.school_year}</span> until
                                        every required survey has been completed and submitted.
                                    </p>

                                    <ul className="mt-5 space-y-3">
                                        {outstandingSurveys.map((survey) => (
                                            <li
                                                key={survey.key}
                                                className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white rounded-xl border-2 border-amber-200"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <XCircle className="h-5 w-5 text-amber-500 flex-shrink-0" />
                                                    <div>
                                                        <p className="font-bold text-gray-900">{survey.label}</p>
                                                        <p className="text-sm text-amber-700">{survey.status}</p>
                                                    </div>
                                                </div>
                                                <a
                                                    href={survey.route}
                                                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-xl font-semibold shadow-lg transition-all hover:scale-105"
                                                >
                                                    Complete now
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Locked Config Notice */}
                    {activeConfig && activeConfig.is_locked && (
                        <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-400 rounded-2xl shadow-xl p-8 mb-6">
                            <div className="flex items-start gap-4">
                                <div className="w-14 h-14 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <AlertCircle className="h-8 w-8 text-yellow-600" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-2xl font-bold text-yellow-900 mb-2">Submissions Locked</h3>
                                    <p className="text-lg text-yellow-700 leading-relaxed">
                                        The IPCRF for SY {activeConfig.school_year} is currently locked by the administrator. You cannot submit a signed IPCRF at this time.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Already Submitted Notice */}
                    {activeConfig && !activeConfig.is_locked && alreadySubmitted && (
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-2xl shadow-xl p-8 mb-6">
                            <div className="flex items-start gap-4">
                                <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <CheckCircle className="h-8 w-8 text-blue-600" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-2xl font-bold text-blue-900 mb-2">Already Submitted for SY {activeConfig.school_year}</h3>
                                    <p className="text-lg text-blue-700 leading-relaxed">
                                        You've already submitted a signed IPCRF for this school year. See it in "Your Submissions" below.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Upload Section */}
                    {canSubmit && (
                        <div className="bg-gradient-to-br from-white via-emerald-50 to-white rounded-2xl shadow-2xl p-8 mb-6 border-2 border-emerald-300 relative overflow-hidden">
                            {/* Decorative elements */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-400/10 rounded-full blur-3xl"></div>
                            <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-400/10 rounded-full blur-2xl"></div>
                            
                            <div className="relative">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                                                <Upload className="h-6 w-6 text-white" />
                                            </div>
                                            <h2 className="text-3xl font-extrabold text-gray-900">Submit Signed IPCRF</h2>
                                        </div>
                                        <p className="text-lg text-gray-600 ml-15">Upload your completed IPCRF for <span className="font-bold text-emerald-600">SY {activeConfig?.school_year}</span></p>
                                    </div>
                                    {!showUploadForm && (
                                        <Button
                                            onClick={() => setShowUploadForm(true)}
                                            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-xl hover:shadow-2xl transition-all duration-200 hover:scale-105 px-8 py-6 text-lg font-bold"
                                        >
                                            <Upload className="h-6 w-6 mr-2" />
                                            Upload IPCRF
                                        </Button>
                                    )}
                                </div>

                                {showUploadForm && (
                                    <form onSubmit={handleSubmit} className="mt-6 bg-white rounded-2xl p-8 border-2 border-emerald-300 shadow-xl">
                                        <div className="space-y-6">
                                            <div>
                                                <label className="block text-base font-bold text-gray-800 mb-3">
                                                    Signed IPCRF Document (PDF only, Max 10MB)
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type="file"
                                                        accept=".pdf"
                                                        onChange={(e) => setData('file', e.target.files[0])}
                                                        className="block w-full text-base text-gray-700 file:mr-4 file:py-4 file:px-8 file:rounded-xl file:border-0 file:text-base file:font-bold file:bg-gradient-to-r file:from-emerald-500 file:to-teal-600 file:text-white hover:file:from-emerald-600 hover:file:to-teal-700 file:shadow-lg hover:file:shadow-xl file:transition-all file:duration-200 cursor-pointer border-2 border-dashed border-emerald-300 rounded-xl p-6 hover:border-emerald-500 transition-colors bg-emerald-50/50"
                                                        required
                                                    />
                                                </div>
                                                {errors.file && (
                                                    <div className="flex items-center gap-2 mt-2 text-red-600">
                                                        <AlertCircle className="h-4 w-4" />
                                                        <p className="text-sm font-medium">{errors.file}</p>
                                                    </div>
                                                )}
                                            </div>

                                            <div>
                                                <label className="block text-base font-bold text-gray-800 mb-3">
                                                    Notes (Optional)
                                                </label>
                                                <textarea
                                                    value={data.notes}
                                                    onChange={(e) => setData('notes', e.target.value)}
                                                    rows="4"
                                                    className="block w-full rounded-xl border-2 border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-4 focus:ring-emerald-200 transition-all p-4 text-base resize-none"
                                                    placeholder="Add any notes about your submission..."
                                                />
                                            </div>

                                            <div className="flex gap-4">
                                                <Button
                                                    type="submit"
                                                    disabled={processing}
                                                    className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg hover:shadow-xl transition-all duration-200 px-8 py-3 text-base font-bold disabled:opacity-70"
                                                >
                                                    {processing ? (
                                                        <>
                                                            <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                            </svg>
                                                            Uploading...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <CheckCircle className="h-5 w-5 mr-2" />
                                                            Submit IPCRF
                                                        </>
                                                    )}
                                                </Button>
                                                <Button
                                                    type="button"
                                                    onClick={() => {
                                                        setShowUploadForm(false);
                                                        reset();
                                                    }}
                                                    variant="outline"
                                                    className="px-8 py-3 text-base font-bold border-2 border-gray-300 hover:bg-gray-100 rounded-xl transition-all"
                                                >
                                                    Cancel
                                                </Button>
                                            </div>
                                        </div>
                                    </form>
                                )}
                            </div>
                        </div>
                    )}

                    {/* No Active Config Notice */}
                    {!activeConfig && (
                        <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-400 rounded-2xl shadow-xl p-8 mb-6">
                            <div className="flex items-start gap-4">
                                <div className="w-14 h-14 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <AlertCircle className="h-8 w-8 text-yellow-600" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-2xl font-bold text-yellow-900 mb-2">No Active IPCRF Configuration</h3>
                                    <p className="text-lg text-yellow-700 leading-relaxed">
                                        There is currently no active IPCRF configuration. Please contact the administrator.
                                    </p>
                                    <div className="mt-4 p-4 bg-yellow-100 rounded-lg">
                                        <p className="text-sm text-yellow-800">
                                            <strong>What this means:</strong> The administrator has not set up an active school year configuration yet. You will be able to submit once it's activated.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Submissions List */}
                    <div className="bg-white rounded-2xl shadow-2xl p-8 border-2 border-gray-300 relative overflow-hidden">
                        {/* Background decoration */}
                        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-100 rounded-full opacity-20 blur-3xl -z-0"></div>
                        
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                                    <FileText className="h-6 w-6 text-white" />
                                </div>
                                <h2 className="text-3xl font-extrabold text-gray-900">Your Submissions</h2>
                            </div>

                            {signedIpcrfs.length === 0 ? (
                                <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-slate-50 rounded-2xl border-2 border-dashed border-gray-300">
                                    <div className="inline-flex items-center justify-center w-24 h-24 bg-gray-100 rounded-full mb-6">
                                        <FileText className="h-12 w-12 text-gray-400" />
                                    </div>
                                    <p className="text-gray-600 text-xl font-semibold mb-2">No submissions yet</p>
                                    <p className="text-gray-500">Your submitted signed IPCRFs will appear here</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {signedIpcrfs.map((submission) => (
                                        <div key={submission.id} className="border-2 border-gray-200 rounded-2xl p-6 hover:border-emerald-400 hover:shadow-xl transition-all duration-200 bg-gradient-to-br from-white to-gray-50">
                                            <div className="flex items-start justify-between gap-6">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-4 mb-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center shadow-md">
                                                                <FileText className="h-5 w-5 text-white" />
                                                            </div>
                                                            <h3 className="text-2xl font-bold text-gray-900">
                                                                School Year {submission.school_year}
                                                            </h3>
                                                        </div>
                                                        {getStatusBadge(submission.status)}
                                                    </div>
                                                    
                                                    {submission.notes && (
                                                        <div className="mb-4 p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
                                                            <p className="text-sm font-bold text-blue-900 mb-2 flex items-center gap-2">
                                                                <FileText className="h-4 w-4" />
                                                                Your Notes:
                                                            </p>
                                                            <p className="text-blue-700 leading-relaxed">{submission.notes}</p>
                                                        </div>
                                                    )}

                                                    {submission.admin_remarks && (
                                                        <div className="mb-4 p-4 bg-purple-50 rounded-xl border-2 border-purple-200">
                                                            <p className="text-sm font-bold text-purple-900 mb-2 flex items-center gap-2">
                                                                <AlertCircle className="h-4 w-4" />
                                                                Admin Remarks:
                                                            </p>
                                                            <p className="text-purple-700 leading-relaxed">{submission.admin_remarks}</p>
                                                        </div>
                                                    )}

                                                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                                                        <div className="flex items-center gap-2">
                                                            <Clock className="h-4 w-4 text-gray-400" />
                                                            <span>Submitted: <strong>{new Date(submission.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</strong></span>
                                                        </div>
                                                        
                                                        {submission.reviewed_by && (
                                                            <div className="flex items-center gap-2">
                                                                <CheckCircle className="h-4 w-4 text-green-500" />
                                                                <span>Reviewed by: <strong>{submission.reviewer?.name}</strong> on <strong>{new Date(submission.reviewed_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</strong></span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex flex-col gap-3">
                                                    <a
                                                        href={route('teacher.signed-ipcrf.document', submission.id)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 font-semibold"
                                                    >
                                                        <Download className="h-5 w-5 mr-2" />
                                                        View PDF
                                                    </a>

                                                    {submission.status === 'submitted' && (
                                                        <Button
                                                            onClick={() => handleDelete(submission.id)}
                                                            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 font-semibold"
                                                        >
                                                            <Trash2 className="h-5 w-5 mr-2" />
                                                            Remove
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>

            {/* Info Modal */}
            {showInfoModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowInfoModal(false)}>
                    <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4 rounded-t-2xl">
                            <div className="flex items-center justify-between">
                                <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                                    <Info className="h-6 w-6" />
                                    About Signed IPCRF Submission
                                </h3>
                                <button onClick={() => setShowInfoModal(false)} className="text-white hover:bg-white/20 rounded-lg p-1">
                                    <XCircle className="h-6 w-6" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <h4 className="text-lg font-bold text-gray-900 mb-2">What is this page?</h4>
                                <p className="text-gray-700">
                                    This page allows you to submit your completed and signed Individual Performance Commitment and Review Form (IPCRF) document for the current school year.
                                </p>
                            </div>

                            <div>
                                <h4 className="text-lg font-bold text-gray-900 mb-2">How to use:</h4>
                                <ol className="list-decimal list-inside space-y-2 text-gray-700">
                                    <li>Click the "Upload IPCRF" button to open the upload form</li>
                                    <li>Select your completed and signed IPCRF document (PDF format only)</li>
                                    <li>Add optional notes about your submission</li>
                                    <li>Click "Submit IPCRF" to upload your document</li>
                                    <li>Wait for admin review and approval</li>
                                </ol>
                            </div>

                            <div>
                                <h4 className="text-lg font-bold text-gray-900 mb-2">Important Notes:</h4>
                                <ul className="list-disc list-inside space-y-1 text-gray-700">
                                    <li>Only PDF files are accepted</li>
                                    <li>Ensure your IPCRF is complete and properly signed before uploading</li>
                                    <li>You can only submit one IPCRF per school year</li>
                                    <li>You can remove your submission only if it's still in "Submitted" status</li>
                                    <li>Once approved or rejected, you cannot delete the submission</li>
                                </ul>
                            </div>

                            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                                <p className="text-sm text-blue-900">
                                    <strong>Status Meanings:</strong><br/>
                                    <span className="font-semibold text-blue-700">Submitted:</span> Waiting for admin review<br/>
                                    <span className="font-semibold text-green-700">Approved:</span> Your submission has been accepted<br/>
                                    <span className="font-semibold text-red-700">Rejected:</span> Your submission needs revision (check admin remarks)
                                </p>
                            </div>
                        </div>

                        <div className="px-6 py-4 bg-gray-50 rounded-b-2xl flex justify-end">
                            <Button onClick={() => setShowInfoModal(false)} className="bg-green-600 hover:bg-green-700">
                                Got it!
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </TeacherLayout>
    );
}
