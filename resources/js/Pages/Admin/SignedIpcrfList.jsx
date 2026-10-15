import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { FileText, Download, CheckCircle, XCircle, Clock, Search, Filter, Eye } from 'lucide-react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function SignedIpcrfList({ signedIpcrfs, schoolYears, filters }) {
    const [selectedSubmission, setSelectedSubmission] = useState(null);
    const [reviewStatus, setReviewStatus] = useState('');
    const [adminRemarks, setAdminRemarks] = useState('');
    const [isReviewing, setIsReviewing] = useState(false);

    const [filterYear, setFilterYear] = useState(filters.school_year || '');
    const [filterStatus, setFilterStatus] = useState(filters.status || '');

    const handleFilter = () => {
        router.get(route('admin.signed-ipcrf'), {
            school_year: filterYear,
            status: filterStatus,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleReview = (submission) => {
        setSelectedSubmission(submission);
        setReviewStatus('');
        setAdminRemarks(submission.admin_remarks || '');
        setIsReviewing(true);
    };

    const submitReview = () => {
        if (!reviewStatus) {
            toast.error('Please select approve or reject');
            return;
        }

        router.post(route('admin.signed-ipcrf.review', selectedSubmission.id), {
            status: reviewStatus,
            admin_remarks: adminRemarks,
        }, {
            onSuccess: () => {
                setIsReviewing(false);
                setSelectedSubmission(null);
                toast.success(`Submission ${reviewStatus} successfully!`);
            },
            onError: () => {
                toast.error('Failed to submit review');
            }
        });
    };

    const handleDownload = (id) => {
        window.open(route('admin.signed-ipcrf.download', id), '_blank');
    };

    const getStatusBadge = (status) => {
        const styles = {
            submitted: 'bg-blue-100 text-blue-800 border-blue-200',
            approved: 'bg-green-100 text-green-800 border-green-200',
            rejected: 'bg-red-100 text-red-800 border-red-200',
            reviewed: 'bg-purple-100 text-purple-800 border-purple-200',
        };

        const icons = {
            submitted: <Clock className="h-4 w-4" />,
            approved: <CheckCircle className="h-4 w-4" />,
            rejected: <XCircle className="h-4 w-4" />,
            reviewed: <CheckCircle className="h-4 w-4" />,
        };

        return (
            <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold border-2 ${styles[status]}`}>
                {icons[status]}
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    return (
        <AdminLayout>
            <Head title="Signed IPCRF Submissions" />
            
            <ToastContainer />

            <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
                {/* Background Logo Watermark */}
                <div className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center opacity-20">
                    <img 
                        src="/pictures/isat.tmp" 
                        alt="ISAT Background" 
                        className="w-[600px] h-[600px] object-contain"
                    />
                </div>

                {/* Header */}
                <div className="bg-gradient-to-r from-green-600 via-green-500 to-emerald-600 shadow-xl border-b-4 border-green-700 relative z-10">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-2xl">
                                <FileText className="h-8 w-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-extrabold text-white drop-shadow-lg">
                                    Signed IPCRF Submissions
                                </h1>
                                <p className="text-sm text-green-100 font-semibold mt-1">
                                    Review and manage teacher IPCRF submissions
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
                    
                    {/* Filters */}
                    <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 border-2 border-gray-200">
                        <div className="flex items-center gap-2 mb-4">
                            <Filter className="h-5 w-5 text-gray-600" />
                            <h2 className="text-lg font-bold text-gray-900">Filters</h2>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    School Year
                                </label>
                                <select
                                    value={filterYear}
                                    onChange={(e) => setFilterYear(e.target.value)}
                                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                                >
                                    <option value="">All Years</option>
                                    {schoolYears.map((year) => (
                                        <option key={year} value={year}>{year}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Status
                                </label>
                                <select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                                >
                                    <option value="">All Status</option>
                                    <option value="submitted">Submitted</option>
                                    <option value="approved">Approved</option>
                                    <option value="rejected">Rejected</option>
                                </select>
                            </div>

                            <div className="flex items-end">
                                <Button
                                    onClick={handleFilter}
                                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                                >
                                    <Search className="h-4 w-4 mr-2" />
                                    Apply Filters
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Submissions List */}
                    <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-gray-200">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Submissions</h2>

                        {signedIpcrfs.data.length === 0 ? (
                            <div className="text-center py-12">
                                <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-600 text-lg">No submissions found</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {signedIpcrfs.data.map((submission) => (
                                    <div key={submission.id} className="border-2 border-gray-200 rounded-xl p-6 hover:border-green-300 transition-all">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="text-lg font-bold text-gray-900">
                                                        {submission.teacher.name}
                                                    </h3>
                                                    <span className="text-sm text-gray-600">
                                                        SY {submission.school_year}
                                                    </span>
                                                    {getStatusBadge(submission.status)}
                                                </div>
                                                
                                                <p className="text-sm text-gray-600 mb-1">
                                                    <span className="font-semibold">Email:</span> {submission.teacher.email}
                                                </p>

                                                {submission.notes && (
                                                    <p className="text-gray-600 mb-2">
                                                        <span className="font-semibold">Teacher Notes:</span> {submission.notes}
                                                    </p>
                                                )}

                                                {submission.admin_remarks && (
                                                    <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                                        <p className="text-sm font-semibold text-blue-900 mb-1">Admin Remarks:</p>
                                                        <p className="text-blue-700">{submission.admin_remarks}</p>
                                                    </div>
                                                )}

                                                {submission.reviewed_by && (
                                                    <p className="text-sm text-gray-500 mt-2">
                                                        Reviewed by: {submission.reviewer?.name} on {new Date(submission.reviewed_at).toLocaleDateString()}
                                                    </p>
                                                )}

                                                <p className="text-sm text-gray-500 mt-1">
                                                    Submitted: {new Date(submission.created_at).toLocaleDateString()}
                                                </p>
                                            </div>

                                            <div className="flex gap-2">
                                                <Button
                                                    onClick={() => handleDownload(submission.id)}
                                                    variant="outline"
                                                    size="sm"
                                                >
                                                    <Download className="h-4 w-4 mr-2" />
                                                    Download
                                                </Button>

                                                {submission.status === 'submitted' && (
                                                    <Button
                                                        onClick={() => handleReview(submission)}
                                                        className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                                                        size="sm"
                                                    >
                                                        <Eye className="h-4 w-4 mr-2" />
                                                        Review
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Pagination */}
                        {signedIpcrfs.links && (
                            <div className="mt-6 flex justify-center gap-2">
                                {signedIpcrfs.links.map((link, index) => (
                                    <button
                                        key={index}
                                        onClick={() => router.get(link.url)}
                                        disabled={!link.url}
                                        className={`px-4 py-2 rounded-lg ${
                                            link.active
                                                ? 'bg-green-600 text-white'
                                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                        } ${!link.url && 'opacity-50 cursor-not-allowed'}`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {/* Review Modal */}
            {isReviewing && selectedSubmission && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl">
                        <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4 rounded-t-2xl">
                            <h3 className="text-2xl font-bold text-white">Review Submission</h3>
                            <p className="text-green-100 text-sm">Teacher: {selectedSubmission.teacher.name}</p>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Decision *
                                </label>
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => setReviewStatus('approved')}
                                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                                            reviewStatus === 'approved'
                                                ? 'bg-green-100 border-green-500 text-green-700'
                                                : 'border-gray-300 hover:border-green-300'
                                        }`}
                                    >
                                        <CheckCircle className="h-5 w-5" />
                                        Approve
                                    </button>
                                    <button
                                        onClick={() => setReviewStatus('rejected')}
                                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                                            reviewStatus === 'rejected'
                                                ? 'bg-red-100 border-red-500 text-red-700'
                                                : 'border-gray-300 hover:border-red-300'
                                        }`}
                                    >
                                        <XCircle className="h-5 w-5" />
                                        Reject
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Remarks
                                </label>
                                <textarea
                                    value={adminRemarks}
                                    onChange={(e) => setAdminRemarks(e.target.value)}
                                    rows="4"
                                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                                    placeholder="Add your remarks here..."
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <Button
                                    onClick={submitReview}
                                    disabled={!reviewStatus}
                                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                                >
                                    Submit Review
                                </Button>
                                <Button
                                    onClick={() => {
                                        setIsReviewing(false);
                                        setSelectedSubmission(null);
                                    }}
                                    variant="outline"
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
