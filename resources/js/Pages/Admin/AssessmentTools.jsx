import { AppSidebar } from "@/components/app-sidebar";
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  ClipboardList, Plus, Pencil, Trash2, ChevronUp, ChevronDown, Save, Settings2,
} from 'lucide-react';

const KRA_PARTS = [
  { key: 'performance', label: 'Part II · Performance Rating' },
  { key: 'challenges', label: 'Part III · Challenges Encountered' },
];

const DEFAULT_SCALE = [
  { value: 5, label: 'SA', description: 'Strongly Agree' },
  { value: 4, label: 'A', description: 'Agree' },
  { value: 3, label: 'MA', description: 'Moderately Agree' },
  { value: 2, label: 'D', description: 'Disagree' },
  { value: 1, label: 'SD', description: 'Strongly Disagree' },
];

const blankKra = () => ({ code: '', title: '', items: [{ no: 1, text: '' }] });

function move(arr, from, to) {
  if (to < 0 || to >= arr.length) return arr;
  const next = [...arr];
  const [x] = next.splice(from, 1);
  next.splice(to, 0, x);
  return next;
}

/* ---------- Scale editor (shared) ---------- */
function ScaleEditor({ scale, onChange }) {
  const rows = scale || [];
  const set = (i, patch) => onChange(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  return (
    <div className="rounded-md border border-gray-200 p-3 bg-gray-50/50">
      <p className="text-xs font-semibold text-gray-600 mb-2">Rating scale</p>
      <div className="space-y-2">
        {rows.map((r, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input type="number" className="w-16" value={r.value ?? ''} onChange={(e) => set(i, { value: Number(e.target.value) })} />
            <Input className="w-24" placeholder="Label" value={r.label ?? ''} onChange={(e) => set(i, { label: e.target.value })} />
            <Input className="flex-1" placeholder="Description" value={r.description ?? ''} onChange={(e) => set(i, { description: e.target.value })} />
            <Button size="icon" variant="ghost" className="text-red-600" onClick={() => onChange(rows.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></Button>
          </div>
        ))}
      </div>
      <Button size="sm" variant="outline" className="mt-2" onClick={() => onChange([...rows, { value: (rows.length ? Math.max(...rows.map((x) => x.value || 0)) + 1 : 1), label: '', description: '' }])}>
        <Plus className="h-3 w-3 mr-1" /> Add scale row
      </Button>
    </div>
  );
}

/* ---------- Flat item list editor ---------- */
function ItemsEditor({ items, onChange }) {
  const rows = items || [];
  return (
    <div className="space-y-2">
      {rows.map((it, i) => (
        <div key={i} className="flex items-start gap-2">
          <span className="text-xs text-gray-400 pt-2 w-6 text-right">{i + 1}.</span>
          <textarea rows={2} className="flex-1 text-sm border border-gray-300 rounded-md px-2 py-1.5"
            value={it.text || ''} onChange={(e) => onChange(rows.map((r, j) => (j === i ? { ...r, text: e.target.value } : r)))} />
          <Button size="icon" variant="ghost" onClick={() => onChange(move(rows, i, i - 1))}><ChevronUp className="h-4 w-4" /></Button>
          <Button size="icon" variant="ghost" onClick={() => onChange(move(rows, i, i + 1))}><ChevronDown className="h-4 w-4" /></Button>
          <Button size="icon" variant="ghost" className="text-red-600" onClick={() => onChange(rows.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></Button>
        </div>
      ))}
      <Button size="sm" variant="outline" onClick={() => onChange([...rows, { no: rows.length + 1, text: '' }])}>
        <Plus className="h-3 w-3 mr-1" /> Add question
      </Button>
    </div>
  );
}

export default function AssessmentTools({ templates, selfRating }) {
  /* ---- Self-rating settings ---- */
  const [srWeight, setSrWeight] = useState(String(selfRating?.total_weight ?? 5));
  const [srActive, setSrActive] = useState(Boolean(selfRating?.is_active ?? true));
  const [srSaving, setSrSaving] = useState(false);

  const saveSelfRating = () => {
    setSrSaving(true);
    router.put(route('admin.assessment-tools.self-rating.update'), { total_weight: Number(srWeight), is_active: srActive }, {
      preserveScroll: true,
      onError: (e) => Object.values(e).forEach((m) => toast.error(m)),
      onFinish: () => setSrSaving(false),
    });
  };

  /* ---- Template editor ---- */
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(null); // { id, title, description, is_active, kind, structure }

  const openEdit = (t) => {
    const kind = t.kind || (t.structure?.kind ?? 'shs');
    const s = t.structure || {};
    setEditing({
      id: t.id,
      title: t.title,
      description: t.description || '',
      is_active: t.is_active,
      kind,
      structure: kind === 'flat'
        ? { kind: 'flat', instructions: s.instructions || '', scale: s.scale || DEFAULT_SCALE, items: s.items || [] }
        : {
            kind: 'shs',
            profile_fields: s.profile_fields || [],
            performance: { title: '', scale: DEFAULT_SCALE, kras: [], ...(s.performance || {}) },
            challenges: { title: '', scale: DEFAULT_SCALE, kras: [], ...(s.challenges || {}) },
          },
    });
  };

  const save = () => {
    if (!editing) return;
    setBusy(true);
    const payload = {
      title: editing.title,
      description: editing.description,
      is_active: editing.is_active,
      kind: editing.kind,
      structure: editing.structure,
    };
    router.put(route('admin.assessment-tools.templates.update', editing.id), payload, {
      preserveScroll: true,
      onSuccess: () => setEditing(null),
      onError: (e) => Object.values(e).forEach((m) => toast.error(m)),
      onFinish: () => setBusy(false),
    });
  };

  /* structure mutation helpers */
  const setStruct = (fn) => setEditing((cur) => ({ ...cur, structure: fn(cur.structure) }));
  const patchGroup = (partKey, fn) => setStruct((st) => ({ ...st, [partKey]: fn(st[partKey]) }));
  const setKra = (partKey, ki, patch) => patchGroup(partKey, (g) => ({
    ...g, kras: g.kras.map((k, i) => (i === ki ? { ...k, ...patch } : k)),
  }));

  return (
    <>
      <Head title="Assessment Tools" />
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem><BreadcrumbPage>Assessment Tools</BreadcrumbPage></BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>

          <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
            {/* Self-Rating settings */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-2 mb-4">
                <Settings2 className="h-5 w-5 text-amber-600" />
                <h2 className="text-lg font-semibold">KRA Self-Rating</h2>
              </div>
              <div className="flex flex-wrap items-end gap-6">
                <div>
                  <Label htmlFor="sr-weight">Total weight (% of overall 100)</Label>
                  <Input id="sr-weight" type="number" min="0" max="100" step="0.01"
                    value={srWeight} onChange={(e) => setSrWeight(e.target.value)} className="w-40" />
                  <p className="mt-1 text-xs text-gray-400">
                    Objectives carry the remaining {(100 - (Number(srWeight) || 0)).toFixed(2)}%.
                  </p>
                </div>
                <label className="flex items-center gap-2 text-sm pb-2">
                  <input type="checkbox" checked={srActive} onChange={(e) => setSrActive(e.target.checked)} />
                  Show the self-rating upload to teachers
                </label>
                <Button onClick={saveSelfRating} disabled={srSaving} className="bg-amber-600 hover:bg-amber-700">
                  <Save className="h-4 w-4 mr-2" /> Save
                </Button>
              </div>
            </div>

            {/* Questionnaires */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-green-600" />
                  <h2 className="text-lg font-semibold">Questionnaires &amp; Self-Assessments</h2>
                </div>
              </div>

              {templates.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">No questionnaires yet.</p>
              ) : (
                <div className="grid gap-3">
                  {templates.map((t) => (
                    <div key={t.id} className="border rounded-lg p-4 flex flex-wrap items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{t.title}</span>
                          <span className={`text-xs px-2 py-0.5 rounded ${t.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {t.is_active ? 'Active' : 'Inactive'}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                            {t.kind === 'flat' ? 'List survey' : 'Structured (SHS)'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          <code>{t.key}</code> ·{' '}
                          {t.kind === 'flat'
                            ? `${t.flat_item_count} questions`
                            : `${t.performance_item_count} performance · ${t.challenge_item_count} challenge items`}
                          {' '}· {t.response_count} responses
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEdit(t)}>
                          <Pencil className="h-3 w-3 mr-1" /> Edit
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>

      {/* Edit */}
      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit questionnaire</DialogTitle>
            <DialogDescription>
              {editing?.kind === 'flat'
                ? 'One rating scale and a flat list of statements. Empty questions are dropped on save.'
                : 'Profile plus Part II / Part III KRA groups. Empty questions are dropped on save.'}
            </DialogDescription>
          </DialogHeader>

          {editing && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <Label>Title</Label>
                  <Input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
                </div>
                <div>
                  <Label>Description</Label>
                  <Input value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={editing.is_active}
                    onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })} />
                  Active (teachers can open this questionnaire)
                </label>
                <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                  {editing.kind === 'flat' ? 'List survey' : 'Structured (SHS)'}
                </span>
              </div>

              {/* ---- FLAT ---- */}
              {editing.kind === 'flat' && (
                <>
                  <div>
                    <Label className="text-xs">Instructions</Label>
                    <textarea rows={3} className="w-full text-sm border border-gray-300 rounded-md px-2 py-1.5"
                      value={editing.structure.instructions || ''}
                      onChange={(e) => setStruct((st) => ({ ...st, instructions: e.target.value }))} />
                  </div>
                  <ScaleEditor scale={editing.structure.scale} onChange={(scale) => setStruct((st) => ({ ...st, scale }))} />
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold text-gray-800 mb-3">Questions</h3>
                    <ItemsEditor items={editing.structure.items} onChange={(items) => setStruct((st) => ({ ...st, items }))} />
                  </div>
                </>
              )}

              {/* ---- SHS ---- */}
              {editing.kind !== 'flat' && KRA_PARTS.map((part) => {
                const g = editing.structure[part.key] || { title: '', scale: [], kras: [] };
                return (
                  <div key={part.key} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-800">{part.label}</h3>
                      <Button size="sm" variant="outline" onClick={() => patchGroup(part.key, (gr) => ({ ...gr, kras: [...(gr.kras || []), blankKra()] }))}>
                        <Plus className="h-3 w-3 mr-1" /> Add KRA
                      </Button>
                    </div>
                    <div className="mb-3">
                      <Label className="text-xs">Section heading</Label>
                      <Input value={g.title || ''} onChange={(e) => patchGroup(part.key, (gr) => ({ ...gr, title: e.target.value }))} />
                    </div>
                    <div className="mb-3">
                      <ScaleEditor scale={g.scale} onChange={(scale) => patchGroup(part.key, (gr) => ({ ...gr, scale }))} />
                    </div>

                    {(g.kras || []).length === 0 && <p className="text-xs text-gray-400">No KRAs. Add one to start.</p>}

                    <div className="space-y-4">
                      {(g.kras || []).map((kra, ki) => (
                        <div key={ki} className="bg-gray-50 rounded-md p-3">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <Input className="w-28" placeholder="KRA 1" value={kra.code || ''}
                              onChange={(e) => setKra(part.key, ki, { code: e.target.value })} />
                            <Input className="flex-1 min-w-[12rem]" placeholder="KRA title" value={kra.title || ''}
                              onChange={(e) => setKra(part.key, ki, { title: e.target.value })} />
                            <Button size="icon" variant="ghost" onClick={() => patchGroup(part.key, (gr) => ({ ...gr, kras: move(gr.kras, ki, ki - 1) }))}><ChevronUp className="h-4 w-4" /></Button>
                            <Button size="icon" variant="ghost" onClick={() => patchGroup(part.key, (gr) => ({ ...gr, kras: move(gr.kras, ki, ki + 1) }))}><ChevronDown className="h-4 w-4" /></Button>
                            <Button size="icon" variant="ghost" className="text-red-600" onClick={() => patchGroup(part.key, (gr) => ({ ...gr, kras: gr.kras.filter((_, i) => i !== ki) }))}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                          <ItemsEditor items={kra.items} onChange={(items) => setKra(part.key, ki, { items })} />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button className="bg-green-600 hover:bg-green-700" onClick={save} disabled={busy || !editing?.title?.trim()}>
              <Save className="h-4 w-4 mr-2" /> Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
