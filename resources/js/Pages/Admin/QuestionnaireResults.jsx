import { Head, router, Link } from '@inertiajs/react';
import { useState } from 'react';
import { FileText, Filter, Users, CheckCircle, Clock, Eye, TrendingUp, Award } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';

export default function QuestionnaireResults({ questionnaires, schoolYears, filters, stats }) {
    const [filterStatus, setFilterStatus] = useState(filters.status || 'all');
    const [filterYear, setFilterYear] = useState(filters.school_year || '');
    const [searchQuery, setSearchQuery] = useState(filters.search || '');

    const handleFilter = () => {
        router.get(route('admin.questionnaire-results'), {
            status: filterStatus,
            school_year: filterYear,
            search: searchQuery,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const getStatusBadge = (status) => {
        const variants = {
            draft: 'bg-gray-200 text-gray-800',
            submitted: 'bg-blue-200 text-blue-800',
            reviewed: 'bg-green-200 text-green-800',
            uploads_only: 'bg-amber-200 text-amber-900',
        };
        const labels = {
            draft: 'Draft',
            submitted: 'Submitted',
            reviewed: 'Reviewed',
            uploads_only: 'Uploads only',
        };

        return <Badge className={variants[status] || 'bg-gray-200 text-gray-800'}>{labels[status] || status}</Badge>;
    };

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <Head title="Questionnaire Results - Admin" />
                
                <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 h-4" />
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbPage>Questionnaire Results</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </header>

                <div className="flex-1 p-6 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
                    {/* Background Logo Watermark */}
                    <div className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center opacity-20">
                        <img 
                            src="/pictures/isat.tmp" 
                            alt="ISAT Background" 
                            className="w-[600px] h-[600px] object-contain"
                        />
                    </div>
                    
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 relative z-10">
                        <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-blue-200">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <Users className="h-5 w-5 text-blue-600" />
                                </div>
                                <p className="text-sm font-semibold text-gray-600">Total Questionnaires</p>
                            </div>
                            <p className="text-3xl font-bold text-blue-600">{stats.total_submissions}</p>
                        </div>

                        <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-green-200">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                </div>
                                <p className="text-sm font-semibold text-gray-600">Submitted</p>
                            </div>
                            <p className="text-3xl font-bold text-green-600">{stats.submitted}</p>
                        </div>

                        <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-amber-200">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                                    <Award className="h-5 w-5 text-amber-600" />
                                </div>
                                <p className="text-sm font-semibold text-gray-600">Self-Rating Uploads</p>
                            </div>
                            <p className="text-3xl font-bold text-amber-600">{stats.self_rating_uploads ?? 0}</p>
                        </div>

                        <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-purple-200">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                    <TrendingUp className="h-5 w-5 text-purple-600" />
                                </div>
                                <p className="text-sm font-semibold text-gray-600">Avg Years of Service</p>
                            </div>
                            <p className="text-3xl font-bold text-purple-600">
                                {stats.average_years_of_service ? Number(stats.average_years_of_service).toFixed(1) : 'N/A'}
                            </p>
                        </div>
                    </div>

                    {/* Status Distribution */}
                    <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border-2 border-gray-200 relative z-10">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Status Distribution</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border-2 border-gray-200">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-semibold text-gray-600">Draft</p>
                                        <p className="text-2xl font-bold text-gray-700">{stats.draft}</p>
                                    </div>
                                    <Clock className="h-8 w-8 text-gray-400" />
                                </div>
                            </div>
                            
                            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border-2 border-blue-200">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-semibold text-blue-600">Submitted</p>
                                        <p className="text-2xl font-bold text-blue-700">{stats.submitted}</p>
                                    </div>
                                    <CheckCircle className="h-8 w-8 text-blue-400" />
                                </div>
                            </div>
                            
                            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border-2 border-green-200">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-semibold text-green-600">Reviewed</p>
                                        <p className="text-2xl font-bold text-green-700">{stats.reviewed}</p>
                                    </div>
                                    <Eye className="h-8 w-8 text-green-400" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border-2 border-gray-200 relative z-10">
                        <div className="flex items-center gap-2 mb-4">
                            <Filter className="h-5 w-5 text-gray-600" />
                            <h2 className="text-lg font-bold text-gray-900">Filters</h2>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                                <select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                >
                                    <option value="all">All Statuses</option>
                                    <option value="draft">Draft</option>
                                    <option value="submitted">Submitted</option>
                                    <option value="reviewed">Reviewed</option>
                                </select>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">School Year</label>
                                <select
                                    value={filterYear}
                                    onChange={(e) => setFilterYear(e.target.value)}
                                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                >
                                    <option value="">All School Years</option>
                                    {schoolYears.map((year) => (
                                        <option key={year} value={year}>{year}</option>
                                    ))}
                                </select>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Search Teacher</label>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Teacher name..."
                                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                />
                            </div>
                            
                            <div className="flex items-end">
                                <Button
                                    onClick={handleFilter}
                                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                                >
                                    Apply Filters
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Questionnaire List */}
                    <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-200 relative z-10">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Teacher Questionnaires</h2>

                        {questionnaires.length === 0 ? (
                            <div className="text-center py-12">
                                <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-600 text-lg">No questionnaires found</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b-2 border-gray-200">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                                Teacher
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                                School Year
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                                Submissions
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                                Last Activity
                                            </th>
                                            <th className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {questionnaires.map((q) => (
                                            <tr key={q.key} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-semibold text-gray-900">{q.teacher.name}</div>
                                                    <div className="text-sm text-gray-500">{q.teacher.email}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">{q.school_year}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {q.has_survey && <Badge className="bg-yellow-100 text-yellow-800">Self-Assessment</Badge>}
                                                        {q.has_shs && <Badge className="bg-emerald-100 text-emerald-800">SHS Performance</Badge>}
                                                        {q.self_rating_count > 0 && (
                                                            <Badge className="bg-amber-100 text-amber-800">Self-Rating ×{q.self_rating_count}</Badge>
                                                        )}
                                                        {!q.has_survey && !q.has_shs && q.self_rating_count === 0 && (
                                                            <span className="text-sm text-gray-400">—</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(q.status)}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">
                                                        {q.last_activity ? new Date(q.last_activity).toLocaleString() : '—'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <Link
                                                        href={route('admin.questionnaire.show', [q.teacher.id, q.school_year])}
                                                        className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                        View Details
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Total Count */}
                        <div className="mt-6 text-center text-gray-600">
                            <p>Showing {questionnaires.length} questionnaire{questionnaires.length !== 1 ? 's' : ''}</p>
                        </div>
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
