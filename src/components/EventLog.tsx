import React from 'react';
import type { LogEntry } from '../types';

export const EventLog: React.FC<{ events: LogEntry[] }> = ({ events }) => {
  return (
    <section aria-label="Event log" className="panel">
      <h2>Incident Timeline ({events.length})</h2>
      {events.length === 0 && <p className="muted">No events yet. Actions you take appear here.</p>}
      <ol className="list log">
        {[...events].reverse().map((e) => (
          <li key={e.id} className="row">
            <time>{e.time}</time>
            <strong>{e.title}</strong>
            <span>{e.detail}</span>
          </li>
        ))}
      </ol>
    </section>
  );
};
