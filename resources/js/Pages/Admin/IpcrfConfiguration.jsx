import { AppSidebar } from "@/components/app-sidebar";
import { Head, router } from '@inertiajs/react';
import React, { useState, useEffect } from 'react';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
    Plus, 
    Edit, 
    Trash2, 
    Lock, 
    Unlock, 
    CheckCircle, 
    XCircle,
    Settings,
    AlertCircle,
    Save,
    Target,
    MoreVertical
} from 'lucide-react';

export default function IpcrfConfiguration({ configurations, currentYear, defaultKras, positionTiers, canManageAllTiers = false, flash }) {
    // Master Teacher (admin) may not manage Master-Teacher-tier configurations.
    const canManageTier = (tier) => canManageAllTiers || !tier || !String(tier).startsWith('MT');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
    const [isObjectivesModalOpen, setIsObjectivesModalOpen] = useState(false);
    const [selectedConfig, setSelectedConfig] = useState(null);
    // Blocks duplicate submits, which previously hit already-deleted records and 404'd
    const [isProcessing, setIsProcessing] = useState(false);
    
    // Custom KRA/Objective states
    const [customKras, setCustomKras] = useState([]);
    const [customObjectives, setCustomObjectives] = useState([]);
    const [showAddKraForm, setShowAddKraForm] = useState(false);
    const [showAddObjectiveForm, setShowAddObjectiveForm] = useState(false);
    const [newKra, setNewKra] = useState({ name: '', description: '' });
    const [newObjective, setNewObjective] = useState({ kra_id: '', code: '', description: '', weight: '6.786' });
    
    // Edit states
    const [editingKra, setEditingKra] = useState(null);
    const [editingObjective, setEditingObjective] = useState(null);
    const [editKraData, setEditKraData] = useState({ name: '', description: '' });
    const [editObjectiveData, setEditObjectiveData] = useState({ kra_id: '', code: '', description: '', weight: '' });
    
    // Objectives Management states
    const [objectivesData, setObjectivesData] = useState([]);
    const [showAddObjectiveModal, setShowAddObjectiveModal] = useState(false);
    const [showEditObjectiveModal, setShowEditObjectiveModal] = useState(false);
    const [showDeleteObjectiveModal, setShowDeleteObjectiveModal] = useState(false);
    const [selectedObjective, setSelectedObjective] = useState(null);
    const [objectiveFormData, setObjectiveFormData] = useState({
        kra_id: '',
        code: '',
        description: '',
        weight: '',
        order: '',
        is_active: true,
        position_tiers: [], // T1-T3, T4-T7, MT1-MT2, MT3-MT5
    });
    
    // Position tiers options (labels come from the tier list shared by the backend)
    const positionTierLabels = {
        'T1 - T3': 'T1 - T3 (Beginning)',
        'T4 - T7': 'T4 - T7 (Proficient)',
        'MT1 - MT2': 'MT1 - MT2 (Master Teacher I-II)',
        'MT3 - MT5': 'MT3 - MT5 (Master Teacher III-V)',
    };

    const positionTierOptions = (positionTiers && positionTiers.length > 0
        ? positionTiers
        : Object.keys(positionTierLabels)
    ).map((tier) => ({ value: tier, label: positionTierLabels[tier] || tier }));
    
    // Combine default and custom KRAs, merging custom objectives into default KRAs
    const allKras = React.useMemo(() => {
        if (!defaultKras) return [];
        
        // Start with default KRAs
        const merged = defaultKras.map(kra => {
            // Compared as strings: the KRA <select> yields "3" while the KRA id
            // is the number 3, and a strict match would silently drop objectives
            const customObjsForThisKra = customObjectives.filter(
                obj => String(obj.kra_id) === String(kra.id)
            );
            
            if (customObjsForThisKra.length > 0) {
                // Merge custom objectives with default objectives
                return {
                    ...kra,
                    objectives: [...(kra.objectives || []), ...customObjsForThisKra]
                };
            }
            return kra;
        });
        
        // Add custom KRAs with their objectives
        customKras.forEach(customKra => {
            const objsForCustomKra = customObjectives.filter(
                obj => String(obj.kra_id) === String(customKra.id)
            );
            merged.push({
                ...customKra,
                objectives: objsForCustomKra
            });
        });
        
        return merged;
    }, [defaultKras, customKras, customObjectives]);
    
    const [formData, setFormData] = useState({
        school_year: '',
        position_tier: '',
        kra_count: 4,
        objectives_per_kra: [3, 3, 3, 3],
        selected_objective_ids: [],
        custom_kras: [],
        custom_objectives: [],
        submission_start_date: '',
        submission_end_date: '',
        notes: '',
    });

    // KRAs/objectives narrowed down to the tier the configuration targets.
    // Items without any tier designation apply to every tier.
    const tierFilteredKras = React.useMemo(() => {
        if (!formData.position_tier) return [];

        const matchesTier = (item) => {
            const tiers = item.position_tiers;
            if (!tiers || tiers.length === 0) return true;
            return tiers.includes(formData.position_tier);
        };

        // Every KRA for this tier is kept, including ones with no objectives yet.
        // A newly added custom KRA starts empty and must still be visible so
        // objectives can be attached to it.
        return allKras
            .filter(matchesTier)
            .map((kra) => ({
                ...kra,
                objectives: (kra.objectives || []).filter(matchesTier),
            }));
    }, [allKras, formData.position_tier]);

    // The configuration modals only ever work with the selected tier's KRAs
    const availableKras = tierFilteredKras;

    // Objective IDs that are valid for the currently selected tier
    const tierObjectiveIds = React.useMemo(
        () => tierFilteredKras.flatMap((kra) => kra.objectives.map((obj) => obj.id)),
        [tierFilteredKras]
    );

    // How many of those are inactive, so the count can explain itself
    const inactiveTierCount = React.useMemo(
        () => tierFilteredKras.reduce(
            (total, kra) => total + kra.objectives.filter((obj) => obj.is_active === false).length,
            0
        ),
        [tierFilteredKras]
    );

    // Active objective ids for a tier. Inactive objectives are still listed,
    // but are never auto-selected.
    const objectiveIdsForTier = (tier) => {
        if (!tier) return [];

        const matchesTier = (item) => {
            const tiers = item.position_tiers;
            if (!tiers || tiers.length === 0) return true;
            return tiers.includes(tier);
        };

        return allKras
            .filter(matchesTier)
            .flatMap((kra) =>
                (kra.objectives || [])
                    .filter(matchesTier)
                    .filter((obj) => obj.is_active !== false)
                    .map((obj) => obj.id)
            );
    };

    // Changing the tier pre-selects every active objective designated for it
    const handlePositionTierChange = (tier) => {
        setFormData((prev) => ({
            ...prev,
            position_tier: tier,
            selected_objective_ids: objectiveIdsForTier(tier),
        }));
    };

    const resetForm = () => {
        setFormData({
            school_year: '',
            position_tier: '',
            kra_count: 4,
            objectives_per_kra: [3, 3, 3, 3],
            selected_objective_ids: [],
            custom_kras: [],
            custom_objectives: [],
            submission_start_date: '',
            submission_end_date: '',
            notes: '',
        });
        setCustomKras([]);
        setCustomObjectives([]);
        setShowAddKraForm(false);
        setShowAddObjectiveForm(false);
    };

    // Custom KRA handlers
    const handleAddCustomKra = () => {
        if (!newKra.name.trim()) {
            toast.error('KRA name is required');
            return;
        }
        
        const customKra = {
            id: `custom_kra_${Date.now()}`,
            name: newKra.name,
            description: newKra.description,
            objectives: [], // Initialize empty objectives array
            is_custom: true,
            order: 100 + customKras.length
        };
        
        setCustomKras([...customKras, customKra]);
        setNewKra({ name: '', description: '' });
        setShowAddKraForm(false);
        toast.success('Custom KRA added!');
    };

    // A saved row has a numeric database id; anything added in this session
    // still carries a client-side temp id like "custom_kra_1756...".
    const isSavedRow = (id) => typeof id === 'number' || /^\d+$/.test(String(id));

    const handleRemoveCustomKra = (kraId) => {
        // Saved KRAs are deleted in the database
        if (isSavedRow(kraId)) {
            if (!window.confirm('Delete this KRA? This cannot be undone.')) return;

            router.delete(route('admin.ipcrf.kra.delete', kraId), {
                preserveScroll: true,
                onSuccess: () => toast.success('KRA deleted'),
                onError: (errs) => toast.error(Object.values(errs)[0] || 'Failed to delete KRA'),
            });
            return;
        }

        setCustomKras(customKras.filter(k => k.id !== kraId));
        // Also remove objectives for this KRA
        setCustomObjectives(customObjectives.filter(o => o.kra_id !== kraId));
        setFormData(prev => ({
            ...prev,
            selected_objective_ids: prev.selected_objective_ids.filter(
                id => !customObjectives.some(o => o.id === id && o.kra_id === kraId)
            ),
        }));
        toast.success('Custom KRA removed');
    };

    // Edit KRA handlers
    const handleEditCustomKra = (kra) => {
        setEditingKra(kra.id);
        setEditKraData({
            name: kra.name,
            description: kra.description || ''
        });
    };

    const handleSaveKraEdit = () => {
        if (!editKraData.name.trim()) {
            toast.error('KRA name is required');
            return;
        }

        // Saved KRAs are written back to the database
        if (isSavedRow(editingKra)) {
            router.put(route('admin.ipcrf.kra.update', editingKra), {
                name: editKraData.name,
                description: editKraData.description,
            }, {
                preserveScroll: true,
                onSuccess: () => {
                    setEditingKra(null);
                    setEditKraData({ name: '', description: '' });
                    toast.success('KRA updated successfully!');
                },
                onError: (errs) => toast.error(Object.values(errs)[0] || 'Failed to update KRA'),
            });
            return;
        }

        setCustomKras(customKras.map(kra => 
            kra.id === editingKra 
                ? { ...kra, name: editKraData.name, description: editKraData.description }
                : kra
        ));
        
        setEditingKra(null);
        setEditKraData({ name: '', description: '' });
        toast.success('KRA updated successfully!');
    };

    const handleCancelKraEdit = () => {
        setEditingKra(null);
        setEditKraData({ name: '', description: '' });
    };

    // Custom Objective handlers
    const handleAddCustomObjective = () => {
        if (!newObjective.kra_id) {
            toast.error('Please select a KRA');
            return;
        }
        if (!newObjective.code.trim() || !newObjective.description.trim()) {
            toast.error('Code and description are required');
            return;
        }
        
        const customObj = {
            id: `custom_obj_${Date.now()}`,
            kra_id: newObjective.kra_id,
            code: newObjective.code,
            description: newObjective.description,
            weight: parseFloat(newObjective.weight) || 6.786,
            is_custom: true,
            order: 100
        };
        
        // Add to customObjectives state (availableKras will auto-update via useMemo)
        setCustomObjectives([...customObjectives, customObj]);
        
        // Add to selected objectives automatically
        setFormData({
            ...formData,
            selected_objective_ids: [...formData.selected_objective_ids, customObj.id]
        });
        
        setNewObjective({ kra_id: '', code: '', description: '', weight: '6.786' });
        setShowAddObjectiveForm(false);
        toast.success('Custom objective added!');
    };

    const handleRemoveCustomObjective = (objId) => {
        // Saved objectives are deleted in the database
        if (isSavedRow(objId)) {
            if (!window.confirm('Delete this objective? This cannot be undone.')) return;

            // Literal path: the objective.* route names are duplicated in
            // routes/admin.php and resolve to a legacy handler.
            router.delete(`/admin/ipcrf/objectives/${objId}`, {
                preserveScroll: true,
                onSuccess: () => {
                    setFormData(prev => ({
                        ...prev,
                        selected_objective_ids: prev.selected_objective_ids.filter(id => id !== objId),
                    }));
                    toast.success('Objective deleted');
                },
                onError: (errs) => toast.error(Object.values(errs)[0] || 'Failed to delete objective'),
            });
            return;
        }

        setCustomObjectives(customObjectives.filter(o => o.id !== objId));
        setFormData({
            ...formData,
            selected_objective_ids: formData.selected_objective_ids.filter(id => id !== objId)
        });
        toast.success('Custom objective removed');
    };

    // Edit Objective handlers
    const handleEditCustomObjective = (objective) => {
        setEditingObjective(objective.id);
        setEditObjectiveData({
            kra_id: objective.kra_id,
            code: objective.code,
            description: objective.description,
            weight: objective.weight.toString(),
            // Preserved so saving an inline edit does not wipe them
            order: objective.order,
            position_tiers: objective.position_tiers || [],
        });
    };

    const handleSaveObjectiveEdit = () => {
        if (!editObjectiveData.kra_id) {
            toast.error('Please select a KRA');
            return;
        }
        if (!editObjectiveData.code.trim() || !editObjectiveData.description.trim()) {
            toast.error('Code and description are required');
            return;
        }

        // Saved objectives are written back to the database
        if (isSavedRow(editingObjective)) {
            // Literal path, same reason as the delete above
            router.put(`/admin/ipcrf/objectives/${editingObjective}`, {
                kra_id: editObjectiveData.kra_id,
                // Sent explicitly so a meaningful code like "1.1.2" is kept
                code: editObjectiveData.code,
                description: editObjectiveData.description,
                weight: parseFloat(editObjectiveData.weight) || 6.786,
                order: editObjectiveData.order || 1,
                is_active: true,
                position_tiers: editObjectiveData.position_tiers || [],
            }, {
                preserveScroll: true,
                onSuccess: () => {
                    setEditingObjective(null);
                    setEditObjectiveData({ kra_id: '', code: '', description: '', weight: '' });
                    toast.success('Objective updated successfully!');
                },
                onError: (errs) => toast.error(Object.values(errs)[0] || 'Failed to update objective'),
            });
            return;
        }

        setCustomObjectives(customObjectives.map(obj => 
            obj.id === editingObjective 
                ? { 
                    ...obj, 
                    kra_id: editObjectiveData.kra_id,
                    code: editObjectiveData.code,
                    description: editObjectiveData.description,
                    weight: parseFloat(editObjectiveData.weight) || 6.786
                }
                : obj
        ));
        
        setEditingObjective(null);
        setEditObjectiveData({ kra_id: '', code: '', description: '', weight: '' });
        toast.success('Objective updated successfully!');
    };

    const handleCancelObjectiveEdit = () => {
        setEditingObjective(null);
        setEditObjectiveData({ kra_id: '', code: '', description: '', weight: '' });
    };

    const handleObjectiveSelection = (objectiveId) => {
        const currentIds = formData.selected_objective_ids || [];
        const newIds = currentIds.includes(objectiveId)
            ? currentIds.filter(id => id !== objectiveId)
            : [...currentIds, objectiveId];
        
        setFormData({
            ...formData,
            selected_objective_ids: newIds,
        });
    };

    // Select All covers the active objectives only
    const handleSelectAllObjectives = () => {
        setFormData({
            ...formData,
            selected_objective_ids: objectiveIdsForTier(formData.position_tier),
        });
    };

    const handleDeselectAllObjectives = () => {
        setFormData({
            ...formData,
            selected_objective_ids: [],
        });
    };

    const handleKraCountChange = (count) => {
        const newCount = parseInt(count);
        const newObjectives = Array(newCount).fill(3);
        
        // Preserve existing values if reducing count
        if (newCount < formData.kra_count) {
            for (let i = 0; i < newCount; i++) {
                newObjectives[i] = formData.objectives_per_kra[i] || 3;
            }
        } else {
            // Copy existing values and fill new ones with 3
            for (let i = 0; i < formData.kra_count; i++) {
                newObjectives[i] = formData.objectives_per_kra[i] || 3;
            }
        }
        
        setFormData({
            ...formData,
            kra_count: newCount,
            objectives_per_kra: newObjectives,
        });
    };

    const handleObjectiveChange = (kraIndex, value) => {
        const newObjectives = [...formData.objectives_per_kra];
        newObjectives[kraIndex] = parseInt(value);
        setFormData({
            ...formData,
            objectives_per_kra: newObjectives,
        });
    };

    const openCreateModal = () => {
        resetForm();
        setFormData({
            ...formData,
            school_year: `${currentYear}-${parseInt(currentYear) + 1}`,
            position_tier: '',
            selected_objective_ids: [],
        });
        setIsCreateModalOpen(true);
    };

    const openEditModal = (config) => {
        setSelectedConfig(config);
        
        // Already-saved custom KRAs and objectives now arrive with the full KRA
        // list from the backend, so these hold only what is added in this session.
        setCustomKras([]);
        setCustomObjectives([]);
        
        setFormData({
            school_year: config.school_year,
            position_tier: config.position_tier || '',
            kra_count: config.kra_count,
            objectives_per_kra: config.objectives_per_kra,
            selected_objective_ids: config.selected_objective_ids || [],
            custom_kras: [],
            custom_objectives: [],
            submission_start_date: config.submission_start_date || '',
            submission_end_date: config.submission_end_date || '',
            notes: config.notes || '',
        });
        
        setIsEditModalOpen(true);
    };

    // Get selected objectives with auto-numbering
    const getSelectedObjectivesWithNumbers = () => {
        const selectedObjs = [];
        let counter = 1;
        
        tierFilteredKras.forEach(kra => {
            const objectives = kra.objectives || [];
            objectives.forEach(obj => {
                if (formData.selected_objective_ids.includes(obj.id)) {
                    selectedObjs.push({
                        ...obj,
                        displayNumber: counter++,
                        kraName: kra.name,
                    });
                }
            });
        });
        
        return selectedObjs;
    };

    const openDeleteModal = (config) => {
        setSelectedConfig(config);
        setIsDeleteModalOpen(true);
    };

    const openPreviewModal = () => {
        setIsPreviewModalOpen(true);
    };

    const handleCreate = () => {
        if (isProcessing) return;

        if (!formData.position_tier) {
            toast.error('Please select the position tier this configuration applies to.');
            return;
        }

        if (formData.selected_objective_ids.length === 0 && customObjectives.length === 0) {
            toast.error(`Select at least one objective for ${formData.position_tier}, or add a custom objective.`);
            return;
        }

        // Calculate objectives_per_kra based on selected objectives
        const objectivesPerKra = tierFilteredKras.map(kra => {
            const kraObjectives = kra.objectives || [];
            const selectedCount = kraObjectives.filter(obj => 
                formData.selected_objective_ids.includes(obj.id)
            ).length;
            return selectedCount;
        });

        // Prepare custom KRAs data
        const customKrasData = customKras.map(kra => ({
            // Sent so the backend can map objectives to the new KRA ids
            temp_id: String(kra.id),
            name: kra.name,
            description: kra.description || ''
        }));

        // Prepare custom objectives data  
        const customObjectivesData = customObjectives.map(obj => ({
            kra_id: obj.kra_id,
            code: obj.code,
            description: obj.description,
            weight: obj.weight
        }));

        // Filter out custom objective IDs (strings) and only send real objective IDs (integers)
        const realObjectiveIds = formData.selected_objective_ids.filter(id => 
            typeof id === 'number' || !id.toString().startsWith('custom_obj_')
        );

        const dataToSubmit = {
            ...formData,
            selected_objective_ids: realObjectiveIds,
            objectives_per_kra: objectivesPerKra,
            kra_count: Math.max(objectivesPerKra.filter(count => count > 0).length, 1),
            custom_kras: customKrasData,
            custom_objectives: customObjectivesData,
        };

        setIsProcessing(true);
        router.post(route('admin.ipcrf.configuration.store'), dataToSubmit, {
            onSuccess: () => {
                setIsCreateModalOpen(false);
                resetForm();
                toast.success('Configuration created successfully!');
            },
            onError: (errors) => {
                Object.keys(errors).forEach((field) => {
                    toast.error(errors[field]);
                });
            },
            onFinish: () => setIsProcessing(false),
        });
    };

    const handleUpdate = () => {
        if (isProcessing) return;

        if (!selectedConfig) {
            toast.error('This configuration is no longer available. Please refresh the page.');
            setIsEditModalOpen(false);
            return;
        }

        if (!formData.position_tier) {
            toast.error('Please select the position tier this configuration applies to.');
            return;
        }

        if (formData.selected_objective_ids.length === 0 && customObjectives.length === 0) {
            toast.error(`Select at least one objective for ${formData.position_tier}, or add a custom objective.`);
            return;
        }

        // Calculate objectives_per_kra based on selected objectives
        const objectivesPerKra = tierFilteredKras.map(kra => {
            const kraObjectives = kra.objectives || [];
            const selectedCount = kraObjectives.filter(obj => 
                formData.selected_objective_ids.includes(obj.id)
            ).length;
            return selectedCount;
        });

        // Prepare custom KRAs data
        const customKrasData = customKras.map(kra => ({
            // Sent so the backend can map objectives to the new KRA ids
            temp_id: String(kra.id),
            name: kra.name,
            description: kra.description || ''
        }));

        // Prepare custom objectives data  
        const customObjectivesData = customObjectives.map(obj => ({
            kra_id: obj.kra_id,
            code: obj.code,
            description: obj.description,
            weight: obj.weight
        }));

        // Filter out custom objective IDs (strings) and only send real objective IDs (integers)
        const realObjectiveIds = formData.selected_objective_ids.filter(id => 
            typeof id === 'number' || !id.toString().startsWith('custom_obj_')
        );

        const dataToSubmit = {
            ...formData,
            selected_objective_ids: realObjectiveIds,
            objectives_per_kra: objectivesPerKra,
            kra_count: Math.max(objectivesPerKra.filter(count => count > 0).length, 1),
            custom_kras: customKrasData,
            custom_objectives: customObjectivesData,
        };

        setIsProcessing(true);
        router.put(route('admin.ipcrf.configuration.update', selectedConfig.id), dataToSubmit, {
            onSuccess: () => {
                setIsEditModalOpen(false);
                setSelectedConfig(null);
                resetForm();
                toast.success('Configuration updated successfully!');
            },
            onError: (errors) => {
                Object.keys(errors).forEach((field) => {
                    toast.error(errors[field]);
                });
            },
            onFinish: () => setIsProcessing(false),
        });
    };

    const handleDelete = () => {
        if (!selectedConfig || isProcessing) return;

        setIsProcessing(true);
        router.delete(route('admin.ipcrf.configuration.destroy', selectedConfig.id), {
            onSuccess: () => {
                setIsDeleteModalOpen(false);
                setSelectedConfig(null);
                toast.success('Configuration deleted successfully!');
            },
            onError: (errors) => {
                if (typeof errors === 'object') {
                    Object.keys(errors).forEach((field) => {
                        toast.error(errors[field]);
                    });
                }
            },
            onFinish: () => setIsProcessing(false),
        });
    };

    const handleToggleActive = (config) => {
        if (isProcessing) return;

        setIsProcessing(true);
        router.post(route('admin.ipcrf.configuration.toggle-active', config.id), {}, {
            onSuccess: () => {
                toast.success(`Configuration ${config.is_active ? 'deactivated' : 'activated'} successfully!`);
            },
            onError: (errors) => {
                if (typeof errors === 'object') {
                    Object.keys(errors).forEach((field) => {
                        toast.error(errors[field]);
                    });
                }
            },
            onFinish: () => setIsProcessing(false),
        });
    };

    const handleToggleLock = (config) => {
        if (isProcessing) return;

        setIsProcessing(true);
        router.post(route('admin.ipcrf.configuration.toggle-lock', config.id), {}, {
            onSuccess: () => {
                toast.success(`Configuration ${config.is_locked ? 'unlocked' : 'locked'} successfully!`);
            },
            onError: (errors) => {
                if (typeof errors === 'object') {
                    Object.keys(errors).forEach((field) => {
                        toast.error(errors[field]);
                    });
                }
            },
            onFinish: () => setIsProcessing(false),
        });
    };

    // Objectives Management Functions
    const openObjectivesModal = () => {
        // Fetch objectives data when opening modal
        fetch('/admin/ipcrf/objectives', {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
            },
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                setObjectivesData(data.objectives || []);
                setIsObjectivesModalOpen(true);
            })
            .catch(error => {
                console.error('Fetch error:', error);
                toast.error('Failed to load objectives data: ' + error.message);
            });
    };

    const handleAddObjective = () => {
        router.post('/admin/ipcrf/objectives', objectiveFormData, {
            onSuccess: () => {
                setShowAddObjectiveModal(false);
                setObjectiveFormData({
                    kra_id: '',
                    code: '',
                    description: '',
                    weight: '',
                    order: '',
                    is_active: true,
                    position_tiers: [],
                });
                toast.success('Objective added successfully!');
                // Refresh objectives data
                openObjectivesModal();
            },
            onError: (errors) => {
                Object.keys(errors).forEach((field) => {
                    toast.error(errors[field]);
                });
            },
        });
    };

    const handleEditObjective = (objective) => {
        setSelectedObjective(objective);
        setObjectiveFormData({
            kra_id: objective.kra_id,
            code: objective.code,
            description: objective.description,
            weight: objective.weight,
            order: objective.order,
            is_active: objective.is_active,
            position_tiers: objective.position_tiers || [],
        });
        setShowEditObjectiveModal(true);
    };

    const handleUpdateObjective = () => {
        router.put(`/admin/ipcrf/objectives/${selectedObjective.id}`, objectiveFormData, {
            onSuccess: () => {
                setShowEditObjectiveModal(false);
                setSelectedObjective(null);
                setObjectiveFormData({
                    kra_id: '',
                    code: '',
                    description: '',
                    weight: '',
                    order: '',
                    is_active: true,
                    position_tiers: [],
                });
                toast.success('Objective updated successfully!');
                // Refresh objectives data
                openObjectivesModal();
            },
            onError: (errors) => {
                Object.keys(errors).forEach((field) => {
                    toast.error(errors[field]);
                });
            },
        });
    };

    const handleDeleteObjective = (objective) => {
        setSelectedObjective(objective);
        setShowDeleteObjectiveModal(true);
    };

    const confirmDeleteObjective = () => {
        router.delete(`/admin/ipcrf/objectives/${selectedObjective.id}`, {
            onSuccess: () => {
                setShowDeleteObjectiveModal(false);
                setSelectedObjective(null);
                toast.success('Objective deleted successfully!');
                // Refresh objectives data
                openObjectivesModal();
            },
            onError: (errors) => {
                if (typeof errors === 'object') {
                    Object.keys(errors).forEach((field) => {
                        toast.error(errors[field]);
                    });
                }
            },
        });
    };

    const getTotalObjectives = (objectives) => {
        return objectives.reduce((sum, count) => sum + count, 0);
    };

    return (
        <>
            <Head title="IPCRF Configuration" />
            <SidebarProvider>
                <AppSidebar />
                <SidebarInset>
                    <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
                        <div className="flex items-center gap-2 px-4 w-full justify-between">
                            <div className="flex items-center gap-2">
                                <SidebarTrigger className="-ml-1" />
                                <Separator orientation="vertical" className="mr-2 h-4" />
                                <Breadcrumb>
                                    <BreadcrumbList>
                                        <BreadcrumbItem>
                                            <BreadcrumbPage>IPCRF Configuration</BreadcrumbPage>
                                        </BreadcrumbItem>
                                    </BreadcrumbList>
                                </Breadcrumb>
                            </div>
                            <Button onClick={openCreateModal} className="bg-green-600 hover:bg-green-700">
                                <Plus className="h-4 w-4 mr-2" />
                                New Configuration
                            </Button>
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
                        <div className="relative z-10 space-y-4">
                            {/* Info Card */}
                            <Card className="border-blue-200 bg-blue-50">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-blue-900">
                                        <Settings className="h-5 w-5" />
                                        IPCRF Configuration Management
                                    </CardTitle>
                                    <CardDescription className="text-blue-700">
                                        Configure KRAs and Objectives per school year. Changes are year-specific and won't affect previous records.
                                    </CardDescription>
                                </CardHeader>
                            </Card>

                            {/* Configurations Table */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>School Year Configurations</CardTitle>
                                    <CardDescription>
                                        Manage KRA and Objective structure for each school year
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {configurations.length === 0 ? (
                                        <div className="text-center py-12">
                                            <Settings className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Configurations Yet</h3>
                                            <p className="text-gray-600 mb-4">Create your first IPCRF configuration to get started.</p>
                                            <Button onClick={openCreateModal} className="bg-green-600 hover:bg-green-700">
                                                <Plus className="h-4 w-4 mr-2" />
                                                Create Configuration
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>School Year</TableHead>
                                                        <TableHead>Position Tier</TableHead>
                                                        <TableHead className="text-center">KRAs</TableHead>
                                                        <TableHead className="text-center">Total Objectives</TableHead>
                                                        <TableHead className="text-center">Status</TableHead>
                                                        <TableHead className="text-center">Lock</TableHead>
                                                        <TableHead className="text-right">Actions</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {configurations.map((config) => (
                                                        <TableRow key={config.id}>
                                                            <TableCell className="font-medium">
                                                                {config.school_year}
                                                                {config.submission_start_date && config.submission_end_date && (
                                                                    <p className="text-xs text-gray-500 mt-1">
                                                                        Submission: {new Date(config.submission_start_date).toLocaleDateString()} - {new Date(config.submission_end_date).toLocaleDateString()}
                                                                    </p>
                                                                )}
                                                                {config.notes && (
                                                                    <p className="text-xs text-gray-500 mt-1">{config.notes}</p>
                                                                )}
                                                            </TableCell>
                                                            <TableCell>
                                                                {config.position_tier ? (
                                                                    <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-bold bg-green-100 text-green-700">
                                                                        {config.position_tier}
                                                                    </span>
                                                                ) : (
                                                                    <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600">
                                                                        All tiers
                                                                    </span>
                                                                )}
                                                            </TableCell>
                                                            <TableCell className="text-center">
                                                                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold">
                                                                    {config.kra_count}
                                                                </span>
                                                            </TableCell>
                                                            <TableCell className="text-center">
                                                                <button
                                                                    onClick={openObjectivesModal}
                                                                    className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-bold hover:bg-purple-200 hover:scale-110 transition-all cursor-pointer"
                                                                    title="Click to manage objectives"
                                                                >
                                                                    {config.selected_objective_ids ? config.selected_objective_ids.length : getTotalObjectives(config.objectives_per_kra)}
                                                                </button>
                                                            </TableCell>
                                                            <TableCell className="text-center">
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => handleToggleActive(config)}
                                                                    disabled={!canManageTier(config.position_tier)}
                                                                    className={config.is_active ? 'border-green-500 text-green-700' : 'border-gray-300'}
                                                                >
                                                                    {config.is_active ? (
                                                                        <>
                                                                            <CheckCircle className="h-3 w-3 mr-1" />
                                                                            Active
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <XCircle className="h-3 w-3 mr-1" />
                                                                            Inactive
                                                                        </>
                                                                    )}
                                                                </Button>
                                                            </TableCell>
                                                            <TableCell className="text-center">
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => handleToggleLock(config)}
                                                                    disabled={!canManageTier(config.position_tier)}
                                                                    className={config.is_locked ? 'border-red-500 text-red-700' : 'border-gray-300'}
                                                                >
                                                                    {config.is_locked ? (
                                                                        <>
                                                                            <Lock className="h-3 w-3 mr-1" />
                                                                            Locked
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <Unlock className="h-3 w-3 mr-1" />
                                                                            Unlocked
                                                                        </>
                                                                    )}
                                                                </Button>
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                <div className="flex items-center justify-end gap-2">
                                                                    <DropdownMenu>
                                                                        <DropdownMenuTrigger asChild>
                                                                            <Button
                                                                                size="sm"
                                                                                variant="outline"
                                                                                className="h-8 w-8 p-0"
                                                                            >
                                                                                <MoreVertical className="h-3 w-3" />
                                                                            </Button>
                                                                        </DropdownMenuTrigger>
                                                                        <DropdownMenuContent align="end">
                                                                            <DropdownMenuItem
                                                                                onClick={() => openEditModal(config)}
                                                                                disabled={config.is_locked || !canManageTier(config.position_tier)}
                                                                            >
                                                                                <Edit className="mr-2 h-4 w-4" />
                                                                                Edit
                                                                            </DropdownMenuItem>
                                                                            <DropdownMenuItem
                                                                                onClick={() => openDeleteModal(config)}
                                                                                disabled={config.is_locked || !canManageTier(config.position_tier)}
                                                                                className="text-red-600 focus:text-red-700"
                                                                            >
                                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                                Delete
                                                                            </DropdownMenuItem>
                                                                            <DropdownMenuSeparator />
                                                                            <DropdownMenuItem onClick={openObjectivesModal}>
                                                                                <Target className="mr-2 h-4 w-4" />
                                                                                Manage Objectives
                                                                            </DropdownMenuItem>
                                                                        </DropdownMenuContent>
                                                                    </DropdownMenu>
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </SidebarInset>
            </SidebarProvider>

            {/* Create Modal */}
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Create New Configuration</DialogTitle>
                        <DialogDescription>
                            Pick the position tier first, then choose the KRAs/objectives that apply to that tier
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-6">
                        {/* School Year + Position Tier */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="school_year">School Year</Label>
                                <Input
                                    id="school_year"
                                    value={formData.school_year}
                                    onChange={(e) => setFormData({ ...formData, school_year: e.target.value })}
                                    placeholder="e.g., 2024-2025"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="position_tier">
                                    Position Tier <span className="text-red-600">*</span>
                                </Label>
                                <select
                                    id="position_tier"
                                    className="w-full h-9 border rounded-md px-3 text-sm bg-white"
                                    value={formData.position_tier}
                                    onChange={(e) => handlePositionTierChange(e.target.value)}
                                >
                                    <option value="">Select position tier...</option>
                                    {positionTierOptions.map((tier) => (
                                        <option key={tier.value} value={tier.value}>
                                            {tier.label}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-gray-500">
                                    Active objectives for the tier are selected automatically.
                                </p>
                                {!canManageAllTiers && (
                                    <p className="text-xs text-amber-600">
                                        Master Teacher (MT) tiers can only be configured by the Principal.
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Submission Dates */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="submission_start_date">Submission Start Date</Label>
                                <Input
                                    id="submission_start_date"
                                    type="date"
                                    value={formData.submission_start_date}
                                    onChange={(e) => setFormData({ ...formData, submission_start_date: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="submission_end_date">Submission End Date</Label>
                                <Input
                                    id="submission_end_date"
                                    type="date"
                                    value={formData.submission_end_date}
                                    onChange={(e) => setFormData({ ...formData, submission_end_date: e.target.value })}
                                    min={formData.submission_start_date}
                                />
                            </div>
                        </div>

                        {/* Objective Selection */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="text-base font-semibold">Select Objectives</Label>
                                <div className="flex gap-2">
                                    <Button type="button" size="sm" variant="outline" onClick={handleSelectAllObjectives}>
                                        Select All
                                    </Button>
                                    <Button type="button" size="sm" variant="outline" onClick={handleDeselectAllObjectives}>
                                        Deselect All
                                    </Button>
                                </div>
                            </div>
                            
                            <p className="text-sm text-gray-600">
                                {formData.position_tier
                                    ? `Selected: ${formData.selected_objective_ids.length} of ${tierObjectiveIds.length} objective(s) designated for ${formData.position_tier}` + (inactiveTierCount > 0 ? ` (${inactiveTierCount} inactive, shown unselected)` : '')
                                    : 'Select a position tier above to load the objectives designated for it.'}
                            </p>

                            {/* Objectives by KRA */}
                            <div className="border rounded-lg p-4 space-y-4 max-h-96 overflow-y-auto">
                                {availableKras.map((kra, kraIndex) => (
                                    <div key={kra.id} className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            {editingKra === kra.id ? (
                                                <div className="flex-1 space-y-2">
                                                    <Input
                                                        value={editKraData.name}
                                                        onChange={(e) => setEditKraData({ ...editKraData, name: e.target.value })}
                                                        placeholder="KRA Name"
                                                        className="text-sm"
                                                    />
                                                    <Textarea
                                                        value={editKraData.description}
                                                        onChange={(e) => setEditKraData({ ...editKraData, description: e.target.value })}
                                                        placeholder="Description (optional)"
                                                        rows={2}
                                                        className="text-sm"
                                                    />
                                                    <div className="flex gap-2">
                                                        <Button 
                                                            type="button" 
                                                            size="sm" 
                                                            onClick={handleSaveKraEdit}
                                                            className="bg-green-600 hover:bg-green-700 text-white"
                                                        >
                                                            <Save className="h-3 w-3 mr-1" />
                                                            Save
                                                        </Button>
                                                        <Button 
                                                            type="button" 
                                                            size="sm" 
                                                            variant="outline"
                                                            onClick={handleCancelKraEdit}
                                                        >
                                                            Cancel
                                                        </Button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <h4 className="font-semibold text-sm text-green-700 bg-green-50 px-3 py-2 rounded">
                                                        KRA {kraIndex + 1}: {kra.name}
                                                    </h4>
                                                    {(
                                                        <div className="flex gap-1">
                                                            <Button 
                                                                type="button" 
                                                                size="sm" 
                                                                variant="ghost" 
                                                                onClick={() => handleEditCustomKra(kra)}
                                                                className="text-blue-600"
                                                                title="Edit KRA"
                                                            >
                                                                <Edit className="h-3 w-3" />
                                                            </Button>
                                                            <Button 
                                                                type="button" 
                                                                size="sm" 
                                                                variant="ghost" 
                                                                onClick={() => handleRemoveCustomKra(kra.id)}
                                                                className="text-red-600"
                                                                title="Delete KRA"
                                                            >
                                                                <Trash2 className="h-3 w-3" />
                                                            </Button>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                        <div className="space-y-2 pl-4">
                                            {kra.objectives && kra.objectives.map((objective) => (
                                                <div key={objective.id} className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded">
                                                    <Checkbox
                                                        id={`obj-${objective.id}`}
                                                        checked={formData.selected_objective_ids.includes(objective.id)}
                                                        onCheckedChange={() => handleObjectiveSelection(objective.id)}
                                                    />
                                                    {editingObjective === objective.id ? (
                                                        <div className="flex-1 space-y-2">
                                                            <select
                                                                className="w-full border rounded px-3 py-1 text-sm"
                                                                value={editObjectiveData.kra_id}
                                                                onChange={(e) => setEditObjectiveData({ ...editObjectiveData, kra_id: e.target.value })}
                                                            >
                                                                <option value="">Select KRA</option>
                                                                {availableKras.map((kraOption, idx) => (
                                                                    <option key={kraOption.id} value={kraOption.id}>
                                                                        KRA {idx + 1}: {kraOption.name}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                            <Input
                                                                value={editObjectiveData.code}
                                                                onChange={(e) => setEditObjectiveData({ ...editObjectiveData, code: e.target.value })}
                                                                placeholder="Objective Code"
                                                                className="text-sm"
                                                            />
                                                            <Textarea
                                                                value={editObjectiveData.description}
                                                                onChange={(e) => setEditObjectiveData({ ...editObjectiveData, description: e.target.value })}
                                                                placeholder="Objective Description"
                                                                rows={2}
                                                                className="text-sm"
                                                            />
                                                            <Input
                                                                type="number"
                                                                step="0.001"
                                                                value={editObjectiveData.weight}
                                                                onChange={(e) => setEditObjectiveData({ ...editObjectiveData, weight: e.target.value })}
                                                                placeholder="Weight (e.g., 6.786)"
                                                                className="text-sm"
                                                            />
                                                            <div className="flex gap-2">
                                                                <Button 
                                                                    type="button" 
                                                                    size="sm" 
                                                                    onClick={handleSaveObjectiveEdit}
                                                                    className="bg-green-600 hover:bg-green-700 text-white"
                                                                >
                                                                    <Save className="h-3 w-3 mr-1" />
                                                                    Save
                                                                </Button>
                                                                <Button 
                                                                    type="button" 
                                                                    size="sm" 
                                                                    variant="outline"
                                                                    onClick={handleCancelObjectiveEdit}
                                                                >
                                                                    Cancel
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <label htmlFor={`obj-${objective.id}`} className="text-sm cursor-pointer flex-1">
                                                            <span className="font-medium text-blue-600">{objective.code}</span>
                                                            <span className="text-gray-700"> - {objective.description}</span>
                                                            {/* Position Tiers badges */}
                                                            {objective.position_tiers && objective.position_tiers.length > 0 ? (
                                                                <span className="ml-2 inline-flex gap-1">
                                                                    {objective.position_tiers.map((tier) => (
                                                                        <span key={tier} className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
                                                                            {tier}
                                                                        </span>
                                                                    ))}
                                                                </span>
                                                            ) : (
                                                                <span className="ml-2 text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                                                                    All Positions
                                                                </span>
                                                            )}
                                                            {objective.is_custom && (
                                                                <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">Custom</span>
                                                            )}
                                                            {objective.is_active === false && (
                                                                <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded font-semibold">Inactive</span>
                                                            )}
                                                            {(
                                                                <>
                                                                    <Button 
                                                                        type="button" 
                                                                        size="sm" 
                                                                        variant="ghost" 
                                                                        onClick={() => handleEditCustomObjective(objective)}
                                                                        className="ml-2 text-blue-600 h-6 w-6 p-0"
                                                                        title="Edit Objective"
                                                                    >
                                                                        <Edit className="h-3 w-3" />
                                                                    </Button>
                                                                    <Button 
                                                                        type="button" 
                                                                        size="sm" 
                                                                        variant="ghost" 
                                                                        onClick={() => handleRemoveCustomObjective(objective.id)}
                                                                        className="ml-1 text-red-600 h-6 w-6 p-0"
                                                                        title="Delete Objective"
                                                                    >
                                                                        <Trash2 className="h-3 w-3" />
                                                                    </Button>
                                                                </>
                                                            )}
                                                        </label>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Add Custom KRA Button */}
                        <div className="space-y-2">
                            {!showAddKraForm ? (
                                <Button type="button" variant="outline" onClick={() => setShowAddKraForm(true)} className="w-full">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Custom KRA
                                </Button>
                            ) : (
                                <div className="border rounded-lg p-4 space-y-3 bg-purple-50">
                                    <Label>Add Custom KRA</Label>
                                    <Input
                                        placeholder="KRA Name (e.g., Digital Competency)"
                                        value={newKra.name}
                                        onChange={(e) => setNewKra({ ...newKra, name: e.target.value })}
                                    />
                                    <Textarea
                                        placeholder="Description (optional)"
                                        value={newKra.description}
                                        onChange={(e) => setNewKra({ ...newKra, description: e.target.value })}
                                        rows={2}
                                    />
                                    <div className="flex gap-2">
                                        <Button type="button" size="sm" onClick={handleAddCustomKra}>
                                            <Plus className="h-3 w-3 mr-1" />
                                            Add KRA
                                        </Button>
                                        <Button type="button" size="sm" variant="outline" onClick={() => {
                                            setShowAddKraForm(false);
                                            setNewKra({ name: '', description: '' });
                                        }}>
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Add Custom Objective Button */}
                        <div className="space-y-2">
                            {!showAddObjectiveForm ? (
                                <Button type="button" variant="outline" onClick={() => setShowAddObjectiveForm(true)} className="w-full">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Custom Objective
                                </Button>
                            ) : (
                                <div className="border rounded-lg p-4 space-y-3 bg-blue-50">
                                    <Label>Add Custom Objective</Label>
                                    <div className="space-y-2">
                                        <select
                                            className="w-full border rounded px-3 py-2"
                                            value={newObjective.kra_id}
                                            onChange={(e) => setNewObjective({ ...newObjective, kra_id: e.target.value })}
                                        >
                                            <option value="">Select KRA</option>
                                            {availableKras.map((kra, idx) => (
                                                <option key={kra.id} value={kra.id}>
                                                    KRA {idx + 1}: {kra.name}
                                                </option>
                                            ))}
                                        </select>
                                        <Input
                                            placeholder="Objective Code (e.g., 1.5.2)"
                                            value={newObjective.code}
                                            onChange={(e) => setNewObjective({ ...newObjective, code: e.target.value })}
                                        />
                                        <Textarea
                                            placeholder="Objective Description"
                                            value={newObjective.description}
                                            onChange={(e) => setNewObjective({ ...newObjective, description: e.target.value })}
                                            rows={2}
                                        />
                                        <Input
                                            type="number"
                                            placeholder="Weight (default: 6.786)"
                                            value={newObjective.weight}
                                            onChange={(e) => setNewObjective({ ...newObjective, weight: e.target.value || '6.786' })}
                                            step="0.001"
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <Button type="button" size="sm" onClick={handleAddCustomObjective}>
                                            <Plus className="h-3 w-3 mr-1" />
                                            Add Objective
                                        </Button>
                                        <Button type="button" size="sm" variant="outline" onClick={() => {
                                            setShowAddObjectiveForm(false);
                                            setNewObjective({ kra_id: '', code: '', description: '', weight: '6.786' });
                                        }}>
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Selected Objectives Preview */}
                        {formData.selected_objective_ids.length > 0 && (
                            <div className="space-y-2">
                                <Label className="text-base font-semibold">Selected Objectives Preview (Auto-numbered)</Label>
                                <div className="border rounded-lg p-4 bg-green-50 max-h-48 overflow-y-auto">
                                    <div className="space-y-1">
                                        {getSelectedObjectivesWithNumbers().map((obj) => (
                                            <div key={obj.id} className="text-sm flex gap-2">
                                                <span className="font-bold text-green-700 min-w-[24px]">{obj.displayNumber}.</span>
                                                <span className="font-medium text-blue-600">{obj.code}</span>
                                                <span className="text-gray-600">({obj.kraName})</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Notes */}
                        <div className="space-y-2">
                            <Label htmlFor="notes">Notes (Optional)</Label>
                            <Textarea
                                id="notes"
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                placeholder="Add any notes about this configuration..."
                                rows={3}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleCreate} 
                            className="bg-green-600 hover:bg-green-700"
                            disabled={formData.selected_objective_ids.length === 0}
                        >
                            <Save className="h-4 w-4 mr-2" />
                            Create Configuration
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Modal */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Edit Configuration</DialogTitle>
                        <DialogDescription>
                            Adjust the KRAs/objectives designated for this position tier
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-6">
                        {/* School Year + Position Tier */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit_school_year">School Year</Label>
                                <Input
                                    id="edit_school_year"
                                    value={formData.school_year}
                                    onChange={(e) => setFormData({ ...formData, school_year: e.target.value })}
                                    placeholder="e.g., 2024-2025"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit_position_tier">
                                    Position Tier <span className="text-red-600">*</span>
                                </Label>
                                <select
                                    id="edit_position_tier"
                                    className="w-full h-9 border rounded-md px-3 text-sm bg-white"
                                    value={formData.position_tier}
                                    onChange={(e) => handlePositionTierChange(e.target.value)}
                                >
                                    <option value="">Select position tier...</option>
                                    {positionTierOptions.map((tier) => (
                                        <option key={tier.value} value={tier.value}>
                                            {tier.label}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-amber-600">
                                    Changing the tier re-selects all active objectives for that tier.
                                </p>
                            </div>
                        </div>

                        {/* Submission Dates */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit_submission_start_date">Submission Start Date</Label>
                                <Input
                                    id="edit_submission_start_date"
                                    type="date"
                                    value={formData.submission_start_date}
                                    onChange={(e) => setFormData({ ...formData, submission_start_date: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit_submission_end_date">Submission End Date</Label>
                                <Input
                                    id="edit_submission_end_date"
                                    type="date"
                                    value={formData.submission_end_date}
                                    onChange={(e) => setFormData({ ...formData, submission_end_date: e.target.value })}
                                    min={formData.submission_start_date}
                                />
                            </div>
                        </div>

                        {/* Objective Selection */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="text-base font-semibold">Select Objectives</Label>
                                <div className="flex gap-2">
                                    <Button type="button" size="sm" variant="outline" onClick={handleSelectAllObjectives}>
                                        Select All
                                    </Button>
                                    <Button type="button" size="sm" variant="outline" onClick={handleDeselectAllObjectives}>
                                        Deselect All
                                    </Button>
                                </div>
                            </div>
                            
                            <p className="text-sm text-gray-600">
                                {formData.position_tier
                                    ? `Selected: ${formData.selected_objective_ids.length} of ${tierObjectiveIds.length} objective(s) designated for ${formData.position_tier}` + (inactiveTierCount > 0 ? ` (${inactiveTierCount} inactive, shown unselected)` : '')
                                    : 'Select a position tier above to load the objectives designated for it.'}
                            </p>

                            {/* Objectives by KRA */}
                            <div className="border rounded-lg p-4 space-y-4 max-h-96 overflow-y-auto">
                                {availableKras.map((kra, kraIndex) => (
                                    <div key={kra.id} className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            {editingKra === kra.id ? (
                                                <div className="flex-1 space-y-2">
                                                    <Input
                                                        value={editKraData.name}
                                                        onChange={(e) => setEditKraData({ ...editKraData, name: e.target.value })}
                                                        placeholder="KRA Name"
                                                        className="text-sm"
                                                    />
                                                    <Textarea
                                                        value={editKraData.description}
                                                        onChange={(e) => setEditKraData({ ...editKraData, description: e.target.value })}
                                                        placeholder="Description (optional)"
                                                        rows={2}
                                                        className="text-sm"
                                                    />
                                                    <div className="flex gap-2">
                                                        <Button 
                                                            type="button" 
                                                            size="sm" 
                                                            onClick={handleSaveKraEdit}
                                                            className="bg-green-600 hover:bg-green-700 text-white"
                                                        >
                                                            <Save className="h-3 w-3 mr-1" />
                                                            Save
                                                        </Button>
                                                        <Button 
                                                            type="button" 
                                                            size="sm" 
                                                            variant="outline"
                                                            onClick={handleCancelKraEdit}
                                                        >
                                                            Cancel
                                                        </Button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <h4 className="font-semibold text-sm text-green-700 bg-green-50 px-3 py-2 rounded">
                                                        KRA {kraIndex + 1}: {kra.name}
                                                    </h4>
                                                    {(
                                                        <div className="flex gap-1">
                                                            <Button 
                                                                type="button" 
                                                                size="sm" 
                                                                variant="ghost" 
                                                                onClick={() => handleEditCustomKra(kra)}
                                                                className="text-blue-600"
                                                                title="Edit KRA"
                                                            >
                                                                <Edit className="h-3 w-3" />
                                                            </Button>
                                                            <Button 
                                                                type="button" 
                                                                size="sm" 
                                                                variant="ghost" 
                                                                onClick={() => handleRemoveCustomKra(kra.id)}
                                                                className="text-red-600"
                                                                title="Delete KRA"
                                                            >
                                                                <Trash2 className="h-3 w-3" />
                                                            </Button>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                        <div className="space-y-2 pl-4">
                                            {kra.objectives && kra.objectives.map((objective) => (
                                                <div key={objective.id} className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded">
                                                    <Checkbox
                                                        id={`edit-obj-${objective.id}`}
                                                        checked={formData.selected_objective_ids.includes(objective.id)}
                                                        onCheckedChange={() => handleObjectiveSelection(objective.id)}
                                                    />
                                                    {editingObjective === objective.id ? (
                                                        <div className="flex-1 space-y-2">
                                                            <select
                                                                className="w-full border rounded px-3 py-1 text-sm"
                                                                value={editObjectiveData.kra_id}
                                                                onChange={(e) => setEditObjectiveData({ ...editObjectiveData, kra_id: e.target.value })}
                                                            >
                                                                <option value="">Select KRA</option>
                                                                {availableKras.map((kraOption, idx) => (
                                                                    <option key={kraOption.id} value={kraOption.id}>
                                                                        KRA {idx + 1}: {kraOption.name}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                            <Input
                                                                value={editObjectiveData.code}
                                                                onChange={(e) => setEditObjectiveData({ ...editObjectiveData, code: e.target.value })}
                                                                placeholder="Objective Code"
                                                                className="text-sm"
                                                            />
                                                            <Textarea
                                                                value={editObjectiveData.description}
                                                                onChange={(e) => setEditObjectiveData({ ...editObjectiveData, description: e.target.value })}
                                                                placeholder="Objective Description"
                                                                rows={2}
                                                                className="text-sm"
                                                            />
                                                            <Input
                                                                type="number"
                                                                step="0.001"
                                                                value={editObjectiveData.weight}
                                                                onChange={(e) => setEditObjectiveData({ ...editObjectiveData, weight: e.target.value })}
                                                                placeholder="Weight (e.g., 6.786)"
                                                                className="text-sm"
                                                            />
                                                            <div className="flex gap-2">
                                                                <Button 
                                                                    type="button" 
                                                                    size="sm" 
                                                                    onClick={handleSaveObjectiveEdit}
                                                                    className="bg-green-600 hover:bg-green-700 text-white"
                                                                >
                                                                    <Save className="h-3 w-3 mr-1" />
                                                                    Save
                                                                </Button>
                                                                <Button 
                                                                    type="button" 
                                                                    size="sm" 
                                                                    variant="outline"
                                                                    onClick={handleCancelObjectiveEdit}
                                                                >
                                                                    Cancel
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <label htmlFor={`edit-obj-${objective.id}`} className="text-sm cursor-pointer flex-1">
                                                            <span className="font-medium text-blue-600">{objective.code}</span>
                                                            <span className="text-gray-700"> - {objective.description}</span>
                                                            {/* Position Tiers badges */}
                                                            {objective.position_tiers && objective.position_tiers.length > 0 ? (
                                                                <span className="ml-2 inline-flex gap-1">
                                                                    {objective.position_tiers.map((tier) => (
                                                                        <span key={tier} className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
                                                                            {tier}
                                                                        </span>
                                                                    ))}
                                                                </span>
                                                            ) : (
                                                                <span className="ml-2 text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                                                                    All Positions
                                                                </span>
                                                            )}
                                                            {objective.is_custom && (
                                                                <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">Custom</span>
                                                            )}
                                                            {objective.is_active === false && (
                                                                <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded font-semibold">Inactive</span>
                                                            )}
                                                            {(
                                                                <>
                                                                    <Button 
                                                                        type="button" 
                                                                        size="sm" 
                                                                        variant="ghost" 
                                                                        onClick={() => handleEditCustomObjective(objective)}
                                                                        className="ml-2 text-blue-600 h-6 w-6 p-0"
                                                                        title="Edit Objective"
                                                                    >
                                                                        <Edit className="h-3 w-3" />
                                                                    </Button>
                                                                    <Button 
                                                                        type="button" 
                                                                        size="sm" 
                                                                        variant="ghost" 
                                                                        onClick={() => handleRemoveCustomObjective(objective.id)}
                                                                        className="ml-1 text-red-600 h-6 w-6 p-0"
                                                                        title="Delete Objective"
                                                                    >
                                                                        <Trash2 className="h-3 w-3" />
                                                                    </Button>
                                                                </>
                                                            )}
                                                        </label>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Add Custom KRA Button */}
                        <div className="space-y-2">
                            {!showAddKraForm ? (
                                <Button type="button" variant="outline" onClick={() => setShowAddKraForm(true)} className="w-full">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Custom KRA
                                </Button>
                            ) : (
                                <div className="border rounded-lg p-4 space-y-3 bg-purple-50">
                                    <Label>Add Custom KRA</Label>
                                    <Input
                                        placeholder="KRA Name (e.g., Digital Competency)"
                                        value={newKra.name}
                                        onChange={(e) => setNewKra({ ...newKra, name: e.target.value })}
                                    />
                                    <Textarea
                                        placeholder="Description (optional)"
                                        value={newKra.description}
                                        onChange={(e) => setNewKra({ ...newKra, description: e.target.value })}
                                        rows={2}
                                    />
                                    <div className="flex gap-2">
                                        <Button type="button" size="sm" onClick={handleAddCustomKra}>
                                            <Plus className="h-3 w-3 mr-1" />
                                            Add KRA
                                        </Button>
                                        <Button type="button" size="sm" variant="outline" onClick={() => {
                                            setShowAddKraForm(false);
                                            setNewKra({ name: '', description: '' });
                                        }}>
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Add Custom Objective Button */}
                        <div className="space-y-2">
                            {!showAddObjectiveForm ? (
                                <Button type="button" variant="outline" onClick={() => setShowAddObjectiveForm(true)} className="w-full">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Custom Objective
                                </Button>
                            ) : (
                                <div className="border rounded-lg p-4 space-y-3 bg-blue-50">
                                    <Label>Add Custom Objective</Label>
                                    <div className="space-y-2">
                                        <select
                                            className="w-full border rounded px-3 py-2"
                                            value={newObjective.kra_id}
                                            onChange={(e) => setNewObjective({ ...newObjective, kra_id: e.target.value })}
                                        >
                                            <option value="">Select KRA</option>
                                            {availableKras.map((kra, idx) => (
                                                <option key={kra.id} value={kra.id}>
                                                    KRA {idx + 1}: {kra.name}
                                                </option>
                                            ))}
                                        </select>
                                        <Input
                                            placeholder="Objective Code (e.g., 1.5.2)"
                                            value={newObjective.code}
                                            onChange={(e) => setNewObjective({ ...newObjective, code: e.target.value })}
                                        />
                                        <Textarea
                                            placeholder="Objective Description"
                                            value={newObjective.description}
                                            onChange={(e) => setNewObjective({ ...newObjective, description: e.target.value })}
                                            rows={2}
                                        />
                                        <Input
                                            type="number"
                                            placeholder="Weight (default: 6.786)"
                                            value={newObjective.weight}
                                            onChange={(e) => setNewObjective({ ...newObjective, weight: e.target.value || '6.786' })}
                                            step="0.001"
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <Button type="button" size="sm" onClick={handleAddCustomObjective}>
                                            <Plus className="h-3 w-3 mr-1" />
                                            Add Objective
                                        </Button>
                                        <Button type="button" size="sm" variant="outline" onClick={() => {
                                            setShowAddObjectiveForm(false);
                                            setNewObjective({ kra_id: '', code: '', description: '', weight: '6.786' });
                                        }}>
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Selected Objectives Preview */}
                        {formData.selected_objective_ids.length > 0 && (
                            <div className="space-y-2">
                                <Label className="text-base font-semibold">Selected Objectives Preview (Auto-numbered)</Label>
                                <div className="border rounded-lg p-4 bg-green-50 max-h-48 overflow-y-auto">
                                    <div className="space-y-1">
                                        {getSelectedObjectivesWithNumbers().map((obj) => (
                                            <div key={obj.id} className="text-sm flex gap-2">
                                                <span className="font-bold text-green-700 min-w-[24px]">{obj.displayNumber}.</span>
                                                <span className="font-medium text-blue-600">{obj.code}</span>
                                                <span className="text-gray-600">({obj.kraName})</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Notes */}
                        <div className="space-y-2">
                            <Label htmlFor="edit_notes">Notes (Optional)</Label>
                            <Textarea
                                id="edit_notes"
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                placeholder="Add any notes about this configuration..."
                                rows={3}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleUpdate} className="bg-blue-600 hover:bg-blue-700">
                            <Save className="h-4 w-4 mr-2" />
                            Update Configuration
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Modal */}
            <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Configuration</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete the configuration for {selectedConfig?.school_year}?
                            This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-red-800">
                                <p className="font-semibold mb-1">Warning</p>
                                <p>This configuration will be permanently deleted. Make sure no submissions exist for this school year.</p>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Configuration
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Preview Modal */}
            <Dialog open={isPreviewModalOpen} onOpenChange={setIsPreviewModalOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Configuration Preview</DialogTitle>
                        <DialogDescription>
                            Preview of the KRA and Objective structure for {formData.school_year}
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                        {/* Summary */}
                        <div className="grid grid-cols-3 gap-4">
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="text-center">
                                        <p className="text-sm text-gray-600 mb-1">Total KRAs</p>
                                        <p className="text-3xl font-bold text-blue-600">{formData.kra_count}</p>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="text-center">
                                        <p className="text-sm text-gray-600 mb-1">Total Objectives</p>
                                        <p className="text-3xl font-bold text-purple-600">
                                            {getTotalObjectives(formData.objectives_per_kra)}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="text-center">
                                        <p className="text-sm text-gray-600 mb-1">Avg per KRA</p>
                                        <p className="text-3xl font-bold text-green-600">
                                            {(getTotalObjectives(formData.objectives_per_kra) / formData.kra_count).toFixed(1)}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Structure */}
                        <div className="space-y-3">
                            {Array.from({ length: formData.kra_count }).map((_, kraIndex) => (
                                <Card key={kraIndex} className="border-2">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-base flex items-center justify-between">
                                            <span>KRA {kraIndex + 1}</span>
                                            <span className="text-sm font-normal text-gray-600">
                                                {formData.objectives_per_kra[kraIndex]} Objectives
                                            </span>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-4 gap-2">
                                            {Array.from({ length: formData.objectives_per_kra[kraIndex] }).map((_, objIndex) => (
                                                <div
                                                    key={objIndex}
                                                    className="bg-gray-100 rounded-lg p-2 text-center text-sm font-medium text-gray-700"
                                                >
                                                    Obj {objIndex + 1}
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button onClick={() => setIsPreviewModalOpen(false)}>
                            Close Preview
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Objectives Management Modal */}
            <Dialog open={isObjectivesModalOpen} onOpenChange={setIsObjectivesModalOpen}>
                <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Target className="h-5 w-5 text-green-600" />
                            Objectives Management
                        </DialogTitle>
                        <DialogDescription>
                            Manage IPCRF objectives database - add, edit, and organize objectives across KRAs
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                        {/* Weight Summary Section */}
                        {objectivesData.length > 0 && (
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold mb-4">Weight Distribution Summary</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 mb-6">
                                    {(() => {
                                        // Group objectives by KRA for summary
                                        const groupedObjectives = objectivesData.reduce((acc, objective) => {
                                            const kraName = objective.kra?.name || 'No KRA';
                                            if (!acc[kraName]) {
                                                acc[kraName] = [];
                                            }
                                            acc[kraName].push(objective);
                                            return acc;
                                        }, {});

                                        const totalWeight = objectivesData.reduce((sum, obj) => sum + (parseFloat(obj.weight) || 0), 0);

                                        return Object.entries(groupedObjectives).map(([kraName, objectives]) => {
                                            const kraWeight = objectives.reduce((sum, obj) => sum + (parseFloat(obj.weight) || 0), 0);
                                            const percentage = totalWeight > 0 ? (kraWeight / totalWeight * 100) : 0;
                                            
                                            return (
                                                <div key={kraName} className="bg-gradient-to-br from-white to-blue-50 rounded-xl border-2 border-blue-200 shadow-sm hover:shadow-md transition-all duration-300 p-4 min-h-[140px] flex flex-col">
                                                    <div className="text-sm font-medium text-blue-800 mb-2 line-clamp-2 flex-shrink-0" title={kraName}>
                                                        {kraName}
                                                    </div>
                                                    <div className="flex-1 space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-xs text-gray-600 font-medium">Weight</span>
                                                            <span className="text-lg font-bold text-blue-900">{kraWeight.toFixed(3)}%</span>
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-xs text-gray-600 font-medium">Share</span>
                                                            <span className="text-sm font-semibold text-green-700">{percentage.toFixed(3)}%</span>
                                                        </div>
                                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                                            <div 
                                                                className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500 ease-in-out"
                                                                style={{ width: `${Math.min(percentage, 100)}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                    <div className="text-xs text-gray-500 mt-2 flex-shrink-0">
                                                        {objectives.length} objective{objectives.length !== 1 ? 's' : ''}
                                                    </div>
                                                </div>
                                            );
                                        });
                                    })()}
                                </div>
                                <div className="p-6 bg-gradient-to-r from-green-50 via-blue-50 to-indigo-50 rounded-xl border border-blue-200 shadow-sm">
                                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-green-100 rounded-lg">
                                                <Target className="h-6 w-6 text-green-700" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-gray-700 mb-1">Total System Weight</div>
                                                <div className="text-3xl font-bold text-green-700">
                                                    {objectivesData.reduce((sum, obj) => sum + (parseFloat(obj.weight) || 0), 0).toFixed(3)}%
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-blue-100 rounded-lg">
                                                <AlertCircle className="h-6 w-6 text-blue-700" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-gray-700 mb-1">Average per Objective</div>
                                                <div className="text-2xl font-semibold text-blue-700">
                                                    {objectivesData.length > 0 ? 
                                                        (objectivesData.reduce((sum, obj) => sum + (parseFloat(obj.weight) || 0), 0) / objectivesData.length).toFixed(3)
                                                        : '0.000'
                                                    }%
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-purple-100 rounded-lg">
                                                <CheckCircle className="h-6 w-6 text-purple-700" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-gray-700 mb-1">Total Objectives</div>
                                                <div className="text-2xl font-semibold text-purple-700">
                                                    {objectivesData.length}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Header with Add Button */}
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-semibold">All Objectives</h3>
                                <p className="text-sm text-gray-600">
                                    {objectivesData.length} objective(s) in total
                                </p>
                            </div>
                            <Button 
                                onClick={() => setShowAddObjectiveModal(true)}
                                className="bg-green-600 hover:bg-green-700"
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Add Objective
                            </Button>
                        </div>

                        {/* Objectives Table */}
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>#</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead>KRA</TableHead>
                                        <TableHead className="text-center">Position Tiers</TableHead>
                                        <TableHead className="text-center">Weight</TableHead>
                                        <TableHead className="text-center">Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {objectivesData.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan="7" className="text-center py-8 text-gray-500">
                                                <Target className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                                No objectives found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        (() => {
                                            // Group objectives by KRA
                                            const groupedObjectives = objectivesData.reduce((acc, objective) => {
                                                const kraName = objective.kra?.name || 'No KRA';
                                                if (!acc[kraName]) {
                                                    acc[kraName] = [];
                                                }
                                                acc[kraName].push(objective);
                                                return acc;
                                            }, {});

                                            const rows = [];
                                            Object.entries(groupedObjectives).forEach(([kraName, objectives], kraIndex) => {
                                                // Add KRA header row (separator)
                                                if (kraIndex > 0) {
                                                    rows.push(
                                                        <TableRow key={`spacer-${kraName}`}>
                                                            <TableCell colSpan="7" className="p-0">
                                                                <div className="h-2 bg-gray-100"></div>
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                }
                                                
                                                rows.push(
                                                    <TableRow key={`header-${kraName}`} className="bg-gradient-to-r from-blue-50 to-blue-100 border-b-2 border-blue-200">
                                                        <TableCell colSpan="7" className="font-semibold text-blue-900 py-3 px-4">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-1 h-6 bg-blue-600 rounded-full"></div>
                                                                    <span className="text-lg">{kraName}</span>
                                                                    <span className="text-sm text-blue-600 ml-2">
                                                                        ({objectives.length} objective{objectives.length !== 1 ? 's' : ''})
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center gap-4">
                                                                    <div className="text-right">
                                                                        <div className="text-sm text-blue-600">Total Weight</div>
                                                                        <div className="text-xl font-bold text-blue-800">
                                                                            {objectives.reduce((sum, obj) => sum + (parseFloat(obj.weight) || 0), 0).toFixed(3)}%
                                                                        </div>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <div className="text-sm text-blue-600">Avg Weight</div>
                                                                        <div className="text-lg font-semibold text-blue-700">
                                                                            {objectives.length > 0 ? 
                                                                                (objectives.reduce((sum, obj) => sum + (parseFloat(obj.weight) || 0), 0) / objectives.length).toFixed(3) 
                                                                                : '0.000'
                                                                            }%
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                );

                                                // Add objective rows for this KRA
                                                objectives.forEach((objective, objIndex) => {
                                                    rows.push(
                                                        <TableRow key={objective.id} className="hover:bg-blue-50/50">
                                                            <TableCell className="font-medium pl-8">{objIndex + 1}</TableCell>
                                                            <TableCell className="max-w-md pl-8">
                                                                <div className="truncate" title={objective.description}>
                                                                    {objective.description}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                                    {objective.kra?.name || 'No KRA'}
                                                                </span>
                                                            </TableCell>
                                                            <TableCell className="text-center">
                                                                {objective.position_tiers && objective.position_tiers.length > 0 ? (
                                                                    <div className="flex flex-wrap gap-1 justify-center">
                                                                        {objective.position_tiers.map((tier) => (
                                                                            <span 
                                                                                key={tier} 
                                                                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800"
                                                                            >
                                                                                {tier}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                ) : (
                                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                                                                        All Positions
                                                                    </span>
                                                                )}
                                                            </TableCell>
                                                            <TableCell className="text-center">
                                                                <span className="font-medium">{objective.weight.toFixed ? objective.weight.toFixed(3) : objective.weight}%</span>
                                                            </TableCell>
                                                            <TableCell className="text-center">
                                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                                    objective.is_active 
                                                                        ? 'bg-green-100 text-green-800' 
                                                                        : 'bg-gray-100 text-gray-600'
                                                                }`}>
                                                                    {objective.is_active ? (
                                                                        <>
                                                                            <CheckCircle className="w-3 h-3 mr-1" />
                                                                            Active
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <XCircle className="w-3 h-3 mr-1" />
                                                                            Inactive
                                                                        </>
                                                                    )}
                                                                </span>
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                <div className="flex items-center justify-end gap-2">
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        onClick={() => handleEditObjective(objective)}
                                                                    >
                                                                        <Edit className="h-3 w-3" />
                                                                    </Button>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        onClick={() => handleDeleteObjective(objective)}
                                                                        className="text-red-600 hover:text-red-700"
                                                                    >
                                                                        <Trash2 className="h-3 w-3" />
                                                                    </Button>
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                });
                                            });
                                            
                                            return rows;
                                        })()
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsObjectivesModalOpen(false)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add Objective Modal */}
            <Dialog open={showAddObjectiveModal} onOpenChange={setShowAddObjectiveModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Plus className="h-5 w-5 text-green-600" />
                            Add New Objective
                        </DialogTitle>
                        <DialogDescription>
                            Create a new objective to add to the IPCRF objectives database.
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="add-kra">Key Result Area (KRA) *</Label>
                            <Select 
                                value={objectiveFormData.kra_id ? String(objectiveFormData.kra_id) : ""} 
                                onValueChange={(value) => setObjectiveFormData({...objectiveFormData, kra_id: value})}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select KRA" />
                                </SelectTrigger>
                                <SelectContent>
                                    {defaultKras?.map((kra) => (
                                        <SelectItem key={kra.id} value={String(kra.id)}>
                                            {kra.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="add-description">Description *</Label>
                            <Textarea
                                id="add-description"
                                value={objectiveFormData.description}
                                onChange={(e) => setObjectiveFormData({...objectiveFormData, description: e.target.value})}
                                placeholder="Detailed description of the objective..."
                                rows={3}
                            />
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="add-weight">Weight (%) *</Label>
                                <Input
                                    id="add-weight"
                                    type="number"
                                    step="0.001"
                                    min="0"
                                    max="100"
                                    value={objectiveFormData.weight}
                                    onChange={(e) => setObjectiveFormData({...objectiveFormData, weight: e.target.value})}
                                    placeholder="0.000"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="add-order">Order *</Label>
                                <Input
                                    id="add-order"
                                    type="number"
                                    min="1"
                                    value={objectiveFormData.order}
                                    onChange={(e) => setObjectiveFormData({...objectiveFormData, order: e.target.value})}
                                    placeholder="1"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Status</Label>
                                <div className="flex items-center space-x-2">
                                    <Checkbox 
                                        id="is_active"
                                        checked={objectiveFormData.is_active}
                                        onCheckedChange={(checked) => setObjectiveFormData({...objectiveFormData, is_active: checked})}
                                    />
                                    <Label htmlFor="is_active">Active</Label>
                                </div>
                            </div>
                        </div>
                        
                        {/* Position Tiers Selection */}
                        <div className="space-y-2">
                            <Label>Position Tiers (Leave empty for all positions)</Label>
                            <div className="grid grid-cols-2 gap-2 p-3 border rounded-lg bg-gray-50">
                                {positionTierOptions.map((tier) => (
                                    <div key={tier.value} className="flex items-center space-x-2">
                                        <Checkbox 
                                            id={`add-tier-${tier.value}`}
                                            checked={objectiveFormData.position_tiers?.includes(tier.value)}
                                            onCheckedChange={(checked) => {
                                                const newTiers = checked 
                                                    ? [...(objectiveFormData.position_tiers || []), tier.value]
                                                    : (objectiveFormData.position_tiers || []).filter(t => t !== tier.value);
                                                setObjectiveFormData({...objectiveFormData, position_tiers: newTiers});
                                            }}
                                        />
                                        <Label htmlFor={`add-tier-${tier.value}`} className="text-sm font-normal cursor-pointer">
                                            {tier.label}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs text-gray-500">
                                Select which position tiers this objective applies to. If none selected, it will be available for all positions.
                            </p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAddObjectiveModal(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleAddObjective} className="bg-green-600 hover:bg-green-700">
                            <Save className="mr-2 h-4 w-4" />
                            Create Objective
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Objective Modal */}
            <Dialog open={showEditObjectiveModal} onOpenChange={setShowEditObjectiveModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Edit className="h-5 w-5 text-blue-600" />
                            Edit Objective
                        </DialogTitle>
                        <DialogDescription>
                            Update the objective information.
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-kra">Key Result Area (KRA) *</Label>
                            <Select 
                                value={objectiveFormData.kra_id ? String(objectiveFormData.kra_id) : ""} 
                                onValueChange={(value) => setObjectiveFormData({...objectiveFormData, kra_id: value})}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select KRA" />
                                </SelectTrigger>
                                <SelectContent>
                                    {defaultKras?.map((kra) => (
                                        <SelectItem key={kra.id} value={String(kra.id)}>
                                            {kra.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="edit-description">Description *</Label>
                            <Textarea
                                id="edit-description"
                                value={objectiveFormData.description}
                                onChange={(e) => setObjectiveFormData({...objectiveFormData, description: e.target.value})}
                                placeholder="Detailed description of the objective..."
                                rows={3}
                            />
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-weight">Weight (%) *</Label>
                                <Input
                                    id="edit-weight"
                                    type="number"
                                    step="0.001"
                                    min="0"
                                    max="100"
                                    value={objectiveFormData.weight}
                                    onChange={(e) => setObjectiveFormData({...objectiveFormData, weight: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-order">Order *</Label>
                                <Input
                                    id="edit-order"
                                    type="number"
                                    min="1"
                                    value={objectiveFormData.order}
                                    onChange={(e) => setObjectiveFormData({...objectiveFormData, order: e.target.value})}
                                    placeholder="1"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Status</Label>
                                <div className="flex items-center space-x-2">
                                    <Checkbox 
                                        id="edit_is_active"
                                        checked={objectiveFormData.is_active}
                                        onCheckedChange={(checked) => setObjectiveFormData({...objectiveFormData, is_active: checked})}
                                    />
                                    <Label htmlFor="edit_is_active">Active</Label>
                                </div>
                            </div>
                        </div>
                        
                        {/* Position Tiers Selection */}
                        <div className="space-y-2">
                            <Label>Position Tiers (Leave empty for all positions)</Label>
                            <div className="grid grid-cols-2 gap-2 p-3 border rounded-lg bg-gray-50">
                                {positionTierOptions.map((tier) => (
                                    <div key={tier.value} className="flex items-center space-x-2">
                                        <Checkbox 
                                            id={`edit-tier-${tier.value}`}
                                            checked={objectiveFormData.position_tiers?.includes(tier.value)}
                                            onCheckedChange={(checked) => {
                                                const newTiers = checked 
                                                    ? [...(objectiveFormData.position_tiers || []), tier.value]
                                                    : (objectiveFormData.position_tiers || []).filter(t => t !== tier.value);
                                                setObjectiveFormData({...objectiveFormData, position_tiers: newTiers});
                                            }}
                                        />
                                        <Label htmlFor={`edit-tier-${tier.value}`} className="text-sm font-normal cursor-pointer">
                                            {tier.label}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs text-gray-500">
                                Select which position tiers this objective applies to. If none selected, it will be available for all positions.
                            </p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowEditObjectiveModal(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleUpdateObjective} className="bg-blue-600 hover:bg-blue-700">
                            <Save className="mr-2 h-4 w-4" />
                            Update Objective
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Objective Confirmation Modal */}
            <Dialog open={showDeleteObjectiveModal} onOpenChange={setShowDeleteObjectiveModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <Trash2 className="h-5 w-5" />
                            Delete Objective
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete the objective "{selectedObjective?.code}"? 
                            This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    
                    {selectedObjective && (
                        <div className="p-4 bg-gray-50 rounded-md">
                            <p className="text-sm"><strong>Code:</strong> {selectedObjective.code}</p>
                            <p className="text-sm"><strong>Description:</strong> {selectedObjective.description}</p>
                            <p className="text-sm"><strong>KRA:</strong> {selectedObjective.kra?.name}</p>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteObjectiveModal(false)}>
                            Cancel
                        </Button>
                        <Button onClick={confirmDeleteObjective} className="bg-red-600 hover:bg-red-700 text-white">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Objective
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}



