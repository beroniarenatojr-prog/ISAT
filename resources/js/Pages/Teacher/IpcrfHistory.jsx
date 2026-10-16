import { Head } from '@inertiajs/react';
import { History, TrendingUp, FileText, Award, Calendar, Star, Download, Info, XCircle, ClipboardList } from 'lucide-react';
import { toast } from 'sonner';
import TeacherLayout from '@/Layouts/TeacherLayout';
import PageHeader from '@/Components/Teacher/PageHeader';
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
    
    // Adjectival bands from IpcrfRating::getAdjectivalRating, in the Admin Panel palette.
    const getPerformanceColor = (level) => {
        const colors = {
            'Outstanding': 'bg-green-900 text-white',
            'Very Satisfactory': 'bg-green-700 text-white',
            'Satisfactory': 'bg-green-100 text-green-800',
            'Unsatisfactory': 'bg-yellow-100 text-yellow-800',
            'Poor': 'bg-red-100 text-red-800',
        };
        return colors[level] || 'bg-gray-100 text-gray-700';
    };

    const getStatusBadge = (status) => {
        const styles = {
            submitted: 'bg-yellow-100 text-yellow-800',
            approved: 'bg-green-800 text-white',
            rejected: 'bg-red-100 text-red-700',
        };
        return styles[status] || 'bg-gray-100 text-gray-700';
    };

    const capitalize = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');

    return (
        <TeacherLayout user={user}>
            <Head title="IPCRF History" />

            <div className="min-h-screen bg-[hsl(var(--canvas))] text-foreground">
                <PageHeader
                    title="IPCRF History"
                    subtitle="Your ratings, MOVs and signed copies, school year by school year"
                    action={
                        <button
                            type="button"
                            onClick={() => setShowInfoModal(true)}
                            className="inline-flex h-11 items-center gap-2 rounded-xl bg-white/15 px-4 text-sm font-bold text-white transition-colors hover:bg-white/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
                        >
                            <Info className="h-[18px] w-[18px]" aria-hidden="true" />
                            Rating scale
                        </button>
                    }
                />

                <main className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-7 sm:px-6 lg:px-12">
                    {historyData.length === 0 ? (
                        <div className="rounded-2xl border-2 border-dashed border-gray-300 bg-white p-12 text-center">
                            <History className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                            <h3 className="mb-1 text-lg font-bold text-gray-900">No History Available</h3>
                            <p className="text-sm text-gray-500">You don't have any IPCRF records yet.</p>
                        </div>
                    ) : (
                        historyData.map((record) => {
                            const canSummarise = record.rating || (record.mov_groups && record.mov_groups.length > 0);
                            return (
                                <article key={record.school_year} className="overflow-hidden rounded-2xl border border-border bg-white">
                                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-6 py-5">
                                        <span className="flex flex-col gap-0.5">
                                            <strong className="text-xl text-gray-900">SY {record.school_year}</strong>
                                            <span className="text-[13px] text-gray-500">
                                                Academic Performance Record
                                                {record.rating?.submitted_at &&
                                                    ` · rated ${new Date(record.rating.submitted_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`}
                                            </span>
                                        </span>
                                        {canSummarise && (
                                            <Button
                                                onClick={() => generateSummary(record)}
                                                disabled={generatingYear === record.school_year}
                                                className="h-10 rounded-[10px] bg-green-700 px-4 font-bold hover:bg-green-800"
                                            >
                                                <ClipboardList className="mr-2 h-4 w-4" />
                                                {generatingYear === record.school_year ? 'Generating…' : 'Generate Ratings Summary'}
                                            </Button>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-3.5 px-6 py-5">
                                        {record.rating ? (
                                            <>
                                                <div className="flex flex-col gap-1 rounded-xl bg-green-50 p-4">
                                                    <span className="text-xs font-semibold text-green-800">Average rating</span>
                                                    <strong className="text-[28px] leading-tight text-green-900">
                                                        {record.rating.numerical_rating ? Number(record.rating.numerical_rating).toFixed(3) : 'N/A'}
                                                    </strong>
                                                    {record.rating.performance_level && (
                                                        <span className={`self-start rounded-full px-2.5 py-0.5 text-xs font-bold ${getPerformanceColor(record.rating.performance_level)}`}>
                                                            {record.rating.performance_level}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex flex-col gap-1 rounded-xl border border-[#EEF2EF] bg-[hsl(var(--canvas))] p-4">
                                                    <span className="text-xs font-semibold text-gray-500">Total score</span>
                                                    <strong className="text-[28px] leading-tight text-gray-900">
                                                        {record.rating.total_score ? Number(record.rating.total_score).toFixed(2) : 'N/A'}
                                                        <span className="text-sm font-semibold text-gray-500"> / 100</span>
                                                    </strong>
                                                </div>
                                                <div className="flex flex-col gap-1 rounded-xl border border-[#EEF2EF] bg-[hsl(var(--canvas))] p-4">
                                                    <span className="text-xs font-semibold text-gray-500">Rating status</span>
                                                    <strong className="text-lg text-gray-900">{capitalize(record.rating.status)}</strong>
                                                    <span className="text-[13px] text-gray-500">by School Head</span>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="flex flex-col justify-center gap-1 rounded-xl border border-dashed border-gray-300 p-4">
                                                <span className="text-xs font-semibold text-gray-500">Rating</span>
                                                <strong className="text-base text-gray-700">Not rated yet</strong>
                                            </div>
                                        )}

                                        <div className="flex flex-col gap-1 rounded-xl border border-[#EEF2EF] bg-[hsl(var(--canvas))] p-4">
                                            <span className="text-xs font-semibold text-gray-500">MOV submissions</span>
                                            <strong className="text-[28px] leading-tight text-gray-900">{record.submissions_count}</strong>
                                            <span className="text-[13px] text-gray-500">{record.submissions_count === 1 ? 'file' : 'files'}</span>
                                        </div>

                                        <div className="flex flex-col gap-1.5 rounded-xl bg-yellow-50 p-4">
                                            <span className="text-xs font-semibold text-yellow-700">Signed IPCRF</span>
                                            {record.signed_ipcrf ? (
                                                <>
                                                    <span className={`self-start rounded-full px-2.5 py-0.5 text-xs font-bold ${getStatusBadge(record.signed_ipcrf.status)}`}>
                                                        {capitalize(record.signed_ipcrf.status)}
                                                    </span>
                                                    <a
                                                        href={route('teacher.signed-ipcrf.document', record.signed_ipcrf.id)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center text-[13px] font-bold text-green-700 hover:underline"
                                                    >
                                                        <Download className="mr-1 h-3.5 w-3.5" />
                                                        Download PDF
                                                    </a>
                                                </>
                                            ) : (
                                                <strong className="text-base text-yellow-900">Not submitted</strong>
                                            )}
                                        </div>
                                    </div>
                                </article>
                            );
                        })
                    )}

                    <section className="flex flex-col gap-3 rounded-2xl border border-border bg-white px-6 py-5">
                        <h2 className="text-base font-bold text-gray-900">Performance ratings</h2>
                        <div className="flex flex-wrap gap-2 text-[13px] font-semibold">
                            <span className="rounded-full bg-green-900 px-3 py-1.5 text-white">Outstanding 4.500–5.000</span>
                            <span className="rounded-full bg-green-700 px-3 py-1.5 text-white">Very Satisfactory 3.500–4.499</span>
                            <span className="rounded-full bg-green-100 px-3 py-1.5 text-green-800">Satisfactory 2.500–3.499</span>
                            <span className="rounded-full bg-yellow-100 px-3 py-1.5 text-yellow-800">Unsatisfactory 1.500–2.499</span>
                            <span className="rounded-full bg-red-100 px-3 py-1.5 text-red-800">Poor below 1.500</span>
                        </div>
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
