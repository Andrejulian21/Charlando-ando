export default function MeshGradient({ className = '' }) {
    return (
        <div
            aria-hidden="true"
            className={`pointer-events-none fixed inset-0 z-0 ${className}`}
            style={{
                background: `
                    radial-gradient(ellipse 600px 400px at 20% 30%, rgba(108,93,211,0.15) 0%, transparent 70%),
                    radial-gradient(ellipse 500px 350px at 80% 70%, rgba(52,211,153,0.08) 0%, transparent 70%),
                    #050505
                `,
            }}
        />
    );
}
