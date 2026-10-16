import TeacherLayout from '@/Layouts/TeacherLayout';
import { Head } from '@inertiajs/react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';
import UpdateProfilePhotoForm from './Partials/UpdateProfilePhotoForm';
import { User, Lock, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function SettingsCard({ icon: Icon, iconClass, title, description, children }) {
    return (
        <section className="overflow-hidden rounded-2xl border border-border bg-white">
            <div className="flex items-center gap-3 border-b border-gray-100 px-[22px] py-[18px]">
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconClass}`}>
                    <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                    <h2 className="text-lg font-bold text-gray-900">{title}</h2>
                    <p className="mt-0.5 text-[13px] text-gray-500">{description}</p>
                </div>
            </div>
            <div className="p-[22px]">{children}</div>
        </section>
    );
}

export default function Edit({ mustVerifyEmail, status, auth }) {
    const [photoPreview, setPhotoPreview] = useState(null);

    // Use profile_picture (consistent with admin upload) with fallback to photo for backward compatibility
    const displayPhoto = photoPreview ||
        ((auth.user.profile_picture || auth.user.photo) ? route('users.avatar', auth.user.id) : null);

    return (
        <TeacherLayout user={auth.user}>
            <Head title="Profile Settings" />

            <ToastContainer
                position="top-right"
                autoClose={6000}
                hideProgressBar={false}
                closeOnClick
                pauseOnHover
                draggable
            />

            <div className="min-h-screen bg-[hsl(var(--canvas))] text-foreground">
                <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-9 sm:px-6 lg:px-12">
                    <div className="flex flex-col gap-1.5">
                        <span className="text-[13px] text-gray-500">
                            Settings / <span className="font-semibold text-green-700">Profile</span>
                        </span>
                        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-[38px]">Profile Settings</h1>
                        <p className="text-base text-gray-500">Manage your account information and security preferences</p>
                    </div>

                    <div className="flex flex-wrap items-start gap-6">
                        {/* Photo card */}
                        <section className="min-w-0 flex-[1_1_300px] overflow-hidden rounded-2xl border border-border bg-white lg:sticky lg:top-6">
                            <div className="relative flex flex-col items-center gap-2 overflow-hidden bg-sidebar px-5 py-7 text-center text-white">
                                <span className="pointer-events-none absolute -right-10 -top-14 h-40 w-40 rounded-full bg-white/10" />
                                <div className="relative h-28 w-28 overflow-hidden rounded-full bg-white ring-4 ring-white/30">
                                    {displayPhoto ? (
                                        <img src={displayPhoto} alt={auth.user.name} className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center bg-yellow-300">
                                            <span className="text-[44px] font-extrabold text-green-900">
                                                {auth.user.name.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <h3 className="relative text-[19px] font-bold">{auth.user.name}</h3>
                                <p className="relative text-[13px] text-white/85">{auth.user.email}</p>
                            </div>
                            <div className="p-5">
                                <UpdateProfilePhotoForm user={auth.user} onPhotoPreview={setPhotoPreview} />
                            </div>
                        </section>

                        {/* Forms */}
                        <div className="flex min-w-0 flex-[2_1_520px] flex-col gap-5">
                            <SettingsCard
                                icon={User}
                                iconClass="bg-green-50 text-green-700"
                                title="Personal Information"
                                description="Update your name and email address"
                            >
                                <UpdateProfileInformationForm mustVerifyEmail={mustVerifyEmail} status={status} />
                            </SettingsCard>

                            <SettingsCard
                                icon={Lock}
                                iconClass="bg-yellow-50 text-yellow-700"
                                title="Security"
                                description="Keep your account secure with a strong password"
                            >
                                <UpdatePasswordForm />
                            </SettingsCard>

                            <section className="overflow-hidden rounded-2xl border border-red-200 bg-white">
                                <div className="flex items-center gap-3 border-b border-red-100 bg-red-50 px-[22px] py-[18px]">
                                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-red-600">
                                        <Trash2 className="h-5 w-5" aria-hidden="true" />
                                    </span>
                                    <div>
                                        <h2 className="text-lg font-bold text-gray-900">Danger Zone</h2>
                                        <p className="mt-0.5 text-[13px] text-red-700">Irreversible actions that affect your account</p>
                                    </div>
                                </div>
                                <div className="p-[22px]">
                                    <DeleteUserForm />
                                </div>
                            </section>
                        </div>
                    </div>
                </main>
            </div>
        </TeacherLayout>
    );
}
