import React, { useEffect, useMemo, useRef, useState } from "react";

// Dummy MVP for a privacy-first, offline-first family tree editor.
// - Data model: persons, marriages, children (ChildLink)
// - Local JSON storage with import/export
// - Rapid entry: add root, add wife, add children
// - RTL/LTR toggle
// - Minimal tree render with selection
// - Zero backend; runs as a PWA-ready component shell

// Types
/** @typedef {{ id: string, name: string, gender: 'M'|'F'|'U', isRoot?: boolean }} Person */
/** @typedef {{ id: string, husbandId: string, wifeId: string, status: 'active'|'divorced'|'widowed' }} Marriage */
/** @typedef {{ childId: string, marriageId: string }} ChildLink */

const newId = () => Math.random().toString(36).slice(2, 10);
const LS_KEY = "family-tree-mvp-json";

/** @type {() => {persons: Person[], marriages: Marriage[], children: ChildLink[]}} */
const emptyData = () => ({ persons: [], marriages: [], children: [] });

export default function FamilyTreeDemo() {
  const [data, setData] = useState(emptyData());
  const [dir, setDir] = useState("ltr");
  const [selectedPersonId, setSelectedPersonId] = useState("");
  const [selectedMarriageId, setSelectedMarriageId] = useState("");
  const [quickName, setQuickName] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  const fileInputRef = useRef(null);

  // Load from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) setData(JSON.parse(raw));
    } catch {}
  }, []);

  // Autosave
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(data));
    } catch {}
  }, [data]);

  // Derived helpers
  const root = useMemo(() => data.persons.find(p => p.isRoot), [data]);
  const marriagesByHusband = useMemo(() => {
    const m = new Map();
    data.marriages.forEach(x => {
      const arr = m.get(x.husbandId) || [];
      arr.push(x);
      m.set(x.husbandId, arr);
    });
    return m;
  }, [data]);

  const childrenByMarriage = useMemo(() => {
    const m = new Map();
    data.children.forEach(x => {
      const arr = m.get(x.marriageId) || [];
      arr.push(x.childId);
      m.set(x.marriageId, arr);
    });
    return m;
  }, [data]);

  const personById = useMemo(() => {
    const m = new Map();
    data.persons.forEach(p => m.set(p.id, p));
    return m;
  }, [data]);

  const selectedPerson = selectedPersonId ? personById.get(selectedPersonId) : undefined;
  const selectedMarriage = selectedMarriageId ? data.marriages.find(m => m.id === selectedMarriageId) : undefined;

  // Ops
  const resetTree = () => {
    setData(emptyData());
    setSelectedMarriageId("");
    setSelectedPersonId("");
    setStatusMsg("New tree created");
  };

  const createRoot = (name, gender) => {
    if (!name) return;
    const id = newId();
    const root = { id, name, gender, isRoot: true };
    setData({ persons: [root], marriages: [], children: [] });
    setSelectedPersonId(id);
    setSelectedMarriageId("");
    setStatusMsg("Root created");
  };

  const addWifeToMan = (husbandId, wifeName) => {
    if (!husbandId || !wifeName) return;
    // Enforce up to 4 active wives
    const activeCount = (marriagesByHusband.get(husbandId) || []).filter(m => m.status === 'active').length;
    if (activeCount >= 4) {
      setStatusMsg("Max 4 active wives reached");
      return;
    }
    const wifeId = newId();
    const wife = { id: wifeId, name: wifeName, gender: 'F' };
    const marriage = { id: newId(), husbandId, wifeId, status: 'active' };
    setData(d => ({
      persons: [...d.persons, wife],
      marriages: [...d.marriages, marriage],
      children: d.children,
    }));
    setSelectedPersonId(wifeId);
    setSelectedMarriageId(marriage.id);
    setStatusMsg("Wife added");
  };

  const addChildToMarriage = (marriageId, childName, gender = 'U') => {
    if (!marriageId || !childName) return;
    const childId = newId();
    const child = { id: childId, name: childName, gender };
    const link = { childId, marriageId };
    setData(d => ({
      persons: [...d.persons, child],
      marriages: d.marriages,
      children: [...d.children, link],
    }));
    setSelectedPersonId(childId);
    setStatusMsg("Child added");
  };

  const divorceMarriage = (marriageId) => {
    if (!marriageId) return;
    setData(d => ({
      ...d,
      marriages: d.marriages.map(m => m.id === marriageId ? { ...m, status: 'divorced' } : m)
    }));
    setStatusMsg("Marriage set to divorced");
  };

  const widowedMarriage = (marriageId) => {
    if (!marriageId) return;
    setData(d => ({
      ...d,
      marriages: d.marriages.map(m => m.id === marriageId ? { ...m, status: 'widowed' } : m)
    }));
    setStatusMsg("Marriage set to widowed");
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'family-tree.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJSON = async (file) => {
    if (!file) return;
    const text = await file.text();
    try {
      const parsed = JSON.parse(text);
      // basic shape check
      if (!parsed.persons || !parsed.marriages || !parsed.children) throw new Error("Invalid file");
      setData(parsed);
      setSelectedPersonId(parsed.persons[0]?.id || "");
      setSelectedMarriageId(parsed.marriages[0]?.id || "");
      setStatusMsg("Imported JSON");
    } catch (e) {
      setStatusMsg("Import failed");
    }
  };

  // Quick-entry handler
  const onQuickSubmit = (e) => {
    e.preventDefault();
    const name = quickName.trim();
    if (!name) return;

    if (!root) {
      // First entry creates the root as male by default; can change later.
      createRoot(name, 'M');
      setQuickName("");
      return;
    }

    if (selectedMarriage) {
      addChildToMarriage(selectedMarriage.id, name, 'U');
      setQuickName("");
      return;
    }

    if (selectedPerson && selectedPerson.gender !== 'F') {
      // Default action on a man: add wife
      addWifeToMan(selectedPerson.id, name);
      setQuickName("");
      return;
    }

    // Fallback: add child to the first marriage of root if exists
    const firstMarriage = data.marriages.find(m => m.husbandId === root.id);
    if (firstMarriage) {
      addChildToMarriage(firstMarriage.id, name, 'U');
    }
    setQuickName("");
  };

  // Render helpers
  const renderMarriageBlock = (m) => {
    const husband = personById.get(m.husbandId);
    const wife = personById.get(m.wifeId);
    const kids = childrenByMarriage.get(m.id) || [];

    return (
      <div key={m.id} className={`rounded-2xl border p-3 my-2 shadow-sm ${selectedMarriageId===m.id? 'ring-2 ring-blue-500':''}`}>
        <div className="flex items-center gap-2">
          <button
            className={`px-2 py-1 rounded-xl text-sm border ${selectedPersonId===husband?.id? 'bg-blue-50 border-blue-400':'border-gray-300'}`}
            onClick={() => { setSelectedPersonId(husband.id); setSelectedMarriageId(m.id); }}
            title="Husband"
          >👤 {husband?.name || '—'}</button>
          <span className="text-gray-400">×</span>
          <button
            className={`px-2 py-1 rounded-xl text-sm border ${selectedPersonId===wife?.id? 'bg-blue-50 border-blue-400':'border-gray-300'}`}
            onClick={() => { setSelectedPersonId(wife.id); setSelectedMarriageId(m.id); }}
            title="Wife"
          >👩 {wife?.name || '—'}</button>
          <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${m.status==='active'?'bg-green-50 text-green-700':'bg-amber-50 text-amber-700'}`}>{m.status}</span>
        </div>
        <div className="mt-2">
          <div className="text-xs text-gray-500">Children</div>
          <div className="flex flex-wrap gap-2 mt-1">
            {kids.length===0 && <span className="text-gray-400 text-sm">None</span>}
            {kids.map(cid => {
              const c = personById.get(cid);
              return (
                <button
                  key={cid}
                  className={`px-2 py-1 rounded-xl text-sm border ${selectedPersonId===cid? 'bg-blue-50 border-blue-400':'border-gray-300'}`}
                  onClick={() => { setSelectedPersonId(cid); setSelectedMarriageId(""); }}
                >🧒 {c?.name || '—'}</button>
              );
            })}
          </div>
          <div className="mt-2 flex gap-2">
            <button className="text-xs px-2 py-1 rounded-lg border hover:bg-gray-50" onClick={() => setSelectedMarriageId(m.id)}>Select marriage</button>
            <button className="text-xs px-2 py-1 rounded-lg border hover:bg-gray-50" onClick={() => divorceMarriage(m.id)}>Set divorced</button>
            <button className="text-xs px-2 py-1 rounded-lg border hover:bg-gray-50" onClick={() => widowedMarriage(m.id)}>Set widowed</button>
          </div>
        </div>
      </div>
    );
  };

  const renderManPanel = (man) => {
    const ms = marriagesByHusband.get(man.id) || [];
    return (
      <div key={man.id} className="rounded-2xl border p-3 my-2">
        <div className="flex items-center gap-2">
          <button className={`px-2 py-1 rounded-xl text-sm border ${selectedPersonId===man.id? 'bg-blue-50 border-blue-400':'border-gray-300'}`} onClick={() => { setSelectedPersonId(man.id); setSelectedMarriageId(""); }}>👨 {man.name}</button>
          {man.isRoot && <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">root</span>}
          <div className="ml-auto flex gap-2">
            <QuickAddButton label="Add wife" onAdd={(nm) => addWifeToMan(man.id, nm)} />
          </div>
        </div>
        <div className="mt-2">
          {ms.length===0 && <div className="text-gray-400 text-sm">No wives</div>}
          {ms.map(renderMarriageBlock)}
        </div>
      </div>
    );
  };

  // Simple tree: start at root husband, render his marriages and children. Allow selecting a child and promoting if male.
  const tree = useMemo(() => {
    if (!root) return null;
    const stacks = [];
    // Render root regardless of gender. If female root, show a notice and allow converting to husband panel when her husband exists.
    if (root.gender === 'M') stacks.push(renderManPanel(root));
    else {
      // If root is female, show marriages where she is wife.
      const m = data.marriages.filter(x => x.wifeId === root.id);
      stacks.push(
        <div key={root.id} className="rounded-2xl border p-3 my-2">
          <div className="flex items-center gap-2">
            <button className={`px-2 py-1 rounded-xl text-sm border ${selectedPersonId===root.id? 'bg-blue-50 border-blue-400':'border-gray-300'}`} onClick={() => { setSelectedPersonId(root.id); setSelectedMarriageId(""); }}>👩 {root.name}</button>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">root</span>
          </div>
          <div className="mt-2">
            {m.length===0 && <div className="text-gray-400 text-sm">No marriage yet</div>}
            {m.map(renderMarriageBlock)}
          </div>
        </div>
      );
    }
    return stacks;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, selectedPersonId, selectedMarriageId]);

  return (
    <div className="p-4 max-w-6xl mx-auto" dir={dir}>
      <header className="flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-semibold">Family Tree — Dummy MVP</h1>
        <span className="text-xs text-gray-500">Offline JSON • No server • Rapid entry</span>
        <div className="ml-auto flex flex-wrap gap-2">
          <button className="px-3 py-1.5 rounded-xl border hover:bg-gray-50" onClick={() => setDir(dir === 'ltr' ? 'rtl' : 'ltr')}>Toggle RTL</button>
          <button className="px-3 py-1.5 rounded-xl border hover:bg-gray-50" onClick={resetTree}>New tree</button>
          <button className="px-3 py-1.5 rounded-xl border hover:bg-gray-50" onClick={exportJSON}>Export JSON</button>
          <button className="px-3 py-1.5 rounded-xl border hover:bg-gray-50" onClick={() => fileInputRef.current?.click()}>Import JSON</button>
          <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={(e) => importJSON(e.target.files?.[0] || null)} />
        </div>
      </header>

      <div className="mt-3 text-xs text-gray-600">{statusMsg}</div>

      {/* Quick Entry */}
      <section className="mt-4 rounded-2xl border p-3">
        <div className="flex items-center gap-2">
          <form onSubmit={onQuickSubmit} className="flex items-center gap-2 w-full">
            <input
              className="flex-1 px-3 py-2 rounded-xl border"
              placeholder={!root ? "Type root name and press Enter" : selectedMarriage ? "Type child name and press Enter" : selectedPerson && selectedPerson.gender !== 'F' ? "Type wife name and press Enter" : "Type name and press Enter"}
              value={quickName}
              onChange={e => setQuickName(e.target.value)}
            />
            <button className="px-3 py-2 rounded-xl border hover:bg-gray-50" type="submit">Add</button>
          </form>
        </div>
        <div className="text-xs text-gray-500 mt-2">
          Logic: If no root → creates male root. If a marriage is selected → adds child. If a male person is selected → adds wife. Otherwise tries to add child to the first root marriage.
        </div>
      </section>

      {/* Person Inspector */}
      {selectedPerson && (
        <section className="mt-4 rounded-2xl border p-3">
          <div className="flex items-center gap-2">
            <div className="text-sm font-medium">Selected Person:</div>
            <div className="px-2 py-1 rounded-xl border">{selectedPerson.name}</div>
            <select
              className="ml-2 px-2 py-1 rounded-xl border"
              value={selectedPerson.gender}
              onChange={(e) => {
                const g = /** @type {'M'|'F'|'U'} */(e.target.value);
                setData(d => ({ ...d, persons: d.persons.map(p => p.id === selectedPerson.id ? { ...p, gender: g } : p) }));
                setStatusMsg("Gender updated");
              }}
            >
              <option value="M">Male</option>
              <option value="F">Female</option>
              <option value="U">Unknown</option>
            </select>
            {!selectedPerson.isRoot && (
              <button
                className="ml-auto px-2 py-1 rounded-xl border hover:bg-gray-50"
                onClick={() => {
                  setData(d => ({ ...d, persons: d.persons.map(p => ({ ...p, isRoot: p.id === selectedPerson.id })) }));
                  setStatusMsg("Root changed");
                }}
              >Make root</button>
            )}
          </div>
          {selectedPerson.gender !== 'F' && (
            <div className="mt-3">
              <QuickAddButton label="Add wife to this man" onAdd={(nm) => addWifeToMan(selectedPerson.id, nm)} />
            </div>
          )}
        </section>
      )}

      {/* Marriage Inspector */}
      {selectedMarriage && (
        <section className="mt-4 rounded-2xl border p-3">
          <div className="flex items-center gap-2">
            <div className="text-sm font-medium">Selected Marriage:</div>
            <div className="px-2 py-1 rounded-xl border text-xs">{selectedMarriage.id}</div>
            <div className="ml-auto flex gap-2">
              <QuickAddButton label="Add child" onAdd={(nm) => addChildToMarriage(selectedMarriage.id, nm, 'U')} />
            </div>
          </div>
        </section>
      )}

      {/* Tree */}
      <section className="mt-4">
        {!root && (
          <div className="rounded-2xl border p-6 text-center text-gray-600">
            Type a name above and press Enter to create the root.
          </div>
        )}
        {root && (
          <div>
            {tree}
          </div>
        )}
      </section>

      {/* Legend */}
      <section className="mt-8 text-xs text-gray-500">
        <div>Legend: 👨 man • 👩 woman • 🧒 child • Active marriage is green • Divorced/Widowed marked accordingly</div>
      </section>
    </div>
  );
}

function QuickAddButton({ label, onAdd }: { label: string, onAdd: (name: string) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  return (
    <div className="relative inline-block">
      <button className="px-2 py-1 rounded-lg border hover:bg-gray-50 text-xs" onClick={() => setOpen(v => !v)}>{label}</button>
      {open && (
        <div className="absolute z-10 mt-2 bg-white border rounded-xl shadow p-2 w-64">
          <div className="text-xs text-gray-600 mb-1">Enter name</div>
          <input className="w-full px-2 py-1 border rounded-lg" value={name} onChange={e => setName(e.target.value)} placeholder="Name" />
          <div className="mt-2 flex gap-2 justify-end">
            <button className="px-2 py-1 rounded-lg border text-xs" onClick={() => setOpen(false)}>Cancel</button>
            <button
              className="px-2 py-1 rounded-lg border text-xs hover:bg-gray-50"
              onClick={() => { if (name.trim()) { onAdd(name.trim()); setName(""); setOpen(false); } }}
            >Add</button>
          </div>
        </div>
      )}
    </div>
  );
}
