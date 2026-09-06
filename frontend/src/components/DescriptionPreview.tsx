import { useEffect, useState } from 'react';

type DescriptionPreviewProps = {
  description: string | null | undefined;
  title: string;
  className?: string;
  emptyLabel?: string;
};

export function DescriptionPreview({
  description,
  title,
  className = '',
  emptyLabel = 'Sin descripción.',
}: DescriptionPreviewProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isLongDescription = Boolean(description && description.length > 240);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  return (
    <>
      <span className={`description-preview ${className}`.trim()}>
        <span className="description-preview-text">{description || emptyLabel}</span>
        {isLongDescription && (
          <span
            className="description-read-more"
            role="button"
            tabIndex={0}
            onClick={(event) => {
              event.stopPropagation();
              setIsOpen(true);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                event.stopPropagation();
                setIsOpen(true);
              }
            }}
          >
            Leer más
          </span>
        )}
      </span>
      {isOpen && description && (
        <div className="description-modal-backdrop" role="presentation" onMouseDown={() => setIsOpen(false)}>
          <section
            className="description-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby={`description-title-${title}`}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button type="button" className="project-modal-close" onClick={() => setIsOpen(false)} aria-label="Cerrar descripción">
              ×
            </button>
            <p className="projects-kicker">Descripción</p>
            <h2 id={`description-title-${title}`}>{title}</h2>
            <p className="description-modal-text">{description}</p>
          </section>
        </div>
      )}
    </>
  );
}
