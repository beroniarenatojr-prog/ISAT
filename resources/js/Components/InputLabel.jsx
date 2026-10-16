export default function InputLabel({
    value,
    className = '',
    children,
    ...props
}) {
    return (
        <label
            {...props}
            className={
                `block text-[13px] font-semibold text-gray-900 ` +
                className
            }
        >
            {value ? value : children}
        </label>
    );
}
