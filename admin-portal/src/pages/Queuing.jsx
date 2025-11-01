import React from 'react';

export default function Queuing() {
  return (
    <div className="card">
      <h2 className="text-base font-semibold">Queuing</h2>
      <p className="help mt-1">Queue lengths, throughput, and live metrics.</p>

      <div className="grid md:grid-cols-3 gap-3 mt-4">
        <div className="card">
          <div className="text-subtext text-xs">Avg Wait</div>
          <div className="mt-2 text-lg font-semibold text-warn">04:12</div>
        </div>
        <div className="card">
          <div className="text-subtext text-xs">In Queue</div>
          <div className="mt-2 text-lg font-semibold text-info">32</div>
        </div>
        <div className="card">
          <div className="text-subtext text-xs">Throughput</div>
          <div className="mt-2 text-lg font-semibold text-primary">87/hr</div>
        </div>
      </div>
    </div>
  );
}
