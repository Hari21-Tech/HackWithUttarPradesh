import React, { useEffect, useMemo, useState } from "react";
import "./Queuing.css";

/**
 * Expected backend shapes
 * Shop: { id:number, name:string, category:string, totalCapacity:number, description?:string }
 * Runtime row: { shopId:number, inside:number, waiting:number, eta?:number, disabled?:boolean }
 */
const computeEta = (waiting = 0, fallbackPerPersonMin = 2) =>
  Math.max(1, Math.round(waiting * fallbackPerPersonMin));

export default function QueuingAdmin() {
  const [shops, setShops] = useState([]);         // [{...shop, runtime:{inside,waiting,eta,disabled}}]
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  // ------- Backend integration points ----------------------------------
  // For now, returns demo data so the page shows immediately.
  async function fetchShopsFromBackend() {
    // DEMO base shops
    const base = [
      {
        id: 1,
        name: "Burger Hub",
        category: "Food",
        totalCapacity: 40,
        description: "Smash burgers, fries & shakes.",
      },
      {
        id: 2,
        name: "Urban Threads",
        category: "Fashion",
        totalCapacity: 60,
        description: "Trendy fits, seasonal drops and basics.",
      },
      {
        id: 3,
        name: "GizmoWorks",
        category: "Electronics",
        totalCapacity: 50,
        description: "Mobiles, accessories & quick repairs.",
      },
    ];

    // DEMO runtime (normally comes from your queue service)
    const rt = [
      { shopId: 1, inside: 15, waiting: 8, eta: 12, disabled: false },
      { shopId: 2, inside: 44, waiting: 3, eta: 6, disabled: false },
      { shopId: 3, inside: 10, waiting: 0, eta: 0, disabled: true }, // demo disabled
    ];

    // Simulate small delay
    await new Promise(r => setTimeout(r, 250));
    return { base, rt };
  }

  function setFromBackend(base = [], runtimeRows = []) {
    const mapRt = new Map(runtimeRows.map(r => [r.shopId, r]));
    const merged = base.map(s => {
      const r = mapRt.get(s.id) || {};
      const inside = Number(r.inside || 0);
      const waiting = Number(r.waiting || 0);
      const eta = typeof r.eta === "number" ? r.eta : computeEta(waiting);
      const disabled = !!r.disabled;
      return { ...s, runtime: { inside, waiting, eta, disabled } };
    });
    setShops(merged);
  }

  async function refresh() {
    try {
      setLoading(true);
      const { base, rt } = await fetchShopsFromBackend();
      setFromBackend(base, rt);
    } catch (e) {
      console.error("[Queuing] refresh failed:", e);
      alert("Failed to fetch shops from backend.");
    } finally {
      setLoading(false);
    }
  }

  async function createShop(payload) {
    // TODO: POST to backend; then refresh()
    setShops(prev => {
      const nextId = Math.max(0, ...prev.map(s => s.id)) + 1;
      return [...prev, { ...payload, id: nextId, runtime: { inside: 0, waiting: 0, eta: 0, disabled: false } }];
    });
  }

  async function updateShop(id, payload) {
    // TODO: PUT to backend; then refresh()
    setShops(prev => prev.map(s => (s.id === id ? { ...s, ...payload } : s)));
  }

  async function deleteShop(id) {
    // TODO: DELETE to backend; then refresh()
    setShops(prev => prev.filter(s => s.id !== id));
  }

  async function toggleDisable(shop) {
    const disabled = !shop.runtime?.disabled;
    // TODO: POST to backend to toggle; then refresh()
    setShops(prev =>
      prev.map(s => (s.id === shop.id ? { ...s, runtime: { ...s.runtime, disabled } } : s))
    );
  }

  // ------- Initial load -----------------------------------------------
  useEffect(() => {
    refresh();
  }, []); // eslint-disable-line

  // ------- Filtering ---------------------------------------------------
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return shops;
    return shops.filter(s =>
      s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q)
    );
  }, [shops, search]);

  // ------- Modal state -------------------------------------------------
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", category: "", totalCapacity: 20, description: "" });

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", category: "", totalCapacity: 20, description: "" });
    setModalOpen(true);
  };

  const openEdit = (shop) => {
    setEditing(shop);
    setForm({
      name: shop.name,
      category: shop.category,
      totalCapacity: shop.totalCapacity,
      description: shop.description || "",
    });
    setModalOpen(true);
  };

  const saveShop = async () => {
    if (!form.name.trim() || !form.category.trim()) return alert("Name and Category are required.");
    if (form.totalCapacity <= 0) return alert("Capacity must be > 0");

    if (editing) {
      await updateShop(editing.id, {
        name: form.name.trim(),
        category: form.category.trim(),
        totalCapacity: form.totalCapacity,
        description: form.description,
      });
    } else {
      await createShop({
        name: form.name.trim(),
        category: form.category.trim(),
        totalCapacity: form.totalCapacity,
        description: form.description,
      });
    }
    setModalOpen(false);
  };

  // ------- UI ----------------------------------------------------------
  return (
    <div className="adminQueue-wrap">
      <div className="adminQueue-head">
        <div>
          <h2 className="adminQueue-title">Queuing</h2>
          <p className="adminQueue-help">Queue lengths, live ETA, and shop management (runtime from backend).</p>
        </div>

        <div className="adminQueue-tools">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search shop or category…"
            className="adminQueue-input"
          />
          <button className="adminQueue-btn" onClick={refresh} disabled={loading}>
            {loading ? "Refreshing…" : "Refresh"}
          </button>
          <button className="adminQueue-btn adminQueue-btn--primary" onClick={openCreate}>
            + Add Shop
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="adminQueue-panel">
        <div className="adminQueue-panelHead">Shops</div>
        <div className="adminQueue-tableWrap">
          <table className="adminQueue-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th className="num">Capacity</th>
                <th className="num">Inside</th>
                <th className="num">Waiting</th>
                <th className="num">ETA</th>
                <th>Status</th>
                <th className="actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => {
                const inside = Number(s.runtime?.inside || 0);
                const waiting = Number(s.runtime?.waiting || 0);
                const eta = typeof s.runtime?.eta === "number" ? s.runtime.eta : computeEta(waiting, 2);
                const disabled = !!s.runtime?.disabled;
                return (
                  <tr key={s.id} className={disabled ? "is-disabled" : ""}>
                    <td>
                      <div className="adminQueue-name">{s.name}</div>
                      <div className="adminQueue-sub">{s.description || "-"}</div>
                    </td>
                    <td>{s.category}</td>
                    <td className="num">{s.totalCapacity}</td>
                    <td className="num">{inside}</td>
                    <td className="num">{waiting}</td>
                    <td className="num">{String(eta).padStart(2, "0")}m</td>
                    <td>
                      <span className={`adminQueue-badge ${disabled ? "danger" : "ok"}`}>
                        {disabled ? "Disabled" : "Live"}
                      </span>
                    </td>
                    <td className="actions">
                      <button className="adminQueue-mini" onClick={() => openEdit(s)}>Edit</button>
                      <button className="adminQueue-mini" onClick={() => toggleDisable(s)}>
                        {disabled ? "Enable" : "Disable"}
                      </button>
                      <button className="adminQueue-mini danger" onClick={() => deleteShop(s.id)}>Delete</button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="empty">No shops match your search.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="adminQueue-modalBackdrop" onClick={() => setModalOpen(false)}>
          <div className="adminQueue-modal" onClick={(e) => e.stopPropagation()}>
            <div className="adminQueue-modalHead">{editing ? "Edit Shop" : "Add Shop"}</div>
            <div className="adminQueue-modalBody">
              <label className="adminQueue-label">Shop Name</label>
              <input
                className="adminQueue-input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., Burger Hub"
              />

              <label className="adminQueue-label">Category</label>
              <input
                className="adminQueue-input"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="Food / Fashion / Electronics"
              />

              <label className="adminQueue-label">Total Capacity</label>
              <input
                className="adminQueue-input"
                type="number"
                min={1}
                value={form.totalCapacity}
                onChange={(e) => setForm({ ...form, totalCapacity: Number(e.target.value) || 0 })}
                placeholder="e.g., 40"
              />

              <label className="adminQueue-label">Description (optional)</label>
              <textarea
                className="adminQueue-textarea"
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Short summary…"
              />
            </div>
            <div className="adminQueue-modalFoot">
              <button className="adminQueue-btn" onClick={() => setModalOpen(false)}>Cancel</button>
              <button className="adminQueue-btn adminQueue-btn--primary" onClick={saveShop}>
                {editing ? "Save Changes" : "Create Shop"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
