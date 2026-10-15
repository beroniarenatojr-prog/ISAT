import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';
import { Mail, Lock, User, UserPlus, Eye, EyeOff, Shield } from 'lucide-react';
import { useState } from 'react';

const DEPARTMENT_GROUPS = [
    {
        label: 'Junior High School (JHS)',
        options: ['Related Subjects 1', 'Related Subjects 2', 'TVL 1', 'TVL 2'],
    },
    {
        label: 'Senior High School (SHS)',
        options: ['Techpro', 'HUMSS', 'STEM'],
    },
];

const POSITION_TO_CAREER_STAGE = {
    'T1 - T3': 'Beginning Towards Proficient',
    'T4 - T7': 'Highly Proficient',
    'MT1 - MT2': 'Distinguished',
    'MT3 - MT5': 'Distinguished',
};

export default function Register() {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        sex: '',
        current_position_id: '',
        career_stage: '',
        department: '',
        teacher_status: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    const selectPosition = (value) => {
        setData({
            ...data,
            current_position_id: value,
            career_stage: POSITION_TO_CAREER_STAGE[value] || '',
        });
    };

    const fieldClass = (hasError) =>
        `block w-full rounded-xl border bg-white text-gray-900 placeholder:text-gray-400 shadow-sm focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-200 h-12 text-sm ${
            hasError ? 'border-red-400 ring-2 ring-red-100' : 'border-gray-300'
        }`;

    return (
        <>
            <Head title="Teacher Registration" />

            <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
                <div className="absolute inset-0">
                    <img src="/pictures/pic2.jpg" alt="Background" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-900/85 via-gray-900/80 to-slate-900/85"></div>
                </div>

                <div className="max-w-2xl w-full relative z-10">
                    <div className="text-center mb-8">
                        <div className="flex justify-center mb-4">
                            <div className="relative">
                                <div className="absolute -inset-3 bg-gradient-to-r from-green-400 via-emerald-400 to-green-500 rounded-full blur-2xl opacity-50"></div>
                                <div className="relative bg-white rounded-full p-3 shadow-2xl">
                                    <img
                                        src="/pictures/isat 1.jpg"
                                        alt="ISAT Logo"
                                        className="h-20 w-20 rounded-full object-cover ring-4 ring-white/50"
                                    />
                                </div>
                            </div>
                        </div>
                        <h1 className="text-3xl lg:text-4xl font-extrabold text-white drop-shadow-2xl">Teacher Registration</h1>
                        <p className="text-gray-300 mt-2">Create your e-TRACES account to get started</p>
                    </div>

                    <div className="bg-white rounded-3xl shadow-2xl p-8 lg:p-10 border-2 border-white/40 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-green-400/10 to-transparent rounded-bl-full pointer-events-none"></div>

                        <div className="relative bg-amber-50 border-l-4 border-amber-400 p-4 rounded-xl mb-6">
                            <p className="text-sm font-semibold text-amber-800">
                                Your account will need admin approval before you can log in. You'll be notified once it's active.
                            </p>
                        </div>

                        <form onSubmit={submit} className="space-y-5 relative">
                            {/* Name */}
                            <div>
                                <InputLabel htmlFor="name" value="Full Name *" className="text-gray-700 text-xs font-semibold mb-1" />
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                                        <User className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <TextInput
                                        id="name"
                                        name="name"
                                        value={data.name}
                                        className={`${fieldClass(errors.name)} pl-11`}
                                        autoComplete="name"
                                        isFocused={true}
                                        placeholder="Juan Dela Cruz"
                                        onChange={(e) => setData('name', e.target.value)}
                                        required
                                    />
                                </div>
                                <InputError message={errors.name} className="mt-1 ml-1 text-red-500" />
                            </div>

                            {/* Email */}
                            <div>
                                <InputLabel htmlFor="email" value="Email Address *" className="text-gray-700 text-xs font-semibold mb-1" />
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                                        <Mail className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <TextInput
                                        id="email"
                                        type="email"
                                        name="email"
                                        value={data.email}
                                        className={`${fieldClass(errors.email)} pl-11`}
                                        autoComplete="username"
                                        placeholder="you@example.com"
                                        onChange={(e) => setData('email', e.target.value)}
                                        required
                                    />
                                </div>
                                <InputError message={errors.email} className="mt-1 ml-1 text-red-500" />
                            </div>

                            {/* Password + Confirm */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <InputLabel htmlFor="password" value="Password *" className="text-gray-700 text-xs font-semibold mb-1" />
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                                            <Lock className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <TextInput
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            name="password"
                                            value={data.password}
                                            className={`${fieldClass(errors.password)} pl-11 pr-11`}
                                            autoComplete="new-password"
                                            placeholder="Min 8 characters"
                                            onChange={(e) => setData('password', e.target.value)}
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 z-10"
                                        >
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                    <InputError message={errors.password} className="mt-1 ml-1 text-red-500" />
                                </div>
                                <div>
                                    <InputLabel htmlFor="password_confirmation" value="Confirm Password *" className="text-gray-700 text-xs font-semibold mb-1" />
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                                            <Lock className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <TextInput
                                            id="password_confirmation"
                                            type={showConfirm ? 'text' : 'password'}
                                            name="password_confirmation"
                                            value={data.password_confirmation}
                                            className={`${fieldClass(errors.password_confirmation)} pl-11 pr-11`}
                                            autoComplete="new-password"
                                            placeholder="Re-enter password"
                                            onChange={(e) => setData('password_confirmation', e.target.value)}
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirm(!showConfirm)}
                                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 z-10"
                                        >
                                            {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                    <InputError message={errors.password_confirmation} className="mt-1 ml-1 text-red-500" />
                                </div>
                            </div>

                            {/* Sex + Position */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <InputLabel htmlFor="sex" value="Sex" className="text-gray-700 text-xs font-semibold mb-1" />
                                    <select
                                        id="sex"
                                        value={data.sex}
                                        onChange={(e) => setData('sex', e.target.value)}
                                        className={`${fieldClass(errors.sex)} px-4`}
                                    >
                                        <option value="">Select sex</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                    </select>
                                    <InputError message={errors.sex} className="mt-1 ml-1 text-red-500" />
                                </div>
                                <div>
                                    <InputLabel htmlFor="current_position_id" value="Position *" className="text-gray-700 text-xs font-semibold mb-1" />
                                    <select
                                        id="current_position_id"
                                        value={data.current_position_id}
                                        onChange={(e) => selectPosition(e.target.value)}
                                        className={`${fieldClass(errors.current_position_id)} px-4`}
                                        required
                                    >
                                        <option value="">Select position</option>
                                        <option value="T1 - T3">T1 - T3</option>
                                        <option value="T4 - T7">T4 - T7</option>
                                        <option value="MT1 - MT2">MT1 - MT2</option>
                                        <option value="MT3 - MT5">MT3 - MT5</option>
                                    </select>
                                    <InputError message={errors.current_position_id} className="mt-1 ml-1 text-red-500" />
                                </div>
                            </div>

                            {/* Career Stage + Status */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <InputLabel htmlFor="career_stage" value="Career Stage" className="text-gray-700 text-xs font-semibold mb-1" />
                                    <TextInput
                                        id="career_stage"
                                        value={data.career_stage}
                                        readOnly
                                        placeholder="Auto-filled"
                                        className={`${fieldClass(false)} px-4 bg-gray-50 text-gray-500`}
                                    />
                                </div>
                                <div>
                                    <InputLabel htmlFor="teacher_status" value="Status" className="text-gray-700 text-xs font-semibold mb-1" />
                                    <select
                                        id="teacher_status"
                                        value={data.teacher_status}
                                        onChange={(e) => setData('teacher_status', e.target.value)}
                                        className={`${fieldClass(errors.teacher_status)} px-4`}
                                    >
                                        <option value="">Select status</option>
                                        <option value="Permanent">Permanent</option>
                                        <option value="Provisioning">Provisioning</option>
                                        <option value="Volunteer/COS">Volunteer/COS</option>
                                    </select>
                                    <InputError message={errors.teacher_status} className="mt-1 ml-1 text-red-500" />
                                </div>
                            </div>

                            {/* Department */}
                            <div>
                                <InputLabel htmlFor="department" value="Department" className="text-gray-700 text-xs font-semibold mb-1" />
                                <select
                                    id="department"
                                    value={data.department}
                                    onChange={(e) => setData('department', e.target.value)}
                                    className={`${fieldClass(errors.department)} px-4`}
                                >
                                    <option value="">Select department</option>
                                    {DEPARTMENT_GROUPS.map((group) => (
                                        <optgroup key={group.label} label={group.label}>
                                            {group.options.map((dept) => (
                                                <option key={dept} value={dept}>{dept}</option>
                                            ))}
                                        </optgroup>
                                    ))}
                                </select>
                                <InputError message={errors.department} className="mt-1 ml-1 text-red-500" />
                            </div>

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="group relative w-full flex justify-center items-center gap-3 py-4 px-6 rounded-xl shadow-lg text-base font-bold text-white bg-gradient-to-r from-green-600 via-green-500 to-green-600 hover:shadow-2xl hover:shadow-green-500/30 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300"
                                >
                                    {processing ? (
                                        <>
                                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            <span>Submitting...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Create Account</span>
                                            <UserPlus className="h-5 w-5" />
                                        </>
                                    )}
                                </button>
                            </div>

                            <div className="text-center pt-2">
                                <Link href={route('login')} className="text-sm font-semibold text-green-600 hover:text-green-700 hover:underline">
                                    Already have an account? Sign in
                                </Link>
                            </div>
                        </form>

                        <div className="relative pt-6 mt-6 border-t border-gray-200">
                            <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                                <Shield className="h-4 w-4 text-green-500" />
                                <span>Protected by ISAT DMS Security</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
