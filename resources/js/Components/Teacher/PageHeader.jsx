/**
 * Green header band shared by the teacher pages (IPCRF Tool, Signed IPCRF,
 * IPCRF History). Same green and yellow as the Admin Panel sidebar.
 * `children` renders as an extra row under the title (e.g. a progress bar).
 */
export default function PageHeader({ title, subtitle, action, children }) {
    return (
        <header className="relative overflow-hidden bg-sidebar text-white">
            <span className="pointer-events-none absolute -right-16 -top-24 h-60 w-60 rounded-full bg-white/10" />

            <div className="relative mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-6 sm:px-6 lg:px-12">
                <div className="flex items-center gap-4">
                    <span className="flex h-[60px] w-[60px] flex-none items-center justify-center rounded-full bg-white ring-[3px] ring-yellow-300">
                        <img src="/pictures/isat.tmp" alt="ISAT seal" className="h-[54px] w-[54px] rounded-full object-cover" />
                    </span>
                    <div className="flex flex-col gap-1">
                        <h1 className="text-2xl font-extrabold tracking-tight sm:text-[32px]">{title}</h1>
                        {subtitle && <p className="text-sm text-white/85">{subtitle}</p>}
                    </div>
                </div>
                {action}
            </div>

            {children && <div className="relative mx-auto max-w-7xl px-4 pb-6 sm:px-6 lg:px-12">{children}</div>}
        </header>
    );
}
