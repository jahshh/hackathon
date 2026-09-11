import React from 'react';
import { Link } from 'react-router-dom';

export const TermsPage: React.FC = () => {
  return (
    <main className="page">
      <p><Link to="/">Back to command center</Link></p>
      <h1>Terms and Conditions</h1>
      <p>Last updated: September 2026. RESPONSE is a demonstration built by FORGE.</p>
      <h2>1. Acceptance of terms</h2>
      <p>By opening RESPONSE you agree to these terms. If you do not agree, do not use the application.</p>
      <h2>2. Demonstration and simulation nature</h2>
      <p>RESPONSE is a fictional simulation. The city, incidents, units, hospitals, routes, and event log are generated demonstration data. Priority scores and recommendations come from a simple documented simulation model, not from any certified emergency protocol.</p>
      <h2>3. No emergency service use</h2>
      <p>RESPONSE must not be used for real emergency dispatch decisions. In a real emergency, contact your local emergency number immediately.</p>
      <h2>4. User responsibilities</h2>
      <p>You are responsible for inputs you enter. You must not enter real personal data, real addresses, or real operational details.</p>
      <h2>5. Intellectual property</h2>
      <p>The RESPONSE interface and simulation code are the property of FORGE unless otherwise agreed in writing.</p>
      <h2>6. Availability</h2>
      <p>RESPONSE is provided as is, without guarantees of uptime or fitness for any purpose.</p>
      <h2>7. Limitation of liability</h2>
      <p>To the maximum extent permitted by law, FORGE is not liable for any loss arising from use of this demonstration.</p>
      <h2>8. Changes to terms</h2>
      <p>These terms may be updated with the application. Continued use after an update counts as acceptance.</p>
      <h2>9. Contact</h2>
      <p>Contact FORGE at hello@example.com for questions about this demonstration.</p>
    </main>
  );
};
