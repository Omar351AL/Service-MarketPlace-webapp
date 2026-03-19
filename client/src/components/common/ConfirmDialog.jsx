import { createPortal } from 'react-dom';
import { useEffect } from 'react';

export const ConfirmDialog = ({
  isOpen,
  title,
  description,
  confirmLabel,
  cancelLabel,
  isConfirming = false,
  onConfirm,
  onCancel
}) => {
  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleEscape = (event) => {
      if (event.key === 'Escape' && !isConfirming) {
        onCancel();
      }
    };

    document.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isConfirming, isOpen, onCancel]);

  if (!isOpen) {
    return null;
  }

  return createPortal(
    <div
      className="dialog-layer"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isConfirming) {
          onCancel();
        }
      }}
    >
      <div className="dialog-backdrop" aria-hidden="true" />

      <div
        className="dialog-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="dialog-card__body">
          <h2 id="confirm-dialog-title">{title}</h2>
          <p id="confirm-dialog-description">{description}</p>
        </div>

        <div className="dialog-card__actions">
          <button
            type="button"
            className="ghost-button"
            onClick={onCancel}
            disabled={isConfirming}
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            className="button"
            onClick={onConfirm}
            disabled={isConfirming}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
