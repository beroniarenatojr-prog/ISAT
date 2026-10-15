import { Head, router, Link } from '@inertiajs/react';
import { useState } from 'react';
import { Filter, FileText, Award, Star, FolderOpen, ExternalLink, TrendingUp } from 'lucide-react';
import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from '@/components/ui/button';

const statusBadge = (status) => {
    const map = {
        draft: 'bg-gray-100 text-gray-700',
        submitted: 'bg-yellow-100 text-yellow-800',
        reviewed: 'bg-blue-100 text-blue-800',
        approved: 'bg-green-100 text-green-800',
    };
    return map[status] || 'bg-gray-100 text-gray-700';
};

const surveyAverage = (responses) => {
    if (!responses || typeof responses !== 'object') return null;
    const values = Object.values(responses).map(Number).filter((n) => !Number.isNaN(n));
    if (values.length === 0) return null;
    return (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2);
};

export default function IpcrfHistory({ groups, movsPagination, schoolYears, teachers, filters, totals }) {
    const [filterYear, setFilterYear] = useState(filters.school_year || '');
    const [filterTeacher, setFilterTeacher] = useState(filters.teacher_id ? String(filters.teacher_id) : '');
    const [search, setSearch] = useState(filters.search || '');

    const applyFilters = () => {
        router.get(route('admin.ipcrf-history'), {
            school_year: filterYear,
            teacher_id: filterTeacher,
            search,
        });
    };

    const scopeLabel = filterYear ? `SY ${filterYear}` : 'All School Years';

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <Head title="IPCRF History - Admin" />

                <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 h-4" />
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbPage>IPCRF History</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </header>

                <div className="flex-1 p-6 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
                    <div className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center opacity-20">
                        <img src="/pictures/isat.tmp" alt="ISAT Background" className="w-[600px] h-[600px] object-contain" />
                    </div>

                    <div className="relative z-10 space-y-6">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                <FolderOpen className="h-6 w-6 text-green-600" />
                                IPCRF History
                            </h1>
                            <p className="text-sm text-gray-600">
                                MOV uploads, IPCRF ratings and e-TRACES surveys &mdash; {scopeLabel}
                            </p>
                        </div>

                        {/* Totals */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-white rounded-xl shadow p-5 border-2 border-green-200">
                                <div className="flex items-center gap-2 mb-1">
                                    <FileText className="h-5 w-5 text-green-600" />
                                    <p className="text-sm font-semibold text-gray-600">MOV Uploads</p>
                                </div>
                                <p className="text-3xl font-bold text-green-600">{totals.submissions}</p>
                            </div>
                            <div className="bg-white rounded-xl shadow p-5 border-2 border-emerald-200">
                                <div className="flex items-center gap-2 mb-1">
                                    <Award className="h-5 w-5 text-emerald-600" />
                                    <p className="text-sm font-semibold text-gray-600">IPCRF Ratings</p>
                                </div>
                                <p className="text-3xl font-bold text-emerald-600">{totals.ratings}</p>
                            </div>
                            <div className="bg-white rounded-xl shadow p-5 border-2 border-yellow-200">
                                <div className="flex items-center gap-2 mb-1">
                                    <Star className="h-5 w-5 text-yellow-600" />
                                    <p className="text-sm font-semibold text-gray-600">Surveys</p>
                                </div>
                                <p className="text-3xl font-bold text-yellow-600">{totals.surveys}</p>
                            </div>
                            <div className="bg-white rounded-xl shadow p-5 border-2 border-teal-200">
                                <div className="flex items-center gap-2 mb-1">
                                    <TrendingUp className="h-5 w-5 text-teal-600" />
                                    <p className="text-sm font-semibold text-gray-600">Average Rating</p>
                                </div>
                                <p className="text-3xl font-bold text-teal-600">
                                    {totals.average_rating ? Number(totals.average_rating).toFixed(2) : 'N/A'}
                                </p>
                            </div>
                        </div>

                        {/* Filters */}
                        <div className="bg-white rounded-xl shadow p-6 border-2 border-gray-200">
                            <div className="flex items-center gap-2 mb-4">
                                <Filter className="h-5 w-5 text-gray-600" />
                                <h2 className="text-lg font-bold text-gray-900">Filters</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Search Teacher</label>
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                                        placeholder="Name or email..."
                                        className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">School Year</label>
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
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Teacher</label>
                                    <select
                                        value={filterTeacher}
                                        onChange={(e) => setFilterTeacher(e.target.value)}
                                        className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                                    >
                                        <option value="">All Teachers</option>
                                        {teachers.map((teacher) => (
                                            <option key={teacher.id} value={teacher.id}>
                                                {teacher.name} ({teacher.email})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex items-end">
                                    <Button onClick={applyFilters} className="w-full bg-green-600 hover:bg-green-700">
                                        Apply Filters
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Grouped records */}
                        {groups.length === 0 ? (
                            <div className="bg-white rounded-xl shadow p-12 border-2 border-gray-200 text-center">
                                <FolderOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-600 text-lg">No records for this filter.</p>
                            </div>
                        ) : (
                            <>
                                <p className="text-xs text-gray-500">
                                    MOV uploads are paginated ({movsPagination.total} total). Ratings and surveys shown are for the
                                    school year{groups.length !== 1 ? 's' : ''} on this page.
                                </p>

                                {groups.map((group) => (
                                    <div key={group.year} className="bg-white rounded-xl shadow border-2 border-gray-200">
                                        <div className="border-b bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-3">
                                            <h2 className="text-lg font-bold text-gray-900">SY {group.year}</h2>
                                            <p className="text-xs text-gray-500">
                                                {group.submissions.length} of {group.submissions_total} MOV{group.submissions_total !== 1 ? 's' : ''} &middot;{' '}
                                                {group.ratings.length} rating{group.ratings.length !== 1 ? 's' : ''} &middot;{' '}
                                                {group.surveys.length} survey{group.surveys.length !== 1 ? 's' : ''}
                                            </p>
                                        </div>

                                        <div className="p-6 space-y-6">
                                            {/* MOV Uploads */}
                                            <section>
                                                <h3 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                                    <FileText className="h-4 w-4 text-green-600" /> MOV Uploads ({group.submissions.length} of {group.submissions_total})
                                                </h3>
                                                {group.submissions.length === 0 ? (
                                                    <p className="text-xs text-gray-400">None on this page.</p>
                                                ) : (
                                                    <div className="overflow-x-auto rounded-lg border border-gray-100">
                                                        <table className="w-full text-sm">
                                                            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                                                                <tr>
                                                                    <th className="px-3 py-2 text-left">Teacher</th>
                                                                    <th className="px-3 py-2 text-left">Objective</th>
                                                                    <th className="px-3 py-2 text-center">Status</th>
                                                                    <th className="px-3 py-2 text-center">Rating</th>
                                                                    <th className="px-3 py-2 text-center">File</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-gray-100">
                                                                {group.submissions.map((mov) => (
                                                                    <tr key={mov.id}>
                                                                        <td className="px-3 py-2">{mov.teacher?.name || '—'}</td>
                                                                        <td className="px-3 py-2">
                                                                            <span className="font-medium text-blue-600">
                                                                                {mov.objective?.code || `#${mov.objective_id}`}
                                                                            </span>
                                                                            <p className="text-xs text-gray-500 truncate max-w-xs">
                                                                                {mov.objective?.description || mov.notes || ''}
                                                                            </p>
                                                                        </td>
                                                                        <td className="px-3 py-2 text-center">
                                                                            <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded ${statusBadge(mov.status || 'draft')}`}>
                                                                                {mov.status || 'draft'}
                                                                            </span>
                                                                        </td>
                                                                        <td className="px-3 py-2 text-center">{mov.rating ? `${mov.rating}/5` : '—'}</td>
                                                                        <td className="px-3 py-2 text-center">
                                                                            {mov.file_path ? (
                                                                                <a
                                                                                    href={route('admin.ipcrf.submissions.document', mov.id)}
                                                                                    target="_blank"
                                                                                    rel="noopener noreferrer"
                                                                                    className="inline-flex items-center gap-1 text-blue-600 underline"
                                                                                >
                                                                                    Open <ExternalLink className="h-3 w-3" />
                                                                                </a>
                                                                            ) : '—'}
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                )}
                                            </section>

                                            {/* IPCRF Ratings */}
                                            <section>
                                                <h3 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                                    <Award className="h-4 w-4 text-emerald-600" /> IPCRF Ratings ({group.ratings.length})
                                                </h3>
                                                {group.ratings.length === 0 ? (
                                                    <p className="text-xs text-gray-400">None.</p>
                                                ) : (
                                                    <div className="grid gap-2 sm:grid-cols-2">
                                                        {group.ratings.map((rating) => (
                                                            <div key={rating.id} className="rounded-lg border border-gray-100 p-3">
                                                                <div className="flex items-center justify-between">
                                                                    <span className="font-semibold text-gray-900">{rating.teacher?.name || '—'}</span>
                                                                    <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded ${statusBadge(rating.status)}`}>
                                                                        {rating.status}
                                                                    </span>
                                                                </div>
                                                                <div className="mt-2 flex gap-4 text-sm">
                                                                    <span>Rating: <b className="text-green-700">{rating.numerical_rating ? Number(rating.numerical_rating).toFixed(2) : '0.00'}</b></span>
                                                                    <span>Score: <b className="text-emerald-700">{rating.total_score ? Number(rating.total_score).toFixed(2) : '0.00'}</b></span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </section>

                                            {/* Surveys */}
                                            <section>
                                                <h3 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                                    <Star className="h-4 w-4 text-yellow-600" /> e-TRACES Surveys ({group.surveys.length})
                                                </h3>
                                                {group.surveys.length === 0 ? (
                                                    <p className="text-xs text-gray-400">None.</p>
                                                ) : (
                                                    <div className="grid gap-2 sm:grid-cols-2">
                                                        {group.surveys.map((survey) => {
                                                            const avg = surveyAverage(survey.responses);
                                                            return (
                                                                <div key={survey.id} className="rounded-lg border border-gray-100 p-3">
                                                                    <div className="flex items-center justify-between">
                                                                        <span className="font-semibold text-gray-900">{survey.teacher?.name || survey.name || '—'}</span>
                                                                        <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded ${statusBadge(survey.status)}`}>
                                                                            {survey.status}
                                                                        </span>
                                                                    </div>
                                                                    <div className="mt-2 flex items-center justify-between text-sm">
                                                                        <span>Avg rating: <b className="text-yellow-700">{avg ?? 'N/A'}{avg ? ' / 5' : ''}</b></span>
                                                                        <Link
                                                                            href={route('admin.questionnaire.show', survey.id)}
                                                                            className="inline-flex items-center gap-1 text-xs text-blue-600 underline"
                                                                        >
                                                                            Detail <ExternalLink className="h-3 w-3" />
                                                                        </Link>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </section>
                                        </div>
                                    </div>
                                ))}

                                {/* MOV pagination */}
                                {movsPagination.last_page > 1 && (
                                    <div className="bg-white rounded-xl shadow p-4 border-2 border-gray-200 flex flex-wrap items-center justify-between gap-3">
                                        <span className="text-sm text-gray-600">
                                            Showing MOV uploads {movsPagination.from}&ndash;{movsPagination.to} of {movsPagination.total}
                                        </span>
                                        <div className="flex flex-wrap gap-1">
                                            {movsPagination.links.map((link, index) => (
                                                <Button
                                                    key={index}
                                                    variant={link.active ? 'default' : 'outline'}
                                                    size="sm"
                                                    disabled={!link.url}
                                                    onClick={() => link.url && router.get(link.url, {}, { preserveScroll: true })}
                                                    className={link.active ? 'bg-green-600 hover:bg-green-700' : ''}
                                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
