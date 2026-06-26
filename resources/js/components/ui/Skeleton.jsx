export default function Skeleton({ variant = 'text', width, height, className = '', count = 1 }) {
    const baseClass = 'animate-shimmer rounded';

    const variants = {
        text: `${baseClass} h-4 w-full`,
        circular: `${baseClass} rounded-full`,
        rectangular: `${baseClass} rounded-md`,
    };

    const style = {};
    if (width) style.width = typeof width === 'number' ? `${width}px` : width;
    if (height) style.height = typeof height === 'number' ? `${height}px` : height;

    const items = Array.from({ length: count }, (_, i) => i);

    return (
        <>
            {items.map((i) => (
                <div
                    key={i}
                    className={[variants[variant] || variants.text, className].join(' ')}
                    style={i === 0 ? style : undefined}
                    aria-hidden="true"
                />
            ))}
        </>
    );
}
