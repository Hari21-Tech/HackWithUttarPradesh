import React from 'react';

export default function FirePortal() {
  return (
    <div className="card">
      <h2 className="text-base font-semibold">Fire Portal</h2>
      <p className="help mt-1">Monitor fire sensors, alarms, and response actions.</p>

      <div className="grid md:grid-cols-2 gap-3 mt-4">
        <div className="card border border-warn">
          <div className="text-subtext text-xs">Sensors Online</div>
          <div className="mt-2 text-lg font-semibold text-info">58</div>
        </div>
        <div className="card border border-danger">
          <div className="text-subtext text-xs">Active Alarms</div>
          <div className="mt-2 text-lg font-semibold text-danger">1</div>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button className="btn btn-primary">Acknowledge</button>
        <button className="btn">Dispatch</button>
      </div>
    </div>
  );
}
