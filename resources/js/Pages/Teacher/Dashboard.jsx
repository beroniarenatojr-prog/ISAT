import { Head, Link } from '@inertiajs/react';
import TeacherLayout from '@/Layouts/TeacherLayout';
import DeadlineReminder from '@/Components/DeadlineReminder';
import { FileText, ArrowRight, Target, TrendingUp, Award, CheckCircle2, Clock, Star } from 'lucide-react';

const STEPS = [
    {
        title: 'Open IPCRF Tool',
        body: 'Use the Open IPCRF Tool button above to see your objectives.',
        note: 'Takes 2 seconds',
        noteClass: 'bg-green-50 text-green-700',
    },
    {
        title: 'Upload Evidence',
        body: 'Submit your documents and evidence for each objective.',
        note: 'PDF only, up to 10 MB',
        noteClass: 'bg-green-50 text-green-700',
    },
    {
        title: 'Track Progress',
        body: 'See your ratings and School Head remarks as they come in.',
        note: 'Updated after each review',
        noteClass: 'bg-yellow-50 text-yellow-700',
    },
];

const REASONS = [
    { icon: TrendingUp, title: 'Track Growth', body: 'Monitor your professional development and see your progress as it happens', chip: 'bg-green-50 text-green-700' },
    { icon: Clock, title: 'Save Time', body: 'Streamlined submission process makes documentation quick and easy', chip: 'bg-green-50 text-green-700' },
    { icon: Award, title: 'Achieve Excellence', body: 'Reach your professional goals with structured performance management', chip: 'bg-yellow-50 text-yellow-700' },
];

function daysLeftLabel(days) {
    if (days === null || days === undefined) return null;
    if (days < 0) return 'Window closed';
    if (days === 0) return 'Closes today';
    return days === 1 ? '1 day left' : `${days} days left`;
}

function StatCard({ icon: Icon, iconClass, pill, pillClass, value, label, note }) {
    return (
        <div className="flex flex-col gap-1 rounded-xl border border-border bg-white p-5 transition hover:-translate-y-0.5 hover:border-green-200 hover:shadow-md">
            <div className="mb-3 flex items-center justify-between">
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconClass}`}>
                    <Icon className="h-5 w-5" />
                </span>
                {pill && <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${pillClass}`}>{pill}</span>}
            </div>
            <span className="text-3xl font-bold tracking-tight text-gray-900">{value}</span>
            <span className="text-sm font-semibold text-gray-700">{label}</span>
            <span className="text-xs text-gray-500">{note}</span>
        </div>
    );
}

export default function TeacherDashboard({ user, activeConfig, submissions, signedIpcrf, stats }) {
    const firstName = user.name.split(' ')[0];
    const tier = [user.position_range, user.position_career_stage].filter(Boolean).join(' · ');

    const total = stats?.objectives_total ?? 0;
    const withEvidence = stats?.objectives_with_evidence ?? 0;
    const percent = total ? Math.round((withEvidence / total) * 100) : 0;
    const rated = stats?.rated_count ?? 0;
    const filesSubmitted = stats?.files_submitted ?? 0;
    const waiting = Math.max(filesSubmitted - rated, 0);
    const daysLabel = daysLeftLabel(stats?.days_left);

    const hasFinal = stats?.final_rating !== null && stats?.final_rating !== undefined;
    const ratingValue = hasFinal
        ? Number(stats.final_rating).toFixed(3)
        : stats?.average_rating !== null && stats?.average_rating !== undefined
            ? Number(stats.average_rating).toFixed(3)
            : '—';

    return (
        <TeacherLayout user={user}>
            <Head title="Teacher Dashboard" />

            <DeadlineReminder activeConfig={activeConfig} submissions={submissions} signedIpcrf={signedIpcrf} />

            <div className="min-h-screen bg-[hsl(var(--canvas))] text-foreground">
                {/* Welcome area - the campus photo stays behind this part only */}
                <section
                    className="bg-cover bg-center px-6 pb-[150px] pt-14 text-white"
                    style={{
                        backgroundImage:
                            'linear-gradient(180deg, rgba(15,59,35,0.88), rgba(20,83,45,0.82)), url(/pictures/pic2.jpg)',
                    }}
                >
                    <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 text-center">
                        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-white ring-[3px] ring-yellow-300">
                            <img src="/pictures/isat.tmp" alt="ISAT seal" className="h-[72px] w-[72px] rounded-full object-cover" />
                        </span>
                        <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                            Good Day, <span className="text-yellow-300">{firstName}</span>
                        </h1>
                        {tier && (
                            <div className="inline-flex items-center gap-3 rounded-full border border-yellow-300/60 bg-yellow-300/10 px-5 py-2.5 text-left">
                                <Star className="h-5 w-5 fill-yellow-300 text-yellow-300" aria-hidden="true" />
                                <span className="flex flex-col">
                                    <span className="text-[11px] font-semibold uppercase tracking-wider text-yellow-100">Your Position Tier</span>
                                    <span className="text-base font-bold text-yellow-300 sm:text-[17px]">{tier}</span>
                                </span>
                            </div>
                        )}
                        <p className="text-lg font-medium text-white/90">Your journey to excellence starts here. Let's make today count.</p>
                    </div>
                </section>

                <div className="relative mx-auto -mt-[110px] flex max-w-5xl flex-col gap-8 px-6 pb-16">
                    {/* IPCRF card */}
                    <Link
                        href={route('teacher.ipcrf')}
                        className="group relative flex flex-wrap items-center gap-7 overflow-hidden rounded-3xl bg-sidebar p-7 text-white shadow-[0_14px_32px_-16px_rgba(20,83,45,0.5)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-16px_rgba(20,83,45,0.55)] focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 focus-visible:ring-offset-2 sm:p-11"
                    >
                        <span className="pointer-events-none absolute -right-16 -top-20 h-60 w-60 rounded-full bg-white/10" />
                        <span className="pointer-events-none absolute -bottom-28 right-32 h-52 w-52 rounded-full bg-yellow-300/20" />

                        <span className="relative flex h-24 w-24 flex-none items-center justify-center rounded-[22px] bg-white/15">
                            <FileText className="h-11 w-11" aria-hidden="true" />
                        </span>

                        <span className="relative flex min-w-0 flex-[1_1_340px] flex-col gap-2">
                            <span className="h-1 w-12 rounded-full bg-yellow-400" />
                            <span className="text-3xl font-extrabold tracking-tight sm:text-[42px] sm:leading-tight">IPCRF Management</span>
                            <span className="font-semibold text-white/90">Your Professional Development Dashboard</span>
                            {tier && (
                                <span className="self-start rounded-full bg-white/15 px-3 py-1 text-[13px]">
                                    Using: {user.position_range}
                                    {user.position_career_stage ? ` (${user.position_career_stage})` : ''} IPCRF Form
                                </span>
                            )}
                            {stats ? (
                                <span className="mt-2 flex max-w-[460px] flex-col gap-1.5">
                                    <span className="flex justify-between gap-3 text-[13px] text-white/90">
                                        <span>
                                            {withEvidence} of {total} objectives have evidence
                                        </span>
                                        {daysLabel && <strong className="text-yellow-300">{daysLabel}</strong>}
                                    </span>
                                    <span className="h-2 overflow-hidden rounded-full bg-white/20">
                                        <span className="block h-full rounded-full bg-yellow-400" style={{ width: `${percent}%` }} />
                                    </span>
                                </span>
                            ) : (
                                <span className="mt-2 text-[13px] text-white/85">No active IPCRF configuration yet.</span>
                            )}
                        </span>

                        <span className="relative inline-flex h-14 items-center gap-2.5 rounded-2xl bg-yellow-400 px-7 text-[17px] font-extrabold text-green-900 transition-colors group-hover:bg-yellow-300">
                            Open IPCRF Tool
                            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                        </span>
                    </Link>

                    {/* Quick start */}
                    <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-white px-6 py-5">
                        <span className="flex flex-col gap-1.5">
                            <span className="h-1 w-10 rounded-full bg-yellow-400" />
                            <strong className="text-xl text-gray-900">Quick Start Guide</strong>
                            <span className="text-sm text-gray-500">Follow these simple steps to get started</span>
                        </span>
                        <span className="rounded-full bg-green-50 px-3.5 py-1.5 text-[13px] font-bold text-green-700">3 Easy Steps</span>
                    </div>

                    <div className="grid grid-cols-1 gap-6 pt-2 md:grid-cols-3">
                        {STEPS.map((step, i) => (
                            <div
                                key={step.title}
                                className="relative flex flex-col gap-2.5 rounded-2xl border border-border bg-white px-5 pb-5 pt-7 text-center transition hover:-translate-y-0.5 hover:border-green-200 hover:shadow-md"
                            >
                                <span className="absolute -left-3 -top-3.5 flex h-10 w-10 items-center justify-center rounded-full bg-green-700 text-[17px] font-extrabold text-white ring-4 ring-[hsl(var(--canvas))]">
                                    {i + 1}
                                </span>
                                <strong className="text-[17px] text-gray-900">{step.title}</strong>
                                <span className="text-sm leading-relaxed text-gray-600">{step.body}</span>
                                <span className={`rounded-lg p-2 text-xs font-semibold ${step.noteClass}`}>{step.note}</span>
                            </div>
                        ))}
                    </div>

                    {/* Performance overview */}
                    <h2 className="mt-2 text-center text-2xl font-bold text-gray-900">Your Performance Overview</h2>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <StatCard
                            icon={TrendingUp}
                            iconClass="bg-yellow-50 text-yellow-700"
                            pill={hasFinal ? stats.performance_level : rated ? `${rated} rated` : 'Not rated yet'}
                            pillClass="bg-gray-100 text-gray-500"
                            value={ratingValue}
                            label={hasFinal ? 'Final rating' : 'Current rating'}
                            note={
                                hasFinal
                                    ? `Final rating for SY ${activeConfig?.school_year}`
                                    : rated
                                        ? 'Average of School Head ratings so far'
                                        : 'Ratings appear after your School Head reviews a file'
                            }
                        />
                        <StatCard
                            icon={CheckCircle2}
                            iconClass="bg-green-50 text-green-700"
                            pill={total ? `${percent}%` : null}
                            pillClass="bg-green-50 text-green-700"
                            value={filesSubmitted}
                            label="Files submitted"
                            note={filesSubmitted ? `${rated} rated · ${waiting} waiting for review` : 'No files uploaded yet'}
                        />
                        <StatCard
                            icon={Target}
                            iconClass="bg-green-50 text-green-700"
                            pill={activeConfig?.school_year ? `SY ${activeConfig.school_year}` : null}
                            pillClass="bg-gray-100 text-gray-500"
                            value={total}
                            label="Objectives this year"
                            note={
                                !total
                                    ? 'Set by your IPCRF configuration'
                                    : total - withEvidence > 0
                                        ? `${total - withEvidence} still need evidence`
                                        : 'All have evidence'
                            }
                        />
                    </div>

                    {/* Why use */}
                    <div className="flex flex-col gap-6 rounded-2xl border border-border bg-white p-8">
                        <h2 className="text-center text-[22px] font-bold text-gray-900">Why Use the IPCRF Tool?</h2>
                        <div className="grid grid-cols-1 gap-6 text-center md:grid-cols-3">
                            {REASONS.map(({ icon: Icon, title, body, chip }) => (
                                <div key={title} className="flex flex-col items-center gap-2">
                                    <span className={`flex h-12 w-12 items-center justify-center rounded-[14px] ${chip}`}>
                                        <Icon className="h-[22px] w-[22px]" aria-hidden="true" />
                                    </span>
                                    <strong className="text-gray-900">{title}</strong>
                                    <span className="text-sm text-gray-600">{body}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Help */}
                    <div className="mx-auto flex w-full max-w-2xl flex-col gap-2 rounded-2xl border border-border bg-white p-6 text-center">
                        <strong className="text-lg text-gray-900">Need Help Getting Started?</strong>
                        <span className="text-sm leading-relaxed text-gray-600">
                            Our administrators are here to support you every step of the way. Don't hesitate to reach out if you have questions.
                        </span>
                        <span className="text-sm font-bold text-green-700">Contact your administrator for guidance</span>
                    </div>
                </div>

                <footer className="border-t-4 border-yellow-400 bg-green-900 px-6 py-7 text-center text-white">
                    <p className="mb-1.5 text-sm font-semibold">© {new Date().getFullYear()} ISAT e-TRACES</p>
                    <p className="text-xs text-white/70">Isabela School of Arts and Trades · Empowering educators through excellence</p>
                </footer>
            </div>
        </TeacherLayout>
    );
}
