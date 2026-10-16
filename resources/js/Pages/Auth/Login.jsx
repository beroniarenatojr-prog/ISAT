import AuthLayout from '@/Components/Auth/AuthLayout';
import { FieldError, FieldLabel, PasswordField, SubmitButton, TextField } from '@/Components/Auth/Fields';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

export default function Login({ status, canResetPassword, canRegister }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <>
            <Head title="Log in" />

            <AuthLayout
                title={
                    <>
                        Good day, <span className="text-yellow-300">teacher</span>
                    </>
                }
                intro="Sign in to pick up your IPCRF where you left off: MOVs, ratings and your signed copy."
            >
                <div className="flex flex-col gap-6">
                    <div className="flex items-center gap-3">
                        <span className="flex h-12 w-12 flex-none items-center justify-center rounded-full bg-white ring-2 ring-yellow-300">
                            <img src="/pictures/isat.tmp" alt="" className="h-11 w-11 rounded-full object-cover" />
                        </span>
                        <div>
                            <h2 className="text-2xl font-extrabold tracking-tight text-gray-900">Sign in</h2>
                            <p className="text-sm text-gray-500">Use the account your administrator approved.</p>
                        </div>
                    </div>

                    {status && (
                        <div role="status" className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-800">
                            <CheckCircle2 className="mt-0.5 h-5 w-5 flex-none" aria-hidden="true" />
                            <span>{status}</span>
                        </div>
                    )}

                    <form onSubmit={submit} className="flex flex-col gap-5">
                        <div>
                            <FieldLabel htmlFor="email">Email address</FieldLabel>
                            <TextField
                                id="email"
                                type="email"
                                name="email"
                                value={data.email}
                                autoComplete="username"
                                isFocused={true}
                                placeholder="you@example.com"
                                hasError={!!errors.email}
                                onChange={(e) => setData('email', e.target.value)}
                            />
                            <FieldError message={errors.email} />
                        </div>

                        <div>
                            <div className="flex items-baseline justify-between gap-3">
                                <FieldLabel htmlFor="password">Password</FieldLabel>
                                {canResetPassword && (
                                    <Link
                                        href={route('password.request')}
                                        className="mb-1.5 rounded text-[13px] font-semibold text-green-700 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-300"
                                    >
                                        Forgot password?
                                    </Link>
                                )}
                            </div>
                            <PasswordField
                                id="password"
                                name="password"
                                value={data.password}
                                autoComplete="current-password"
                                placeholder="Your password"
                                hasError={!!errors.password}
                                onChange={(e) => setData('password', e.target.value)}
                            />
                            <FieldError message={errors.password} />
                        </div>

                        {/* There is deliberately no "Remember me": sessions end when
                            the browser closes, so the next visit must sign in again. */}

                        <div className="pt-1">
                            <SubmitButton processing={processing} busyLabel="Signing in…">
                                Sign in to e-TRACES
                                <ArrowRight className="h-[18px] w-[18px] transition-transform group-hover:translate-x-1" aria-hidden="true" />
                            </SubmitButton>
                        </div>
                    </form>

                    {canRegister && (
                        <div className="flex flex-col gap-1 rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3.5 text-sm">
                            <strong className="text-yellow-900">New teacher?</strong>
                            <span className="text-yellow-800">
                                <Link href={route('register')} className="font-bold text-green-700 hover:underline">
                                    Create your account
                                </Link>
                                . An administrator approves it before you can sign in.
                            </span>
                        </div>
                    )}
                </div>
            </AuthLayout>
        </>
    );
}
