import { useState } from 'react';
import { AlertTriangle, ArrowRight, CheckCircle2, FileText, Trash2, Upload } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

/**
 * Self-rating for one KRA: a green banner on the page, with the upload form
 * (PDF, 1–5 rating, notes) and the uploaded sheets inside a modal.
 */
export default function SelfRatingPanel({
    kra,
    kraNumber,
    weight,
    totalWeight,
    kraCount,
    uploads,
    form,
    formKey,
    onSubmit,
    onView,
    onDelete,
}) {
    const [open, setOpen] = useState(false);

    const selected = form.data.self_rating === '' || form.data.self_rating === null ? null : Number(form.data.self_rating);
    const pick = (n) => form.setData('self_rating', selected === n ? '' : String(n));

    const latestScored = uploads.find((item) => item.self_rating !== null && item.self_rating !== '');

    // The PDF viewer and delete confirm are page-level modals, so close this one first.
    const view = (item) => {
        setOpen(false);
        onView(item);
    };
    const remove = (id) => {
        setOpen(false);
        onDelete(id);
    };

    return (
        <>
            <section className="relative mt-6 flex flex-wrap items-center gap-6 overflow-hidden rounded-3xl bg-sidebar px-6 py-8 text-white sm:px-10">
                <span className="pointer-events-none absolute -right-16 -top-20 h-60 w-60 rounded-full bg-white/10" />
                <span className="pointer-events-none absolute -bottom-28 right-56 h-52 w-52 rounded-full bg-yellow-300/20" />
                <div className="relative flex min-w-0 flex-[1_1_420px] flex-col gap-2.5">
                    <span className="inline-flex items-center gap-2 self-start rounded-full bg-yellow-300/20 px-3 py-1 text-[13px] font-bold text-yellow-300">
                        {uploads.length > 0 && <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />}
                        KRA {kraNumber} · worth {weight.toFixed(2)}%
                    </span>
                    <h3 className="text-2xl font-extrabold leading-tight tracking-tight sm:text-[34px]">Self-Rating for this KRA</h3>
                    <p className="max-w-[620px] text-base text-white/90">
                        Upload your self-rating sheet for <strong className="font-bold text-white">{kra.name}</strong> and give yourself a score from 1 to 5.
                    </p>
                    <div className="mt-1 flex flex-wrap gap-2 text-[13px]">
                        <span className="rounded-full bg-white/15 px-3 py-1">
                            {uploads.length === 0 ? 'No sheet uploaded yet' : `${uploads.length} sheet${uploads.length === 1 ? '' : 's'} uploaded`}
                        </span>
                        {latestScored && (
                            <span className="rounded-full bg-white/15 px-3 py-1">Your rating: {Number(latestScored.self_rating).toFixed(2)} / 5</span>
                        )}
                        <span className="rounded-full bg-white/15 px-3 py-1">
                            {Number(totalWeight).toFixed(2)}% of the total, split across {kraCount} KRA{kraCount === 1 ? '' : 's'}
                        </span>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => setOpen(true)}
                    className="relative inline-flex h-[60px] items-center gap-2.5 whitespace-nowrap rounded-2xl bg-yellow-400 px-8 text-lg font-extrabold text-green-900 transition-colors hover:bg-yellow-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                    {uploads.length === 0 ? 'Rate Yourself' : 'Manage Self-Rating'}
                    <ArrowRight className="h-5 w-5" aria-hidden="true" />
                </button>
            </section>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-h-[90vh] max-w-xl gap-0 overflow-y-auto rounded-2xl p-0 [&>button]:text-white [&>button]:opacity-90">
                    <DialogHeader className="rounded-t-2xl bg-sidebar px-6 py-5 text-left">
                        <span className="text-xs font-bold text-yellow-300">
                            KRA {kraNumber} · worth {weight.toFixed(2)}%
                        </span>
                        <DialogTitle className="text-xl text-white">Self-rating</DialogTitle>
                        <DialogDescription className="text-white/85">{kra.name}</DialogDescription>
                    </DialogHeader>

                    <form
                        key={formKey}
                        onSubmit={(e) => onSubmit(e, () => setOpen(false))}
                        className="flex flex-col gap-3 p-5"
                    >
                        <label
                            htmlFor={`self-rating-file-${kra.id}`}
                            className="flex cursor-pointer flex-col items-center gap-1 rounded-xl border-2 border-dashed border-green-300 bg-[hsl(var(--canvas))] px-3 py-5 text-center transition-colors hover:border-green-600"
                        >
                            <Upload className="h-5 w-5 text-green-700" aria-hidden="true" />
                            <strong className="text-sm text-green-800">{form.data.file ? form.data.file.name : 'Choose your rating sheet'}</strong>
                            <span className="text-xs text-gray-500">PDF only, up to 10 MB</span>
                            <input
                                id={`self-rating-file-${kra.id}`}
                                type="file"
                                accept=".pdf"
                                onChange={(e) => form.setData('file', e.target.files[0])}
                                className="sr-only"
                                required
                            />
                        </label>
                        {form.errors.file && (
                            <p className="flex items-center gap-1.5 text-sm font-medium text-red-600">
                                <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                                {form.errors.file}
                            </p>
                        )}

                        <span className="text-[13px] font-semibold text-gray-900">
                            Your rating <span className="font-medium text-gray-500">(optional)</span>
                        </span>
                        <div role="group" aria-label="Rating from 1 to 5" className="grid grid-cols-5 gap-1.5">
                            {[1, 2, 3, 4, 5].map((n) => {
                                const on = selected === n;
                                return (
                                    <button
                                        key={n}
                                        type="button"
                                        onClick={() => pick(n)}
                                        aria-pressed={on}
                                        className={`h-12 rounded-xl border text-[17px] font-extrabold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 ${
                                            on ? 'border-green-700 bg-green-700 text-white' : 'border-border bg-white text-gray-900 hover:border-green-700'
                                        }`}
                                    >
                                        {n}
                                    </button>
                                );
                            })}
                        </div>
                        <span className="text-center text-xs text-gray-500">
                            {selected ? `You picked ${selected} out of 5 · converted to this KRA's ${weight.toFixed(2)}% share` : 'No rating picked · the sheet uploads on its own'}
                        </span>
                        {form.errors.self_rating && <p className="text-sm font-medium text-red-600">{form.errors.self_rating}</p>}

                        <label htmlFor={`self-rating-notes-${kra.id}`} className="text-[13px] font-semibold text-gray-900">
                            Notes <span className="font-medium text-gray-500">(optional)</span>
                        </label>
                        <textarea
                            id={`self-rating-notes-${kra.id}`}
                            rows={2}
                            value={form.data.notes}
                            onChange={(e) => form.setData('notes', e.target.value)}
                            placeholder="How you arrived at this rating..."
                            className="resize-none rounded-[10px] border border-border p-2.5 text-sm focus:border-green-600 focus:ring-2 focus:ring-yellow-300"
                        />

                        <button
                            type="submit"
                            disabled={form.processing}
                            className="flex h-[50px] items-center justify-center gap-2 rounded-xl bg-green-700 text-[15px] font-bold text-white transition-colors hover:bg-green-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {form.processing ? 'Uploading…' : 'Upload self-rating'}
                        </button>
                    </form>

                    <div className="flex flex-col gap-2.5 border-t border-border px-5 py-4">
                        <strong className="text-sm text-gray-900">Uploaded for this KRA</strong>
                        {uploads.length === 0 ? (
                            <p className="rounded-xl border border-dashed border-yellow-300 bg-yellow-50 px-3.5 py-3 text-[13px] text-yellow-900">
                                No self-rating sheet yet. Your rater reviews it alongside your MOVs.
                            </p>
                        ) : (
                            <ul className="flex flex-col gap-2">
                                {uploads.map((item) => (
                                    <li key={item.id} className="flex flex-wrap items-center gap-2.5 rounded-xl border border-border bg-[hsl(var(--canvas))] p-3">
                                        <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-red-50 text-[10px] font-extrabold text-red-700">PDF</span>
                                        <span className="min-w-0 flex-1">
                                            <span className="block truncate text-[13px] font-semibold text-gray-900">{item.original_name || 'Self-rating document'}</span>
                                            <span className="text-xs text-gray-500">
                                                Uploaded {new Date(item.created_at).toLocaleDateString()}
                                                {item.self_rating ? ` · ${Number(item.self_rating).toFixed(2)} / 5` : ''}
                                            </span>
                                            {item.notes && <span className="mt-1 block text-xs italic text-gray-600">{item.notes}</span>}
                                        </span>
                                        <span className="flex gap-1.5">
                                            <button
                                                type="button"
                                                onClick={() => view(item)}
                                                className="inline-flex h-8 items-center rounded-lg border border-border bg-white px-2.5 text-xs font-bold text-green-700 hover:border-green-700"
                                            >
                                                <FileText className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
                                                View
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => remove(item.id)}
                                                aria-label="Remove this self-rating"
                                                className="inline-flex h-8 items-center rounded-lg border border-red-200 bg-white px-2 text-red-600 hover:bg-red-50"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                                            </button>
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                        {uploads.length > 1 && <p className="text-xs text-gray-500">The newest upload with a score is the one that counts.</p>}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
