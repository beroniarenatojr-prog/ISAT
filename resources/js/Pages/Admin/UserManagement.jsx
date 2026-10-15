import { AppSidebar } from "@/components/app-sidebar";
import { Head, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
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
import { Search, UserPlus, Pencil, Trash2, KeyRound, ShieldCheck } from 'lucide-react';

const emptyForm = { name: '', email: '', password: '', role: 'admin', is_active: true };

export default function UserManagement({ users, roleOptions, canManagePrincipal = false, filters, flash }) {
    const [search, setSearch] = useState(filters?.search || '');
    const [roleFilter, setRoleFilter] = useState(filters?.role || '');

    const [createOpen, setCreateOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [resetOpen, setResetOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);

    const [form, setForm] = useState(emptyForm);
    const [selected, setSelected] = useState(null);
    const [resetPassword, setResetPassword] = useState('');
    const [processing, setProcessing] = useState(false);

    const applyFilters = (next = {}) => {
        router.get(route('admin.users.index'), {
            search,
            role: roleFilter,
            ...next,
        }, { preserveState: true, replace: true });
    };

    const roleBadge = (role) => (
        role === 'super-admin'
            ? 'bg-purple-100 text-purple-700'
            : 'bg-blue-100 text-blue-700'
    );

    const openCreate = () => {
        setForm(emptyForm);
        setCreateOpen(true);
    };

    const openEdit = (user) => {
        setSelected(user);
        setForm({
            name: user.name,
            email: user.email,
            password: '',
            role: user.role,
            is_active: user.is_active,
        });
        setEditOpen(true);
    };

    const openReset = (user) => {
        setSelected(user);
        setResetPassword('');
        setResetOpen(true);
    };

    const openDelete = (user) => {
        setSelected(user);
        setDeleteOpen(true);
    };

    const submitCreate = () => {
        setProcessing(true);
        router.post(route('admin.users.store'), form, {
            preserveScroll: true,
            onSuccess: () => setCreateOpen(false),
            onError: (errors) => Object.values(errors).forEach((e) => toast.error(e)),
            onFinish: () => setProcessing(false),
        });
    };

    const submitEdit = () => {
        if (!selected) return;
        setProcessing(true);
        router.put(route('admin.users.update', selected.id), {
            name: form.name,
            email: form.email,
            role: form.role,
            is_active: form.is_active,
        }, {
            preserveScroll: true,
            onSuccess: () => setEditOpen(false),
            onError: (errors) => Object.values(errors).forEach((e) => toast.error(e)),
            onFinish: () => setProcessing(false),
        });
    };

    const submitReset = () => {
        if (!selected) return;
        setProcessing(true);
        router.post(route('admin.users.reset-password', selected.id), { password: resetPassword }, {
            preserveScroll: true,
            onSuccess: () => setResetOpen(false),
            onError: (errors) => Object.values(errors).forEach((e) => toast.error(e)),
            onFinish: () => setProcessing(false),
        });
    };

    const submitDelete = () => {
        if (!selected) return;
        setProcessing(true);
        router.delete(route('admin.users.destroy', selected.id), {
            preserveScroll: true,
            onSuccess: () => setDeleteOpen(false),
            onError: (errors) => Object.values(errors).forEach((e) => toast.error(e)),
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <>
            <Head title="User Management" />
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
                                        <BreadcrumbPage>User Management</BreadcrumbPage>
                                    </BreadcrumbItem>
                                </BreadcrumbList>
                            </Breadcrumb>
                        </div>
                    </header>

                    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                        <div className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center opacity-20">
                            <img src="/pictures/isat.tmp" alt="ISAT Background" className="w-[600px] h-[600px] object-contain" />
                        </div>

                        <div className="relative z-10">
                            <div className="bg-white rounded-lg shadow p-6">
                                <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                                    <div>
                                        <h2 className="text-2xl font-semibold flex items-center gap-2">
                                            <ShieldCheck className="h-6 w-6 text-green-600" />
                                            User Management
                                        </h2>
                                        <p className="text-sm text-gray-600">Principal and Master Teacher accounts</p>
                                    </div>
                                    <Button onClick={openCreate} className="bg-green-600 hover:bg-green-700">
                                        <UserPlus className="h-4 w-4 mr-2" />
                                        Add User
                                    </Button>
                                </div>

                                <div className="flex flex-col md:flex-row gap-4 items-end mb-6">
                                    <div className="flex-1">
                                        <Label htmlFor="search">Search</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                id="search"
                                                placeholder="Name or email..."
                                                value={search}
                                                onChange={(e) => setSearch(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                                            />
                                            <Button onClick={() => applyFilters()} className="bg-green-600 hover:bg-green-700">
                                                <Search className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="w-full md:w-56">
                                        <Label htmlFor="role">Filter by Role</Label>
                                        <Select
                                            value={roleFilter || 'all'}
                                            onValueChange={(value) => {
                                                const v = value === 'all' ? '' : value;
                                                setRoleFilter(v);
                                                applyFilters({ role: v });
                                            }}
                                        >
                                            <SelectTrigger id="role">
                                                <SelectValue placeholder="All Roles" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Roles</SelectItem>
                                                {roleOptions.map((opt) => (
                                                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="rounded-md border overflow-hidden">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Name</TableHead>
                                                <TableHead>Email</TableHead>
                                                <TableHead className="text-center">Role</TableHead>
                                                <TableHead className="text-center">Status</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {users.data.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                                        No accounts found
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                users.data.map((user) => (
                                                    <TableRow key={user.id}>
                                                        <TableCell className="font-medium">
                                                            {user.name}
                                                            {user.is_self && (
                                                                <span className="ml-2 text-xs text-gray-400">(you)</span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell>{user.email}</TableCell>
                                                        <TableCell className="text-center">
                                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${roleBadge(user.role)}`}>
                                                                {user.role_label}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${user.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                                                {user.is_active ? 'Active' : 'Inactive'}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <div className="flex gap-2 justify-end">
                                                                <Button size="sm" variant="outline" onClick={() => openEdit(user)}>
                                                                    <Pencil className="h-3 w-3" />
                                                                </Button>
                                                                <Button size="sm" variant="outline" onClick={() => openReset(user)} title="Reset password">
                                                                    <KeyRound className="h-3 w-3" />
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="text-red-600 hover:text-red-700"
                                                                    disabled={user.is_self}
                                                                    onClick={() => openDelete(user)}
                                                                    title={user.is_self ? "You can't delete yourself" : 'Delete'}
                                                                >
                                                                    <Trash2 className="h-3 w-3" />
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>

                                {users.links && users.links.length > 3 && (
                                    <div className="flex justify-center gap-2 mt-4">
                                        {users.links.map((link, index) => (
                                            <Button
                                                key={index}
                                                variant={link.active ? 'default' : 'outline'}
                                                size="sm"
                                                disabled={!link.url}
                                                onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
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

            {/* Create */}
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add User</DialogTitle>
                        <DialogDescription>
                            {canManagePrincipal
                                ? 'Create a Principal or Master Teacher account.'
                                : 'Create a Master Teacher account. Only the Administrator can add Principal accounts.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                        <div>
                            <Label htmlFor="c-name">Full Name</Label>
                            <Input id="c-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                        </div>
                        <div>
                            <Label htmlFor="c-email">Email</Label>
                            <Input id="c-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                        </div>
                        <div>
                            <Label htmlFor="c-password">Password</Label>
                            <Input id="c-password" type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Min. 8 characters" />
                        </div>
                        <div>
                            <Label htmlFor="c-role">Role</Label>
                            <Select value={form.role} onValueChange={(value) => setForm({ ...form, role: value })}>
                                <SelectTrigger id="c-role"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {roleOptions.map((opt) => (
                                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                        <Button className="bg-green-600 hover:bg-green-700" onClick={submitCreate} disabled={processing}>Create</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit User</DialogTitle>
                        <DialogDescription>{selected?.email}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                        <div>
                            <Label htmlFor="e-name">Full Name</Label>
                            <Input id="e-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                        </div>
                        <div>
                            <Label htmlFor="e-email">Email</Label>
                            <Input id="e-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                        </div>
                        <div>
                            <Label htmlFor="e-role">Role</Label>
                            {!canManagePrincipal && selected?.role === 'super-admin' ? (
                                <Input id="e-role" value={selected?.role_label || 'Principal'} readOnly className="bg-gray-50" />
                            ) : (
                                <Select value={form.role} onValueChange={(value) => setForm({ ...form, role: value })}>
                                    <SelectTrigger id="e-role"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {roleOptions.map((opt) => (
                                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                            {!canManagePrincipal && (
                                <p className="mt-1 text-xs text-gray-400">Only the Administrator can change accounts to Principal.</p>
                            )}
                        </div>
                        <label className="flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={form.is_active}
                                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                            />
                            Active
                        </label>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
                        <Button className="bg-green-600 hover:bg-green-700" onClick={submitEdit} disabled={processing}>Save</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reset password */}
            <Dialog open={resetOpen} onOpenChange={setResetOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reset Password</DialogTitle>
                        <DialogDescription>Set a new password for {selected?.name}.</DialogDescription>
                    </DialogHeader>
                    <div>
                        <Label htmlFor="r-password">New Password</Label>
                        <Input id="r-password" type="text" value={resetPassword} onChange={(e) => setResetPassword(e.target.value)} placeholder="Min. 8 characters" />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setResetOpen(false)}>Cancel</Button>
                        <Button className="bg-green-600 hover:bg-green-700" onClick={submitReset} disabled={processing}>Reset</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete */}
            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete User</DialogTitle>
                        <DialogDescription>
                            This permanently removes {selected?.name} ({selected?.email}).
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={submitDelete} disabled={processing}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
