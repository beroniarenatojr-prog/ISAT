import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { 
    ArrowLeft, Edit, User, Mail, Phone, MapPin, Building, IdCard, Briefcase, 
    Calendar, Award, TrendingUp, FileText, CheckCircle, Download, Eye, Upload, Camera,
    Target, Plus, Trash2, Save, X
} from 'lucide-react';
import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function TeacherProfile({ teacher, ipcrfStats, promotions, questionnaires, signedIpcrfs, recentActivity, objectives, kras, positions = [] }) {
    const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
    const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

    const profileDefaults = () => ({
        name: teacher.name || '',
        email: teacher.email || '',
        department: teacher.department || '',
        teacher_status: teacher.teacher_status || teacher.teacher_type || '',
        career_stage: teacher.career_stage || '',
        school_campus: teacher.school_campus || '',
        level: teacher.level || '',
        date_hired: teacher.date_hired ? String(teacher.date_hired).slice(0, 10) : '',
        years_of_service: teacher.years_of_service ?? '',
        current_position_id: teacher.current_position_id ? String(teacher.current_position_id) : '',
    });

    const editForm = useForm(profileDefaults());

    const openEditProfile = () => {
        editForm.clearErrors();
        editForm.setData(profileDefaults());
        setIsEditProfileOpen(true);
    };

    const handleUpdateProfile = (e) => {
        e.preventDefault();
        editForm.put(route('admin.teachers.update', teacher.id), {
            preserveScroll: true,
            onSuccess: () => setIsEditProfileOpen(false),
        });
    };

    const [isAddObjectiveModalOpen, setIsAddObjectiveModalOpen] = useState(false);
    const [isEditObjectiveModalOpen, setIsEditObjectiveModalOpen] = useState(false);
    const [selectedObjective, setSelectedObjective] = useState(null);
    const [objectiveForm, setObjectiveForm] = useState({
        kra_id: '',
        code: '',
        description: '',
        weight: '',
    });

    const handlePhotoUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setIsUploadingPhoto(true);
            const formData = new FormData();
            formData.append('photo', file);
            formData.append('teacher_id', teacher.id);

            router.post(route('admin.teachers.upload-photo', teacher.id), formData, {
                onSuccess: () => {
                    setIsUploadingPhoto(false);
                },
                onError: () => {
                    setIsUploadingPhoto(false);
                    alert('Failed to upload photo');
                }
            });
        }
    };

    const getYearsOfService = () => {
        // Manual value wins; otherwise derive from date hired; default 0.
        let years = teacher.years_of_service;
        if (years === null || years === undefined || years === '') {
            years = teacher.date_hired
                ? new Date().getFullYear() - new Date(teacher.date_hired).getFullYear()
                : 0;
        }
        years = Number(years) || 0;
        return `${years} year${years !== 1 ? 's' : ''}`;
    };

    const getStatusBadge = () => {
        return teacher.is_active ? (
            <Badge className="bg-green-200 text-green-800">Active</Badge>
        ) : (
            <Badge className="bg-gray-200 text-gray-800">Inactive</Badge>
        );
    };

    // Objective Management Functions
    const openAddObjectiveModal = () => {
        setObjectiveForm({
            kra_id: '',
            code: '',
            description: '',
            weight: '',
        });
        setIsAddObjectiveModalOpen(true);
    };

    const openEditObjectiveModal = (objective) => {
        setSelectedObjective(objective);
        setObjectiveForm({
            kra_id: objective.kra_id,
            code: objective.code,
            description: objective.description,
            weight: objective.weight,
        });
        setIsEditObjectiveModalOpen(true);
    };

    const handleAddObjective = (e) => {
        e.preventDefault();
        router.post(route('admin.ipcrf.objective.store'), objectiveForm, {
            onSuccess: () => {
                setIsAddObjectiveModalOpen(false);
                setObjectiveForm({
                    kra_id: '',
                    code: '',
                    description: '',
                    weight: '',
                });
            },
            onError: (errors) => {
                console.error('Error adding objective:', errors);
            }
        });
    };

    const handleEditObjective = (e) => {
        e.preventDefault();
        router.put(route('admin.ipcrf.objective.update', selectedObjective.id), objectiveForm, {
            onSuccess: () => {
                setIsEditObjectiveModalOpen(false);
                setSelectedObjective(null);
                setObjectiveForm({
                    kra_id: '',
                    code: '',
                    description: '',
                    weight: '',
                });
            },
            onError: (errors) => {
                console.error('Error updating objective:', errors);
            }
        });
    };

    const handleDeleteObjective = (objectiveId) => {
        if (confirm('Are you sure you want to delete this objective?')) {
            router.delete(route('admin.ipcrf.objective.delete', objectiveId), {
                onError: (errors) => {
                    console.error('Error deleting objective:', errors);
                }
            });
        }
    };

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <Head title={`${teacher.name} - Profile`} />
                
                <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 h-4" />
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href={route('admin.teachers.index')}>
                                    Teacher Management
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Profile</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </header>

                <div className="flex-1 p-6 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
                    {/* Background Logo */}
                    <div className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center opacity-10">
                        <img 
                            src="/pictures/isat.tmp" 
                            alt="ISAT Background" 
                            className="w-[800px] h-[800px] object-contain"
                        />
                    </div>

                    <div className="max-w-7xl mx-auto relative z-10">
                        {/* Back Button */}
                        <Link
                            href={route('admin.teachers.index')}
                            className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-medium mb-6"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Teacher Management
                        </Link>

                        {/* Header Card with Profile Photo */}
                        <div className="bg-white rounded-xl shadow-lg p-8 mb-6 border-2 border-green-200">
                            <div className="flex items-start gap-6">
                                {/* Profile Photo */}
                                <div className="relative group">
                                    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-green-500 shadow-lg bg-gray-100 flex items-center justify-center">
                                        {teacher.profile_picture ? (
                                            <img
                                                src={route('users.avatar', teacher.id)}
                                                alt={teacher.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <User className="h-16 w-16 text-gray-400" />
                                        )}
                                    </div>
                                    {/* Upload Photo Button */}
                                    <label className="absolute bottom-0 right-0 cursor-pointer">
                                        <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center shadow-lg hover:bg-green-700 transition-colors">
                                            <Camera className="h-5 w-5 text-white" />
                                        </div>
                                        <input 
                                            type="file" 
                                            className="hidden" 
                                            accept="image/*"
                                            onChange={handlePhotoUpload}
                                            disabled={isUploadingPhoto}
                                        />
                                    </label>
                                </div>

                                {/* Basic Info */}
                                <div className="flex-1">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <h1 className="text-3xl font-bold text-gray-900 mb-2">{teacher.name}</h1>
                                            <p className="text-lg text-green-600 font-semibold mb-1">
                                                {teacher.current_position?.name || 'No Position'}
                                            </p>
                                            <div className="flex items-center gap-2">
                                                {getStatusBadge()}
                                                {teacher.career_stage && (
                                                    <Badge className="bg-blue-200 text-blue-800">
                                                        {teacher.career_stage}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                        <Button
                                            onClick={openEditProfile}
                                            className="bg-green-600 hover:bg-green-700"
                                        >
                                            <Edit className="h-4 w-4 mr-2" />
                                            Edit Profile
                                        </Button>
                                    </div>

                                    {/* Contact Info Grid */}
                                    <div className="grid grid-cols-2 gap-4">
                                        {teacher.employee_id && (
                                            <div className="flex items-center gap-2 text-gray-700">
                                                <IdCard className="h-4 w-4 text-green-600" />
                                                <span className="text-sm font-medium">ID:</span>
                                                <span className="text-sm">{teacher.employee_id}</span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2 text-gray-700">
                                            <Mail className="h-4 w-4 text-green-600" />
                                            <span className="text-sm">{teacher.email}</span>
                                        </div>
                                        {teacher.contact_number && (
                                            <div className="flex items-center gap-2 text-gray-700">
                                                <Phone className="h-4 w-4 text-green-600" />
                                                <span className="text-sm">{teacher.contact_number}</span>
                                            </div>
                                        )}
                                        {teacher.department && (
                                            <div className="flex items-center gap-2 text-gray-700">
                                                <Building className="h-4 w-4 text-green-600" />
                                                <span className="text-sm">{teacher.department}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                            <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-blue-200">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <TrendingUp className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <p className="text-sm font-semibold text-gray-600">Latest Rating</p>
                                </div>
                                <p className="text-3xl font-bold text-blue-600">
                                    {ipcrfStats.latest_rating || 'N/A'}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                    {ipcrfStats.latest_rating_date || ''}
                                </p>
                            </div>

                            <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-green-200">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                        <FileText className="h-5 w-5 text-green-600" />
                                    </div>
                                    <p className="text-sm font-semibold text-gray-600">Total IPCRFs</p>
                                </div>
                                <p className="text-3xl font-bold text-green-600">{ipcrfStats.total_submissions || 0}</p>
                            </div>

                            <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-purple-200">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                        <Award className="h-5 w-5 text-purple-600" />
                                    </div>
                                    <p className="text-sm font-semibold text-gray-600">Avg Rating</p>
                                </div>
                                <p className="text-3xl font-bold text-purple-600">
                                    {ipcrfStats.average_rating ? Number(ipcrfStats.average_rating).toFixed(2) : 'N/A'}
                                </p>
                            </div>

                            <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-orange-200">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                                        <Calendar className="h-5 w-5 text-orange-600" />
                                    </div>
                                    <p className="text-sm font-semibold text-gray-600">Years of Service</p>
                                </div>
                                <p className="text-3xl font-bold text-orange-600">{getYearsOfService()}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Left Column */}
                            <div className="space-y-6">
                                {/* Professional Details */}
                                <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-200">
                                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                        <Briefcase className="h-6 w-6 text-green-600" />
                                        Professional Details
                                    </h2>
                                    
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center pb-3 border-b">
                                            <span className="text-gray-600 font-medium">Current Position</span>
                                            <span className="text-gray-900 font-semibold">{teacher.current_position?.name || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between items-center pb-3 border-b">
                                            <span className="text-gray-600 font-medium">Career Stage</span>
                                            <span className="text-gray-900 font-semibold">{teacher.career_stage || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between items-center pb-3 border-b">
                                            <span className="text-gray-600 font-medium">Teacher Status</span>
                                            <span className="text-gray-900 font-semibold">{teacher.teacher_status || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between items-center pb-3 border-b">
                                            <span className="text-gray-600 font-medium">Department</span>
                                            <span className="text-gray-900 font-semibold">{teacher.department || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between items-center pb-3 border-b">
                                            <span className="text-gray-600 font-medium">School/Campus</span>
                                            <span className="text-gray-900 font-semibold">{teacher.school_campus || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between items-center pb-3 border-b">
                                            <span className="text-gray-600 font-medium">Level</span>
                                            <span className="text-gray-900 font-semibold">{teacher.level || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between items-center pb-3 border-b">
                                            <span className="text-gray-600 font-medium">Date Hired</span>
                                            <span className="text-gray-900 font-semibold">
                                                {teacher.date_hired ? new Date(teacher.date_hired).toLocaleDateString() : 'N/A'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center pb-3 border-b">
                                            <span className="text-gray-600 font-medium">Years of Service</span>
                                            <span className="text-gray-900 font-semibold">{getYearsOfService()}</span>
                                        </div>
                                        {teacher.address && (
                                            <div className="flex justify-between items-start pb-3">
                                                <span className="text-gray-600 font-medium">Address</span>
                                                <span className="text-gray-900 font-semibold text-right max-w-xs">{teacher.address}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Promotion History */}
                                <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-200">
                                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                        <TrendingUp className="h-6 w-6 text-green-600" />
                                        Promotion History
                                    </h2>
                                    
                                    {promotions && promotions.length > 0 ? (
                                        <div className="space-y-4">
                                            {promotions.map((promotion, index) => (
                                                <div key={index} className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border-2 border-green-200">
                                                    <div className="flex items-start justify-between">
                                                        <div>
                                                            <p className="font-semibold text-gray-900">{promotion.to_position?.name || 'Position Updated'}</p>
                                                            {promotion.from_position && (
                                                                <p className="text-sm text-gray-600">From: {promotion.from_position.name}</p>
                                                            )}
                                                            <p className="text-xs text-gray-500 mt-1">
                                                                {new Date(promotion.promotion_date).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                        <CheckCircle className="h-5 w-5 text-green-600" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-gray-500 text-center py-4">No promotion history</p>
                                    )}
                                </div>

                                {/* Questionnaire Feedback */}
                                <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-200">
                                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                        <FileText className="h-6 w-6 text-green-600" />
                                        Questionnaire Feedback
                                    </h2>
                                    
                                    {questionnaires && questionnaires.length > 0 ? (
                                        <div className="space-y-4">
                                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border-2 border-blue-200">
                                                <p className="text-sm text-gray-600 mb-2">Total Questionnaires</p>
                                                <p className="text-3xl font-bold text-blue-600">{questionnaires.length}</p>
                                            </div>
                                            
                                            {questionnaires[0] && (
                                                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 border-2 border-purple-200">
                                                    <p className="text-sm text-gray-600 mb-2">Latest Survey ({questionnaires[0].school_year})</p>
                                                    <p className="text-sm text-gray-700">Status: <span className="font-semibold">{questionnaires[0].status}</span></p>
                                                    {questionnaires[0].responses && (
                                                        <p className="text-sm text-gray-700 mt-1">
                                                            Avg Rating: <span className="font-semibold">
                                                                {(Object.values(questionnaires[0].responses).reduce((a, b) => a + b, 0) / Object.keys(questionnaires[0].responses).length).toFixed(2)}/5
                                                            </span>
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                            
                                            <Link
                                                href={route('admin.questionnaire-results', { search: teacher.name })}
                                                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                                            >
                                                <Eye className="h-4 w-4" />
                                                View All Responses
                                            </Link>
                                        </div>
                                    ) : (
                                        <p className="text-gray-500 text-center py-4">No questionnaires submitted</p>
                                    )}
                                </div>
                            </div>

                            {/* Right Column */}
                            <div className="space-y-6">
                                {/* IPCRF Performance Summary */}
                                <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-200">
                                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                        <Award className="h-6 w-6 text-green-600" />
                                        IPCRF Performance Summary
                                    </h2>
                                    
                                    <div className="space-y-4">
                                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border-2 border-green-200">
                                            <p className="text-sm text-gray-600 mb-1">Latest IPCRF Rating</p>
                                            <p className="text-4xl font-bold text-green-600">{ipcrfStats.latest_rating || 'N/A'}</p>
                                            <p className="text-sm text-gray-500 mt-1">{ipcrfStats.latest_rating_date || 'No date'}</p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                                                <p className="text-xs text-gray-600 mb-1">Total Submissions</p>
                                                <p className="text-2xl font-bold text-blue-600">{ipcrfStats.total_submissions || 0}</p>
                                            </div>
                                            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                                                <p className="text-xs text-gray-600 mb-1">Average Rating</p>
                                                <p className="text-2xl font-bold text-purple-600">
                                                    {ipcrfStats.average_rating ? Number(ipcrfStats.average_rating).toFixed(2) : 'N/A'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Quick Rating History Chart */}
                                        {ipcrfStats.rating_history && ipcrfStats.rating_history.length > 0 && (
                                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                                <p className="text-sm text-gray-600 mb-4 font-medium">Rating Timeline</p>
                                                
                                                {/* Visual Chart */}
                                                <div className="mb-4">
                                                    <div className="flex items-end justify-between h-20 bg-white rounded p-3 border">
                                                        {ipcrfStats.rating_history.slice(0, 6).map((rating, index) => {
                                                            const height = (rating.final_rating / 5) * 100;
                                                            return (
                                                                <div key={index} className="flex flex-col items-center">
                                                                    <div 
                                                                        className={`w-4 rounded-t transition-all duration-300 ${
                                                                            rating.final_rating >= 4.5 ? 'bg-green-500' :
                                                                            rating.final_rating >= 3.5 ? 'bg-blue-500' :
                                                                            rating.final_rating >= 2.5 ? 'bg-yellow-500' : 'bg-red-500'
                                                                        }`}
                                                                        style={{ height: `${Math.max(height, 10)}%` }}
                                                                        title={`Rating: ${Number(rating.final_rating).toFixed(2)}`}
                                                                    ></div>
                                                                    <span className="text-xs text-gray-500 mt-1 transform -rotate-45 origin-top-left">
                                                                        {rating.school_year || new Date(rating.created_at).getFullYear()}
                                                                    </span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>

                                                {/* Rating List */}
                                                <div className="space-y-2">
                                                    {ipcrfStats.rating_history.slice(0, 3).map((rating, index) => (
                                                        <div key={index} className="flex items-center justify-between">
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-3 h-3 rounded-full ${
                                                                    rating.final_rating >= 4.5 ? 'bg-green-500' :
                                                                    rating.final_rating >= 3.5 ? 'bg-blue-500' :
                                                                    rating.final_rating >= 2.5 ? 'bg-yellow-500' : 'bg-red-500'
                                                                }`}></div>
                                                                <span className="text-sm text-gray-700">
                                                                    {rating.school_year || new Date(rating.created_at).getFullYear()}
                                                                </span>
                                                            </div>
                                                            <span className="text-sm font-semibold text-gray-900">
                                                                {Number(rating.final_rating).toFixed(2)}
                                                            </span>
                                                        </div>
                                                    ))}
                                                    {ipcrfStats.rating_history.length > 3 && (
                                                        <div className="text-xs text-gray-500 text-center pt-2">
                                                            +{ipcrfStats.rating_history.length - 3} more ratings
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        <Link
                                            href={route('admin.ipcrf-history', { teacher_id: teacher.id })}
                                            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium w-full justify-center"
                                        >
                                            <Eye className="h-4 w-4" />
                                            View Full IPCRF History
                                        </Link>
                                    </div>
                                </div>

                                {/* Signed IPCRF Documents */}
                                <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-200">
                                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                        <CheckCircle className="h-6 w-6 text-green-600" />
                                        Signed IPCRF Documents
                                    </h2>
                                    
                                    {signedIpcrfs && signedIpcrfs.length > 0 ? (
                                        <div className="space-y-3">
                                            {signedIpcrfs.slice(0, 5).map((doc, index) => (
                                                <div key={index} className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg p-4 border border-gray-200 flex items-center justify-between">
                                                    <div>
                                                        <p className="font-semibold text-gray-900">{doc.school_year}</p>
                                                        <p className="text-sm text-gray-600">
                                                            Status: <span className={`font-semibold ${doc.status === 'approved' ? 'text-green-600' : 'text-orange-600'}`}>
                                                                {doc.status}
                                                            </span>
                                                        </p>
                                                    </div>
                                                    <a
                                                        href={route('admin.signed-ipcrf.download', doc.id)}
                                                        className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                                    >
                                                        <Download className="h-4 w-4" />
                                                    </a>
                                                </div>
                                            ))}
                                            
                                            {signedIpcrfs.length > 5 && (
                                                <Link
                                                    href={route('admin.signed-ipcrf', { teacher_id: teacher.id })}
                                                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium mt-2"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                    View All ({signedIpcrfs.length} total)
                                                </Link>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-gray-500 text-center py-4">No signed documents</p>
                                    )}
                                </div>

                                {/* Recent Activity */}
                                {recentActivity && recentActivity.length > 0 && (
                                    <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-200">
                                        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                            <Calendar className="h-6 w-6 text-green-600" />
                                            Recent Activity
                                        </h2>
                                        
                                        <div className="space-y-3">
                                            {recentActivity.map((activity, index) => (
                                                <div key={index} className="flex items-start gap-3 pb-3 border-b last:border-0">
                                                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                                                    <div className="flex-1">
                                                        <p className="text-sm text-gray-900">{activity.description}</p>
                                                        <p className="text-xs text-gray-500 mt-1">{activity.date}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Quick Actions */}
                                <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-200">
                                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
                                    
                                    <div className="grid grid-cols-2 gap-3">
                                        <Link
                                            href={route('admin.ipcrf.rate', teacher.id)}
                                            className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                                        >
                                            <Award className="h-4 w-4" />
                                            Rate Teacher
                                        </Link>
                                        
                                        <Link
                                            href={route('admin.teachers.promotions', teacher.id)}
                                            className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium text-sm"
                                        >
                                            <TrendingUp className="h-4 w-4" />
                                            Promote
                                        </Link>
                                        
                                        <Link
                                            href={route('admin.questionnaire-results', { search: teacher.name })}
                                            className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
                                        >
                                            <FileText className="h-4 w-4" />
                                            View Surveys
                                        </Link>
                                        
                                        <button
                                            onClick={() => window.print()}
                                            className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium text-sm"
                                        >
                                            <Download className="h-4 w-4" />
                                            Print Report
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </SidebarInset>

            {/* Edit Profile Modal */}
            <Dialog open={isEditProfileOpen} onOpenChange={setIsEditProfileOpen}>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Edit className="h-5 w-5 text-green-600" />
                            Edit Profile
                        </DialogTitle>
                        <DialogDescription>Update {teacher.name}'s details and professional information.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleUpdateProfile}>
                        <div className="space-y-4 py-2">
                            <div className="space-y-1">
                                <Label htmlFor="ep_name">Full Name</Label>
                                <Input
                                    id="ep_name"
                                    value={editForm.data.name}
                                    onChange={(e) => editForm.setData('name', e.target.value)}
                                    className={editForm.errors.name ? 'border-red-500' : ''}
                                />
                                {editForm.errors.name && (
                                    <p className="text-xs text-red-600">{editForm.errors.name}</p>
                                )}
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="ep_email">Email</Label>
                                <Input
                                    id="ep_email"
                                    type="email"
                                    value={editForm.data.email}
                                    onChange={(e) => editForm.setData('email', e.target.value)}
                                    className={editForm.errors.email ? 'border-red-500' : ''}
                                />
                                {editForm.errors.email && (
                                    <p className="text-xs text-red-600">{editForm.errors.email}</p>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label htmlFor="ep_department">Department</Label>
                                    <Select
                                        value={editForm.data.department}
                                        onValueChange={(value) => editForm.setData('department', value)}
                                    >
                                        <SelectTrigger id="ep_department" className={editForm.errors.department ? 'border-red-500' : ''}>
                                            <SelectValue placeholder="Select department" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Acad">Acad</SelectItem>
                                            <SelectItem value="Tech-Pro">Tech-Pro</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {editForm.errors.department && (
                                        <p className="text-xs text-red-600">{editForm.errors.department}</p>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="ep_status">Status</Label>
                                    <Select
                                        value={editForm.data.teacher_status}
                                        onValueChange={(value) => editForm.setData('teacher_status', value)}
                                    >
                                        <SelectTrigger id="ep_status" className={editForm.errors.teacher_status ? 'border-red-500' : ''}>
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Permanent">Permanent</SelectItem>
                                            <SelectItem value="Provisioning">Provisioning</SelectItem>
                                            <SelectItem value="Volunteer/COS">Volunteer/COS</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {editForm.errors.teacher_status && (
                                        <p className="text-xs text-red-600">{editForm.errors.teacher_status}</p>
                                    )}
                                </div>
                            </div>

                            <div className="pt-2 border-t">
                                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">Professional Details</p>

                                <div className="space-y-1">
                                    <Label htmlFor="ep_position">Current Position</Label>
                                    <Select
                                        value={editForm.data.current_position_id || 'none'}
                                        onValueChange={(value) => editForm.setData('current_position_id', value === 'none' ? '' : value)}
                                    >
                                        <SelectTrigger id="ep_position" className={editForm.errors.current_position_id ? 'border-red-500' : ''}>
                                            <SelectValue placeholder="Select position" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">None</SelectItem>
                                            {positions.map((pos) => (
                                                <SelectItem key={pos.id} value={String(pos.id)}>{pos.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {editForm.errors.current_position_id && (
                                        <p className="text-xs text-red-600">{editForm.errors.current_position_id}</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-3 mt-3">
                                    <div className="space-y-1">
                                        <Label htmlFor="ep_career_stage">Career Stage</Label>
                                        <Select
                                            value={editForm.data.career_stage || 'none'}
                                            onValueChange={(value) => editForm.setData('career_stage', value === 'none' ? '' : value)}
                                        >
                                            <SelectTrigger id="ep_career_stage" className={editForm.errors.career_stage ? 'border-red-500' : ''}>
                                                <SelectValue placeholder="Select stage" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">None</SelectItem>
                                                <SelectItem value="Beginning Towards Proficient">Beginning Towards Proficient</SelectItem>
                                                <SelectItem value="Highly Proficient">Highly Proficient</SelectItem>
                                                <SelectItem value="Distinguished">Distinguished</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {editForm.errors.career_stage && (
                                            <p className="text-xs text-red-600">{editForm.errors.career_stage}</p>
                                        )}
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="ep_date_hired">Date Hired</Label>
                                        <Input
                                            id="ep_date_hired"
                                            type="date"
                                            value={editForm.data.date_hired}
                                            onChange={(e) => editForm.setData('date_hired', e.target.value)}
                                            className={editForm.errors.date_hired ? 'border-red-500' : ''}
                                        />
                                        {editForm.errors.date_hired && (
                                            <p className="text-xs text-red-600">{editForm.errors.date_hired}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-1 mt-3">
                                    <Label htmlFor="ep_years_of_service">Years of Service</Label>
                                    <Input
                                        id="ep_years_of_service"
                                        type="number"
                                        min="0"
                                        max="80"
                                        value={editForm.data.years_of_service}
                                        onChange={(e) => editForm.setData('years_of_service', e.target.value)}
                                        placeholder="Leave blank to derive from Date Hired"
                                        className={editForm.errors.years_of_service ? 'border-red-500' : ''}
                                    />
                                    {editForm.errors.years_of_service && (
                                        <p className="text-xs text-red-600">{editForm.errors.years_of_service}</p>
                                    )}
                                    <p className="text-[11px] text-gray-400">Blank = auto-calculated from Date Hired.</p>
                                </div>

                                <div className="grid grid-cols-2 gap-3 mt-3">
                                    <div className="space-y-1">
                                        <Label htmlFor="ep_school_campus">School / Campus</Label>
                                        <Input
                                            id="ep_school_campus"
                                            value={editForm.data.school_campus}
                                            onChange={(e) => editForm.setData('school_campus', e.target.value)}
                                            placeholder="e.g. ISAT-MAIN"
                                            className={editForm.errors.school_campus ? 'border-red-500' : ''}
                                        />
                                        {editForm.errors.school_campus && (
                                            <p className="text-xs text-red-600">{editForm.errors.school_campus}</p>
                                        )}
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="ep_level">Level</Label>
                                        <Select
                                            value={editForm.data.level || 'none'}
                                            onValueChange={(value) => editForm.setData('level', value === 'none' ? '' : value)}
                                        >
                                            <SelectTrigger id="ep_level" className={editForm.errors.level ? 'border-red-500' : ''}>
                                                <SelectValue placeholder="Select level" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">Not set</SelectItem>
                                                <SelectItem value="JHS">JHS</SelectItem>
                                                <SelectItem value="SHS">SHS</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {editForm.errors.level && (
                                            <p className="text-xs text-red-600">{editForm.errors.level}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsEditProfileOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" className="bg-green-600 hover:bg-green-700" disabled={editForm.processing}>
                                <Save className="h-4 w-4 mr-2" />
                                Save Changes
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Add Objective Modal */}
            <Dialog open={isAddObjectiveModalOpen} onOpenChange={setIsAddObjectiveModalOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Plus className="h-5 w-5 text-green-600" />
                            Add New Objective
                        </DialogTitle>
                        <DialogDescription>
                            Create a new objective for this teacher's IPCRF evaluation.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddObjective}>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="add_kra_id">KRA</Label>
                                <Select
                                    value={objectiveForm.kra_id}
                                    onValueChange={(value) => setObjectiveForm({...objectiveForm, kra_id: value})}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select KRA" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {kras && kras.map((kra) => (
                                            <SelectItem key={kra.id} value={kra.id.toString()}>
                                                {kra.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="add_code">Code</Label>
                                <Input
                                    id="add_code"
                                    value={objectiveForm.code}
                                    onChange={(e) => setObjectiveForm({...objectiveForm, code: e.target.value})}
                                    placeholder="e.g., OBJ-001"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="add_description">Description</Label>
                                <Textarea
                                    id="add_description"
                                    value={objectiveForm.description}
                                    onChange={(e) => setObjectiveForm({...objectiveForm, description: e.target.value})}
                                    placeholder="Enter objective description"
                                    required
                                    rows={3}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="add_weight">Weight (%)</Label>
                                <Input
                                    id="add_weight"
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.01"
                                    value={objectiveForm.weight}
                                    onChange={(e) => setObjectiveForm({...objectiveForm, weight: e.target.value})}
                                    placeholder="0.00"
                                    required
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsAddObjectiveModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" className="bg-green-600 hover:bg-green-700">
                                <Save className="h-4 w-4 mr-2" />
                                Add Objective
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit Objective Modal */}
            <Dialog open={isEditObjectiveModalOpen} onOpenChange={setIsEditObjectiveModalOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Edit className="h-5 w-5 text-blue-600" />
                            Edit Objective
                        </DialogTitle>
                        <DialogDescription>
                            Update the selected objective details.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleEditObjective}>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit_kra_id">KRA</Label>
                                <Select
                                    value={objectiveForm.kra_id?.toString()}
                                    onValueChange={(value) => setObjectiveForm({...objectiveForm, kra_id: value})}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select KRA" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {kras && kras.map((kra) => (
                                            <SelectItem key={kra.id} value={kra.id.toString()}>
                                                {kra.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit_code">Code</Label>
                                <Input
                                    id="edit_code"
                                    value={objectiveForm.code}
                                    onChange={(e) => setObjectiveForm({...objectiveForm, code: e.target.value})}
                                    placeholder="e.g., OBJ-001"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit_description">Description</Label>
                                <Textarea
                                    id="edit_description"
                                    value={objectiveForm.description}
                                    onChange={(e) => setObjectiveForm({...objectiveForm, description: e.target.value})}
                                    placeholder="Enter objective description"
                                    required
                                    rows={3}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit_weight">Weight (%)</Label>
                                <Input
                                    id="edit_weight"
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.01"
                                    value={objectiveForm.weight}
                                    onChange={(e) => setObjectiveForm({...objectiveForm, weight: e.target.value})}
                                    placeholder="0.00"
                                    required
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsEditObjectiveModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                                <Save className="h-4 w-4 mr-2" />
                                Update Objective
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </SidebarProvider>
    );
}
