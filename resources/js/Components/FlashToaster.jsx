import { usePage } from '@inertiajs/react';
import { useEffect, useRef } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';

/**
 * Collapse identical toasts fired close together into one - e.g. a page's
 * client-side `toast.success('Saved!')` and the matching server flash that
 * <FlashToaster/> also raises. Runs once at module load.
 */
(function dedupeToasts() {
    const WINDOW_MS = 2000;
    ['success', 'error', 'warning', 'info', 'loading', 'message'].forEach((type) => {
        const original = toast[type];
        if (typeof original !== 'function' || original.__deduped) return;

        const seen = new Map();
        const wrapped = (message, options = {}) => {
            const text = typeof message === 'string' ? message : null;
            if (text && !options.id) {
                const key = `${type}::${text}`;
                const now = Date.now();
                if (seen.get(key) > now - WINDOW_MS) return undefined;
                seen.set(key, now);
            }
            return original(message, options);
        };
        wrapped.__deduped = true;
        toast[type] = wrapped;
    });
})();

/**
 * The single, app-wide toast region. Mounted once in app.jsx.
 *
 * Every server action that redirects with ->with('success'|'error'|...) becomes
 * a toast here, so no page needs its own <Toaster/> or flash handling.
 * Client-side `toast.*()` calls anywhere in the app render here too.
 */
export default function FlashToaster() {
    const flash = usePage().props.flash || {};
    const lastSignature = useRef('');

    useEffect(() => {
        const messages = [
            ['success', flash.success],
            ['error', flash.error],
            ['warning', flash.warning],
            ['info', flash.info || flash.message],
        ].filter(([, msg]) => Boolean(msg));

        if (messages.length === 0) return;

        const signature = JSON.stringify(messages);
        if (signature === lastSignature.current) return;
        lastSignature.current = signature;

        messages.forEach(([type, msg]) => {
            (toast[type] || toast)(msg);
        });
    }, [flash]);

    return <Toaster richColors closeButton position="top-right" />;
}
