import { Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';

/**
 * Sign-in / registration layout in the same template as the welcome page:
 * white top bar, campus-photo green band, and a white form card that
 * overlaps the band.
 */
export default function AuthLayout({ title, intro, children, wide = false }) {
    return (
        <div className="flex min-h-screen flex-col bg-[hsl(var(--canvas))] text-foreground">
            <header className="border-b border-border bg-white">
                <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
                    <Link
                        href="/"
                        className="flex items-center gap-2.5 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
                    >
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white ring-2 ring-yellow-300">
                            <img src="/pictures/isat.tmp" alt="ISAT seal" className="h-9 w-9 rounded-full object-cover" />
                        </span>
                        <span className="flex flex-col leading-tight">
                            <strong className="text-[17px] text-gray-900">ISAT e-TRACES</strong>
                            <span className="text-[11px] font-semibold text-gray-500">IPCRF Portal</span>
                        </span>
                    </Link>
                    <Link
                        href="/"
                        className="inline-flex h-10 items-center gap-1.5 rounded-[10px] px-3 text-sm font-semibold text-gray-600 hover:bg-green-50 hover:text-green-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
                    >
                        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                        Back to home
                    </Link>
                </div>
            </header>

            <section
                className="bg-cover bg-center px-4 pb-36 pt-12 text-white sm:px-6"
                style={{ backgroundImage: 'linear-gradient(180deg, rgba(15,59,35,0.88), rgba(20,83,45,0.82)), url(/pictures/pic2.jpg)' }}
            >
                <div className="mx-auto flex max-w-3xl flex-col items-center gap-3 text-center">
                    <span className="h-1 w-12 rounded-full bg-yellow-400" />
                    <h1 className="text-3xl font-extrabold leading-tight tracking-tight [text-wrap:balance] sm:text-[44px]">{title}</h1>
                    {intro && <p className="max-w-xl text-base leading-relaxed text-white/90 sm:text-lg">{intro}</p>}
                </div>
            </section>

            <main className="relative -mt-24 flex-1 px-4 pb-14 sm:px-6">
                <div
                    className={`mx-auto w-full rounded-3xl border border-border bg-white p-6 shadow-[0_14px_32px_-16px_rgba(20,83,45,0.35)] sm:p-9 ${
                        wide ? 'max-w-[680px]' : 'max-w-[480px]'
                    }`}
                >
                    {children}
                </div>
            </main>

            <footer className="border-t-4 border-yellow-400 bg-green-900 px-6 py-5 text-center text-xs text-white/75">
                © {new Date().getFullYear()} ISAT e-TRACES · Isabela School of Arts and Trades
            </footer>
        </div>
    );
}
