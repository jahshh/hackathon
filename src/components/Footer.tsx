import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div>
        <strong>RESPONSE</strong>
        <span>Emergency Response Command Center</span>
      </div>
      <p>Simulation environment. Data shown is fictional and intended for demonstration purposes.</p>
      <nav aria-label="Legal">
        <Link to="/privacy">Privacy Policy</Link>
        <Link to="/terms">Terms and Conditions</Link>
      </nav>
      <p className="forge">FORGE</p>
    </footer>
  );
};
