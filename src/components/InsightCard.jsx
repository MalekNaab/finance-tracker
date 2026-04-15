import React from 'react';
import { TrendingUp, TrendingDown, Minus, Tag, PieChart } from 'lucide-react';
import './InsightCard.css';

const InsightCard = ({ type, text, value, currency }) => {
  const getIcon = () => {
    switch (type) {
      case 'up': return <TrendingUp size={18} />;
      case 'down': return <TrendingDown size={18} />;
      case 'flat': return <Minus size={18} />;
      case 'category': return <Tag size={18} />;
      case 'budget': return <PieChart size={18} />;
      default: return <Tag size={18} />;
    }
  };

  const getColorClass = () => {
    switch (type) {
      case 'up': return 'insight-red';
      case 'down': return 'insight-green';
      case 'flat': return 'insight-neutral';
      case 'category': return 'insight-primary';
      case 'budget': return 'insight-accent';
      default: return 'insight-primary';
    }
  };

  return (
    <div className={`insight-card ${getColorClass()}`} data-testid="insight-card">
      <div className="insight-icon">{getIcon()}</div>
      <p className="insight-text">{text}</p>
    </div>
  );
};

export default InsightCard;
