import { Eye, EyeOff } from 'lucide-react';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';

// Form controls for the sign-in and registration screens, in the Admin Panel palette.

const controlBase =
    'block h-12 w-full rounded-[10px] border bg-white px-3.5 text-[15px] text-gray-900 shadow-none placeholder:text-gray-400 transition focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-yellow-300 disabled:cursor-not-allowed';

export const controlClass = (hasError) =>
    `${controlBase} ${hasError ? 'border-red-500 ring-2 ring-red-100' : 'border-border'}`;

export function FieldLabel({ htmlFor, children, optional = false }) {
    return (
        <label htmlFor={htmlFor} className="mb-1.5 flex items-baseline justify-between gap-2 text-[13px] font-semibold text-gray-900">
            <span>{children}</span>
            {optional && <span className="text-xs font-medium text-gray-500">Optional</span>}
        </label>
    );
}

export function FieldError({ message }) {
    return message ? <p className="mt-1.5 text-sm font-medium text-red-600">{message}</p> : null;
}

export const TextField = forwardRef(function TextField({ className = '', hasError = false, isFocused = false, ...props }, ref) {
    const localRef = useRef(null);
    useImperativeHandle(ref, () => ({ focus: () => localRef.current?.focus() }));

    useEffect(() => {
        if (isFocused) localRef.current?.focus();
    }, [isFocused]);

    return <input {...props} ref={localRef} className={`${controlClass(hasError)} ${className}`} />;
});

export function SelectField({ hasError = false, className = '', children, ...props }) {
    return (
        <select {...props} className={`${controlClass(hasError)} pr-10 ${className}`}>
            {children}
        </select>
    );
}

export function PasswordField({ hasError = false, ...props }) {
    const [visible, setVisible] = useState(false);

    return (
        <div className="relative">
            <input
                {...props}
                type={visible ? 'text' : 'password'}
                className={`${controlClass(hasError)} pr-12 [&::-ms-clear]:hidden [&::-ms-reveal]:hidden`}
            />
            <button
                type="button"
                onClick={() => setVisible((v) => !v)}
                aria-label={visible ? 'Hide password' : 'Show password'}
                className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-[10px] text-gray-500 transition-colors hover:text-green-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-300"
            >
                {visible ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
            </button>
        </div>
    );
}

export function SubmitButton({ processing, children, busyLabel }) {
    return (
        <button
            type="submit"
            disabled={processing}
            className="group flex h-[52px] w-full items-center justify-center gap-2.5 rounded-xl bg-green-700 text-base font-bold text-white transition-colors hover:bg-green-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
            {processing ? (
                <>
                    <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span>{busyLabel}</span>
                </>
            ) : (
                children
            )}
        </button>
    );
}
