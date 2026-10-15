import { Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { Home, FileText, User, Settings, LogOut, ChevronLeft, ChevronRight, LayoutGrid } from 'lucide-react';
import { hasRole } from '@/lib/roleLabels';

export default function TeacherLayout({ children, user = { name: 'User', email: 'user@example.com' } }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showUserDropdown, setShowUserDropdown] = useState(false);

    const { auth } = usePage().props;
    const roles = auth?.roles ?? auth?.user?.roles;
    // A Master Teacher also holds the admin role - let them jump to the admin panel.
    const alsoAdmin = hasRole(roles, 'admin') || hasRole(roles, 'super-admin');

    const handleLogout = () => {
        router.post(route('logout'));
    };

    const navigation = [
        { name: 'Dashboard', href: route('teacher.dashboard'), icon: Home },
        { name: 'IPCRF Tool', href: route('teacher.ipcrf'), icon: FileText },
        { name: 'Signed IPCRF', href: route('teacher.signed-ipcrf'), icon: FileText },
        { name: 'IPCRF History', href: route('teacher.ipcrf-history'), icon: FileText },
        ...(alsoAdmin ? [{ name: 'Admin Panel', href: route('admin.dashboard'), icon: LayoutGrid }] : []),
    ];

    const isActive = (href) => {
        return window.location.pathname === new URL(href).pathname;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-green-50 to-green-100">
            {/* Backdrop */}
            <div 
                className={`fixed inset-0 bg-black/50 z-[45] transition-opacity duration-300 ${
                    sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
                onClick={() => setSidebarOpen(false)}
            ></div>

            {/* Toggle Button - Enhanced */}
            <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className={`fixed top-1/2 -translate-y-1/2 z-50 bg-gradient-to-r from-white to-gray-50 hover:from-gray-50 hover:to-white shadow-xl rounded-r-2xl transition-all duration-300 group border-y border-r ${
                    sidebarOpen ? 'left-72' : 'left-0'
                }`}
                style={{ 
                    padding: '24px 14px',
                    borderColor: '#66BB6A'
                }}
            >
                {sidebarOpen ? (
                    <ChevronLeft className="h-6 w-6 transition-colors" style={{ color: '#66BB6A' }} />
                ) : (
                    <ChevronRight className="h-6 w-6 transition-colors" style={{ color: '#66BB6A' }} />
                )}
            </button>

            {/* Sidebar Drawer - Slides from left */}
            <aside className={`fixed top-0 left-0 z-50 h-full w-72 shadow-2xl transform transition-transform duration-300 ease-in-out ${
                sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`} style={{ 
                borderRight: '2px solid #66BB6A',
                background: 'linear-gradient(to bottom, #E8F5E9, #F1F8E9, #E8F5E9)'
            }}>
                <div className="flex flex-col h-full">
                    {/* Logo Section - Enhanced */}
                    <div className="relative p-6 border-b" style={{ backgroundColor: '#e8f5e9', borderColor: '#66BB6A', borderBottomWidth: '2px' }}>
                        {/* Decorative background */}
                        <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl" style={{ background: 'rgba(102, 187, 106, 0.1)' }}></div>
                        
                        <div className="relative flex items-center gap-4">
                            <div className="relative group">
                                {/* Animated glow effect */}
                                <div className="absolute -inset-2 rounded-full blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-300" style={{ background: 'linear-gradient(to right, #66BB6A, #4CAF50)' }}></div>
                                <div className="relative bg-white rounded-full p-1 shadow-lg" style={{ border: '2px solid rgba(102, 187, 106, 0.3)' }}>
                                    <img 
                                        src="/pictures/isat 1.jpg" 
                                        alt="ISAT Logo" 
                                        className="h-14 w-14 rounded-full object-cover"
                                    />
                                </div>
                            </div>
                            <div>
                                <h2 className="text-xl font-extrabold text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(to right, #2e7d32, #66BB6A, #4CAF50)' }}>
                                    ISAT DMS
                                </h2>
                                <p className="text-xs font-semibold mt-0.5" style={{ color: '#66BB6A' }}>Teacher Portal</p>
                            </div>
                        </div>
                    </div>

                    {/* Navigation - Enhanced */}
                    <nav className="flex-1 p-5 space-y-2 overflow-y-auto">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider px-4 mb-3">Menu</p>
                        {navigation.map((item) => {
                            const Icon = item.icon;
                            const active = isActive(item.href);
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    onClick={() => setSidebarOpen(false)}
                                    className={`group relative flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 ${
                                        active
                                            ? 'text-white shadow-lg'
                                            : 'text-gray-700 hover:text-gray-900'
                                    }`}
                                    style={active ? {
                                        background: 'linear-gradient(to right, #66BB6A, #4CAF50)',
                                        boxShadow: '0 10px 15px -3px rgba(102, 187, 106, 0.3)'
                                    } : {}}
                                    onMouseEnter={(e) => !active && (e.currentTarget.style.background = 'linear-gradient(to right, #f1f8e9, #e8f5e9)')}
                                    onMouseLeave={(e) => !active && (e.currentTarget.style.background = '')}
                                >
                                    {/* Active indicator */}
                                    {active && (
                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full"></div>
                                    )}
                                    
                                    <div className={`p-2 rounded-lg transition-colors ${
                                        active 
                                            ? 'bg-white/20' 
                                            : ''
                                    }`} style={!active ? { backgroundColor: '#e8f5e9' } : {}}>
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <span className="font-semibold text-sm">{item.name}</span>
                                    
                                    {/* Hover arrow */}
                                    {!active && (
                                        <ChevronRight className="h-4 w-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* User Section - Enhanced */}
                    <div className="p-5 border-t" style={{ backgroundColor: '#e8f5e9', borderColor: '#66BB6A', borderTopWidth: '2px' }}>
                        <div className="relative">
                            <button
                                onClick={() => setShowUserDropdown(!showUserDropdown)}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/80 transition-all duration-200 hover:shadow-md group"
                            >
                                <div className="relative w-11 h-11 rounded-full overflow-hidden flex-shrink-0 transition-all" style={{ 
                                    background: 'linear-gradient(to bottom right, #66BB6A, #4CAF50)',
                                    border: '2px solid rgba(102, 187, 106, 0.3)'
                                }}>
                                    {(user.profile_picture || user.photo) ? (
                                        <img
                                            src={route('users.avatar', user.id)}
                                            alt={user.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <span className="text-xl font-bold text-white">
                                                {user.name.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 text-left min-w-0">
                                    <p className="text-sm font-bold text-gray-900 truncate">{user.name}</p>
                                    <p className="text-xs text-gray-600 truncate">{user.email}</p>
                                </div>
                                <ChevronRight className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${showUserDropdown ? 'rotate-90' : ''}`} />
                            </button>

                            {/* User Dropdown - Enhanced */}
                            {showUserDropdown && (
                                <>
                                    <div 
                                        className="fixed inset-0 z-10" 
                                        onClick={() => setShowUserDropdown(false)}
                                    ></div>
                                    <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-xl shadow-2xl border overflow-hidden z-20 animate-in slide-in-from-bottom-2 duration-200" style={{ borderColor: '#66BB6A' }}>
                                        <Link
                                            href={route('profile.edit')}
                                            className="flex items-center gap-3 px-4 py-3 hover:bg-green-50 transition-all duration-200 group"
                                            onClick={() => {
                                                setShowUserDropdown(false);
                                                setSidebarOpen(false);
                                            }}
                                        >
                                            <div className="p-2 rounded-lg bg-gray-100 transition-colors" style={{ backgroundColor: '#e8f5e9' }}>
                                                <Settings className="h-4 w-4" style={{ color: '#66BB6A' }} />
                                            </div>
                                            <span className="text-sm font-semibold" style={{ color: '#2e7d32' }}>Profile Settings</span>
                                        </Link>
                                        <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent my-1"></div>
                                        <button
                                            onClick={() => {
                                                setShowUserDropdown(false);
                                                setSidebarOpen(false);
                                                handleLogout();
                                            }}
                                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 transition-all duration-200 text-left group"
                                        >
                                            <div className="p-2 rounded-lg bg-red-50 group-hover:bg-red-100 transition-colors">
                                                <LogOut className="h-4 w-4 text-red-600" />
                                            </div>
                                            <span className="text-sm font-semibold text-red-600">Logout</span>
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div>
                {/* Page Content */}
                <main>
                    {children}
                </main>
            </div>
        </div>
    );
}
