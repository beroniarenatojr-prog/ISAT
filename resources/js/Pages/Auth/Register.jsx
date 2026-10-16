import AuthLayout from '@/Components/Auth/AuthLayout';
import { FieldError, FieldLabel, PasswordField, SelectField, SubmitButton, TextField, controlClass } from '@/Components/Auth/Fields';
import { Head, Link, useForm } from '@inertiajs/react';
import { Clock, UserPlus } from 'lucide-react';

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

function Legend({ children }) {
    return (
        <legend className="mb-4 flex flex-col gap-1.5">
            <span className="h-1 w-8 rounded-full bg-yellow-400" />
            <span className="text-base font-bold text-gray-900">{children}</span>
        </legend>
    );
}

export default function Register() {
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

    return (
        <>
            <Head title="Teacher Registration" />

            <AuthLayout
                wide
                title={
                    <>
                        Create your <span className="text-yellow-300">e-TRACES</span> account
                    </>
                }
                intro="Register once. After an administrator approves your account, you can upload MOVs and submit your IPCRF."
            >
                <div className="flex flex-col gap-7">
                    <div className="flex flex-wrap items-end justify-between gap-3">
                        <div>
                            <h2 className="text-2xl font-extrabold tracking-tight text-gray-900">Teacher registration</h2>
                            <p className="text-sm text-gray-500">
                                Already have an account?{' '}
                                <Link href={route('login')} className="font-bold text-green-700 hover:underline">
                                    Sign in
                                </Link>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3 rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm font-medium text-yellow-900">
                        <Clock className="mt-0.5 h-5 w-5 flex-none text-yellow-700" aria-hidden="true" />
                        <span>Your account needs admin approval before you can sign in. You'll be notified once it's active.</span>
                    </div>

                    <form onSubmit={submit} className="flex flex-col gap-8">
                        <fieldset className="flex flex-col gap-5">
                            <Legend>Account</Legend>

                            <div>
                                <FieldLabel htmlFor="name">Full name</FieldLabel>
                                <TextField
                                    id="name"
                                    name="name"
                                    value={data.name}
                                    autoComplete="name"
                                    isFocused={true}
                                    placeholder="Juan Dela Cruz"
                                    hasError={!!errors.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    required
                                />
                                <FieldError message={errors.name} />
                            </div>

                            <div>
                                <FieldLabel htmlFor="email">Email address</FieldLabel>
                                <TextField
                                    id="email"
                                    type="email"
                                    name="email"
                                    value={data.email}
                                    autoComplete="username"
                                    placeholder="you@example.com"
                                    hasError={!!errors.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    required
                                />
                                <FieldError message={errors.email} />
                            </div>

                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                <div>
                                    <FieldLabel htmlFor="password">Password</FieldLabel>
                                    <PasswordField
                                        id="password"
                                        name="password"
                                        value={data.password}
                                        autoComplete="new-password"
                                        placeholder="At least 8 characters"
                                        hasError={!!errors.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        required
                                    />
                                    <FieldError message={errors.password} />
                                </div>
                                <div>
                                    <FieldLabel htmlFor="password_confirmation">Confirm password</FieldLabel>
                                    <PasswordField
                                        id="password_confirmation"
                                        name="password_confirmation"
                                        value={data.password_confirmation}
                                        autoComplete="new-password"
                                        placeholder="Re-enter password"
                                        hasError={!!errors.password_confirmation}
                                        onChange={(e) => setData('password_confirmation', e.target.value)}
                                        required
                                    />
                                    <FieldError message={errors.password_confirmation} />
                                </div>
                            </div>
                        </fieldset>

                        <div className="border-t border-gray-100" aria-hidden="true" />

                        <fieldset className="flex flex-col gap-5">
                            <Legend>Teaching profile</Legend>

                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                <div>
                                    <FieldLabel htmlFor="current_position_id">Position</FieldLabel>
                                    <SelectField
                                        id="current_position_id"
                                        value={data.current_position_id}
                                        onChange={(e) => selectPosition(e.target.value)}
                                        hasError={!!errors.current_position_id}
                                        required
                                    >
                                        <option value="">Select position</option>
                                        <option value="T1 - T3">T1 - T3</option>
                                        <option value="T4 - T7">T4 - T7</option>
                                        <option value="MT1 - MT2">MT1 - MT2</option>
                                        <option value="MT3 - MT5">MT3 - MT5</option>
                                    </SelectField>
                                    <FieldError message={errors.current_position_id} />
                                </div>
                                <div>
                                    <FieldLabel htmlFor="career_stage">Career stage</FieldLabel>
                                    <input
                                        id="career_stage"
                                        value={data.career_stage}
                                        readOnly
                                        placeholder="Set from your position"
                                        className={`${controlClass(false)} border-dashed bg-[hsl(var(--canvas))] font-semibold`}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                <div>
                                    <FieldLabel htmlFor="sex" optional>Sex</FieldLabel>
                                    <SelectField id="sex" value={data.sex} onChange={(e) => setData('sex', e.target.value)} hasError={!!errors.sex}>
                                        <option value="">Select sex</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                    </SelectField>
                                    <FieldError message={errors.sex} />
                                </div>
                                <div>
                                    <FieldLabel htmlFor="teacher_status" optional>Status</FieldLabel>
                                    <SelectField
                                        id="teacher_status"
                                        value={data.teacher_status}
                                        onChange={(e) => setData('teacher_status', e.target.value)}
                                        hasError={!!errors.teacher_status}
                                    >
                                        <option value="">Select status</option>
                                        <option value="Permanent">Permanent</option>
                                        <option value="Provisioning">Provisioning</option>
                                        <option value="Volunteer/COS">Volunteer/COS</option>
                                    </SelectField>
                                    <FieldError message={errors.teacher_status} />
                                </div>
                            </div>

                            <div>
                                <FieldLabel htmlFor="department" optional>Department</FieldLabel>
                                <SelectField
                                    id="department"
                                    value={data.department}
                                    onChange={(e) => setData('department', e.target.value)}
                                    hasError={!!errors.department}
                                >
                                    <option value="">Select department</option>
                                    {DEPARTMENT_GROUPS.map((group) => (
                                        <optgroup key={group.label} label={group.label}>
                                            {group.options.map((dept) => (
                                                <option key={dept} value={dept}>{dept}</option>
                                            ))}
                                        </optgroup>
                                    ))}
                                </SelectField>
                                <FieldError message={errors.department} />
                            </div>
                        </fieldset>

                        <SubmitButton processing={processing} busyLabel="Submitting…">
                            Create my account
                            <UserPlus className="h-[18px] w-[18px]" aria-hidden="true" />
                        </SubmitButton>
                    </form>
                </div>
            </AuthLayout>
        </>
    );
}
