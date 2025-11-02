import React, { useMemo, useState } from "react";
import "./Parking.css";

/** Helpers */
const ROWS = ["A", "B", "C", "D", "E"];
const COLS = [1, 2, 3, 4, 5];

function generateFloor(floor) {
  const now = new Date().toISOString();
  return ROWS.flatMap((r, ri) =>
    COLS.map((c, ci) => {
      const roll = (ri * 5 + ci) % 7;
      const status = roll === 0 ? "occupied" : roll === 1 ? "disabled" : roll === 2 ? "reserved" : "available";
      const code = `${r}${c}`;
      return { id: `F${floor}-${code}`, floor, code, status, lastUpdated: now };
    })
  );
}

const statusLabel = (s) =>
  ({ available: "Available", occupied: "Occupied", disabled: "Disabled", reserved: "Reserved" }[s] || s);

export default function Parking() {
  const floors = [1, 2, 3, 4];
  const [data, setData] = useState(() =>
    Object.fromEntries(floors.map((f) => [f, generateFloor(f)]))
  );
  const [activeFloor, setActiveFloor] = useState(1);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState([]);
  const [disableDialog, setDisableDialog] = useState({ open: false, ids: [] });
  const [disableReason, setDisableReason] = useState("");
  const [autoRelease, setAutoRelease] = useState(true);
  const [loading, setLoading] = useState(false);

  const activeSlots = data[activeFloor] ?? [];

  const visible = useMemo(() => {
    return activeSlots.filter((s) => {
      const codeMatch = s.code.toLowerCase().includes(search.toLowerCase());
      const filterMatch = filter === "all" ? true : s.status === filter;
      return codeMatch && filterMatch;
    });
  }, [activeSlots, search, filter]);

  const stats = useMemo(() => {
    const all = Object.values(data).flat();
    return {
      total: all.length,
      occupied: all.filter((s) => s.status === "occupied").length,
      disabled: all.filter((s) => s.status === "disabled").length,
      reserved: all.filter((s) => s.status === "reserved").length,
      free: all.filter((s) => s.status === "available").length,
    };
  }, [data]);

  function toggleSelect(id) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function setStatus(ids, status) {
    if (!ids.length) return;
    setData((prev) => {
      const next = { ...prev };
      for (const f in next) {
        next[f] = next[f].map((s) =>
          ids.includes(s.id) ? { ...s, status, lastUpdated: new Date().toISOString() } : s
        );
      }
      return next;
    });
    setSelectedIds((idsSel) => idsSel.filter((id) => !ids.includes(id)));
  }

  function openDisable(ids) {
    if (!ids.length) return;
    setDisableReason("");
    setDisableDialog({ open: true, ids });
  }

  async function confirmDisable() {
    try {
      setLoading(true);
      // Integrate your API/socket here if needed
      setStatus(disableDialog.ids, "disabled");
      alert(`${disableDialog.ids.length} slot(s) disabled${disableReason ? ` (${disableReason})` : ""}`);
    } finally {
      setLoading(false);
      setDisableDialog({ open: false, ids: [] });
    }
  }

  const markOccupied   = () => setStatus(selectedIds, "occupied");
  const markAvailable  = () => setStatus(selectedIds, "available");
  const disableSelected= () => openDisable(selectedIds);
  const enableSelected = () => setStatus(selectedIds, "available");

  const selectionCount = selectedIds.length;

  return (
    <div className="adminParking-pageWrapper">
      <div className="adminParking-page">
        {/* Header */}
        <div className="adminParking-header">
          <div>
            <h2 className="adminParking-title">Parking Admin</h2>
            <p className="adminParking-muted">Enable/disable slots, change status, and manage floors.</p>
          </div>

          <div className="adminParking-toolbar">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search code e.g. A3"
              className="adminParking-input"
            />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="adminParking-select"
            >
              <option value="all">All</option>
              <option value="available">Available</option>
              <option value="occupied">Occupied</option>
              <option value="reserved">Reserved</option>
              <option value="disabled">Disabled</option>
            </select>
            <button
              onClick={() => alert("Synced!")}
              className="adminParking-btn adminParking-btn--icon"
              title="Sync"
            >
              ↻
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div className="adminParking-kpis">
          <div className="adminParking-card">
            <div className="adminParking-cardLabel">Total Slots</div>
            <div className="adminParking-cardValue">{stats.total}</div>
          </div>
          <div className="adminParking-card">
            <div className="adminParking-cardLabel">Occupied</div>
            <div className="adminParking-cardValue adminParking-textRose">{stats.occupied}</div>
          </div>
          <div className="adminParking-card">
            <div className="adminParking-cardLabel">Free</div>
            <div className="adminParking-cardValue adminParking-textEmerald">{stats.free}</div>
          </div>
          <div className="adminParking-card">
            <div className="adminParking-cardLabel">Disabled</div>
            <div className="adminParking-cardValue adminParking-textMuted">{stats.disabled}</div>
          </div>
        </div>

        {/* Floor Tabs */}
        <div className="adminParking-tabs">
          {floors.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFloor(f)}
              className={`adminParking-tab ${activeFloor === f ? "is-active" : ""}`}
              aria-current={activeFloor === f ? "true" : "false"}
            >
              Floor {f}
            </button>
          ))}
        </div>

        {/* Floor Toolbar */}
        <div className="adminParking-subtoolbar">
          <div className="adminParking-pillRow">
            <span className="adminParking-pill">{visible.length} shown</span>
            <span className="adminParking-pill adminParking-pill--outline">{selectionCount} selected</span>
          </div>

          <div className="adminParking-actions">
            <button
              disabled={!selectionCount}
              onClick={markAvailable}
              className={`adminParking-btn adminParking-btn--green ${!selectionCount ? "is-disabled" : ""}`}
            >
              Mark Available
            </button>
            <button
              disabled={!selectionCount}
              onClick={markOccupied}
              className={`adminParking-btn ${!selectionCount ? "is-disabled" : ""}`}
            >
              Mark Occupied
            </button>
            <button
              disabled={!selectionCount}
              onClick={disableSelected}
              className={`adminParking-btn adminParking-btn--danger ${!selectionCount ? "is-disabled" : ""}`}
            >
              Disable
            </button>
            <button
              disabled={!selectionCount}
              onClick={enableSelected}
              className={`adminParking-btn adminParking-btn--outline ${!selectionCount ? "is-disabled" : ""}`}
            >
              Enable
            </button>
          </div>
        </div>

        {/* Grid */}
        <div className="adminParking-panel">
          <div className="adminParking-panelHeader">Floor {activeFloor} — Spots</div>
          <div className="adminParking-panelBody">
            <div className="adminParking-grid">
              {(data[activeFloor] ?? [])
                .filter(
                  (s) =>
                    s.code.toLowerCase().includes(search.toLowerCase()) &&
                    (filter === "all" || s.status === filter)
                )
                .map((slot) => {
                  const selected = selectedIds.includes(slot.id);
                  const selectedClass = selected ? "is-selected" : "";
                  const statusClass = `status-${slot.status}`;
                  return (
                    <button
                      key={slot.id}
                      onClick={() => toggleSelect(slot.id)}
                      className={`adminParking-slot ${statusClass} ${selectedClass}`}
                    >
                      <div className="adminParking-slotTop">
                        <span className="adminParking-slotCode">{slot.code}</span>
                        {slot.status === "disabled" && <span className="adminParking-chip">Disabled</span>}
                      </div>
                      <div className="adminParking-slotLabel">{statusLabel(slot.status)}</div>
                      <div className="adminParking-slotTime">Updated {new Date(slot.lastUpdated).toLocaleString()}</div>
                      {selected && (
                        <span className="adminParking-selectedBadge">Selected</span>
                      )}
                    </button>
                  );
                })}
            </div>

            {/* Legend */}
            <div className="adminParking-legend">
              <span><span className="adminParking-legendDot adminParking-legendDot--emerald" /> Available</span>
              <span><span className="adminParking-legendDot adminParking-legendDot--rose" /> Occupied</span>
              <span><span className="adminParking-legendDot adminParking-legendDot--amber" /> Reserved</span>
              <span><span className="adminParking-legendDot adminParking-legendDot--muted" /> Disabled</span>
            </div>
          </div>
        </div>

        {/* Disable modal */}
        {disableDialog.open && (
          <div className="adminParking-modalBackdrop">
            <div className="adminParking-modal">
              <div className="adminParking-modalHeader">
                Disable {disableDialog.ids.length} slot(s)
              </div>
              <div className="adminParking-modalBody">
                <label className="adminParking-label" htmlFor="reason">Reason</label>
                <input
                  id="reason"
                  placeholder="Maintenance, blocked area, etc."
                  value={disableReason}
                  onChange={(e) => setDisableReason(e.target.value)}
                  className="adminParking-input mt-4"
                />
                <div className="adminParking-toggleRow">
                  <div>
                    <div className="adminParking-label">Auto-release when free</div>
                    <div className="adminParking-muted small">Re-enable after nightly reset or when marked available by staff.</div>
                  </div>
                  <button
                    onClick={() => setAutoRelease((v) => !v)}
                    className={`adminParking-switch ${autoRelease ? "is-on" : ""}`}
                    aria-label="Toggle auto release"
                  >
                    <span className="adminParking-switchKnob" />
                  </button>
                </div>
              </div>
              <div className="adminParking-modalFooter">
                <button
                  onClick={() => setDisableDialog({ open: false, ids: [] })}
                  className="adminParking-btn adminParking-btn--outline"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDisable}
                  disabled={loading}
                  className={`adminParking-btn adminParking-btn--primary ${loading ? "is-loading" : ""}`}
                >
                  {loading ? "Saving..." : "Disable"}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
