import { Head, Link } from '@inertiajs/react';
import { ArrowRight, LogIn, LayoutDashboard } from 'lucide-react';

const STEPS = [
    { title: 'Upload your MOVs', body: 'One PDF or more as evidence for each objective.', note: 'PDF only, up to 10 MB', noteClass: 'bg-green-50 text-green-700' },
    { title: 'Answer the questionnaire', body: 'The IPCRF self-assessment opens once every MOV is in.', note: 'About 15–20 minutes', noteClass: 'bg-green-50 text-green-700' },
    { title: 'Get rated', body: 'Your School Head rates each MOV from 1 to 5.', note: 'Updated after each review', noteClass: 'bg-yellow-50 text-yellow-700' },
    { title: 'File the signed IPCRF', body: 'Upload the signed copy. It joins your history.', note: 'One per school year', noteClass: 'bg-green-50 text-green-700' },
];

const CAMPUS = [
    { src: '/pictures/pic1.jpg', alt: 'ISAT main gate on the national road', caption: 'Main gate · Calamagui 2nd' },
    { src: '/pictures/pic4.jpg', alt: 'Corridor of the academic building with green doors', caption: 'Academic building' },
    { src: '/pictures/pic6.jpg', alt: 'Campus garden with a nipa hut, seen from above', caption: 'Campus garden' },
];

const CORE_VALUES = ['Maka-Diyos', 'Maka-tao', 'Makakalikasan', 'Makabansa'];

const focusRing = 'focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 focus-visible:ring-offset-2';

export default function Welcome({ auth, canRegister, activeSchoolYear }) {
    const user = auth?.user;
    const schoolYear = activeSchoolYear ? activeSchoolYear.replace(/\s*-\s*/, '–') : null;
    const primaryHref = user ? route('dashboard') : route('login');

    return (
        <>
            <Head title="Welcome to ISAT e-TRACES" />

            <div className="min-h-screen bg-[hsl(var(--canvas))] text-foreground">
                {/* Navigation */}
                <header className="sticky top-0 z-30 border-b border-border bg-white/95 backdrop-blur">
                    <nav aria-label="Main" className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-3 sm:px-6">
                        <Link href="/" className={`flex items-center gap-2.5 rounded-lg ${focusRing}`}>
                            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white ring-2 ring-yellow-300">
                                <img src="/pictures/isat.tmp" alt="ISAT seal" className="h-9 w-9 rounded-full object-cover" />
                            </span>
                            <span className="flex flex-col leading-tight">
                                <strong className="text-[17px] text-gray-900">ISAT e-TRACES</strong>
                                <span className="text-[11px] font-semibold text-gray-500">IPCRF Portal</span>
                            </span>
                        </Link>
                        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-semibold">
                            <a href="#how" className="hidden text-gray-700 hover:text-green-700 md:inline">How it works</a>
                            <a href="#about" className="hidden text-gray-700 hover:text-green-700 md:inline">About ISAT</a>
                            {user ? (
                                <Link href={route('dashboard')} className={`inline-flex h-[42px] items-center rounded-[10px] bg-green-700 px-[18px] text-white hover:bg-green-800 ${focusRing}`}>
                                    Dashboard
                                </Link>
                            ) : (
                                <>
                                    {canRegister && (
                                        <Link href={route('register')} className={`inline-flex h-[42px] items-center rounded-[10px] border border-border px-4 text-green-700 hover:border-green-700 ${focusRing}`}>
                                            Create account
                                        </Link>
                                    )}
                                    <Link href={route('login')} className={`inline-flex h-[42px] items-center rounded-[10px] bg-green-700 px-[18px] text-white hover:bg-green-800 ${focusRing}`}>
                                        Sign in
                                    </Link>
                                </>
                            )}
                        </div>
                    </nav>
                </header>

                {/* Hero - campus photo behind the welcome area only */}
                <section
                    className="bg-cover bg-center px-4 pb-40 pt-16 text-white sm:px-6"
                    style={{ backgroundImage: 'linear-gradient(180deg, rgba(15,59,35,0.88), rgba(20,83,45,0.82)), url(/pictures/pic2.jpg)' }}
                >
                    <div className="mx-auto flex max-w-5xl flex-col items-center gap-[18px] text-center">
                        <span className="flex h-[88px] w-[88px] items-center justify-center rounded-full bg-white ring-[3px] ring-yellow-300">
                            <img src="/pictures/isat.tmp" alt="" className="h-20 w-20 rounded-full object-cover" />
                        </span>
                        <span className="inline-flex items-center rounded-full border border-yellow-300/60 bg-yellow-300/10 px-[18px] py-2 text-[13px] font-bold text-yellow-300">
                            Isabela School of Arts and Trades · Est. 1908
                        </span>
                        <h1 className="text-4xl font-extrabold leading-[1.08] tracking-tight [text-wrap:balance] sm:text-5xl lg:text-[64px]">
                            Your IPCRF, from <span className="text-yellow-300">upload</span> to <span className="text-yellow-300">signed</span>
                        </h1>
                        <p className="max-w-2xl text-lg leading-relaxed text-white/90">
                            Upload your MOVs, follow your School Head's rating, and file your signed IPCRF. One portal for every teacher at ISAT.
                        </p>
                    </div>
                </section>

                <main className="relative mx-auto -mt-[120px] flex max-w-5xl flex-col gap-8 px-4 pb-16 sm:px-6">
                    {/* Sign-in card */}
                    <Link
                        href={primaryHref}
                        className="group relative flex flex-wrap items-center gap-7 overflow-hidden rounded-3xl bg-sidebar p-7 text-white shadow-[0_14px_32px_-16px_rgba(20,83,45,0.5)] transition hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 focus-visible:ring-offset-2 sm:p-11"
                    >
                        <span className="pointer-events-none absolute -right-16 -top-20 h-60 w-60 rounded-full bg-white/10" />
                        <span className="pointer-events-none absolute -bottom-28 right-32 h-52 w-52 rounded-full bg-yellow-300/20" />
                        <span className="relative flex h-24 w-24 flex-none items-center justify-center rounded-[22px] bg-white/15">
                            {user ? <LayoutDashboard className="h-11 w-11" aria-hidden="true" /> : <LogIn className="h-11 w-11" aria-hidden="true" />}
                        </span>
                        <span className="relative flex min-w-0 flex-[1_1_340px] flex-col gap-2">
                            <span className="h-1 w-12 rounded-full bg-yellow-400" />
                            <span className="text-3xl font-extrabold tracking-tight sm:text-[40px] sm:leading-tight">
                                {user ? 'Go to your dashboard' : 'Sign in to e-TRACES'}
                            </span>
                            <span className="font-semibold text-white/90">
                                {user ? `Welcome back, ${user.name.split(' ')[0]}` : 'Pick up your IPCRF where you left off'}
                            </span>
                            {schoolYear && (
                                <span className="self-start rounded-full bg-white/15 px-3 py-1 text-[13px]">Active cycle · SY {schoolYear}</span>
                            )}
                        </span>
                        <span className="relative inline-flex h-14 items-center gap-2.5 rounded-2xl bg-yellow-400 px-7 text-[17px] font-extrabold text-green-900 transition-colors group-hover:bg-yellow-300">
                            {user ? 'Open dashboard' : 'Sign in'}
                            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                        </span>
                    </Link>
                    {!user && canRegister && (
                        <p className="-mt-4 text-center text-sm text-gray-500">
                            New teacher?{' '}
                            <Link href={route('register')} className="font-bold text-green-700 hover:underline">
                                Create your account
                            </Link>
                            . An administrator approves it before you can sign in.
                        </p>
                    )}

                    {/* How it works */}
                    <div id="how" className="flex scroll-mt-24 flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-white px-6 py-5">
                        <span className="flex flex-col gap-1.5">
                            <span className="h-1 w-10 rounded-full bg-yellow-400" />
                            <strong className="text-xl text-gray-900">How it works</strong>
                            <span className="text-sm text-gray-500">Four steps each school year</span>
                        </span>
                        <span className="rounded-full bg-green-50 px-3.5 py-1.5 text-[13px] font-bold text-green-700">4 steps</span>
                    </div>
                    <ol className="grid grid-cols-1 gap-6 pt-2 sm:grid-cols-2 lg:grid-cols-4">
                        {STEPS.map((step, i) => (
                            <li
                                key={step.title}
                                className="relative flex flex-col gap-2 rounded-2xl border border-border bg-white px-5 pb-5 pt-7 text-center transition hover:-translate-y-0.5 hover:border-green-200 hover:shadow-md"
                            >
                                <span className="absolute -left-3 -top-3.5 flex h-10 w-10 items-center justify-center rounded-full bg-green-700 font-extrabold text-white ring-4 ring-[hsl(var(--canvas))]">
                                    {i + 1}
                                </span>
                                <strong className="text-base text-gray-900">{step.title}</strong>
                                <span className="text-sm leading-relaxed text-gray-600">{step.body}</span>
                                <span className={`mt-auto rounded-lg p-2 text-xs font-semibold ${step.noteClass}`}>{step.note}</span>
                            </li>
                        ))}
                    </ol>

                    {/* Campus */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        {CAMPUS.map((photo) => (
                            <figure key={photo.src} className="flex flex-col gap-2">
                                <img src={photo.src} alt={photo.alt} loading="lazy" className="aspect-[4/3] w-full rounded-[14px] object-cover" />
                                <figcaption className="text-[13px] text-gray-500">{photo.caption}</figcaption>
                            </figure>
                        ))}
                    </div>

                    {/* About */}
                    <section id="about" className="flex scroll-mt-24 flex-col gap-5 rounded-2xl border border-border bg-white p-6 sm:p-8">
                        <h2 className="text-center text-[22px] font-bold text-gray-900">About ISAT</h2>
                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                            <div className="flex flex-col gap-2 rounded-xl bg-green-50 p-5">
                                <strong className="text-green-800">Vision</strong>
                                <span className="text-sm leading-relaxed text-gray-700">
                                    To produce Filipinos who passionately love their country, realize their full potential, and contribute to nation-building through a continuously improving, learner-centered environment.
                                </span>
                            </div>
                            <div className="flex flex-col gap-2 rounded-xl bg-yellow-50 p-5">
                                <strong className="text-yellow-700">Mission</strong>
                                <span className="text-sm leading-relaxed text-gray-700">
                                    To provide quality, equitable, and culture-based basic education in a safe, motivating environment, supported by nurturing teachers and active stakeholder involvement.
                                </span>
                            </div>
                        </div>
                        <div className="flex flex-wrap justify-center gap-2">
                            {CORE_VALUES.map((value) => (
                                <span key={value} className="rounded-full bg-sidebar px-4 py-2 text-sm font-bold text-white">{value}</span>
                            ))}
                        </div>
                    </section>

                    <div className="mx-auto flex w-full max-w-2xl flex-col gap-2 rounded-2xl border border-border bg-white p-6 text-center">
                        <strong className="text-lg text-gray-900">Need help?</strong>
                        <span className="text-sm text-gray-600">
                            Ask your School Head or IPCRF coordinator about your account, objectives or acceptable evidence.
                        </span>
                    </div>
                </main>

                <footer className="border-t-4 border-yellow-400 bg-green-900 px-6 py-7 text-center text-white">
                    <p className="mb-1.5 text-sm font-semibold">© {new Date().getFullYear()} ISAT e-TRACES</p>
                    <p className="mb-3 text-xs text-white/70">Isabela School of Arts and Trades · Calamagui 2nd, City of Ilagan, Isabela</p>
                    <div className="flex flex-wrap justify-center gap-x-5 gap-y-1 text-xs font-semibold">
                        <Link href={route('vision')} className="text-white/85 hover:text-yellow-300">Vision</Link>
                        <Link href={route('mission')} className="text-white/85 hover:text-yellow-300">Mission</Link>
                        <Link href={route('core-values')} className="text-white/85 hover:text-yellow-300">Core Values</Link>
                    </div>
                </footer>
            </div>
        </>
    );
}
