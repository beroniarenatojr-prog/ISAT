import { Head } from '@inertiajs/react';
import { History, TrendingUp, FileText, Award, Calendar, Star, Download, Info, XCircle, ClipboardList } from 'lucide-react';
import { toast } from 'sonner';
import TeacherLayout from '@/Layouts/TeacherLayout';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { generateIpcrfOfficialForm } from '@/lib/ipcrfOfficialForm';

export default function IpcrfHistory({ historyData, user }) {
    const [showInfoModal, setShowInfoModal] = useState(false);
    const [generatingYear, setGeneratingYear] = useState(null);

    // Job title: division JSON position_title, then role label.
    const positionLabel = (u) => {
        if (!u) return '';
        try {
            const d = typeof u.division === 'string' ? JSON.parse(u.division) : u.division;
            if (d?.position_title) return d.position_title;
        } catch (e) { /* not JSON */ }
        return u.position || '';
    };

    const generateSummary = async (record) => {
        // Prefer the rater's saved KRA breakdown; otherwise rebuild from rated MOVs.
        let kraGroups = (record.rating?.kra_details || [])
            .map((kra) => ({
                domain: kra.kra_name || 'Key Result Area',
                objectives: (kra.objectives || []).map((obj) => ({
                    description: obj.objective_description || obj.objective_code || 'Objective',
                    weight: null,
                    rating: Number(obj.rating) || 0,
                })),
            }))
            .filter((g) => g.objectives.length > 0);

        if (kraGroups.length === 0) {
            kraGroups = (record.mov_groups || [])
                .map((g) => ({
                    domain: g.domain,
                    objectives: (g.objectives || []).map((o) => ({
                        description: o.description || o.code || 'Objective',
                        weight: o.weight,
                        rating: Number(o.rating) || 0,
                    })),
                }))
                .filter((g) => g.objectives.length > 0);
        }

        if (kraGroups.length === 0) {
            toast.error(`No rated objectives to summarise for SY ${record.school_year}.`);
            return;
        }

        try {
            setGeneratingYear(record.school_year);
            await generateIpcrfOfficialForm({
                employee: {
                    name: user.name || '',
                    position: positionLabel(user) || 'No Position',
                    division: 'ISABELA SCHOOL OF ARTS AND TRADES - Ilagan Campus',
                },
                rater: {
                    name: record.rating?.rater?.name || '',
                    position: positionLabel(record.rating?.rater),
                },
                ratingPeriod: record.school_year,
                dateOfReview: record.rating?.submitted_at ? new Date(record.rating.submitted_at) : new Date(),
                kraGroups,
                numericalRating: record.rating?.numerical_rating != null ? Number(record.rating.numerical_rating) : null,
                fileName: `IPCRF_Part1_${(user.name || 'teacher').replace(/\s+/g, '_')}_${record.school_year}.pdf`,
            });
            toast.success('IPCRF Part 1 summary generated!');
        } catch (e) {
            console.error(e);
            toast.error('Failed to generate summary: ' + e.message);
        } finally {
            setGeneratingYear(null);
        }
    };
    
    const getPerformanceColor = (level) => {
        const colors = {
            'Outstanding': 'text-purple-600 bg-purple-100 border-purple-300',
            'Very Satisfactory': 'text-blue-600 bg-blue-100 border-blue-300',
            'Satisfactory': 'text-green-600 bg-green-100 border-green-300',
            'Unsatisfactory': 'text-yellow-600 bg-yellow-100 border-yellow-300',
            'Poor': 'text-red-600 bg-red-100 border-red-300',
        };
        return colors[level] || 'text-gray-600 bg-gray-100 border-gray-300';
    };

    const getStatusBadge = (status) => {
        const styles = {
            submitted: 'bg-blue-100 text-blue-800',
            approved: 'bg-green-100 text-green-800',
            rejected: 'bg-red-100 text-red-800',
        };
        return styles[status] || 'bg-gray-100 text-gray-800';
    };

    return (
        <TeacherLayout user={user}>
            <Head title="IPCRF History" />

            <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
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
                                        IPCRF History
                                    </h1>
                                    <p className="text-sm text-green-100 font-semibold mt-1">
                                        View your performance records across all school years
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
                    
                    {historyData.length === 0 ? (
                        <div className="bg-white rounded-2xl shadow-xl p-12 text-center border-2 border-gray-200">
                            <History className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-gray-900 mb-2">No History Available</h3>
                            <p className="text-gray-600">You don't have any IPCRF records yet.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {historyData.map((record, index) => (
                                <div 
                                    key={index}
                                    className="bg-white rounded-2xl shadow-xl p-6 border-2 border-gray-200 hover:border-indigo-300 transition-all"
                                >
                                    {/* School Year Header */}
                                    <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-gray-100">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                                                <Calendar className="h-6 w-6 text-white" />
                                            </div>
                                            <div>
                                                <h2 className="text-2xl font-bold text-gray-900">
                                                    School Year {record.school_year}
                                                </h2>
                                                <p className="text-sm text-gray-600">Academic Performance Record</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            {(record.rating || (record.mov_groups && record.mov_groups.length > 0)) && (
                                                <Button
                                                    onClick={() => generateSummary(record)}
                                                    disabled={generatingYear === record.school_year}
                                                    variant="outline"
                                                    className="border-green-600 text-green-700 hover:bg-green-50"
                                                >
                                                    <ClipboardList className="h-4 w-4 mr-2" />
                                                    {generatingYear === record.school_year ? 'Generating…' : 'Generate Ratings Summary'}
                                                </Button>
                                            )}
                                            {record.rating && (
                                                <div className={`px-6 py-3 rounded-xl border-2 font-bold text-lg ${getPerformanceColor(record.rating.performance_level)}`}>
                                                    {record.rating.performance_level}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Rating Information */}
                                    {record.rating ? (
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border-2 border-blue-200">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Star className="h-5 w-5 text-blue-600" />
                                                    <p className="text-sm font-semibold text-blue-900">Average Rating</p>
                                                </div>
                                                <p className="text-3xl font-bold text-blue-600">
                                                    {record.rating?.numerical_rating ? Number(record.rating.numerical_rating).toFixed(2) : 'N/A'}
                                                    <span className="text-lg text-blue-500">/5.00</span>
                                                </p>
                                            </div>

                                            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border-2 border-green-200">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <TrendingUp className="h-5 w-5 text-green-600" />
                                                    <p className="text-sm font-semibold text-green-900">Total Score</p>
                                                </div>
                                                <p className="text-3xl font-bold text-green-600">
                                                    {record.rating?.total_score ? Number(record.rating.total_score).toFixed(2) : 'N/A'}
                                                    <span className="text-lg text-green-500">/100</span>
                                                </p>
                                            </div>

                                            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border-2 border-purple-200">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Award className="h-5 w-5 text-purple-600" />
                                                    <p className="text-sm font-semibold text-purple-900">Status</p>
                                                </div>
                                                <span className={`inline-block px-4 py-2 rounded-lg font-bold text-sm ${
                                                    record.rating.status === 'submitted' ? 'bg-green-600 text-white' : 'bg-green-200 text-green-800'
                                                }`}>
                                                    {record.rating.status.charAt(0).toUpperCase() + record.rating.status.slice(1)}
                                                </span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-gray-50 rounded-xl p-6 text-center border-2 border-gray-200 mb-6">
                                            <p className="text-gray-600 font-semibold">No rating available for this school year</p>
                                        </div>
                                    )}

                                    {/* Submissions and Signed IPCRF */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Submissions */}
                                        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border-2 border-amber-200">
                                            <div className="flex items-center gap-2 mb-2">
                                                <FileText className="h-5 w-5 text-amber-600" />
                                                <p className="text-sm font-semibold text-amber-900">MOV Submissions</p>
                                            </div>
                                            <p className="text-2xl font-bold text-amber-600">
                                                {record.submissions_count} {record.submissions_count === 1 ? 'file' : 'files'}
                                            </p>
                                        </div>

                                        {/* Signed IPCRF */}
                                        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 border-2 border-emerald-200">
                                            <div className="flex items-center gap-2 mb-2">
                                                <FileText className="h-5 w-5 text-emerald-600" />
                                                <p className="text-sm font-semibold text-emerald-900">Signed IPCRF</p>
                                            </div>
                                            {record.signed_ipcrf ? (
                                                <div className="flex items-center justify-between">
                                                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusBadge(record.signed_ipcrf.status)}`}>
                                                        {record.signed_ipcrf.status.charAt(0).toUpperCase() + record.signed_ipcrf.status.slice(1)}
                                                    </span>
                                                    <a
                                                        href={route('teacher.signed-ipcrf.document', record.signed_ipcrf.id)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center px-3 py-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm"
                                                    >
                                                        <Download className="h-3 w-3 mr-1" />
                                                        View
                                                    </a>
                                                </div>
                                            ) : (
                                                <p className="text-gray-500 text-sm">Not submitted</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Timestamp */}
                                    {record.rating && (
                                        <div className="mt-4 pt-4 border-t-2 border-gray-100">
                                            <p className="text-sm text-gray-600">
                                                Submitted on: {new Date(record.rating.submitted_at).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
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
                                    About IPCRF History
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
                                    This page displays your complete IPCRF performance history across all school years. It provides a comprehensive view of your ratings, submissions, and signed documents from previous years.
                                </p>
                            </div>

                            <div>
                                <h4 className="text-lg font-bold text-gray-900 mb-2">What can you see here:</h4>
                                <ul className="list-disc list-inside space-y-2 text-gray-700">
                                    <li><strong>Performance Level:</strong> Your overall rating (Outstanding, Very Satisfactory, Satisfactory, etc.)</li>
                                    <li><strong>Average Rating:</strong> Your numerical score out of 5.00</li>
                                    <li><strong>Total Score:</strong> Your accumulated points out of 100</li>
                                    <li><strong>MOV Submissions:</strong> Number of Means of Verification files uploaded</li>
                                    <li><strong>Signed IPCRF:</strong> Status and download link for your completed form</li>
                                </ul>
                            </div>

                            <div>
                                <h4 className="text-lg font-bold text-gray-900 mb-2">Performance Ratings:</h4>
                                <div className="space-y-1 text-sm">
                                    <p><span className="inline-block w-32 font-semibold text-purple-700">Outstanding:</span> 4.50 - 5.00</p>
                                    <p><span className="inline-block w-32 font-semibold text-blue-700">Very Satisfactory:</span> 3.50 - 4.49</p>
                                    <p><span className="inline-block w-32 font-semibold text-green-700">Satisfactory:</span> 2.50 - 3.49</p>
                                    <p><span className="inline-block w-32 font-semibold text-yellow-700">Unsatisfactory:</span> 1.50 - 2.49</p>
                                    <p><span className="inline-block w-32 font-semibold text-red-700">Poor:</span> Below 1.50</p>
                                </div>
                            </div>

                            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                                <p className="text-sm text-blue-900">
                                    <strong>Note:</strong> This page is read-only. You cannot modify past records. To submit new IPCRFs, use the IPCRF Tool or Signed IPCRF Submission pages.
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
