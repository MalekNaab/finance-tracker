import React from 'react';
import './CategoryBadge.css';

const CategoryBadge = ({ category, type = 'expense' }) => {
  return (
    <span 
      className={`category-badge ${type}`}
      data-testid={`badge-category-${category.toLowerCase()}`}
    >
      {category}
    </span>
  );
};

export default CategoryBadge;
