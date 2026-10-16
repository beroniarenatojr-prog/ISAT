import { Head, router, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { Upload, FileText, Trash2, X, ZoomIn, ZoomOut, Download, AlertTriangle, Info, ClipboardCheck, Lock, ArrowRight, CheckCircle2 } from 'lucide-react';
import TeacherLayout from '@/Layouts/TeacherLayout';
import PageHeader from '@/Components/Teacher/PageHeader';
import SelfRatingPanel from '@/Components/Teacher/SelfRatingPanel';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function TeacherIpcrf({
    kras,
    submissions,
    selfRatings,
    selfRatingTotalWeight = 5,
    selfRatingWeightPerKra,
    selfRatingActive = true,
    schoolYear,
    user,
    noActiveConfig,
    isLocked,
    message,
}) {
    const [uploadingFor, setUploadingFor] = useState(null);
    const [currentKraIndex, setCurrentKraIndex] = useState(0);
    const [viewingPdf, setViewingPdf] = useState(null);
    const [pdfZoom, setPdfZoom] = useState(100);
    const [deletingSubmission, setDeletingSubmission] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showTeacherInfo, setShowTeacherInfo] = useState(false);
    const [selfRatingFormKey, setSelfRatingFormKey] = useState(0);
    const [deletingSelfRating, setDeletingSelfRating] = useState(null);
    const { data, setData, post, processing, errors, reset } = useForm({
        objective_id: '',
        competency_id: '',
        file: null,
        notes: '',
        school_year: schoolYear,
    });

    const selfRatingForm = useForm({
        kra_id: '',
        file: null,
        self_rating: '',
        notes: '',
    });

    // Show success toast on page load if there's a success message
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const success = urlParams.get('success');
        if (success) {
            toast.success(success, {
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
            });
        }
    }, []);

    const handleFileUpload = (objectiveId, competencyId = null) => {
        setUploadingFor({ objectiveId, competencyId });
        setData({
            objective_id: objectiveId,
            competency_id: competencyId,
            file: null,
            notes: '',
            school_year: schoolYear,
        });
    };

    const submitFile = (e) => {
        e.preventDefault();
        post(route('teacher.ipcrf.upload'), {
            onSuccess: () => {
                setUploadingFor(null);
                reset();
                toast.success('MOV uploaded successfully!', {
                    position: "top-right",
                    autoClose: 3000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                });
            },
            onError: () => {
                toast.error('Failed to upload MOV. Please try again.', {
                    position: "top-right",
                    autoClose: 3000,
                });
            }
        });
    };

    const deleteSubmission = (submissionId) => {
        setDeletingSubmission(submissionId);
    };

    const confirmDelete = () => {
        setIsDeleting(true);
        router.delete(route('teacher.ipcrf.delete', deletingSubmission), {
            onSuccess: () => {
                setDeletingSubmission(null);
                setIsDeleting(false);
                toast.success('MOV removed successfully!', {
                    position: "top-right",
                    autoClose: 3000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                });
            },
            onError: () => {
                setDeletingSubmission(null);
                setIsDeleting(false);
                toast.error('Failed to remove MOV. Please try again.', {
                    position: "top-right",
                    autoClose: 3000,
                });
            }
        });
    };

    // Self-rating helpers (one set of uploads per KRA)
    const getSelfRatings = (kraId) => (selfRatings && selfRatings[kraId]) || [];

    // The self-rating component is worth 5% of the overall 100%, split evenly
    // across the KRAs. Objectives carry the remaining 95%.
    const selfRatingWeight = Number(
        selfRatingWeightPerKra ?? (kras && kras.length > 0 ? selfRatingTotalWeight / kras.length : 0)
    );

    // The scoring self-rating for a KRA is the most recent upload that carries a score
    const getScoringSelfRating = (kraId) =>
        getSelfRatings(kraId).find((item) => item.self_rating !== null && item.self_rating !== '') || null;

    // Switching KRA clears a half-filled self-rating form so it can't post to the wrong KRA.
    useEffect(() => {
        selfRatingForm.reset();
        selfRatingForm.clearErrors();
        setSelfRatingFormKey((k) => k + 1);
    }, [currentKraIndex]);

    // The self-rating modal always posts for the KRA on screen; onDone closes it after a successful upload.
    const submitSelfRating = (e, onDone) => {
        e.preventDefault();
        const kraId = kras[currentKraIndex]?.id;
        selfRatingForm.transform((formData) => ({ ...formData, kra_id: kraId }));
        selfRatingForm.post(route('teacher.ipcrf.self-rating.upload'), {
            forceFormData: true,
            onSuccess: () => {
                selfRatingForm.reset();
                setSelfRatingFormKey((k) => k + 1);
                onDone?.();
                toast.success('Self-rating uploaded successfully!', {
                    position: 'top-right',
                    autoClose: 3000,
                });
            },
            onError: (errs) => {
                const first = errs && Object.values(errs)[0];
                toast.error(first || 'Failed to upload self-rating. Please try again.', {
                    position: 'top-right',
                    autoClose: 3000,
                });
            },
        });
    };

    const confirmDeleteSelfRating = () => {
        setIsDeleting(true);
        router.delete(route('teacher.ipcrf.self-rating.delete', deletingSelfRating), {
            onSuccess: () => {
                setDeletingSelfRating(null);
                setIsDeleting(false);
                toast.success('Self-rating removed successfully!', {
                    position: 'top-right',
                    autoClose: 3000,
                });
            },
            onError: () => {
                setDeletingSelfRating(null);
                setIsDeleting(false);
                toast.error('Failed to remove self-rating. Please try again.', {
                    position: 'top-right',
                    autoClose: 3000,
                });
            },
        });
    };

    const getSubmission = (objectiveId, competencyId = null) => {
        if (competencyId === null) {
            // Looking for objective submissions (no competency) - returns array
            const key = objectiveId + '_obj';
            return submissions[key] || [];
        } else {
            // Looking for competency submissions - returns array
            const key = objectiveId + '_' + competencyId;
            return submissions[key] || [];
        }
    };

    const nextKra = () => {
        if (currentKraIndex < kras.length - 1) {
            setCurrentKraIndex(currentKraIndex + 1);
        }
    };

    const prevKra = () => {
        if (currentKraIndex > 0) {
            setCurrentKraIndex(currentKraIndex - 1);
        }
    };

    const currentKra = kras && kras.length > 0 ? kras[currentKraIndex] : null;

    // Calculate global index for current KRA
    let globalStartIndex = 0;
    if (currentKra) {
        for (let i = 0; i < currentKraIndex; i++) {
            globalStartIndex += kras[i].objectives.length;
        }
    }

    // A teacher must upload a MOV for every objective before the survey becomes available
    const allObjectives = (kras || []).flatMap((kra) => kra.objectives);
    const totalObjectives = allObjectives.length;
    const missingObjectives = allObjectives.filter((obj) => getSubmission(obj.id, null).length === 0);
    const allMovsUploaded = totalObjectives > 0 && missingObjectives.length === 0;
    const uploadedObjectivesCount = totalObjectives - missingObjectives.length;

    return (
        <TeacherLayout user={user}>
            <Head title="IPCRF Tool" />
            
            {/* Toast Container */}
            <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="light"
            />
            
            <div className="min-h-screen bg-[hsl(var(--canvas))] text-foreground">
                <PageHeader
                    title="IPCRF Tool"
                    subtitle={schoolYear ? `Official Electronic IPCRF Tool v4.3 · SY ${schoolYear}` : 'Official Electronic IPCRF Tool v4.3'}
                    action={
                        <button
                            type="button"
                            onClick={() => setShowTeacherInfo(true)}
                            className="inline-flex h-11 items-center gap-2 rounded-xl bg-white/15 px-4 text-sm font-bold text-white transition-colors hover:bg-white/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
                        >
                            <Info className="h-[18px] w-[18px]" aria-hidden="true" />
                            My IPCRF info
                        </button>
                    }
                >
                    {totalObjectives > 0 && (
                        <div className="flex flex-col gap-1.5">
                            <div className="flex justify-between gap-3 text-[13px] text-white/90">
                                <span>
                                    {uploadedObjectivesCount} of {totalObjectives} MOVs uploaded
                                </span>
                                <strong className="text-yellow-300">{Math.round((uploadedObjectivesCount / totalObjectives) * 100)}%</strong>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-white/20">
                                <div
                                    className="h-full rounded-full bg-yellow-400 transition-all duration-300"
                                    style={{ width: `${(uploadedObjectivesCount / totalObjectives) * 100}%` }}
                                />
                            </div>
                        </div>
                    )}
                </PageHeader>

                {/* Main Content */}
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                    {/* No Active Config or Locked Notice */}
                    {(noActiveConfig || isLocked) && (
                        <div className={`${noActiveConfig ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'} mb-6 rounded-2xl border p-6`}>
                            <div className="flex items-start gap-4">
                                <div className={`w-14 h-14 ${noActiveConfig ? 'bg-red-100' : 'bg-yellow-100'} rounded-full flex items-center justify-center flex-shrink-0`}>
                                    <AlertTriangle className={`h-8 w-8 ${noActiveConfig ? 'text-red-600' : 'text-yellow-600'}`} />
                                </div>
                                <div className="flex-1">
                                    <h3 className={`text-2xl font-bold mb-2 ${noActiveConfig ? 'text-red-900' : 'text-yellow-900'}`}>
                                        {noActiveConfig ? 'No Active IPCRF Configuration' : 'IPCRF Submission Locked'}
                                    </h3>
                                    <p className={`text-lg ${noActiveConfig ? 'text-red-700' : 'text-yellow-700'} leading-relaxed`}>
                                        {message}
                                    </p>
                                    {noActiveConfig && (
                                        <div className="mt-4 p-4 bg-red-100 rounded-lg">
                                            <p className="text-sm text-red-800">
                                                <strong>What does this mean?</strong><br />
                                                The administrator has not set up an active IPCRF configuration for any school year. 
                                                You cannot submit any documents until an active configuration is available.
                                            </p>
                                        </div>
                                    )}
                                    {isLocked && (
                                        <div className="mt-4 p-4 bg-yellow-100 rounded-lg">
                                            <p className="text-sm text-yellow-800">
                                                <strong>What does this mean?</strong><br />
                                                The IPCRF for School Year {schoolYear} has been locked by the administrator. 
                                                This typically happens during the review or evaluation period. No new submissions or changes are allowed.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Only show KRA content if config is active and not locked */}
                    {!noActiveConfig && !isLocked && currentKra && (
                    <>
                    {/* KRA Navigation - Enhanced */}
                    <div className="mb-6 flex flex-col gap-[18px] rounded-2xl border border-border bg-white px-6 py-5">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-700 text-[17px] font-extrabold text-white">
                                    {currentKraIndex + 1}
                                </span>
                                <div>
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Key Result Area</p>
                                    <h3 className="text-[19px] font-bold text-gray-900">{currentKra.name}</h3>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button onClick={prevKra} disabled={currentKraIndex === 0} variant="outline" className="h-10 rounded-[10px] font-semibold">
                                    ← Previous
                                </Button>
                                <Button onClick={nextKra} disabled={currentKraIndex === kras.length - 1} variant="outline" className="h-10 rounded-[10px] font-semibold">
                                    Next →
                                </Button>
                            </div>
                        </div>

                        <div role="tablist" aria-label="Key Result Areas" className="flex flex-wrap gap-2">
                            {kras.map((kra, index) => {
                                const active = index === currentKraIndex;
                                const done = kra.objectives.filter((obj) => getSubmission(obj.id, null).length > 0).length;
                                const full = kra.objectives.length > 0 && done === kra.objectives.length;
                                return (
                                    <button
                                        key={kra.id}
                                        type="button"
                                        role="tab"
                                        aria-selected={active}
                                        title={kra.name}
                                        onClick={() => setCurrentKraIndex(index)}
                                        className={`inline-flex h-11 items-center gap-2 rounded-xl border px-4 text-sm font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 ${
                                            active ? 'border-green-700 bg-green-700 text-white' : 'border-border bg-white text-gray-800 hover:border-green-700'
                                        }`}
                                    >
                                        KRA {index + 1}
                                        <span
                                            className={`rounded-full px-[7px] py-px text-[11px] ${
                                                active ? 'bg-white/20 text-white' : full ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'
                                            }`}
                                        >
                                            {done}/{kra.objectives.length}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* IPCRF Table */}
                    <div className="overflow-hidden rounded-2xl border border-border bg-white">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[860px] border-collapse text-[15px]">
                                <thead className="bg-green-700 text-left text-xs uppercase tracking-wider text-white">
                                    <tr>
                                        <th scope="col" className="w-[110px] px-[18px] py-3.5">Objective No.</th>
                                        <th scope="col" className="px-[18px] py-3.5">Objective</th>
                                        <th scope="col" className="w-[300px] px-[18px] py-3.5">Mode of Verification (MOV)</th>
                                        <th scope="col" className="w-[110px] px-[18px] py-3.5 text-right">Weight</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white">
                                    {currentKra.objectives.map((objective, objIndex) => {
                                        const globalIndex = globalStartIndex + objIndex + 1;
                                        const objectiveSubmissions = getSubmission(objective.id, null);
                                        const competency = objective.competencies[0];
                                        const competencySubmissions = competency ? getSubmission(objective.id, competency.id) : [];
                                        
                                        // Check if all submissions are reviewed
                                        const hasObjectiveSubmissions = objectiveSubmissions.length > 0;
                                        const hasCompetencySubmissions = competencySubmissions.length > 0;
                                        const allObjectiveReviewed = objectiveSubmissions.every(sub => sub.status === 'reviewed');
                                        const allCompetencyReviewed = competencySubmissions.length === 0 || competencySubmissions.every(sub => sub.status === 'reviewed');
                                        const showDetails = hasObjectiveSubmissions && allObjectiveReviewed && allCompetencyReviewed;
                                        
                                        const isLastInKra = objIndex === currentKra.objectives.length - 1;
                                        
                                        return (
                                            <tr key={objective.id} className="border-t border-[#EEF2EF] align-top transition-colors hover:bg-green-50/60">
                                                <td className="whitespace-nowrap px-[18px] py-[18px] font-extrabold text-green-700">
                                                    {objective.code || globalIndex}
                                                </td>

                                                <td className="px-[18px] py-[18px] leading-relaxed text-gray-800">
                                                    {objective.description}
                                                </td>

                                                {/* Mode of Verification (MOV) Column */}
                                                <td className="px-[18px] py-3.5">
                                                    <div className="flex flex-col gap-2">
                                                        {objectiveSubmissions.map((submission, idx) => (
                                                            <div key={submission.id} className="relative flex items-center gap-2.5 rounded-[10px] border border-border bg-white p-2.5">
                                                                <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-red-50 text-[10px] font-extrabold text-red-700">PDF</span>
                                                                <span className="flex min-w-0 flex-1 flex-col items-start gap-0.5">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setViewingPdf({ url: route('teacher.ipcrf.submissions.document', submission.id), title: `MOV Evidence ${idx + 1}` })}
                                                                        className="text-[13px] font-semibold text-gray-900 hover:text-green-700 hover:underline"
                                                                    >
                                                                        MOV {idx + 1}
                                                                    </button>
                                                                    {submission.status === 'reviewed' && submission.rating && (
                                                                        <span className="rounded-full bg-green-100 px-2 py-px text-[11px] font-bold text-green-800">
                                                                            Rated {submission.rating} by School Head
                                                                        </span>
                                                                    )}
                                                                    {submission.status === 'submitted' && (
                                                                        <span className="rounded-full bg-yellow-100 px-2 py-px text-[11px] font-bold text-yellow-800">Pending review</span>
                                                                    )}
                                                                    {submission.status === 'pending' && (
                                                                        <span className="rounded-full bg-gray-100 px-2 py-px text-[11px] font-bold text-gray-600">Draft</span>
                                                                    )}
                                                                </span>
                                                                {submission.status !== 'reviewed' && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => deleteSubmission(submission.id)}
                                                                        className="flex h-7 w-7 flex-none items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                                                                        aria-label={`Remove MOV ${idx + 1}`}
                                                                        title="Remove this MOV"
                                                                    >
                                                                        <X className="h-4 w-4" />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        ))}

                                                        {objectiveSubmissions.length > 0 ? (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleFileUpload(objective.id, null)}
                                                                className="h-[34px] self-start rounded-lg border border-border bg-white px-3 text-[13px] font-bold text-green-700 transition-colors hover:border-green-700"
                                                            >
                                                                + Add another MOV
                                                            </button>
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleFileUpload(objective.id, null)}
                                                                className="flex h-14 w-full items-center justify-center gap-2 rounded-[10px] border-2 border-dashed border-yellow-400 bg-yellow-50 text-sm font-bold text-yellow-800 transition-colors hover:bg-yellow-100"
                                                            >
                                                                <Upload className="h-4 w-4" aria-hidden="true" />
                                                                Upload MOV (PDF)
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Weight Column - Computed */}
                                                <td className="px-[18px] py-[18px] text-right font-bold text-gray-900">
                                                    {showDetails ? (
                                                        <div className="flex flex-col items-end gap-1">
                                                            <span className="text-lg font-bold text-green-700">{objective.weight}%</span>
                                                            {objectiveSubmissions.length > 0 && objectiveSubmissions[0].rating && (
                                                                <span className="text-sm text-gray-600">
                                                                    ({(objective.weight * objectiveSubmissions[0].rating / 5).toFixed(2)}%)
                                                                </span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-300">-</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    <tr className="border-t-2 border-green-700/20 bg-green-50">
                                        <td colSpan="3" className="px-[18px] py-4 text-right text-sm font-bold uppercase tracking-wider text-gray-900">
                                            Total
                                        </td>
                                        <td className="px-[18px] py-4 text-right text-base font-bold text-gray-900">
                                            {/* Calculate weighted total based on ratings */}
                                            {(() => {
                                                let totalWeight = 0;
                                                let weightedScore = 0;
                                                kras.forEach(kra => {
                                                    kra.objectives.forEach(obj => {
                                                        const objSubs = getSubmission(obj.id, null);
                                                        const comp = obj.competencies[0];
                                                        const compSubs = comp ? getSubmission(obj.id, comp.id) : [];
                                                        const allObjReviewed = objSubs.length > 0 && objSubs.every(s => s.status === 'reviewed');
                                                        const allCompReviewed = compSubs.length > 0 && compSubs.every(s => s.status === 'reviewed');
                                                        
                                                        if (allObjReviewed && allCompReviewed) {
                                                            totalWeight += parseFloat(obj.weight);
                                                            // Calculate weighted score based on rating
                                                            if (objSubs[0] && objSubs[0].rating) {
                                                                weightedScore += (parseFloat(obj.weight) * objSubs[0].rating / 5);
                                                            }
                                                        }
                                                    });
                                                });

                                                // Self-rating adds its share of the 5% for every KRA that has one
                                                let selfWeight = 0;
                                                let selfWeighted = 0;
                                                kras.forEach(kra => {
                                                    if (getSelfRatings(kra.id).length === 0) return;

                                                    selfWeight += selfRatingWeight;

                                                    const scoring = getScoringSelfRating(kra.id);
                                                    if (scoring) {
                                                        selfWeighted += selfRatingWeight * Number(scoring.self_rating) / 5;
                                                    }
                                                });

                                                const combinedWeight = totalWeight + selfWeight;
                                                const combinedWeighted = weightedScore + selfWeighted;

                                                if (combinedWeight > 0) {
                                                    return (
                                                        <div className="flex flex-col items-end gap-1">
                                                            <span className="text-lg font-bold text-green-700">{combinedWeight.toFixed(2)}%</span>
                                                            <span className="text-sm text-gray-600">
                                                                (Weighted: {combinedWeighted.toFixed(2)}%)
                                                            </span>
                                                            {selfWeight > 0 && (
                                                                <span className="text-xs text-amber-700 font-semibold">
                                                                    incl. self-rating {selfWeight.toFixed(2)}%
                                                                </span>
                                                            )}
                                                        </div>
                                                    );
                                                }
                                                return '-';
                                            })()}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Self-rating for the current KRA — hidden until every MOV is uploaded */}
                    {currentKra && selfRatingActive && allMovsUploaded && (
                        <SelfRatingPanel
                            kra={currentKra}
                            kraNumber={currentKraIndex + 1}
                            weight={selfRatingWeight}
                            totalWeight={selfRatingTotalWeight}
                            kraCount={kras.length}
                            uploads={getSelfRatings(currentKra.id)}
                            form={selfRatingForm}
                            formKey={`${currentKra.id}-${selfRatingFormKey}`}
                            onSubmit={submitSelfRating}
                            onView={(item) => setViewingPdf({
                                url: route('teacher.ipcrf.self-rating.document', item.id),
                                title: `Self-Rating - ${currentKra.name}`,
                            })}
                            onDelete={(id) => setDeletingSelfRating(id)}
                        />
                    )}

                    {/* MOV Upload Progress / Survey Gate */}
                    {totalObjectives > 0 && !allMovsUploaded && (
                        <div className="mt-6 rounded-2xl border border-yellow-200 bg-yellow-50 p-6">
                            <div className="flex items-start gap-4">
                                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-white text-yellow-700">
                                    <Lock className="h-6 w-6" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="mb-1 text-lg font-bold text-yellow-900">Finish uploading your MOVs first</h3>
                                    <p className="mb-4 text-sm text-yellow-800">
                                        The IPCRF Questionnaire unlocks once you've uploaded a Mode of Verification (MOV) for every objective.
                                    </p>
                                    <div className="mb-3 flex items-center gap-3">
                                        <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white">
                                            <div
                                                className="h-full rounded-full bg-yellow-400 transition-all duration-300"
                                                style={{ width: `${(uploadedObjectivesCount / totalObjectives) * 100}%` }}
                                            />
                                        </div>
                                        <span className="whitespace-nowrap text-sm font-semibold text-yellow-900">
                                            {uploadedObjectivesCount} / {totalObjectives} objectives
                                        </span>
                                    </div>
                                    <div className="text-sm text-yellow-900">
                                        <p className="mb-1 font-semibold">Still missing a MOV for:</p>
                                        <ul className="list-disc list-inside space-y-0.5">
                                            {missingObjectives.map((obj) => (
                                                <li key={obj.id}>{obj.code} - {obj.description}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Questionnaire banners — unlock once every MOV is uploaded */}
                    {allMovsUploaded && (
                        <section className="relative mt-6 flex flex-wrap items-center gap-6 overflow-hidden rounded-3xl bg-sidebar px-6 py-8 text-white sm:px-10">
                            <span className="pointer-events-none absolute -right-16 -top-20 h-60 w-60 rounded-full bg-white/10" />
                            <span className="pointer-events-none absolute -bottom-28 right-56 h-52 w-52 rounded-full bg-yellow-300/20" />
                            <div className="relative flex min-w-0 flex-[1_1_420px] flex-col gap-2.5">
                                <span className="inline-flex items-center gap-2 self-start rounded-full bg-yellow-300/20 px-3 py-1 text-[13px] font-bold text-yellow-300">
                                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                                    All {totalObjectives} MOVs uploaded
                                </span>
                                <h3 className="text-2xl font-extrabold leading-tight tracking-tight sm:text-[34px]">Ready for Self-Assessment?</h3>
                                <p className="max-w-[620px] text-base text-white/90">
                                    Answer the e-TRACES survey on teachers' level of satisfaction and performance. It takes about 15–20 minutes and you can save a draft.
                                </p>
                                <div className="mt-1 flex flex-wrap gap-2 text-[13px]">
                                    <span className="rounded-full bg-white/15 px-3 py-1">Rate each statement, Very Satisfied to Very Dissatisfied</span>
                                    <span className="rounded-full bg-white/15 px-3 py-1">Saves as a draft</span>
                                    <span className="rounded-full bg-white/15 px-3 py-1">Needed for the signed IPCRF</span>
                                </div>
                            </div>
                            <a
                                href={route('teacher.questionnaire')}
                                className="relative inline-flex h-[60px] items-center gap-2.5 whitespace-nowrap rounded-2xl bg-yellow-400 px-8 text-lg font-extrabold text-green-900 transition-colors hover:bg-yellow-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                            >
                                Take Survey
                                <ArrowRight className="h-5 w-5" aria-hidden="true" />
                            </a>
                        </section>
                    )}

                    {/* SHS Performance & Challenges — same gate as the survey above */}
                    {allMovsUploaded && (
                        <section className="relative mt-6 flex flex-wrap items-center gap-6 overflow-hidden rounded-3xl bg-sidebar px-6 py-8 text-white sm:px-10">
                            <span className="pointer-events-none absolute -right-16 -top-20 h-60 w-60 rounded-full bg-white/10" />
                            <span className="pointer-events-none absolute -bottom-32 left-[40%] h-56 w-56 rounded-full bg-yellow-300/20" />
                            <div className="relative flex min-w-0 flex-[1_1_420px] flex-col gap-2.5">
                                <span className="self-start rounded-full bg-yellow-300/20 px-3 py-1 text-[13px] font-bold text-yellow-300">
                                    For Senior High School teachers
                                </span>
                                <h3 className="text-2xl font-extrabold leading-tight tracking-tight sm:text-[34px]">SHS Performance &amp; Challenges</h3>
                                <p className="text-base text-white/90">Tell us how you performed and what got in the way this school year.</p>
                                <div className="mt-1.5 flex flex-wrap gap-2.5">
                                    {[
                                        ['3', 'parts'],
                                        ['14', 'rating items'],
                                        ['60', 'challenge items'],
                                    ].map(([value, label]) => (
                                        <span key={label} className="flex flex-col rounded-xl bg-white/15 px-3.5 py-2.5">
                                            <strong className="text-xl">{value}</strong>
                                            <span className="text-xs text-white/80">{label}</span>
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <a
                                href={route('teacher.shs-questionnaire')}
                                className="relative inline-flex h-[60px] items-center gap-2.5 whitespace-nowrap rounded-2xl bg-yellow-400 px-8 text-lg font-extrabold text-green-900 transition-colors hover:bg-yellow-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                            >
                                Start
                                <ArrowRight className="h-5 w-5" aria-hidden="true" />
                            </a>
                        </section>
                    )}

                    </>
                    )}
                </main>

                {/* PDF Viewer Modal */}
                {viewingPdf && (
                    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl w-full max-w-6xl h-[90vh] flex flex-col shadow-2xl">
                            {/* Modal Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-600 to-green-700">
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <FileText className="h-5 w-5" />
                                    {viewingPdf.title}
                                </h3>
                                <div className="flex items-center gap-3">
                                    {/* Zoom Controls */}
                                    <div className="flex items-center gap-2 bg-white/20 rounded-lg px-3 py-1.5">
                                        <button
                                            onClick={() => setPdfZoom(Math.max(50, pdfZoom - 10))}
                                            className="text-white hover:text-green-100 transition-colors"
                                            title="Zoom Out"
                                        >
                                            <ZoomOut className="h-4 w-4" />
                                        </button>
                                        <span className="text-white font-semibold text-sm min-w-[50px] text-center">
                                            {pdfZoom}%
                                        </span>
                                        <button
                                            onClick={() => setPdfZoom(Math.min(200, pdfZoom + 10))}
                                            className="text-white hover:text-green-100 transition-colors"
                                            title="Zoom In"
                                        >
                                            <ZoomIn className="h-4 w-4" />
                                        </button>
                                    </div>
                                    
                                    {/* Download Button */}
                                    <a
                                        href={viewingPdf.url}
                                        download
                                        className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                                    >
                                        <Download className="h-4 w-4" />
                                        <span className="text-sm font-medium">Download</span>
                                    </a>
                                    
                                    {/* Close Button */}
                                    <button
                                        onClick={() => {
                                            setViewingPdf(null);
                                            setPdfZoom(100);
                                        }}
                                        className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-lg transition-colors"
                                        title="Close"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                            
                            {/* PDF Viewer */}
                            <div className="flex-1 overflow-auto bg-gray-100 p-4">
                                <div className="flex justify-center">
                                    <iframe
                                        src={viewingPdf.url}
                                        className="bg-white shadow-lg rounded-lg"
                                        style={{
                                            width: `${pdfZoom}%`,
                                            minWidth: '100%',
                                            height: '100%',
                                            minHeight: '800px',
                                            border: 'none'
                                        }}
                                        title="PDF Viewer"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Upload Modal - Enhanced */}
                {uploadingFor && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                        <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl animate-in zoom-in-95 duration-200">
                            {/* Modal Header */}
                            <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-2xl">
                                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                                    <Upload className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">Upload PDF File</h3>
                                    <p className="text-sm text-gray-600 font-medium">
                                        {uploadingFor.competencyId 
                                            ? 'Uploading for: Competency Evidence' 
                                            : 'Uploading Mode of Verification (MOV)'}
                                    </p>
                                </div>
                            </div>

                            {/* Modal Body */}
                            <form onSubmit={submitFile}>
                                <div className="px-6 py-6 space-y-5">
                                    <div>
                                        <label className="block text-base font-bold text-gray-800 mb-3">
                                            Select PDF File (Max 10MB)
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="file"
                                                accept=".pdf"
                                                onChange={(e) => setData('file', e.target.files[0])}
                                                className="block w-full text-base text-gray-700 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-base file:font-bold file:bg-gradient-to-r file:from-green-500 file:to-green-600 file:text-white hover:file:from-green-600 hover:file:to-green-700 file:shadow-lg hover:file:shadow-xl file:transition-all file:duration-200 cursor-pointer border-2 border-dashed border-gray-300 rounded-xl p-4 hover:border-green-400 transition-colors bg-gray-50"
                                                required
                                            />
                                        </div>
                                        {errors.file && (
                                            <div className="flex items-center gap-2 mt-2 text-red-600">
                                                <AlertTriangle className="h-4 w-4" />
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
                                            className="block w-full text-base rounded-xl border-2 border-gray-300 shadow-sm focus:border-green-500 focus:ring-4 focus:ring-green-200 transition-all p-4 resize-none"
                                            placeholder="Add any notes about this submission..."
                                        />
                                    </div>
                                </div>

                                {/* Modal Footer */}
                                <div className="flex items-center justify-end gap-3 px-6 py-5 bg-gray-50 rounded-b-2xl border-t border-gray-200">
                                    <Button 
                                        type="button" 
                                        variant="outline" 
                                        onClick={() => setUploadingFor(null)}
                                        disabled={processing}
                                        className="px-8 py-3 text-base font-bold border-2 border-gray-300 hover:bg-gray-100 rounded-xl transition-all disabled:opacity-50"
                                    >
                                        Cancel
                                    </Button>
                                    <Button 
                                        type="submit" 
                                        disabled={processing}
                                        className="px-8 py-3 text-base font-bold bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-xl rounded-xl transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
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
                                                <Upload className="h-5 w-5 mr-2" />
                                                Upload
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Delete Self-Rating Confirmation */}
                {deletingSelfRating && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                        <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
                            <div className="flex items-center gap-3 px-6 py-5 border-b-2 border-red-100 bg-red-50 rounded-t-2xl">
                                <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center shadow-lg">
                                    <AlertTriangle className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">Remove Self-Rating?</h3>
                                    <p className="text-sm text-gray-600 font-medium">This cannot be undone.</p>
                                </div>
                            </div>

                            <div className="px-6 py-5">
                                <p className="text-base text-gray-700">
                                    The uploaded self-rating document will be permanently deleted. You can upload a
                                    new one afterwards.
                                </p>
                            </div>

                            <div className="flex items-center justify-end gap-3 px-6 py-5 bg-gray-50 rounded-b-2xl border-t border-gray-200">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setDeletingSelfRating(null)}
                                    disabled={isDeleting}
                                    className="px-8 py-3 text-base font-bold border-2 border-gray-300 hover:bg-gray-100 rounded-xl transition-all disabled:opacity-50"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="button"
                                    onClick={confirmDeleteSelfRating}
                                    disabled={isDeleting}
                                    className="px-8 py-3 text-base font-bold bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-xl rounded-xl transition-all disabled:opacity-70"
                                >
                                    {isDeleting ? 'Removing...' : 'Remove'}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Teacher Information Drawer */}
                {showTeacherInfo && (
                    <>
                        {/* Backdrop */}
                        <div 
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-in fade-in duration-200"
                            onClick={() => setShowTeacherInfo(false)}
                        ></div>
                        
                        {/* Drawer */}
                        <div className="fixed top-0 right-0 h-full w-full max-w-2xl bg-white shadow-2xl z-50 overflow-y-auto animate-in slide-in-from-right duration-300 rounded-l-3xl">
                            {/* Drawer Header */}
                            <div className="sticky top-0 bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-5 border-b-4 border-green-700 z-10 rounded-tl-3xl">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                                            <Info className="h-6 w-6 text-white" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold text-white">Teacher Information</h2>
                                            <p className="text-sm text-green-100">Your IPCRF Details</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowTeacherInfo(false)}
                                        className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors"
                                    >
                                        <X className="h-6 w-6 text-white" />
                                    </button>
                                </div>
                            </div>

                            {/* Drawer Content */}
                            <div className="p-6 space-y-4">
                                {/* School Year */}
                                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-200 hover:shadow-lg transition-shadow">
                                    <div className="flex-shrink-0 w-14 h-14 bg-green-500 rounded-xl flex items-center justify-center shadow-lg">
                                        <span className="text-white font-bold text-xl">SY</span>
                                    </div>
                                    <div className="flex-1">
                                        <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">School Year</label>
                                        <p className="text-xl font-bold text-red-600">{schoolYear}</p>
                                    </div>
                                </div>
                                
                                {/* Teacher Type */}
                                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 hover:shadow-lg transition-shadow">
                                    <div className="flex-shrink-0 w-14 h-14 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                                        <span className="text-white font-bold text-xl">TT</span>
                                    </div>
                                    <div className="flex-1">
                                        <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Teacher Type</label>
                                        <p className="text-xl font-bold text-red-600">Regular Teacher</p>
                                    </div>
                                </div>
                                
                                {/* Career Stage */}
                                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200 hover:shadow-lg transition-shadow">
                                    <div className="flex-shrink-0 w-14 h-14 bg-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                                        <span className="text-white font-bold text-xl">CS</span>
                                    </div>
                                    <div className="flex-1">
                                        <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Career Stage</label>
                                        <p className="text-xl font-bold text-blue-600">Proficient</p>
                                    </div>
                                </div>
                                
                                {/* Total Objectives */}
                                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border-2 border-amber-200 hover:shadow-lg transition-shadow">
                                    <div className="flex-shrink-0 w-14 h-14 bg-amber-500 rounded-xl flex items-center justify-center shadow-lg">
                                        <span className="text-white font-bold text-xl">OB</span>
                                    </div>
                                    <div className="flex-1">
                                        <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Total Objectives</label>
                                        <p className="text-xl font-bold text-gray-900">14</p>
                                    </div>
                                </div>
                                
                                {/* Classroom Observations */}
                                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl border-2 border-teal-200 hover:shadow-lg transition-shadow">
                                    <div className="flex-shrink-0 w-14 h-14 bg-teal-500 rounded-xl flex items-center justify-center shadow-lg">
                                        <span className="text-white font-bold text-xl">CO</span>
                                    </div>
                                    <div className="flex-1">
                                        <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Classroom Observations</label>
                                        <input 
                                            type="text" 
                                            placeholder="Enter number"
                                            className="mt-2 w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition-all"
                                        />
                                    </div>
                                </div>
                                
                                {/* MS Office Version */}
                                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-200 hover:shadow-lg transition-shadow">
                                    <div className="flex-shrink-0 w-14 h-14 bg-green-500 rounded-xl flex items-center justify-center shadow-lg">
                                        <span className="text-white font-bold text-xl">MS</span>
                                    </div>
                                    <div className="flex-1">
                                        <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">MS Office Version</label>
                                        <p className="text-xl font-bold text-green-600">Supported</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* Delete Confirmation Modal */}
                {deletingSubmission && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                        <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
                            {/* Modal Header */}
                            <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-red-50 to-orange-50">
                                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                                    <AlertTriangle className="h-6 w-6 text-red-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">Remove MOV</h3>
                                    <p className="text-sm text-gray-600">This action cannot be undone</p>
                                </div>
                            </div>

                            {/* Modal Body */}
                            <div className="px-6 py-6">
                                <p className="text-gray-700 leading-relaxed">
                                    Are you sure you want to remove this Mode of Verification (MOV) file? 
                                    This will permanently remove the file from your submission.
                                </p>
                            </div>

                            {/* Modal Footer */}
                            <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 rounded-b-2xl">
                                <Button
                                    variant="outline"
                                    onClick={() => setDeletingSubmission(null)}
                                    disabled={isDeleting}
                                    className="px-6 py-2 border-gray-300 hover:bg-gray-100 disabled:opacity-50"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={confirmDelete}
                                    disabled={isDeleting}
                                    className="px-6 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {isDeleting ? (
                                        <>
                                            <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Removing...
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Remove MOV
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </TeacherLayout>
    );
}
