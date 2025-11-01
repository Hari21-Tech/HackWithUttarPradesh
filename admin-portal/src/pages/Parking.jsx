import React from 'react';

export default function Parking() {
  return (
    <div className="card">
      <h2 className="text-base font-semibold">Parking</h2>
      <p className="help mt-1">Manage parking status, slots, and passes.</p>

      <div className="grid md:grid-cols-3 gap-3 mt-4">
        <div className="card">
          <div className="text-subtext text-xs">Total Slots</div>
          <div className="mt-2 text-lg font-semibold">420</div>
        </div>
        <div className="card">
          <div className="text-subtext text-xs">Occupied</div>
          <div className="mt-2 text-lg font-semibold text-warn">287</div>
        </div>
        <div className="card">
          <div className="text-subtext text-xs">Free</div>
          <div className="mt-2 text-lg font-semibold text-primary">133</div>
        </div>
      </div>
    </div>
  );
}
