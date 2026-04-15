import React from 'react';
import './EmptyState.css';

const EmptyState = ({ icon: Icon, title, description, action }) => {
  return (
    <div className="empty-state" data-testid="empty-state">
      <div className="empty-icon-wrapper">
        <Icon size={32} />
      </div>
      <h3 className="empty-title">{title}</h3>
      <p className="empty-description">{description}</p>
      {action && (
        <div className="empty-action">
          {action}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
