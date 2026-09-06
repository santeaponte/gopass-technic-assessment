type WarningModalProps = {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function WarningModal({ title, message, confirmLabel, onConfirm, onCancel }: WarningModalProps) {
  return (
    <div className="warning-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onCancel()}>
      <section className="warning-modal" role="alertdialog" aria-modal="true" aria-labelledby="warning-modal-title" onMouseDown={(event) => event.stopPropagation()}>
        <span className="warning-modal-icon" aria-hidden="true">!</span>
        <h2 id="warning-modal-title">{title}</h2>
        <p>{message}</p>
        <div className="warning-modal-actions">
          <button type="button" className="secondary-button" onClick={onCancel}>Cancelar</button>
          <button type="button" className="danger-button" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </section>
    </div>
  );
}
