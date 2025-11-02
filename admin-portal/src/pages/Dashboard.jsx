import React from 'react';

export default function Dashboard() {
  return (
    <div className="grid gap-4">
      <div className="card">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Overview</h2>
        </div>
        <p className="help mt-1">Welcome to the secure control center. Use the sidebar to navigate.</p>
      </div>

      {/* <div className="grid md:grid-cols-3 gap-4">
        <div className="card">
          <div className="text-subtext text-xs">Live Status</div>
          <div className="mt-2 text-lg font-semibold text-primary">Operational</div>
        </div>
        <div className="card">
          <div className="text-subtext text-xs">Open Alerts</div>
          <div className="mt-2 text-lg font-semibold text-warn">3</div>
        </div>
        <div className="card">
          <div className="text-subtext text-xs">Blacklisted</div>
          <div className="mt-2 text-lg font-semibold text-info">17</div>
        </div>
      </div> */}
    </div>
  );
}
