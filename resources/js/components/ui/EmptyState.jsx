import Icon from './Icon';

export default function EmptyState({ icon, title, description, action, className = '' }) {
    return (
        <div className={['flex flex-col items-center justify-center px-6 py-16 text-center', className].join(' ')}>
            <div className="mb-4 text-fg-tertiary">
                {icon || <Icon name="Inbox" size={48} />}
            </div>
            <h3 className="text-title font-semibold text-fg-primary">{title}</h3>
            {description && (
                <p className="mt-2 max-w-sm text-body text-fg-secondary">{description}</p>
            )}
            {action && (
                <div className="mt-6">{action}</div>
            )}
        </div>
    );
}
