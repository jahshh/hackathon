import React from 'react';
import { Link } from 'react-router-dom';

export const PrivacyPage: React.FC = () => {
  return (
    <main className="page">
      <p><Link to="/">Back to command center</Link></p>
      <h1>Privacy Policy</h1>
      <p>Last updated: September 2026. RESPONSE is a client side demonstration.</p>
      <h2>Information collected</h2>
      <p>RESPONSE does not send data to any server. Scenario state you create is stored only in your own browser local storage so the demo survives a page refresh. No accounts, no analytics, no tracking.</p>
      <h2>How information is used</h2>
      <p>Local scenario data is used only to render the command center in your browser. It is never transmitted anywhere.</p>
      <h2>Cookies and local storage</h2>
      <p>The application uses browser local storage under the key response-demo-v1. Clearing your browser site data removes it. No cookies are set for tracking.</p>
      <h2>Third party services</h2>
      <p>No third party services are integrated. The map is drawn by the application itself, so no location data leaves your device.</p>
      <h2>Data retention</h2>
      <p>Data remains in your browser until you clear it or press Reset demo scenario.</p>
      <h2>Security</h2>
      <p>Because nothing is uploaded, the main risk is someone with access to your device reading your screen. Do not enter real personal data.</p>
      <h2>User rights</h2>
      <p>You can view, export by screenshot, and delete your scenario at any time by clearing site data or resetting the demo.</p>
      <h2>Contact</h2>
      <p>Contact FORGE at hello@example.com with privacy questions about this demonstration.</p>
    </main>
  );
};
