import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { MessageSquare, Star, Filter, TrendingUp, Users, BarChart3 } from 'lucide-react';
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

export default function SurveyResults({ surveys, schoolYears, filters, stats }) {
    const [filterYear, setFilterYear] = useState(filters.school_year || '');

    const handleFilter = () => {
        router.get(route('admin.survey-results'), {
            school_year: filterYear,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const questionLabels = {
        process_clarity: 'Process Clarity',
        submission_ease: 'Submission Ease',
        admin_feedback: 'Admin Feedback Quality',
        objectives_clarity: 'Objectives Clarity',
        system_usability: 'System Usability',
    };

    const StarDisplay = ({ value }) => {
        return (
            <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star 
                        key={star} 
                        className={`h-5 w-5 ${star <= value ? 'text-yellow-400' : 'text-gray-300'}`}
                        fill={star <= value ? 'currentColor' : 'none'}
                    />
                ))}
            </div>
        );
    };

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <Head title="Survey Results - Admin" />
                
                <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 h-4" />
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbPage>Survey Results</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </header>

                <div className="flex-1 p-6 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
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
                        <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-green-200">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                    <Users className="h-5 w-5 text-green-600" />
                                </div>
                                <p className="text-sm font-semibold text-gray-600">Total Responses</p>
                            </div>
                            <p className="text-3xl font-bold text-green-600">{stats.total_responses}</p>
                        </div>

                        <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-emerald-200">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                                    <Star className="h-5 w-5 text-emerald-600" />
                                </div>
                                <p className="text-sm font-semibold text-gray-600">Avg Satisfaction</p>
                            </div>
                            <p className="text-3xl font-bold text-emerald-600">
                                {stats.average_satisfaction ? stats.average_satisfaction.toFixed(2) : 'N/A'}/5
                            </p>
                        </div>

                        <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-teal-200 col-span-2">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                                    <BarChart3 className="h-5 w-5 text-teal-600" />
                                </div>
                                <p className="text-sm font-semibold text-gray-600">Satisfaction Distribution</p>
                            </div>
                            <div className="flex gap-2 items-end h-16">
                                {[1, 2, 3, 4, 5].map((rating) => {
                                    const count = stats.satisfaction_distribution[rating] || 0;
                                    const maxCount = Math.max(...Object.values(stats.satisfaction_distribution));
                                    const height = maxCount > 0 ? (count / maxCount) * 100 : 0;
                                    
                                    return (
                                        <div key={rating} className="flex-1 flex flex-col items-center gap-1">
                                            <div 
                                                className="w-full bg-green-500 rounded-t"
                                                style={{ height: `${height}%`, minHeight: count > 0 ? '20px' : '0' }}
                                            />
                                            <span className="text-xs font-bold text-gray-600">{rating}★</span>
                                            <span className="text-xs text-gray-500">({count})</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Average Responses */}
                    {Object.keys(stats.average_responses).length > 0 && (
                        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border-2 border-gray-200 relative z-10">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Average Question Ratings</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {Object.entries(stats.average_responses).map(([key, value]) => (
                                    <div key={key} className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border-2 border-green-200">
                                        <p className="text-sm font-semibold text-green-900 mb-2">
                                            {questionLabels[key]}
                                        </p>
                                        <div className="flex items-center gap-3">
                                            <StarDisplay value={Math.round(value)} />
                                            <span className="text-lg font-bold text-green-600">
                                                {value.toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Filter */}
                    <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border-2 border-gray-200 relative z-10">
                        <div className="flex items-center gap-2 mb-4">
                            <Filter className="h-5 w-5 text-gray-600" />
                            <h2 className="text-lg font-bold text-gray-900">Filter</h2>
                        </div>
                        
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <select
                                    value={filterYear}
                                    onChange={(e) => setFilterYear(e.target.value)}
                                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                                >
                                    <option value="">All School Years</option>
                                    {schoolYears.map((year) => (
                                        <option key={year} value={year}>{year}</option>
                                    ))}
                                </select>
                            </div>
                            <Button
                                onClick={handleFilter}
                                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                            >
                                Apply Filter
                            </Button>
                        </div>
                    </div>

                    {/* Individual Responses */}
                    <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-200 relative z-10">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Individual Responses</h2>

                        {surveys.length === 0 ? (
                            <div className="text-center py-12">
                                <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-600 text-lg">No survey responses yet</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {surveys.map((survey) => (
                                    <div key={survey.id} className="border-2 border-gray-200 rounded-xl p-6 hover:border-green-300 transition-all">
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-900">
                                                    {survey.teacher.name}
                                                </h3>
                                                <p className="text-sm text-gray-600">
                                                    SY {survey.school_year} • {new Date(survey.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-semibold text-gray-600">Overall:</span>
                                                <StarDisplay value={survey.overall_satisfaction} />
                                                <span className="text-lg font-bold text-green-600">
                                                    {survey.overall_satisfaction}/5
                                                </span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                                            {Object.entries(survey.responses).map(([key, value]) => (
                                                <div key={key} className="bg-gray-50 rounded-lg p-3">
                                                    <p className="text-xs text-gray-600 mb-1">{questionLabels[key]}</p>
                                                    <div className="flex items-center gap-2">
                                                        <StarDisplay value={value} />
                                                        <span className="text-sm font-bold">{value}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {survey.comments && (
                                            <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
                                                <p className="text-sm font-semibold text-blue-900 mb-1">Comments:</p>
                                                <p className="text-blue-700">{survey.comments}</p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Total Count */}
                        <div className="mt-6 text-center text-gray-600">
                            <p>Showing all {surveys.length} survey response{surveys.length !== 1 ? 's' : ''}</p>
                        </div>
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
