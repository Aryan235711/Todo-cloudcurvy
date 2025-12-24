
import React, { useMemo, useState } from 'react';
import { X, Library, Zap, ChevronDown, Save, Play, Edit3, Trash2 } from 'lucide-react';
import { Template, Priority } from '../../types';

interface LibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  templates: Template[];
  setTemplates: React.Dispatch<React.SetStateAction<Template[]>>;
  onDeploy: (tmpl: Template) => void;
  capitalize: (str: string) => string;
}

export const LibraryModal: React.FC<LibraryModalProps> = ({ isOpen, onClose, templates, setTemplates, onDeploy, capitalize }) => {
  const [expandedTemplateId, setExpandedTemplateId] = useState<string | null>(null);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [editTemplateData, setEditTemplateData] = useState<Template | null>(null);
  const [selectedTag, setSelectedTag] = useState<string>('');

  const handleEditTemplate = (tmpl: Template) => {
    setEditingTemplateId(tmpl.id);
    setEditTemplateData({ ...tmpl });
  };

  const normalizeTag = (t: string) => t.trim().toLowerCase();
  const isNonEmptyTag = (t: string): t is string => t.trim().length > 0;

  const GENERIC_TAGS = new Set([
    'recurring',
    'routine',
    'daily',
    'weekly',
    'monthly',
    'yearly',
    'plan',
    'checklist',
    'list',
    'general',
    'basic',
    'misc',
    'miscellaneous'
  ]);

  const globalTagCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const tmpl of templates) {
      const uniq = new Set<string>((tmpl.tags || []).map(normalizeTag).filter(isNonEmptyTag));
      for (const t of uniq) counts.set(t, (counts.get(t) ?? 0) + 1);
    }
    return counts;
  }, [templates]);

  const primaryTagByTemplateId = useMemo(() => {
    const totalTemplates = Math.max(1, templates.length);
    const pickPrimary = (tags: string[]) => {
      const uniq = [...new Set<string>(tags.map(normalizeTag).filter(isNonEmptyTag))];
      if (uniq.length === 0) return null;

      let best: string | null = null;
      let bestScore = -Infinity;

      for (const tag of uniq) {
        const count = globalTagCounts.get(tag) ?? 0;
        const idf = Math.log((totalTemplates + 1) / (count + 1)) + 1;
        const genericPenalty = GENERIC_TAGS.has(tag) ? 0.25 : 1;
        const score = idf * genericPenalty;
        if (score > bestScore) {
          bestScore = score;
          best = tag;
        }
      }

      return best;
    };

    const map = new Map<string, string | null>();
    for (const tmpl of templates) map.set(tmpl.id, pickPrimary(tmpl.tags || []));
    return map;
  }, [templates, globalTagCounts]);

  const availableTags = useMemo(() => {
    const counts = new Map<string, number>();
    const display = new Map<string, string>();

    for (const tmpl of templates) {
      const primary = primaryTagByTemplateId.get(tmpl.id);
      if (!primary) continue;
      counts.set(primary, (counts.get(primary) ?? 0) + 1);

      const original = (tmpl.tags || []).find(t => normalizeTag(t) === primary)?.trim();
      if (original && !display.has(primary)) display.set(primary, original);
    }

    return [...counts.entries()]
      .sort((a, b) => {
        const byCount = (b[1] ?? 0) - (a[1] ?? 0);
        if (byCount !== 0) return byCount;
        return a[0].localeCompare(b[0]);
      })
      .map(([norm, count]) => ({
        value: norm,
        label: display.get(norm) || norm,
        count
      }));
  }, [templates, primaryTagByTemplateId]);

  const visibleTemplates = useMemo(() => {
    const filtered = selectedTag
      ? templates.filter(tmpl => (primaryTagByTemplateId.get(tmpl.id) || '') === selectedTag)
      : templates;

    return filtered.slice().sort((a, b) => {
      const pMap = { high: 3, medium: 2, low: 1 };
      return (pMap[b.priority || 'low'] || 0) - (pMap[a.priority || 'low'] || 0);
    });
  }, [templates, selectedTag, primaryTagByTemplateId]);

  if (!isOpen) return null;

  const handleDeleteTemplate = (tmpl: Template) => {
    setPendingDeleteTemplate(tmpl);
    {/* Custom Delete Modal */}
    {pendingDeleteTemplate && (
      <CustomConfirmModal
        message={`Delete “${pendingDeleteTemplate.name}” from your Manifest Vault?`}
        onConfirm={() => {
          setTemplates(prev => prev.filter(t => t.id !== pendingDeleteTemplate.id));
          if (expandedTemplateId === pendingDeleteTemplate.id) setExpandedTemplateId(null);
          if (editingTemplateId === pendingDeleteTemplate.id) {
            setEditingTemplateId(null);
            setEditTemplateData(null);
          }
          setPendingDeleteTemplate(null);
        }}
        onCancel={() => setPendingDeleteTemplate(null)}
      />
    )}
  };

  const saveTemplateEdit = () => {
    if (!editTemplateData) return;
    const sanitized: Template = {
      ...editTemplateData,
      name: capitalize(editTemplateData.name.trim()),
      items: editTemplateData.items.map(i => capitalize(i.trim())),
      priority: editTemplateData.priority || 'medium'
    };
    setTemplates(prev => prev.map(t => t.id === sanitized.id ? sanitized : t));
    setEditingTemplateId(null);
    setEditTemplateData(null);
  };

  const prioritySelectionColors: Record<Priority, string> = {
    low: 'bg-emerald-500 text-white',
    medium: 'bg-amber-500 text-white',
    high: 'bg-rose-500 text-white'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/10 backdrop-blur-md">
      <div className="liquid-glass-dark w-full max-w-md h-full shadow-2xl px-6 pb-[calc(var(--safe-bottom)+1.5rem)] pt-[calc(var(--safe-top)+1.5rem)] sm:p-8 flex flex-col rounded-l-[3rem] animate-in slide-in-from-right duration-700">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-black text-slate-900 tracking-tighter flex items-center gap-3"><Library className="text-indigo-500" /> Manifest Vault</h2>
          <button onClick={onClose} className="p-3 bg-white/60 rounded-xl"><X size={22} /></button>
        </div>
        <div className="mb-5 bg-white/40 border border-white/50 rounded-[1.8rem] p-4">
          <label className="block text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 mb-2">
            Filter by tag
          </label>
          <select
            value={selectedTag}
            onChange={(e) => {
              setSelectedTag(e.target.value);
              setExpandedTemplateId(null);
              setEditingTemplateId(null);
              setEditTemplateData(null);
            }}
            className="w-full bg-white/70 border border-white/70 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700"
          >
            <option value="">All tags</option>
            {availableTags.map(t => (
              <option key={t.value} value={t.value}>
                {t.label} ({t.count})
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1 overflow-y-auto space-y-4 no-scrollbar">
          {visibleTemplates.map((tmpl) => {
            const isExpanded = expandedTemplateId === tmpl.id;
            const isEditing = editingTemplateId === tmpl.id;
            const isHigh = tmpl.priority === 'high';
            const primary = primaryTagByTemplateId.get(tmpl.id);
            const orderedTags = tmpl.tags?.length
              ? [
                  ...(primary ? tmpl.tags.filter(t => normalizeTag(t) === primary) : []),
                  ...tmpl.tags.filter(t => !primary || normalizeTag(t) !== primary)
                ]
              : [];
            return (
              <div key={tmpl.id} className={`bg-white/80 rounded-[2.2rem] border-2 transition-all ${isExpanded ? 'border-sky-300 shadow-xl' : isHigh ? 'border-rose-100' : 'border-transparent'}`}>
                <button onClick={() => !isEditing && setExpandedTemplateId(isExpanded ? null : tmpl.id)} className="w-full text-left p-6 flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex gap-2 mb-2">
                      <span className="text-[9px] uppercase font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg">{tmpl.category}</span>
                      {isHigh && <span className="text-[9px] uppercase font-black text-rose-500 bg-rose-50 px-2 py-0.5 rounded-lg flex items-center gap-1"><Zap size={10} fill="currentColor" /> High</span>}
                    </div>
                    <h3 className="font-black text-lg tracking-tight truncate">{tmpl.name}</h3>
                    {orderedTags.length > 0 && (
                      <div className="flex gap-2 mt-2 overflow-hidden">
                        {orderedTags.slice(0, 3).map((tag, i) => (
                          <span
                            key={`${tmpl.id}-tag-${i}`}
                            className={`text-[9px] uppercase font-black px-2 py-0.5 rounded-lg truncate ${primary && normalizeTag(tag) === primary ? 'text-indigo-600 bg-indigo-50' : 'text-slate-500 bg-slate-50'}`}
                            title={tag}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <ChevronDown className={`transition-transform duration-700 ${isExpanded ? 'rotate-180 text-sky-500' : 'text-slate-200'}`} />
                </button>
                <div className={`transition-all duration-700 overflow-hidden ${isExpanded ? 'max-h-[1000px] opacity-100 p-6 pt-0' : 'max-h-0 opacity-0'}`}>
                  <div className="space-y-4 mb-6 pt-5 border-t border-slate-100">
                    {isEditing ? (
                      <div className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400">Priority</label>
                            <div className="flex gap-2">
                              {(['low', 'medium', 'high'] as Priority[]).map(p => (
                                <button key={p} onClick={() => setEditTemplateData(prev => prev ? { ...prev, priority: p } : null)} className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase transition-all border ${editTemplateData?.priority === p ? prioritySelectionColors[p] : 'text-slate-400 bg-slate-50 border-slate-100'}`}>{p}</button>
                              ))}
                            </div>
                          </div>
                          {editTemplateData?.items.map((item, i) => (
                            <div key={i} className="flex gap-2">
                              <input value={item} onChange={(e) => {
                                const next = [...(editTemplateData?.items || [])];
                                next[i] = capitalize(e.target.value);
                                setEditTemplateData(prev => prev ? { ...prev, items: next } : null);
                              }} className="flex-1 bg-slate-50 p-2 rounded-lg text-sm font-semibold border" />
                              <button onClick={() => setEditTemplateData(prev => prev ? { ...prev, items: prev.items.filter((_, idx) => idx !== i) } : null)} className="p-2 text-rose-500"><Trash2 size={16} /></button>
                            </div>
                          ))}
                          <button onClick={() => setEditTemplateData(prev => prev ? { ...prev, items: [...prev.items, 'New Intent'] } : null)} className="w-full py-2 border-2 border-dashed border-sky-100 rounded-xl text-sky-500 text-xs font-black uppercase">+ Add Item</button>
                      </div>
                    ) : tmpl.items.map((item, i) => (
                      <div key={i} className="text-xs font-semibold text-slate-600 flex items-center gap-3"><div className="w-2 h-2 bg-sky-400 rounded-full shrink-0" /> <span className="truncate">{item}</span></div>
                    ))}
                  </div>
                  <div className="flex gap-3">
                    {isEditing ? (
                      <button onClick={saveTemplateEdit} className="flex-1 bg-emerald-500 text-white py-4 rounded-[1.8rem] font-black text-xs uppercase shadow-lg flex items-center justify-center gap-2"><Save size={16} /> Save Kit</button>
                    ) : (
                      <>
                        <button onClick={() => onDeploy(tmpl)} className="flex-1 bg-sky-500 text-white py-4 rounded-[1.8rem] font-black text-xs uppercase shadow-lg flex items-center justify-center gap-2"><Play size={16} fill="currentColor" /> Deploy</button>
                        <button onClick={() => handleEditTemplate(tmpl)} className="p-4 bg-amber-50 text-amber-500 rounded-[1.8rem]"><Edit3 size={18} /></button>
                        <button onClick={() => handleDeleteTemplate(tmpl)} className="p-4 bg-rose-50 text-rose-500 rounded-[1.8rem]" aria-label="Delete kit"><Trash2 size={18} /></button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
