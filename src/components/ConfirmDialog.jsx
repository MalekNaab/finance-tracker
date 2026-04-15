import React from 'react';
import './ConfirmDialog.css';

const ConfirmDialog = ({ isOpen, title, message, onConfirm, onCancel, confirmLabel = 'Delete', dangerous = true }) => {
  if (!isOpen) return null;

  return (
    <div className="confirm-backdrop" onClick={onCancel} data-testid="confirm-dialog-backdrop">
      <div className="confirm-dialog" onClick={(e) => e.stopPropagation()} data-testid="confirm-dialog">
        <h3 className="confirm-title">{title}</h3>
        <p className="confirm-message">{message}</p>
        <div className="confirm-actions">
          <button className="btn btn-secondary" onClick={onCancel} data-testid="button-confirm-cancel">
            Cancel
          </button>
          <button
            className={`btn ${dangerous ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
            data-testid="button-confirm-ok"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
