import { Head, router, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { useState, useEffect, useRef } from 'react';
import { Upload, FileText, Trash2, CheckCircle, XCircle, Clock, Download, AlertCircle, Info } from 'lucide-react';
import TeacherLayout from '@/Layouts/TeacherLayout';
import PageHeader from '@/Components/Teacher/PageHeader';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function SignedIpcrf({ signedIpcrfs, activeConfig, user, outstandingSurveys = [], surveysComplete = true }) {
    const [showUploadForm, setShowUploadForm] = useState(true);
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
            submitted: 'bg-yellow-100 text-yellow-800',
            approved: 'bg-green-800 text-white',
            rejected: 'bg-red-100 text-red-700',
            reviewed: 'bg-green-100 text-green-800',
        };

        const icons = {
            submitted: <Clock className="h-3.5 w-3.5" />,
            approved: <CheckCircle className="h-3.5 w-3.5" />,
            rejected: <XCircle className="h-3.5 w-3.5" />,
            reviewed: <CheckCircle className="h-3.5 w-3.5" />,
        };

        return (
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${styles[status] ?? 'bg-gray-100 text-gray-700'}`}>
                {icons[status]}
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    const formatDate = (value) => new Date(value).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <TeacherLayout user={user}>
            <Head title="Signed IPCRF Submission" />

            <ToastContainer />

            <div className="min-h-screen bg-[hsl(var(--canvas))] text-foreground">
                <PageHeader
                    title="Signed IPCRF"
                    subtitle={activeConfig ? `Upload your completed, signed IPCRF for SY ${activeConfig.school_year}` : 'IPCRF Submission Portal'}
                    action={
                        <button
                            type="button"
                            onClick={() => setShowInfoModal(true)}
                            className="inline-flex h-11 items-center gap-2 rounded-xl bg-white/15 px-4 text-sm font-bold text-white transition-colors hover:bg-white/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
                        >
                            <Info className="h-[18px] w-[18px]" aria-hidden="true" />
                            How this works
                        </button>
                    }
                />

                <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-7 sm:px-6 lg:px-12">

                    {/* Surveys Not Complete - blocks submission */}
                    {activeConfig && !activeConfig.is_locked && !alreadySubmitted && !surveysComplete && (
                        <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-6">
                            <div className="flex items-start gap-4">
                                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-white text-yellow-700">
                                    <AlertCircle className="h-6 w-6" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="mb-1 text-lg font-bold text-yellow-900">Complete your surveys first</h3>
                                    <p className="text-sm leading-relaxed text-yellow-800">
                                        You cannot submit your signed IPCRF for <span className="font-bold">SY {activeConfig.school_year}</span> until
                                        every required survey has been completed and submitted.
                                    </p>

                                    <ul className="mt-4 space-y-3">
                                        {outstandingSurveys.map((survey) => (
                                            <li
                                                key={survey.key}
                                                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-yellow-200 bg-white p-4"
                                            >
                                                <div>
                                                    <p className="font-bold text-gray-900">{survey.label}</p>
                                                    <p className="text-sm font-semibold text-yellow-700">{survey.status}</p>
                                                </div>
                                                <a
                                                    href={survey.route}
                                                    className="inline-flex h-11 items-center rounded-xl bg-yellow-400 px-5 text-sm font-bold text-green-900 transition-colors hover:bg-yellow-300"
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
                        <div className="flex items-start gap-4 rounded-2xl border border-yellow-200 bg-yellow-50 p-6">
                            <AlertCircle className="mt-0.5 h-6 w-6 flex-shrink-0 text-yellow-700" />
                            <div>
                                <h3 className="mb-1 text-lg font-bold text-yellow-900">Submissions locked</h3>
                                <p className="text-sm leading-relaxed text-yellow-800">
                                    The IPCRF for SY {activeConfig.school_year} is currently locked by the administrator. You cannot submit a signed IPCRF at this time.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Already Submitted Notice */}
                    {activeConfig && !activeConfig.is_locked && alreadySubmitted && (
                        <div className="flex items-start gap-4 rounded-2xl border border-green-200 bg-green-50 p-6">
                            <CheckCircle className="mt-0.5 h-6 w-6 flex-shrink-0 text-green-700" />
                            <div>
                                <h3 className="mb-1 text-lg font-bold text-green-900">Already submitted for SY {activeConfig.school_year}</h3>
                                <p className="text-sm leading-relaxed text-green-800">
                                    You've already submitted a signed IPCRF for this school year. See it in "Your Submissions" below.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Upload Section + rules */}
                    {canSubmit && (
                        <div className="flex flex-wrap items-start gap-6">
                            <section className="flex min-w-0 flex-[999_1_520px] flex-col gap-[18px] rounded-2xl border border-border bg-white p-6 sm:p-7">
                                <div className="flex flex-wrap items-start justify-between gap-4">
                                    <div className="flex flex-col gap-1.5">
                                        <span className="h-1 w-10 rounded-full bg-yellow-400" />
                                        <h2 className="text-[22px] font-bold text-gray-900">Submit Signed IPCRF</h2>
                                        <p className="text-sm text-gray-500">
                                            for <strong className="text-green-700">SY {activeConfig?.school_year}</strong>
                                        </p>
                                    </div>
                                    {!showUploadForm && (
                                        <Button onClick={() => setShowUploadForm(true)} className="h-11 rounded-xl bg-green-700 px-6 font-bold hover:bg-green-800">
                                            <Upload className="mr-2 h-5 w-5" />
                                            Upload IPCRF
                                        </Button>
                                    )}
                                </div>

                                <div className="flex items-center gap-2.5 rounded-[10px] bg-green-50 px-3.5 py-3 text-sm text-green-800">
                                    <CheckCircle className="h-[18px] w-[18px] flex-none" aria-hidden="true" />
                                    All required surveys are complete. You can upload.
                                </div>

                                {showUploadForm && (
                                    <form onSubmit={handleSubmit} className="flex flex-col gap-[18px]">
                                        <div className="flex flex-col gap-2">
                                            <label htmlFor="signed-ipcrf-file" className="text-[13px] font-bold text-gray-900">
                                                Signed IPCRF document <span className="font-medium text-gray-500">(PDF only, up to 20 MB)</span>
                                            </label>
                                            <input
                                                id="signed-ipcrf-file"
                                                type="file"
                                                accept=".pdf"
                                                onChange={(e) => setData('file', e.target.files[0])}
                                                className="block w-full cursor-pointer rounded-[14px] border-2 border-dashed border-green-300 bg-[hsl(var(--canvas))] p-6 text-sm text-gray-700 transition-colors file:mr-4 file:rounded-xl file:border-0 file:bg-green-700 file:px-5 file:py-3 file:text-sm file:font-bold file:text-white hover:border-green-600 hover:file:bg-green-800"
                                                required
                                            />
                                            {errors.file && (
                                                <div className="flex items-center gap-2 text-red-600">
                                                    <AlertCircle className="h-4 w-4" />
                                                    <p className="text-sm font-medium">{errors.file}</p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            <label htmlFor="signed-ipcrf-notes" className="text-[13px] font-bold text-gray-900">
                                                Notes <span className="font-medium text-gray-500">(optional)</span>
                                            </label>
                                            <textarea
                                                id="signed-ipcrf-notes"
                                                value={data.notes}
                                                onChange={(e) => setData('notes', e.target.value)}
                                                rows="3"
                                                className="block w-full resize-none rounded-[10px] border border-border p-3 text-sm focus:border-green-600 focus:ring-2 focus:ring-yellow-300"
                                                placeholder="Add any notes about your submission..."
                                            />
                                        </div>

                                        <div className="flex flex-wrap gap-3">
                                            <Button
                                                type="submit"
                                                disabled={processing}
                                                className="h-12 rounded-xl bg-green-700 px-6 text-[15px] font-bold hover:bg-green-800 disabled:opacity-70"
                                            >
                                                {processing ? (
                                                    <>
                                                        <svg className="mr-2 h-5 w-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                        </svg>
                                                        Uploading...
                                                    </>
                                                ) : (
                                                    <>
                                                        <CheckCircle className="mr-2 h-5 w-5" />
                                                        Submit signed IPCRF
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
                                                className="h-12 rounded-xl px-6 font-bold"
                                            >
                                                Cancel
                                            </Button>
                                        </div>
                                    </form>
                                )}
                            </section>

                            <aside className="flex min-w-0 flex-[1_1_300px] flex-col gap-2.5 rounded-2xl border border-yellow-200 bg-yellow-50 p-6 text-yellow-900">
                                <h2 className="text-base font-bold">Before you upload</h2>
                                <ul className="flex list-disc flex-col gap-2 pl-[18px] text-sm leading-relaxed">
                                    <li>Only PDF files are accepted.</li>
                                    <li>Make sure the IPCRF is complete and properly signed.</li>
                                    <li>You can submit one signed IPCRF per school year.</li>
                                    <li>You can remove it only while it's still "Submitted". Once it's approved or rejected, it stays on file.</li>
                                </ul>
                            </aside>
                        </div>
                    )}

                    {/* No Active Config Notice */}
                    {!activeConfig && (
                        <div className="flex items-start gap-4 rounded-2xl border border-yellow-200 bg-yellow-50 p-6">
                            <AlertCircle className="mt-0.5 h-6 w-6 flex-shrink-0 text-yellow-700" />
                            <div>
                                <h3 className="mb-1 text-lg font-bold text-yellow-900">No active IPCRF configuration</h3>
                                <p className="text-sm leading-relaxed text-yellow-800">
                                    There is currently no active IPCRF configuration. The administrator has not set up an active school year yet. You will be able to submit once it's activated.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Submissions List */}
                    <section className="flex flex-col gap-3.5">
                        <h2 className="text-xl font-bold text-gray-900">Your Submissions</h2>

                        {signedIpcrfs.length === 0 ? (
                            <div className="rounded-2xl border-2 border-dashed border-gray-300 bg-white py-14 text-center">
                                <FileText className="mx-auto mb-4 h-10 w-10 text-gray-400" />
                                <p className="mb-1 text-lg font-semibold text-gray-700">No submissions yet</p>
                                <p className="text-sm text-gray-500">Your submitted signed IPCRFs will appear here</p>
                            </div>
                        ) : (
                            signedIpcrfs.map((submission) => (
                                <article key={submission.id} className="flex flex-col gap-3 rounded-[14px] border border-border bg-white px-6 py-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <strong className="text-[17px] text-gray-900">SY {submission.school_year}</strong>
                                        {getStatusBadge(submission.status)}
                                    </div>

                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-gray-500">
                                        <span className="inline-flex items-center gap-2">
                                            <span className="text-[11px] font-extrabold text-red-700">PDF</span>
                                            Submitted {formatDate(submission.created_at)}
                                        </span>
                                        {submission.reviewed_by && (
                                            <span>
                                                Reviewed by <strong className="text-gray-700">{submission.reviewer?.name}</strong> on {formatDate(submission.reviewed_at)}
                                            </span>
                                        )}
                                    </div>

                                    {submission.notes && (
                                        <div className="rounded-[10px] bg-[hsl(var(--canvas))] px-3.5 py-3 text-sm text-gray-700">
                                            <strong className="mb-0.5 block text-xs text-gray-500">Your notes</strong>
                                            {submission.notes}
                                        </div>
                                    )}

                                    {submission.admin_remarks && (
                                        <div className="rounded-[10px] bg-green-50 px-3.5 py-3 text-sm text-gray-700">
                                            <strong className="mb-0.5 block text-xs text-green-700">Admin remarks</strong>
                                            {submission.admin_remarks}
                                        </div>
                                    )}

                                    <div className="flex flex-wrap gap-2.5">
                                        <a
                                            href={route('teacher.signed-ipcrf.document', submission.id)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex h-10 items-center rounded-[10px] border border-border bg-white px-4 text-sm font-semibold text-green-700 transition-colors hover:border-green-700"
                                        >
                                            <Download className="mr-2 h-4 w-4" />
                                            View PDF
                                        </a>

                                        {submission.status === 'submitted' && (
                                            <button
                                                type="button"
                                                onClick={() => handleDelete(submission.id)}
                                                className="inline-flex h-10 items-center rounded-[10px] border border-red-200 bg-white px-4 text-sm font-bold text-red-700 transition-colors hover:bg-red-50"
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Remove
                                            </button>
                                        )}
                                    </div>
                                </article>
                            ))
                        )}
                    </section>
                </main>
            </div>

            {/* Info Modal */}
            {showInfoModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowInfoModal(false)}>
                    <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className="bg-sidebar px-6 py-4 rounded-t-2xl">
                            <div className="flex items-center justify-between">
                                <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                                    <Info className="h-6 w-6" />
                                    About Signed IPCRF Submission
                                </h3>
                                <button onClick={() => setShowInfoModal(false)} className="text-white hover:bg-white/20 rounded-lg p-1" aria-label="Close">
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
                                    <li>Select your completed and signed IPCRF document (PDF format only)</li>
                                    <li>Add optional notes about your submission</li>
                                    <li>Click "Submit signed IPCRF" to upload your document</li>
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

                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                <p className="text-sm text-yellow-900">
                                    <strong>Status Meanings:</strong><br/>
                                    <span className="font-semibold">Submitted:</span> Waiting for admin review<br/>
                                    <span className="font-semibold text-green-700">Approved:</span> Your submission has been accepted<br/>
                                    <span className="font-semibold text-red-700">Rejected:</span> Your submission needs revision (check admin remarks)
                                </p>
                            </div>
                        </div>

                        <div className="px-6 py-4 bg-gray-50 rounded-b-2xl flex justify-end">
                            <Button onClick={() => setShowInfoModal(false)} className="bg-green-700 hover:bg-green-800">
                                Got it!
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </TeacherLayout>
    );
}
