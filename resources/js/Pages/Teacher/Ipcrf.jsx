import { Head, router, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { Upload, FileText, Trash2, X, ZoomIn, ZoomOut, Download, AlertTriangle, Info, ClipboardCheck, Lock } from 'lucide-react';
import TeacherLayout from '@/Layouts/TeacherLayout';
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
    const [selfRatingFor, setSelfRatingFor] = useState(null);
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

    const openSelfRatingUpload = (kra) => {
        setSelfRatingFor(kra);
        selfRatingForm.setData({
            kra_id: kra.id,
            file: null,
            self_rating: '',
            notes: '',
        });
    };

    const submitSelfRating = (e) => {
        e.preventDefault();
        selfRatingForm.post(route('teacher.ipcrf.self-rating.upload'), {
            forceFormData: true,
            onSuccess: () => {
                setSelfRatingFor(null);
                selfRatingForm.reset();
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
            
            <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
                {/* Page Header - Enhanced with Info Button */}
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
                                        OFFICIAL ELECTRONIC IPCRF TOOL v4.3
                                    </h1>
                                    <p className="text-sm text-green-100 font-semibold mt-1">
                                        {schoolYear ? `Proficient Regular Teacher - SY ${schoolYear}` : 'IPCRF Submission Portal'}
                                    </p>
                                </div>
                            </div>
                            
                            {/* Action Buttons */}
                            <div className="flex items-center gap-3">
                                {/* Info Button */}
                                <button
                                    onClick={() => setShowTeacherInfo(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-xl transition-all duration-200 hover:scale-105 shadow-lg"
                                    title="View Teacher Information"
                                >
                                    <Info className="h-5 w-5" />
                                    <span className="font-semibold">Info</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                    {/* No Active Config or Locked Notice */}
                    {(noActiveConfig || isLocked) && (
                        <div className={`${noActiveConfig ? 'bg-red-50 border-red-300' : 'bg-yellow-50 border-yellow-300'} border-2 rounded-2xl shadow-xl p-8 mb-6`}>
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
                    <div className="bg-gradient-to-r from-white via-green-50 to-white rounded-2xl shadow-xl p-6 mb-6 border-2 border-green-200 relative overflow-hidden">
                        {/* Decorative elements */}
                        <div className="absolute top-0 left-0 w-32 h-32 bg-green-400/10 rounded-full blur-2xl"></div>
                        <div className="absolute bottom-0 right-0 w-32 h-32 bg-emerald-400/10 rounded-full blur-2xl"></div>
                        
                        <div className="relative">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center shadow-lg">
                                        <span className="text-white font-bold text-lg">{currentKraIndex + 1}</span>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Key Result Area</p>
                                        <h3 className="text-xl font-bold text-gray-900">
                                            <span className="text-green-600">{currentKra.name}</span>
                                        </h3>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        onClick={prevKra}
                                        disabled={currentKraIndex === 0}
                                        variant="outline"
                                        size="sm"
                                        className="border-2 border-green-300 hover:bg-green-50 hover:text-green-700 hover:border-green-400 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-sm"
                                    >
                                        ← Previous
                                    </Button>
                                    <Button
                                        onClick={nextKra}
                                        disabled={currentKraIndex === kras.length - 1}
                                        variant="outline"
                                        size="sm"
                                        className="border-2 border-green-300 hover:bg-green-50 hover:text-green-700 hover:border-green-400 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-sm"
                                    >
                                        Next →
                                    </Button>
                                </div>
                            </div>
                            
                            <div className="flex flex-wrap gap-2">
                                {kras.map((kra, index) => (
                                    <button
                                        key={kra.id}
                                        onClick={() => setCurrentKraIndex(index)}
                                        className={`px-6 py-3 text-base font-bold rounded-xl transition-all duration-200 shadow-md ${
                                            index === currentKraIndex
                                                ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg scale-105 ring-4 ring-green-200'
                                                : 'bg-white text-gray-700 hover:bg-green-50 hover:text-green-700 hover:shadow-lg hover:scale-105 border-2 border-gray-200 hover:border-green-300'
                                        }`}
                                    >
                                        KRA {index + 1}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* IPCRF Table */}
                    <div className="bg-white rounded-lg shadow overflow-hidden border-2 border-gray-300">
                        <div className="overflow-x-auto">
                            <table className="min-w-full border-collapse">
                                <thead className="bg-green-600">
                                    <tr>
                                        <th className="px-4 py-3 text-center text-sm font-bold text-white uppercase border-2 border-gray-400 w-32">
                                            KRA
                                        </th>
                                        <th className="px-4 py-3 text-center text-sm font-bold text-white uppercase border-2 border-gray-400 w-24">
                                            Objective No.
                                        </th>
                                        <th className="px-4 py-3 text-center text-sm font-bold text-white uppercase border-2 border-gray-400">
                                            Objective
                                        </th>
                                        <th className="px-4 py-3 text-center text-sm font-bold text-white uppercase border-2 border-gray-400 w-48">
                                            Mode of Verification (MOV)
                                        </th>
                                        <th className="px-4 py-3 text-center text-sm font-bold text-white uppercase border-2 border-gray-400 w-20">
                                            Weight
                                        </th>
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
                                            <tr key={objective.id} className={`hover:bg-green-200 transition-colors ${globalIndex % 2 === 0 ? 'bg-green-100' : 'bg-white'}`}>
                                                {objIndex === 0 && (
                                                    <td 
                                                        rowSpan={currentKra.objectives.length} 
                                                        className="px-4 py-4 text-base font-semibold text-gray-900 bg-green-50 border-l-2 border-r-2 border-t-2 border-gray-400 align-top"
                                                        style={{ borderBottom: '2px solid rgb(156, 163, 175)' }}
                                                    >
                                                        <div className="font-bold mb-1">{currentKraIndex + 1}. {currentKra.name}</div>
                                                    </td>
                                                )}
                                                <td className={`px-4 py-4 text-base text-gray-900 text-center border-l-2 border-r-2 border-gray-400 font-bold whitespace-nowrap ${isLastInKra ? 'border-b-2' : ''} ${objIndex === 0 ? 'border-t-2' : ''}`}>
                                                    {objective.code || globalIndex}
                                                </td>

                                                <td className={`px-5 py-4 text-lg leading-relaxed text-gray-800 border-l-2 border-r-2 border-gray-400 ${isLastInKra ? 'border-b-2' : ''} ${objIndex === 0 ? 'border-t-2' : ''}`}>
                                                    {objective.description}
                                                </td>
                                                
                                                {/* Mode of Verification (MOV) Column */}
                                                <td className={`px-4 py-3 border-l-2 border-r-2 border-gray-400 ${isLastInKra ? 'border-b-2' : ''} ${objIndex === 0 ? 'border-t-2' : ''}`}>
                                                    <div className="flex flex-col items-center gap-2 py-2">
                                                        {/* Show all existing submissions */}
                                                        {objectiveSubmissions.length > 0 && (
                                                            <div className="flex flex-col gap-2 w-full">
                                                                {objectiveSubmissions.map((submission, idx) => (
                                                                    <div key={submission.id} className="relative flex flex-col items-center gap-1 p-3 bg-white rounded-lg border-2 border-gray-200 hover:border-green-300 transition-all duration-200">
                                                                        {/* Remove X button in top-right corner */}
                                                                        {submission.status !== 'reviewed' && (
                                                                            <button
                                                                                onClick={() => deleteSubmission(submission.id)}
                                                                                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 z-10"
                                                                                title="Remove this MOV"
                                                                            >
                                                                                <X className="h-3.5 w-3.5" />
                                                                            </button>
                                                                        )}
                                                                        
                                                                        <button
                                                                            onClick={() => setViewingPdf({ url: route('teacher.ipcrf.submissions.document', submission.id), title: `MOV Evidence ${idx + 1}` })}
                                                                            className="text-green-600 hover:text-green-800 flex items-center gap-2 w-full justify-center transition-colors"
                                                                        >
                                                                            <FileText className="h-5 w-5" />
                                                                            <span className="text-base font-semibold">MOV {idx + 1}</span>
                                                                        </button>
                                                                        
                                                                        {submission.status === 'reviewed' && submission.rating && (
                                                                            <span className="text-sm text-green-600 font-semibold bg-green-50 px-2 py-1 rounded-full">
                                                                                ★ {submission.rating}
                                                                            </span>
                                                                        )}
                                                                        {submission.status === 'submitted' && (
                                                                            <span className="text-sm text-yellow-600 font-medium bg-yellow-50 px-2 py-1 rounded-full">Pending Review</span>
                                                                        )}
                                                                        {submission.status === 'pending' && (
                                                                            <span className="text-sm text-gray-500 font-medium bg-gray-100 px-2 py-1 rounded-full">Draft</span>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                        
                                                        {/* Add More Button - Always visible */}
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleFileUpload(objective.id, null)}
                                                            className="text-sm h-9 w-full mt-1 font-medium"
                                                        >
                                                            <Upload className="h-4 w-4 mr-1" />
                                                            {objectiveSubmissions.length > 0 ? 'Add More' : 'Upload MOV'}
                                                        </Button>
                                                    </div>
                                                </td>
                                                
                                                {/* Weight Column - Computed */}
                                                <td className={`px-4 py-4 text-base text-gray-900 text-center font-bold border-l-2 border-r-2 border-gray-400 ${isLastInKra ? 'border-b-2' : ''} ${objIndex === 0 ? 'border-t-2' : ''}`}>
                                                    {showDetails ? (
                                                        <div className="flex flex-col items-center gap-1">
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
                                    <tr className="bg-green-100">
                                        <td colSpan="4" className="px-4 py-4 text-right text-base font-bold text-gray-900 border-2 border-gray-400">
                                            TOTAL
                                        </td>
                                        <td className="px-4 py-4 text-center text-base font-bold text-gray-900 border-2 border-gray-400">
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
                                                        <div className="flex flex-col items-center gap-1">
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

                    {/* Self-Rating upload for the current KRA — hidden until every MOV is uploaded */}
                    {currentKra && selfRatingActive && allMovsUploaded && (
                        <div className="mt-6 bg-white rounded-2xl shadow-lg border-2 border-amber-200 overflow-hidden">
                            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 px-6 py-4 border-b-2 border-amber-200">
                                <div className="flex flex-wrap items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg">
                                            <ClipboardCheck className="h-6 w-6 text-white" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className="text-lg font-bold text-gray-900">
                                                    Self-Rating for KRA's
                                                </h4>
                                                <span className="inline-flex items-center rounded-full bg-amber-200 px-2.5 py-0.5 text-xs font-bold text-amber-900">
                                                    {selfRatingWeight.toFixed(2)}%
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600">
                                                Upload your own rating sheet for {currentKra.name}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-0.5">
                                                Self-rating is worth {Number(selfRatingTotalWeight).toFixed(2)}% of the
                                                total 100%, split across {kras.length} KRA{kras.length === 1 ? '' : 's'}.
                                                Objectives carry the remaining {(100 - Number(selfRatingTotalWeight)).toFixed(2)}%.
                                            </p>
                                        </div>
                                    </div>

                                    <Button
                                        onClick={() => openSelfRatingUpload(currentKra)}
                                        className="bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white font-bold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all"
                                    >
                                        <Upload className="h-4 w-4 mr-2" />
                                        Upload Self-Rating
                                    </Button>
                                </div>
                            </div>

                            <div className="px-6 py-5">
                                {getSelfRatings(currentKra.id).length === 0 ? (
                                    <div className="flex items-start gap-3 p-4 bg-amber-50/60 rounded-xl border border-dashed border-amber-300">
                                        <Info className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                        <p className="text-sm text-amber-900">
                                            No self-rating uploaded for this KRA yet. Attach your accomplished
                                            self-rating sheet (PDF) so your rater can review it alongside your MOVs.
                                        </p>
                                    </div>
                                ) : (
                                    <ul className="space-y-3">
                                        {getSelfRatings(currentKra.id).map((item) => (
                                            <li
                                                key={item.id}
                                                className="flex flex-wrap items-center justify-between gap-3 p-4 bg-gray-50 rounded-xl border-2 border-gray-200"
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <FileText className="h-5 w-5 text-amber-600 flex-shrink-0" />
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-semibold text-gray-900 truncate">
                                                            {item.original_name || 'Self-rating document'}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            Uploaded {new Date(item.created_at).toLocaleDateString()}
                                                            {item.self_rating ? ` • Self-rating: ${Number(item.self_rating).toFixed(2)}/5` : ''}
                                                        </p>
                                                        {item.notes && (
                                                            <p className="text-xs text-gray-600 mt-1 italic">{item.notes}</p>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => setViewingPdf({
                                                            url: route('teacher.ipcrf.self-rating.document', item.id),
                                                            title: `Self-Rating - ${currentKra.name}`,
                                                        })}
                                                        className="border-2 border-amber-300 text-amber-700 hover:bg-amber-50 font-semibold"
                                                    >
                                                        <FileText className="h-3 w-3 mr-1" />
                                                        View
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => setDeletingSelfRating(item.id)}
                                                        className="border-2 border-red-300 text-red-600 hover:bg-red-50 font-semibold"
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    )}

                    {/* MOV Upload Progress / Survey Gate */}
                    {totalObjectives > 0 && !allMovsUploaded && (
                        <div className="mt-8 bg-gray-50 border-2 border-dashed border-gray-300 rounded-2xl p-8">
                            <div className="flex items-start gap-4">
                                <div className="w-14 h-14 bg-gray-200 rounded-2xl flex items-center justify-center flex-shrink-0">
                                    <Lock className="h-7 w-7 text-gray-500" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-2xl font-bold text-gray-800 mb-1">Finish Uploading Your MOVs First</h3>
                                    <p className="text-gray-600 mb-4">
                                        The IPCRF Questionnaire unlocks once you've uploaded a Mode of Verification (MOV) for every objective.
                                    </p>
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                                            <div
                                                className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                                                style={{ width: `${(uploadedObjectivesCount / totalObjectives) * 100}%` }}
                                            />
                                        </div>
                                        <span className="text-sm font-semibold text-gray-700 whitespace-nowrap">
                                            {uploadedObjectivesCount} / {totalObjectives} objectives
                                        </span>
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        <p className="font-semibold mb-1">Still missing a MOV for:</p>
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

                    {/* Take Survey Call-to-Action */}
                    {allMovsUploaded && (
                        <div className="mt-8 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl shadow-2xl p-8 border-2 border-blue-300 relative overflow-hidden">
                            {/* Decorative elements */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl"></div>
                            <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-400/10 rounded-full blur-2xl"></div>
                            
                            <div className="relative">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl">
                                                <FileText className="h-8 w-8 text-white" />
                                            </div>
                                            <div>
                                                <h3 className="text-3xl font-extrabold text-gray-900 mb-2">Ready for Self-Assessment?</h3>
                                                <p className="text-lg text-gray-700">Complete the IPCRF Questionnaire to evaluate your performance</p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-start gap-3 p-5 bg-white/80 backdrop-blur rounded-xl border-2 border-blue-200">
                                            <Info className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
                                            <div className="text-base text-blue-900">
                                                <p className="font-semibold mb-2">What is the IPCRF Questionnaire?</p>
                                                <ul className="list-disc list-inside space-y-1 text-blue-800">
                                                    <li>Self-rate your performance across all Key Result Areas (KRAs)</li>
                                                    <li>Provide insights on challenges and training needs</li>
                                                    <li>Help improve teaching practices and professional development</li>
                                                    <li>Takes approximately 15-20 minutes to complete</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="ml-8">
                                        <a
                                            href={route('teacher.questionnaire')}
                                            className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white text-xl font-bold rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-200 hover:scale-105"
                                        >
                                            <FileText className="h-7 w-7" />
                                            Take Survey
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SHS Performance & Challenges Questionnaire Call-to-Action
                        (hidden until every MOV is uploaded, same gate as the survey above). */}
                    {allMovsUploaded && (
                    <div className="mt-8 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 rounded-2xl shadow-2xl p-8 border-2 border-emerald-300 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-400/10 rounded-full blur-3xl"></div>
                            <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-400/10 rounded-full blur-2xl"></div>

                            <div className="relative">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-xl">
                                                <ClipboardCheck className="h-8 w-8 text-white" />
                                            </div>
                                            <div>
                                                <h3 className="text-3xl font-extrabold text-gray-900 mb-2">SHS Performance &amp; Challenges</h3>
                                                <p className="text-lg text-gray-700">Senior High School teacher self-assessment questionnaire</p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-3 p-5 bg-white/80 backdrop-blur rounded-xl border-2 border-emerald-200">
                                            <Info className="h-6 w-6 text-emerald-600 flex-shrink-0 mt-0.5" />
                                            <div className="text-base text-emerald-900">
                                                <p className="font-semibold mb-2">What's inside?</p>
                                                <ul className="list-disc list-inside space-y-1 text-emerald-800">
                                                    <li>Part I – Profile and trainings attended (last 3 years)</li>
                                                    <li>Part II – Performance rating across the 5 KRAs (14 items)</li>
                                                    <li>Part III – Challenges encountered across the 5 KRAs (60 items)</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="ml-8">
                                        <a
                                            href={route('teacher.shs-questionnaire')}
                                            className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-700 hover:via-teal-700 hover:to-cyan-700 text-white text-xl font-bold rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-200 hover:scale-105"
                                        >
                                            <ClipboardCheck className="h-7 w-7" />
                                            Start
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
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

                {/* Self-Rating Upload Modal */}
                {selfRatingFor && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                        <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl animate-in zoom-in-95 duration-200">
                            {/* Modal Header */}
                            <div className="flex items-center gap-3 px-6 py-5 border-b-2 border-amber-100 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-t-2xl">
                                <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg">
                                    <ClipboardCheck className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">Upload Self-Rating</h3>
                                    <p className="text-sm text-gray-600 font-medium">
                                        KRA: {selfRatingFor.name}
                                    </p>
                                    <p className="text-xs text-amber-800 font-semibold">
                                        Worth {selfRatingWeight.toFixed(2)}% of the total 100%
                                    </p>
                                </div>
                            </div>

                            <form onSubmit={submitSelfRating}>
                                <div className="px-6 py-6 space-y-5">
                                    <div>
                                        <label className="block text-base font-bold text-gray-800 mb-3">
                                            Self-Rating Document (PDF)
                                        </label>
                                        <input
                                            type="file"
                                            accept=".pdf"
                                            onChange={(e) => selfRatingForm.setData('file', e.target.files[0])}
                                            className="block w-full text-base text-gray-700 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-base file:font-bold file:bg-gradient-to-r file:from-amber-500 file:to-yellow-600 file:text-white hover:file:from-amber-600 hover:file:to-yellow-700 file:shadow-lg hover:file:shadow-xl file:transition-all file:duration-200 cursor-pointer border-2 border-dashed border-gray-300 rounded-xl p-4 hover:border-amber-400 transition-colors bg-gray-50"
                                            required
                                        />
                                        {selfRatingForm.errors.file && (
                                            <div className="flex items-center gap-2 mt-2 text-red-600">
                                                <AlertTriangle className="h-4 w-4" />
                                                <p className="text-sm font-medium">{selfRatingForm.errors.file}</p>
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-base font-bold text-gray-800 mb-3">
                                            Your Self-Rating (1 - 5)
                                        </label>
                                        <p className="text-sm text-gray-600 mb-2">
                                            Your score is converted to this KRA&apos;s {selfRatingWeight.toFixed(2)}% share.
                                            Leave blank to upload the document only.
                                        </p>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="1"
                                            max="5"
                                            value={selfRatingForm.data.self_rating}
                                            onChange={(e) => selfRatingForm.setData('self_rating', e.target.value)}
                                            className="block w-full text-base rounded-xl border-2 border-gray-300 shadow-sm focus:border-amber-500 focus:ring-4 focus:ring-amber-200 transition-all p-4"
                                            placeholder="Rate yourself from 1 to 5 for this KRA"
                                        />
                                        {selfRatingForm.errors.self_rating && (
                                            <div className="flex items-center gap-2 mt-2 text-red-600">
                                                <AlertTriangle className="h-4 w-4" />
                                                <p className="text-sm font-medium">{selfRatingForm.errors.self_rating}</p>
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-base font-bold text-gray-800 mb-3">
                                            Notes (Optional)
                                        </label>
                                        <textarea
                                            value={selfRatingForm.data.notes}
                                            onChange={(e) => selfRatingForm.setData('notes', e.target.value)}
                                            rows="4"
                                            className="block w-full text-base rounded-xl border-2 border-gray-300 shadow-sm focus:border-amber-500 focus:ring-4 focus:ring-amber-200 transition-all p-4 resize-none"
                                            placeholder="Explain how you arrived at this self-rating..."
                                        />
                                    </div>
                                </div>

                                {/* Modal Footer */}
                                <div className="flex items-center justify-end gap-3 px-6 py-5 bg-gray-50 rounded-b-2xl border-t border-gray-200">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setSelfRatingFor(null)}
                                        disabled={selfRatingForm.processing}
                                        className="px-8 py-3 text-base font-bold border-2 border-gray-300 hover:bg-gray-100 rounded-xl transition-all disabled:opacity-50"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={selfRatingForm.processing}
                                        className="px-8 py-3 text-base font-bold bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white shadow-lg hover:shadow-xl rounded-xl transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {selfRatingForm.processing ? (
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
                                                Upload Self-Rating
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
