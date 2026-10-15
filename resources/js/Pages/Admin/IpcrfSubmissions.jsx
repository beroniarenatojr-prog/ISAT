import { AppSidebar } from "@/components/app-sidebar";
import { Head, router, useForm, usePage } from '@inertiajs/react';
import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Plus, Eye, FileDown, FileCheck, FileX, ClipboardList } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { generateIpcrfOfficialForm } from '@/lib/ipcrfOfficialForm';

const POSITION_LABELS = {
    'T1 - T3': 'T1 - T3 (Teacher I-III)',
    'T4 - T7': 'T4 - T7 (Teacher IV-VII)',
    'MT1 - MT2': 'MT1 - MT2 (Master Teacher I-II)',
    'MT3 - MT5': 'MT3 - MT5 (Master Teacher III-V)',
};

export default function IpcrfSubmissions({ teachers, availableYears, kras, totalObjectives, currentSchoolYear, ratingScope, positionOptions = [], filters, flash }) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || '');
    const [selectedYear, setSelectedYear] = useState(filters.year || '');
    const [selectedUploads, setSelectedUploads] = useState(filters.has_uploads ? 'has' : '');
    const [selectedPosition, setSelectedPosition] = useState(filters.position || '');

    const applyFilters = (overrides = {}) => {
        router.get(route('admin.ipcrf.submissions'), {
            search: searchTerm,
            status: selectedStatus,
            year: selectedYear,
            has_uploads: selectedUploads === 'has' ? 1 : '',
            position: selectedPosition,
            ...overrides,
        }, { preserveState: true });
    };
    const [isViewDetailsModalOpen, setIsViewDetailsModalOpen] = useState(false);
    const [selectedRating, setSelectedRating] = useState(null);
    const [selectedTeacher, setSelectedTeacher] = useState(null);
    const [recordsPage, setRecordsPage] = useState(0);
    const [expandedYear, setExpandedYear] = useState(null);
    const RECORDS_PER_PAGE = 4;

    // Handle search
    const handleSearch = () => applyFilters();

    // Get status badge color
    const getStatusBadge = (status) => {
        const colors = {
            draft: 'bg-gray-100 text-gray-800',
            submitted: 'bg-yellow-100 text-yellow-800',
            approved: 'bg-green-100 text-green-800',
        };
        return colors[status] || colors.draft;
    };

    // Get rating equivalency
    const getRatingEquivalency = (rating) => {
        const numRating = Number(rating);
        if (numRating >= 4.5) return 'Outstanding';
        if (numRating >= 3.5) return 'Very Satisfactory';
        if (numRating >= 2.5) return 'Satisfactory';
        if (numRating >= 1.5) return 'Unsatisfactory';
        return 'Poor';
    };

    // Get rating color
    const getRatingColor = (rating) => {
        const numRating = Number(rating);
        if (numRating >= 4.5) return 'text-purple-600 bg-purple-50';
        if (numRating >= 3.5) return 'text-green-600 bg-green-50';
        if (numRating >= 2.5) return 'text-blue-600 bg-blue-50';
        if (numRating >= 1.5) return 'text-orange-600 bg-orange-50';
        return 'text-red-600 bg-red-50';
    };

    // Open the Rating Records view for a teacher - all rating periods + the
    // MOVs the teacher submitted in each of those years.
    const openRecords = (teacher) => {
        setSelectedTeacher(teacher);
        setSelectedRating(teacher?.ipcrf_ratings?.[0] ?? null);
        setRecordsPage(0);
        setExpandedYear(teacher?.ipcrf_ratings?.[0]?.rating_period ?? null);
        setIsViewDetailsModalOpen(true);
    };

    // Every school year this teacher has a rating and/or MOV submissions for,
    // newest first, each with its rating record and that year's MOVs.
    const buildRecords = (teacher) => {
        if (!teacher) return [];
        const ratings = teacher.ipcrf_ratings ?? [];
        const movs = teacher.teacher_submissions ?? [];
        const years = [...new Set([
            ...ratings.map((r) => r.rating_period).filter(Boolean),
            ...movs.map((m) => m.school_year).filter(Boolean),
        ])].sort((a, b) => String(b).localeCompare(String(a)));

        return years.map((year) => ({
            year,
            rating: ratings.find((r) => r.rating_period === year) ?? null,
            movs: movs.filter((m) => m.school_year === year),
        }));
    };

    const authUser = usePage().props.auth?.user;

    // Generate the official IPCRF Part 1 form from the selected rating
    const generateRatingSummaryOfficial = async () => {
        if (!selectedRating) return;

        try {
            const kraGroups = (selectedRating.kra_details || [])
                .map((kra) => ({
                    domain: kra.kra_name || 'Key Result Area',
                    objectives: (kra.objectives || []).map((obj) => ({
                        description: obj.objective_description || obj.objective_code || 'Objective',
                        weight: null,
                        rating: Number(obj.rating) || 0,
                    })),
                }))
                .filter((group) => group.objectives.length > 0);

            if (kraGroups.length === 0) {
                toast.error('This rating has no per-objective breakdown to put on the form.');
                return;
            }

            const teacher = teachers.data.find((t) => t.ipcrf_ratings?.some((r) => r.id === selectedRating.id));

            // Job title: real Position, then the division JSON position_title, then a role label.
            const positionLabel = (u) => {
                if (!u) return '';
                if (u.current_position?.name) return u.current_position.name;
                try {
                    const d = typeof u.division === 'string' ? JSON.parse(u.division) : u.division;
                    if (d?.position_title) return d.position_title;
                } catch (e) { /* not JSON */ }
                const roles = (u.roles || []).map((r) => (typeof r === 'string' ? r : r?.name));
                if (roles.includes('super-admin')) return 'Principal';
                if (roles.includes('admin')) return 'Master Teacher';
                if (roles.includes('teacher')) return 'Teacher';
                return '';
            };

            await generateIpcrfOfficialForm({
                employee: {
                    name: teacher?.name || '',
                    position: positionLabel(teacher) || 'No Position',
                    division: 'ISABELA SCHOOL OF ARTS AND TRADES - Ilagan Campus',
                },
                rater: {
                    name: authUser?.name || '',
                    position: positionLabel(authUser),
                },
                ratingPeriod: selectedRating.rating_period || selectedRating.school_year || '',
                dateOfReview: selectedRating.created_at ? new Date(selectedRating.created_at) : new Date(),
                kraGroups,
                numericalRating: selectedRating.numerical_rating != null ? Number(selectedRating.numerical_rating) : null,
                fileName: `IPCRF_Part1_${(teacher?.name || 'teacher').replace(/\s+/g, '_')}_${selectedRating.rating_period || 'SY'}.pdf`,
            });

            toast.success('IPCRF Part 1 form generated!');
        } catch (error) {
            console.error('Error generating IPCRF form:', error);
            toast.error('Failed to generate form: ' + error.message);
        }
    };

    // Export rating to PDF in official IPCRF format
    const exportRatingToPDF = () => {
        if (!selectedRating) return;

        try {
            console.log('Exporting rating to PDF:', selectedRating);
            
            // Create PDF in landscape orientation
            const doc = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'legal'
            });

            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            
            // Pink/salmon background color
            doc.setFillColor(255, 192, 203);
            doc.rect(0, 0, pageWidth, pageHeight, 'F');

            // Add logos
            doc.setFontSize(10);
            doc.setTextColor(0, 0, 0);
            doc.text('DepEd', 15, 15);
            doc.text('BHROD', pageWidth - 25, 15);

            // Title section
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('Official Electronic IPCRF Tool v4.3', pageWidth / 2, 12, { align: 'center' });
            doc.text('Highly Proficient Regular Teacher', pageWidth / 2, 17, { align: 'center' });
            doc.text(`SY ${selectedRating.rating_period || '2024-2025'}`, pageWidth / 2, 22, { align: 'center' });
            doc.setFontSize(11);
            doc.text('PART 1: INDIVIDUAL PERFORMANCE COMMITMENT AND REVIEW FORM', pageWidth / 2, 28, { align: 'center' });

            // Privacy notice
            doc.setFontSize(7);
            doc.setFont('helvetica', 'bold');
            doc.text('PRIVACY NOTICE:', 10, 35);
            doc.setFont('helvetica', 'normal');
            const privacyText = 'By using this tool, you agree to authorize the Department of Education to collect, process, retain, and dispose of your personal information in accordance with the Data Privacy Act of 2012.';
            doc.text(privacyText, 10, 38, { maxWidth: pageWidth - 20 });

            // Instructions
            doc.setFont('helvetica', 'bold');
            doc.text('INSTRUCTIONS:', 10, 45);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(6);
            const instructions = 'Part 1 shall be accomplished by the Rater during the Phase III: Performance Review and Evaluation of the RPMS Cycle. Fill in empty cells (white) with needed information about the rater and approving authority.';
            doc.text(instructions, 10, 48, { maxWidth: pageWidth - 20 });

            // Find teacher from the list
            const teacher = teachers.data.find(t => t.ipcrf_ratings?.some(r => r.id === selectedRating.id));

            // Employee information table
            const employeeData = [
                [
                    { content: 'Name of Employee:', styles: { fontStyle: 'bold', fillColor: [255, 192, 203] } },
                    { content: teacher?.name || '', colSpan: 2, styles: { fillColor: [255, 255, 255] } },
                    { content: 'RATER Last Name:', styles: { fontStyle: 'bold', fillColor: [255, 192, 203] } },
                    { content: '', styles: { fillColor: [255, 255, 255] } },
                    { content: 'First:', styles: { fontStyle: 'bold', fillColor: [255, 192, 203] } },
                    { content: '', styles: { fillColor: [255, 255, 255] } },
                    { content: 'Middle:', styles: { fontStyle: 'bold', fillColor: [255, 192, 203] } },
                    { content: '', styles: { fillColor: [255, 255, 255] } }
                ],
                [
                    { content: 'Position:', styles: { fontStyle: 'bold', fillColor: [255, 192, 203] } },
                    { content: teacher?.current_position?.name || 'Master Teacher II', colSpan: 2, styles: { fillColor: [255, 255, 255] } },
                    { content: 'Position:', styles: { fontStyle: 'bold', fillColor: [255, 192, 203] } },
                    { content: 'Principal IV', styles: { fillColor: [255, 255, 255] } },
                    { content: 'DepEd Email:', styles: { fontStyle: 'bold', fillColor: [255, 192, 203] } },
                    { content: '', colSpan: 2, styles: { fillColor: [255, 255, 255] } }
                ],
                [
                    { content: 'Bureau/Center/Service/Division:', styles: { fontStyle: 'bold', fillColor: [255, 192, 203] } },
                    { content: 'ISABELA SCHOOL OF ARTS AND TRADES - Ilagan Campus', colSpan: 2, styles: { fillColor: [255, 255, 255] } },
                    { content: 'Date of Review:', styles: { fontStyle: 'bold', fillColor: [255, 192, 203] } },
                    { content: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }), colSpan: 4, styles: { fillColor: [255, 255, 255] } }
                ],
                [
                    { content: 'Rating Period:', styles: { fontStyle: 'bold', fillColor: [255, 192, 203] } },
                    { content: `SY ${selectedRating.rating_period || '2024-2025'}`, colSpan: 7, styles: { fillColor: [255, 255, 255] } }
                ]
            ];

            autoTable(doc, {
                startY: 55,
                body: employeeData,
                theme: 'grid',
                styles: {
                    fontSize: 7,
                    cellPadding: 2,
                    lineColor: [0, 0, 0],
                    lineWidth: 0.1
                },
                columnStyles: {
                    0: { cellWidth: 45 },
                    1: { cellWidth: 35 },
                    2: { cellWidth: 35 },
                    3: { cellWidth: 35 },
                    4: { cellWidth: 30 },
                    5: { cellWidth: 20 },
                    6: { cellWidth: 30 },
                    7: { cellWidth: 25 }
                }
            });

            // Main IPCRF table
            let currentY = doc.lastAutoTable.finalY + 3;

            // Table headers
            const headers = [
                [
                    { content: 'KRA', rowSpan: 3, styles: { halign: 'center', valign: 'middle', fillColor: [144, 238, 144] } },
                    { content: 'Objective\nNo.', rowSpan: 3, styles: { halign: 'center', valign: 'middle', fillColor: [144, 238, 144] } },
                    { content: 'PPST', rowSpan: 3, styles: { halign: 'center', valign: 'middle', fillColor: [144, 238, 144] } },
                    { content: 'COI/NCOI', rowSpan: 3, styles: { halign: 'center', valign: 'middle', fillColor: [144, 238, 144] } },
                    { content: 'Weight\nper\nObjective', rowSpan: 3, styles: { halign: 'center', valign: 'middle', fillColor: [144, 238, 144] } },
                    { content: 'COT\nIndicator\nNo.', rowSpan: 3, styles: { halign: 'center', valign: 'middle', fillColor: [144, 238, 144] } },
                    { content: 'COT 1', colSpan: 2, styles: { halign: 'center', fillColor: [255, 192, 203] } },
                    { content: 'COT 2', colSpan: 2, styles: { halign: 'center', fillColor: [255, 192, 203] } },
                    { content: 'COT 3', colSpan: 2, styles: { halign: 'center', fillColor: [255, 192, 203] } },
                    { content: 'COT 4', colSpan: 2, styles: { halign: 'center', fillColor: [255, 192, 203] } },
                    { content: 'Ave', rowSpan: 3, styles: { halign: 'center', valign: 'middle', fillColor: [144, 238, 144] } },
                    { content: 'IPCRF Numerical Ratings', colSpan: 4, styles: { halign: 'center', fillColor: [144, 238, 144] } },
                    { content: 'Score', rowSpan: 3, styles: { halign: 'center', valign: 'middle', fillColor: [144, 238, 144] } },
                    { content: 'Adjectival\nRating', rowSpan: 3, styles: { halign: 'center', valign: 'middle', fillColor: [144, 238, 144] } }
                ],
                [
                    { content: 'Rating', styles: { halign: 'center', fillColor: [255, 192, 203] } },
                    { content: 'RPMS 5-pt', styles: { halign: 'center', fillColor: [255, 192, 203] } },
                    { content: 'Rating', styles: { halign: 'center', fillColor: [255, 192, 203] } },
                    { content: 'RPMS 5-pt', styles: { halign: 'center', fillColor: [255, 192, 203] } },
                    { content: 'Rating', styles: { halign: 'center', fillColor: [255, 192, 203] } },
                    { content: 'RPMS 5-pt', styles: { halign: 'center', fillColor: [255, 192, 203] } },
                    { content: 'Rating', styles: { halign: 'center', fillColor: [255, 192, 203] } },
                    { content: 'RPMS 5-pt', styles: { halign: 'center', fillColor: [255, 192, 203] } },
                    { content: 'Q', styles: { halign: 'center', fillColor: [144, 238, 144] } },
                    { content: 'E', styles: { halign: 'center', fillColor: [144, 238, 144] } },
                    { content: 'T', styles: { halign: 'center', fillColor: [144, 238, 144] } },
                    { content: 'Ave', styles: { halign: 'center', fillColor: [144, 238, 144] } }
                ]
            ];

            // Get rating description
            const getRatingDescription = (rating) => {
                const numRating = Number(rating);
                if (numRating >= 4.5) return 'Outstanding';
                if (numRating >= 3.5) return 'Very Satisfactory';
                if (numRating >= 2.5) return 'Satisfactory';
                if (numRating >= 1.5) return 'Unsatisfactory';
                return 'Poor';
            };

            // Build data rows from KRA details
            const dataRows = [];
            if (selectedRating.kra_details) {
                selectedRating.kra_details.forEach((kra, kraIndex) => {
                    if (kra.objectives) {
                        kra.objectives.forEach((obj, objIndex) => {
                            const rating = Number(obj.rating) || 0;
                            const score = Number(obj.score) || 0;
                            
                            dataRows.push([
                                (kraIndex + 1).toString(),
                                (objIndex + 1).toString(),
                                obj.objective_code || '',
                                'COI',
                                '7.14%',
                                '',
                                '', '', '', '', '', '', '', '',
                                rating ? rating.toFixed(3) : '',
                                rating || '',
                                rating || '',
                                rating || '',
                                rating ? rating.toFixed(3) : '',
                                score ? score.toFixed(3) : '',
                                rating ? getRatingDescription(rating) : ''
                            ]);
                        });
                    }
                });
            }

            autoTable(doc, {
                startY: currentY,
                head: headers,
                body: dataRows,
                theme: 'grid',
                styles: {
                    fontSize: 6,
                    cellPadding: 1,
                    lineColor: [0, 0, 0],
                    lineWidth: 0.1,
                    halign: 'center',
                    valign: 'middle'
                },
                headStyles: {
                    fillColor: [144, 238, 144],
                    textColor: [0, 0, 0],
                    fontStyle: 'bold'
                }
            });

            // Footer section
            currentY = doc.lastAutoTable.finalY;
            
            const footerData = [
                [
                    { content: 'Date Observed:', styles: { fontStyle: 'bold', fillColor: [255, 192, 203] } },
                    { content: new Date().toLocaleDateString('en-US'), styles: { fillColor: [255, 255, 255] } },
                    { content: '', colSpan: 2, styles: { fillColor: [255, 192, 203] } },
                    { content: 'Final Rating', styles: { fontStyle: 'bold', fillColor: [144, 238, 144] } },
                    { content: selectedRating.numerical_rating ? Number(selectedRating.numerical_rating).toFixed(3) : '', styles: { fillColor: [255, 255, 255] } }
                ],
                [
                    { content: 'COT Status:', styles: { fontStyle: 'bold', fillColor: [255, 192, 203] } },
                    { content: '✓', styles: { fillColor: [255, 255, 255] } },
                    { content: '', colSpan: 2, styles: { fillColor: [255, 192, 203] } },
                    { content: 'Adjectival Rating', styles: { fontStyle: 'bold', fillColor: [144, 238, 144] } },
                    { content: selectedRating.numerical_rating ? getRatingDescription(selectedRating.numerical_rating) : '', styles: { fillColor: [255, 255, 255] } }
                ]
            ];

            autoTable(doc, {
                startY: currentY,
                body: footerData,
                theme: 'grid',
                styles: {
                    fontSize: 7,
                    cellPadding: 2,
                    lineColor: [0, 0, 0],
                    lineWidth: 0.1
                }
            });

            // Signature section
            currentY = doc.lastAutoTable.finalY + 5;
            
            const signatureData = [
                [
                    { content: 'Rater', colSpan: 2, styles: { halign: 'center', fontStyle: 'bold', fillColor: [255, 192, 203] } },
                    { content: 'Approving Authority', colSpan: 2, styles: { halign: 'center', fontStyle: 'bold', fillColor: [255, 192, 203] } },
                    { content: '', colSpan: 2, styles: { fillColor: [255, 192, 203] } }
                ],
                [
                    { content: '', styles: { fillColor: [255, 255, 255] } },
                    { content: '', styles: { halign: 'center', fontStyle: 'bold', fillColor: [255, 255, 255] } },
                    { content: 'Last:', styles: { fontStyle: 'bold', fillColor: [255, 192, 203] } },
                    { content: '', styles: { fillColor: [255, 255, 255] } },
                    { content: 'First:', styles: { fontStyle: 'bold', fillColor: [255, 192, 203] } },
                    { content: '', styles: { fillColor: [255, 255, 255] } }
                ],
                [
                    { content: '', styles: { fillColor: [255, 192, 203] } },
                    { content: 'Principal IV', styles: { halign: 'center', fontStyle: 'italic', fillColor: [255, 255, 255] } },
                    { content: 'Position:', styles: { fontStyle: 'bold', fillColor: [255, 192, 203] } },
                    { content: 'Schools Division Superintendent', styles: { fillColor: [255, 255, 255] } },
                    { content: 'Middle:', styles: { fontStyle: 'bold', fillColor: [255, 192, 203] } },
                    { content: '', styles: { fillColor: [255, 255, 255] } }
                ]
            ];

            autoTable(doc, {
                startY: currentY,
                body: signatureData,
                theme: 'grid',
                styles: {
                    fontSize: 7,
                    cellPadding: 3,
                    lineColor: [0, 0, 0],
                    lineWidth: 0.1
                }
            });

            // Save the PDF
            const fileName = `IPCRF_${teacher?.name.replace(/\s+/g, '_') || 'Teacher'}_${selectedRating.rating_period}_${new Date().toISOString().split('T')[0]}.pdf`;
            console.log('Saving PDF as:', fileName);
            doc.save(fileName);
            
            toast.success('PDF exported successfully!');
        } catch (error) {
            console.error('Error exporting PDF:', error);
            toast.error('Failed to export PDF: ' + error.message);
        }
    };

    return (
        <>
            <Head title="IPCRF Submissions" />
            <SidebarProvider>
                <AppSidebar />
                <SidebarInset>
                    <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
                        <div className="flex items-center gap-2 px-4">
                            <SidebarTrigger className="-ml-1" />
                            <Separator orientation="vertical" className="mr-2 h-4" />
                            <Breadcrumb>
                                <BreadcrumbList>
                                    <BreadcrumbItem>
                                        <BreadcrumbPage>IPCRF Submissions</BreadcrumbPage>
                                    </BreadcrumbItem>
                                </BreadcrumbList>
                            </Breadcrumb>
                        </div>
                    </header>
                    
                    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                        {/* Background Logo Watermark */}
                        <div className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center opacity-20">
                            <img 
                                src="/pictures/isat.tmp" 
                                alt="ISAT Background" 
                                className="w-[600px] h-[600px] object-contain"
                            />
                        </div>

                        {/* Content */}
                        <div className="relative z-10">
                            <div className="bg-white rounded-lg shadow p-6">
                                <h2 className="text-2xl font-semibold mb-2">IPCRF Submissions</h2>

                                {ratingScope && (
                                    <div className="mb-6 flex flex-wrap items-center gap-1.5 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
                                        <span className="font-semibold">{ratingScope.raterRole}</span>
                                        <span>&mdash;</span>
                                        {ratingScope.allTiers ? (
                                            <>
                                                <span>you oversee</span>
                                                <span className="font-semibold">{ratingScope.label}</span>
                                                <span>&mdash; use <span className="font-semibold">Filter by Position</span> to narrow the list.</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>you can rate the</span>
                                                <span className="font-semibold">{ratingScope.label}</span>
                                                <span>tier only. Other tiers are hidden from this list.</span>
                                            </>
                                        )}
                                    </div>
                                )}

                                {/* Search and Filter Section */}
                                <div className="flex flex-col md:flex-row gap-4 items-end mb-6">
                                    <div className="flex-1">
                                        <Label htmlFor="search">Search by Teacher Name</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                id="search"
                                                placeholder="Search teachers..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                            />
                                            <Button onClick={handleSearch} className="bg-green-600 hover:bg-green-700">
                                                <Search className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    
                                    <div className="w-full md:w-48">
                                        <Label htmlFor="status">Filter by Status</Label>
                                        <Select value={selectedStatus || "all"} onValueChange={(value) => {
                                            const filterValue = value === "all" ? "" : value;
                                            setSelectedStatus(filterValue);
                                            applyFilters({ status: filterValue });
                                        }}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="All Status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Status</SelectItem>
                                                <SelectItem value="draft">Draft</SelectItem>
                                                <SelectItem value="submitted">Submitted</SelectItem>
                                                <SelectItem value="approved">Approved</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="w-full md:w-48">
                                        <Label htmlFor="year">Filter by Year</Label>
                                        <Select value={selectedYear || "all"} onValueChange={(value) => {
                                            const filterValue = value === "all" ? "" : value;
                                            setSelectedYear(filterValue);
                                            applyFilters({ year: filterValue });
                                        }}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="All Years" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Years</SelectItem>
                                                {availableYears.map((year) => (
                                                    <SelectItem key={year} value={year}>
                                                        {year}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="w-full md:w-48">
                                        <Label htmlFor="uploads">Filter by Uploads</Label>
                                        <Select value={selectedUploads || "all"} onValueChange={(value) => {
                                            const v = value === "has" ? "has" : "";
                                            setSelectedUploads(v);
                                            applyFilters({ has_uploads: v === "has" ? 1 : "" });
                                        }}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="All" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All</SelectItem>
                                                <SelectItem value="has">Has MOV uploads</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="w-full md:w-56">
                                        <Label htmlFor="position">Filter by Position</Label>
                                        <Select value={selectedPosition || "all"} onValueChange={(value) => {
                                            const v = value === "all" ? "" : value;
                                            setSelectedPosition(v);
                                            applyFilters({ position: v });
                                        }}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="All Positions" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Positions</SelectItem>
                                                {positionOptions.map((tier) => (
                                                    <SelectItem key={tier} value={tier}>
                                                        {POSITION_LABELS[tier] || tier}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* Teachers Table */}
                                <div className="rounded-md border overflow-hidden">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Teacher Name</TableHead>
                                                <TableHead>Position</TableHead>
                                                <TableHead className="text-center">MOV Uploads</TableHead>
                                                <TableHead className="text-center">Rating</TableHead>
                                                <TableHead className="text-center">Equivalency</TableHead>
                                                <TableHead className="text-center">Status</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {teachers.data.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                                                        No teachers found
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                teachers.data.map((teacher) => {
                                                    const latestRating = teacher.ipcrf_ratings?.[0];
                                                    const movCount = teacher.mov_uploads_count || 0;
                                                    // Expected MOV count depends on the teacher's position tier configuration
                                                    const expectedMovs = teacher.expected_movs ?? totalObjectives ?? 0;
                                                    const movPercentage = expectedMovs > 0 ? Math.round((movCount / expectedMovs) * 100) : 0;
                                                    const movComplete = expectedMovs > 0 && movCount >= expectedMovs;
                                                    
                                                    // Determine MOV status color
                                                    const getMovStatusColor = () => {
                                                        if (movCount === 0) return 'bg-gray-100 text-gray-600';
                                                        if (movComplete) return 'bg-green-100 text-green-700';
                                                        if (movPercentage >= 50) return 'bg-yellow-100 text-yellow-700';
                                                        return 'bg-orange-100 text-orange-700';
                                                    };
                                                    
                                                    return (
                                                        <TableRow key={teacher.id}>
                                                            <TableCell className="font-medium">{teacher.name}</TableCell>
                                                            <TableCell>
                                                                <div className="flex flex-col gap-1">
                                                                    {teacher.position_range && (
                                                                        <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-bold bg-green-100 text-green-700">
                                                                            {teacher.position_range}
                                                                        </span>
                                                                    )}
                                                                    <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700">
                                                                        {teacher.position_career_stage || teacher.current_position?.name || 'No Position'}
                                                                    </span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-center">
                                                                <div className="flex flex-col items-center gap-1">
                                                                    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${getMovStatusColor()}`}>
                                                                        {movCount === 0 ? (
                                                                            <FileX className="h-3 w-3" />
                                                                        ) : (
                                                                            <FileCheck className="h-3 w-3" />
                                                                        )}
                                                                        {movCount}/{expectedMovs}
                                                                    </span>
                                                                    {movCount > 0 && !movComplete && (
                                                                        <span className="text-[10px] text-gray-500">{movPercentage}%</span>
                                                                    )}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-center">
                                                                <span className={`font-semibold text-lg ${latestRating?.numerical_rating ? '' : 'text-gray-400'}`}>
                                                                    {Number(latestRating?.numerical_rating || 0).toFixed(2)}
                                                                </span>
                                                            </TableCell>
                                                            <TableCell className="text-center">
                                                                {latestRating?.numerical_rating ? (
                                                                    <span className={`inline-flex px-3 py-1 text-xs font-bold rounded ${getRatingColor(latestRating.numerical_rating)}`}>
                                                                        {getRatingEquivalency(latestRating.numerical_rating)}
                                                                    </span>
                                                                ) : (
                                                                    <span className="inline-flex px-3 py-1 text-xs font-medium rounded bg-gray-100 text-gray-500">
                                                                        Not rated yet
                                                                    </span>
                                                                )}
                                                            </TableCell>
                                                            <TableCell className="text-center">
                                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${getStatusBadge(latestRating?.status || 'draft')}`}>
                                                                    {latestRating?.status || 'draft'}
                                                                </span>
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                <div className="flex gap-2 justify-end">
                                                                    <Button
                                                                        size="sm"
                                                                        className="bg-green-600 hover:bg-green-700"
                                                                        onClick={() => router.visit(route('admin.ipcrf.rate', teacher.id))}
                                                                    >
                                                                        <Plus className="h-3 w-3 mr-1" />
                                                                        Rate
                                                                    </Button>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        onClick={() => openRecords(teacher)}
                                                                    >
                                                                        <Eye className="h-3 w-3 mr-1" />
                                                                        Records
                                                                    </Button>
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* Pagination */}
                                {teachers.links.length > 3 && (
                                    <div className="flex justify-center gap-2 mt-4">
                                        {teachers.links.map((link, index) => (
                                            <Button
                                                key={index}
                                                variant={link.active ? "default" : "outline"}
                                                size="sm"
                                                disabled={!link.url}
                                                onClick={() => link.url && router.get(link.url)}
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </SidebarInset>
            </SidebarProvider>

            {/* View Details Modal */}
            <Dialog open={isViewDetailsModalOpen} onOpenChange={setIsViewDetailsModalOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Rating Records{selectedTeacher ? ` — ${selectedTeacher.name}` : ''}</DialogTitle>
                        <DialogDescription>
                            Every school year with a rating and/or submitted MOVs
                        </DialogDescription>
                    </DialogHeader>

                    {(() => {
                        const records = buildRecords(selectedTeacher);
                        if (records.length === 0) {
                            return (
                                <div className="py-8 text-center text-sm text-gray-500">
                                    No rating records or MOV submissions yet.
                                </div>
                            );
                        }
                        const totalPages = Math.ceil(records.length / RECORDS_PER_PAGE);
                        const pageRecords = records.slice(
                            recordsPage * RECORDS_PER_PAGE,
                            (recordsPage + 1) * RECORDS_PER_PAGE
                        );
                        return (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-semibold text-gray-700">
                                        {records.length} record{records.length !== 1 ? 's' : ''}
                                    </span>
                                    {totalPages > 1 && (
                                        <div className="flex items-center gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-7 px-3 text-xs"
                                                disabled={recordsPage === 0}
                                                onClick={() => setRecordsPage((p) => Math.max(0, p - 1))}
                                            >
                                                Previous
                                            </Button>
                                            <span className="text-xs text-gray-600">
                                                Page {recordsPage + 1} of {totalPages}
                                            </span>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-7 px-3 text-xs"
                                                disabled={recordsPage >= totalPages - 1}
                                                onClick={() => setRecordsPage((p) => Math.min(totalPages - 1, p + 1))}
                                            >
                                                Next
                                            </Button>
                                        </div>
                                    )}
                                </div>

                                {pageRecords.map((rec) => {
                                    const isOpen = expandedYear === rec.year;
                                    const isSelected = selectedRating && rec.rating && selectedRating.id === rec.rating.id;
                                    return (
                                        <div
                                            key={rec.year}
                                            className={`border rounded-lg ${isSelected ? 'border-green-400 ring-1 ring-green-200' : 'border-gray-200'}`}
                                        >
                                            <div className="flex flex-wrap items-center justify-between gap-2 p-3">
                                                <div className="flex items-center gap-3">
                                                    <span className="font-semibold text-gray-900">SY {rec.year}</span>
                                                    {rec.rating?.numerical_rating ? (
                                                        <span className={`inline-flex px-2 py-0.5 text-xs font-bold rounded ${getRatingColor(rec.rating.numerical_rating)}`}>
                                                            {getRatingEquivalency(rec.rating.numerical_rating)} ({Number(rec.rating.numerical_rating).toFixed(2)})
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded bg-gray-100 text-gray-500">
                                                            Not rated yet
                                                        </span>
                                                    )}
                                                    <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded ${getStatusBadge(rec.rating?.status || 'draft')}`}>
                                                        {rec.rating?.status || 'draft'}
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                        {rec.movs.length} MOV{rec.movs.length !== 1 ? 's' : ''}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {rec.rating && (
                                                        <Button
                                                            size="sm"
                                                            variant={isSelected ? 'default' : 'outline'}
                                                            className={`h-7 px-3 text-xs ${isSelected ? 'bg-green-600 hover:bg-green-700' : ''}`}
                                                            onClick={() => setSelectedRating(rec.rating)}
                                                        >
                                                            {isSelected ? 'Selected' : 'View rating'}
                                                        </Button>
                                                    )}
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-7 px-3 text-xs"
                                                        onClick={() => setExpandedYear(isOpen ? null : rec.year)}
                                                    >
                                                        {isOpen ? 'Hide MOVs' : 'Show MOVs'}
                                                    </Button>
                                                </div>
                                            </div>

                                            {isOpen && (
                                                <div className="border-t bg-gray-50 p-3 space-y-2">
                                                    {rec.movs.length === 0 ? (
                                                        <p className="text-xs text-gray-500">No MOVs submitted for SY {rec.year}.</p>
                                                    ) : (
                                                        rec.movs.map((mov) => (
                                                            <div key={mov.id} className="flex items-center justify-between gap-3 rounded bg-white p-2 border border-gray-100">
                                                                <div className="min-w-0">
                                                                    <span className="text-sm font-medium text-blue-600">
                                                                        {mov.objective?.code || `Objective #${mov.objective_id}`}
                                                                    </span>
                                                                    <p className="text-xs text-gray-500 truncate">
                                                                        {mov.objective?.description || mov.notes || '—'}
                                                                    </p>
                                                                </div>
                                                                <div className="flex items-center gap-3 shrink-0">
                                                                    <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded ${getStatusBadge(mov.status || 'draft')}`}>
                                                                        {mov.status || 'draft'}
                                                                    </span>
                                                                    <span className="text-xs text-gray-600">
                                                                        {mov.rating ? `${mov.rating}/5` : '—'}
                                                                    </span>
                                                                    {mov.file_path && (
                                                                        <a
                                                                            href={route('admin.ipcrf.submissions.document', mov.id)}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="text-xs text-blue-600 underline"
                                                                        >
                                                                            View file
                                                                        </a>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })()}

                    {selectedRating && (
                        <div className="space-y-4 border-t pt-4 mt-2">
                            <p className="text-sm font-semibold text-gray-700">
                                Rating detail — SY {selectedRating.rating_period}
                            </p>
                            <div className="grid grid-cols-3 gap-4">
                                <div className={`p-4 rounded-lg ${getRatingColor(selectedRating.numerical_rating)}`}>
                                    <p className="text-sm font-medium opacity-80">Rating Equivalency</p>
                                    <p className="text-2xl font-bold mt-1">
                                        {selectedRating.numerical_rating ? getRatingEquivalency(selectedRating.numerical_rating) : 'N/A'}
                                    </p>
                                    <p className="text-sm font-medium mt-1 opacity-70">
                                        ({selectedRating.numerical_rating ? Number(selectedRating.numerical_rating).toFixed(2) : 'N/A'})
                                    </p>
                                </div>
                                <div className="bg-green-50 p-4 rounded-lg">
                                    <p className="text-sm text-gray-600">Total Score</p>
                                    <p className="text-2xl font-bold text-green-600">
                                        {selectedRating.total_score ? Number(selectedRating.total_score).toFixed(2) : 'N/A'}
                                    </p>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <p className="text-sm text-gray-600">Status</p>
                                    <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded mt-2 ${getStatusBadge(selectedRating.status)}`}>
                                        {selectedRating.status}
                                    </span>
                                </div>
                            </div>

                            {/* KRA Details */}
                            {selectedRating.kra_details?.map((kra, index) => (
                                <div key={index} className="border rounded-lg p-4">
                                    <h3 className="font-semibold text-lg mb-3">{kra.kra_name}</h3>
                                    <div className="space-y-2">
                                        {kra.objectives?.map((obj, objIndex) => (
                                            <div key={objIndex} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                                <div className="flex-1">
                                                    <span className="font-medium text-sm text-blue-600">{obj.objective_code}</span>
                                                    <p className="text-sm text-gray-600">{obj.objective_description}</p>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="text-right">
                                                        <p className="text-xs text-gray-500">Rating</p>
                                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${getRatingColor(obj.rating)}`}>
                                                            {obj.rating ? getRatingEquivalency(obj.rating) : 'N/A'}
                                                        </span>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-xs text-gray-500">Score</p>
                                                        <span className="font-semibold text-sm">{obj.score ? Number(obj.score).toFixed(2) : 'N/A'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-3 pt-3 border-t flex justify-between items-center">
                                        <span className="font-semibold">KRA Average:</span>
                                        <div className="text-right">
                                            <span className={`inline-flex px-3 py-1 text-sm font-bold rounded ${getRatingColor(kra.average_rating)}`}>
                                                {kra.average_rating ? getRatingEquivalency(kra.average_rating) : 'N/A'}
                                            </span>
                                            <p className="text-xs text-gray-500 mt-1">
                                                ({kra.average_rating ? Number(kra.average_rating).toFixed(2) : 'N/A'})
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {selectedRating.remarks && (
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <p className="text-sm font-semibold text-gray-700 mb-2">Remarks:</p>
                                    <p className="text-sm text-gray-600">{selectedRating.remarks}</p>
                                </div>
                            )}
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsViewDetailsModalOpen(false)}>
                            Close
                        </Button>
                        <Button
                            variant="outline"
                            className="border-green-600 text-green-700 hover:bg-green-50"
                            onClick={generateRatingSummaryOfficial}
                            disabled={!selectedRating}
                        >
                            <ClipboardList className="h-4 w-4 mr-2" />
                            Generate Ratings Summary
                        </Button>
                        <Button
                            className="bg-blue-600 hover:bg-blue-700"
                            onClick={exportRatingToPDF}
                            disabled={!selectedRating}
                        >
                            <FileDown className="h-4 w-4 mr-2" />
                            Export PDF
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
