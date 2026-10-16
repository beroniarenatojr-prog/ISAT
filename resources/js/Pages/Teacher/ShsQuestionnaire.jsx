import { Head, useForm, Link } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, CheckCircle2, FileText, Plus, Send, Trash2 } from 'lucide-react';
import TeacherLayout from '@/Layouts/TeacherLayout';
import PageHeader from '@/Components/Teacher/PageHeader';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const emptyTraining = () => ({ title: '', level: '', year: '' });

// Dropdown values for "Year Attended" - this year back 45 years.
const YEAR_OPTIONS = Array.from({ length: 46 }, (_, i) => new Date().getFullYear() - i);

export default function ShsQuestionnaire({ template, response, schoolYear, user, profileDefaults = {} }) {
    const structure = template?.structure || {};
    const profileFields = structure.profile_fields || [];
    const performance = structure.performance || { kras: [], scale: [] };
    const challenges = structure.challenges || { kras: [], scale: [] };

    const isSubmitted = response?.status === 'submitted';

    // Build the ordered list of item keys so we can measure progress.
    const perfItems = useMemo(
        () => performance.kras.flatMap((kra, ki) => kra.items.map((it) => ({ ...it, ki, key: `p_${ki}_${it.no}` }))),
        [performance]
    );
    const chalItems = useMemo(
        () => challenges.kras.flatMap((kra, ki) => kra.items.map((it) => ({ ...it, ki, key: `c_${ki}_${it.no}` }))),
        [challenges]
    );

    // Pre-fill order: a saved answer wins, otherwise the value pulled from the
    // teacher's records (profileDefaults), otherwise blank.
    const savedProfile = response?.profile || {};
    const defaultProfile = profileDefaults?.profile || {};
    const savedTrainings = response?.trainings || [];
    const defaultTrainings = profileDefaults?.trainings || [];

    const { data, setData, post, processing, transform } = useForm({
        school_year: schoolYear,
        status: 'draft',
        profile: { name: user?.name || '', ...defaultProfile, ...savedProfile },
        trainings: (savedTrainings.length ? savedTrainings
            : defaultTrainings.length ? defaultTrainings
            : [emptyTraining()]),
        performance_ratings: response?.performance_ratings || {},
        challenge_ratings: response?.challenge_ratings || {},
    });

    const isPrefilled = (key) =>
        savedProfile[key] === undefined && defaultProfile[key] !== undefined && defaultProfile[key] !== '';

    // ---- Steps: Profile, then one per performance KRA, then one per challenge KRA ----
    const steps = useMemo(() => {
        const list = [{ type: 'profile', label: 'Profile' }];
        performance.kras.forEach((kra, ki) => list.push({ type: 'performance', ki, label: `II · ${kra.code}` }));
        challenges.kras.forEach((kra, ki) => list.push({ type: 'challenges', ki, label: `III · ${kra.code}` }));
        return list;
    }, [performance, challenges]);

    const [step, setStep] = useState(0);
    const [showConfirm, setShowConfirm] = useState(false);
    const current = steps[step];
    const isLastStep = step === steps.length - 1;

    const setProfile = (key, value) => setData('profile', { ...data.profile, [key]: value });
    const setRating = (bucket, key, value) =>
        setData(bucket, { ...data[bucket], [key]: value });

    const setTraining = (idx, key, value) => {
        const next = data.trainings.map((row, i) => (i === idx ? { ...row, [key]: value } : row));
        setData('trainings', next);
    };
    const addTraining = () => setData('trainings', [...data.trainings, emptyTraining()]);
    const removeTraining = (idx) =>
        setData('trainings', data.trainings.length > 1 ? data.trainings.filter((_, i) => i !== idx) : data.trainings);

    // ---- Progress ----
    const answered = (items, bucket) => items.filter((it) => data[bucket][it.key] != null).length;
    const perfAnswered = answered(perfItems, 'performance_ratings');
    const chalAnswered = answered(chalItems, 'challenge_ratings');
    const totalItems = perfItems.length + chalItems.length;
    const totalAnswered = perfAnswered + chalAnswered;
    const progress = totalItems ? Math.round((totalAnswered / totalItems) * 100) : 0;

    const requiredProfileMissing = profileFields
        .filter((f) => f.required && f.type !== 'training_table')
        .filter((f) => !String(data.profile[f.key] ?? '').trim())
        .map((f) => f.label);

    const stepComplete = (s) => {
        if (s.type === 'profile') return requiredProfileMissing.length === 0;
        const kra = (s.type === 'performance' ? performance : challenges).kras[s.ki];
        const bucket = s.type === 'performance' ? 'performance_ratings' : 'challenge_ratings';
        const prefix = s.type === 'performance' ? 'p' : 'c';
        return kra.items.every((it) => data[bucket][`${prefix}_${s.ki}_${it.no}`] != null);
    };

    const goToStep = (target) => {
        setShowConfirm(false);
        setStep(Math.max(0, Math.min(target, steps.length - 1)));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleNext = () => {
        if (!stepComplete(current)) {
            toast.error(current.type === 'profile'
                ? `Please complete: ${requiredProfileMissing.join(', ')}`
                : 'Please answer every item in this section before continuing.');
            return;
        }
        goToStep(step + 1);
    };

    const submitWith = (status, onDone) => {
        transform((payload) => ({ ...payload, status }));
        post(route('teacher.shs-questionnaire.store'), {
            preserveScroll: true,
            onSuccess: () => { transform((p) => p); onDone?.(); },
            onError: () => { transform((p) => p); toast.error('Something went wrong. Please try again.'); },
        });
    };

    const handleSaveDraft = () => submitWith('draft', () => toast.success('Draft saved.'));

    const handleSubmit = (e) => {
        e?.preventDefault?.();
        if (requiredProfileMissing.length) {
            toast.error(`Complete the profile first: ${requiredProfileMissing.join(', ')}`);
            goToStep(0);
            return;
        }
        if (totalAnswered < totalItems) {
            toast.error(`Answer all ${totalItems} items. ${totalAnswered}/${totalItems} done.`);
            return;
        }
        setShowConfirm(true);
    };

    const handleConfirmSubmit = () => {
        submitWith('submitted', () => { setShowConfirm(false); toast.success('Submitted. Thank you!'); });
    };

    const scale = current?.type === 'challenges' ? challenges.scale : performance.scale;

    const inputClass =
        'w-full h-11 rounded-[10px] border border-border px-3 text-sm focus:border-green-600 focus:ring-2 focus:ring-yellow-300 disabled:bg-[hsl(var(--canvas))] read-only:bg-[hsl(var(--canvas))]';

    return (
        <TeacherLayout user={user}>
            <Head title="SHS Performance & Challenges Questionnaire" />
            <ToastContainer position="top-right" />

            <div className="min-h-screen bg-[hsl(var(--canvas))] text-foreground">
                <PageHeader
                    title={template.title}
                    subtitle={`SY ${schoolYear}${template.description ? ` · ${template.description}` : ' · Senior High School teacher self-assessment'}`}
                    action={
                        <Link
                            href={route('teacher.ipcrf')}
                            className="inline-flex h-11 items-center gap-2 rounded-xl bg-white/15 px-4 text-sm font-bold text-white transition-colors hover:bg-white/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
                        >
                            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                            Back to IPCRF Tool
                        </Link>
                    }
                >
                    <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between gap-3 text-[13px] text-white/90">
                            <span>
                                {totalAnswered} of {totalItems} rating items answered
                            </span>
                            <strong className="text-yellow-300">{isSubmitted ? 'Submitted' : `${progress}% · draft`}</strong>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-white/20">
                            <div className="h-full rounded-full bg-yellow-400 transition-all duration-300" style={{ width: `${progress}%` }} />
                        </div>
                    </div>
                </PageHeader>

                <main className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-7 sm:px-6 lg:px-12">
                    {isSubmitted && (
                        <div className="flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 p-5">
                            <CheckCircle2 className="h-6 w-6 flex-shrink-0 text-green-700" />
                            <p className="font-semibold text-green-900">
                                This questionnaire was already submitted for SY {schoolYear}. You may still review your answers below.
                            </p>
                        </div>
                    )}

                    {/* Step tabs */}
                    <div className="overflow-x-auto pb-1">
                        <div role="tablist" aria-label="Questionnaire steps" className="flex min-w-max gap-1.5">
                            {steps.map((s, i) => {
                                const done = stepComplete(s);
                                const active = i === step;
                                return (
                                    <button
                                        key={i}
                                        type="button"
                                        role="tab"
                                        aria-selected={active}
                                        onClick={() => goToStep(i)}
                                        className={`inline-flex h-10 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 text-[13px] font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 ${
                                            active
                                                ? 'border-green-700 bg-green-700 text-white'
                                                : done
                                                    ? 'border-green-200 bg-green-50 text-green-800'
                                                    : 'border-border bg-white text-gray-700 hover:border-green-700'
                                        }`}
                                    >
                                        {done && !active && <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />}
                                        {s.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                        {/* PART I - PROFILE */}
                        {current.type === 'profile' && (
                            <section className="flex flex-col gap-4 rounded-2xl border border-border bg-white px-6 py-5">
                                <div className="flex flex-col gap-1.5">
                                    <span className="h-1 w-10 rounded-full bg-yellow-400" />
                                    <h2 className="text-lg font-bold text-gray-900">Part I – Profile</h2>
                                    <p className="text-[13px] text-gray-500">Fields marked * are required. Some answers are pre-filled from your records.</p>
                                </div>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {profileFields.filter((f) => f.type !== 'training_table').map((f) => (
                                        <div key={f.key} className="flex flex-col gap-1.5">
                                            <label htmlFor={`shs-${f.key}`} className="text-[13px] font-semibold text-gray-900">
                                                {f.label}{f.required ? ' *' : ''}
                                            </label>
                                            {f.options ? (
                                                <select
                                                    id={`shs-${f.key}`}
                                                    value={data.profile[f.key] ?? ''}
                                                    disabled={isSubmitted}
                                                    onChange={(e) => setProfile(f.key, e.target.value)}
                                                    className={inputClass}
                                                >
                                                    <option value="">Select</option>
                                                    {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
                                                </select>
                                            ) : (
                                                <input
                                                    id={`shs-${f.key}`}
                                                    type={f.type === 'number' ? 'number' : 'text'}
                                                    value={data.profile[f.key] ?? ''}
                                                    readOnly={isSubmitted}
                                                    onChange={(e) => setProfile(f.key, e.target.value)}
                                                    className={`${inputClass} ${isPrefilled(f.key) && !isSubmitted ? 'bg-green-50' : ''}`}
                                                />
                                            )}
                                            {isPrefilled(f.key) && !isSubmitted && (
                                                <p className="text-xs text-green-700">Pre-filled from your records — edit if needed.</p>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* Trainings table */}
                                {profileFields.filter((f) => f.type === 'training_table').map((f) => (
                                    <div key={f.key} className="mt-2 flex flex-col gap-3">
                                        <strong className="text-sm text-gray-900">{f.label}</strong>
                                        <div className="overflow-x-auto rounded-xl border border-border">
                                            <table className="w-full min-w-[640px] text-sm">
                                                <thead className="bg-green-50 text-left text-xs text-green-800">
                                                    <tr>
                                                        {f.columns.map((c) => (
                                                            <th key={c.key} scope="col" className="px-3 py-2.5 font-semibold">{c.label}</th>
                                                        ))}
                                                        <th scope="col" className="w-12"><span className="sr-only">Remove</span></th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {data.trainings.map((row, idx) => (
                                                        <tr key={idx} className="border-t border-gray-100">
                                                            {f.columns.map((c) => (
                                                                <td key={c.key} className="px-3 py-2">
                                                                    {(c.options || c.type === 'year') ? (
                                                                        <select
                                                                            aria-label={`${c.label}, training ${idx + 1}`}
                                                                            value={row[c.key] ?? ''}
                                                                            disabled={isSubmitted}
                                                                            onChange={(e) => setTraining(idx, c.key, e.target.value)}
                                                                            className="h-10 w-full rounded-lg border border-border px-2 text-sm focus:border-green-600 focus:ring-2 focus:ring-yellow-300 disabled:bg-[hsl(var(--canvas))]"
                                                                        >
                                                                            <option value="">—</option>
                                                                            {(c.options || YEAR_OPTIONS).map((o) => <option key={o} value={o}>{o}</option>)}
                                                                        </select>
                                                                    ) : (
                                                                        <input
                                                                            type="text"
                                                                            aria-label={`${c.label}, training ${idx + 1}`}
                                                                            value={row[c.key] ?? ''}
                                                                            readOnly={isSubmitted}
                                                                            onChange={(e) => setTraining(idx, c.key, e.target.value)}
                                                                            className="h-10 w-full rounded-lg border border-border px-2 text-sm focus:border-green-600 focus:ring-2 focus:ring-yellow-300 read-only:bg-[hsl(var(--canvas))]"
                                                                        />
                                                                    )}
                                                                </td>
                                                            ))}
                                                            <td className="px-2 text-center">
                                                                {!isSubmitted && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => removeTraining(idx)}
                                                                        aria-label={`Remove training ${idx + 1}`}
                                                                        className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </button>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                        {!isSubmitted && (
                                            <button
                                                type="button"
                                                onClick={addTraining}
                                                className="inline-flex h-10 items-center gap-1.5 self-start rounded-[10px] border border-border bg-white px-3.5 text-sm font-bold text-green-700 hover:border-green-700"
                                            >
                                                <Plus className="h-4 w-4" /> Add training
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </section>
                        )}

                        {/* PART II / III - rating rows */}
                        {current.type !== 'profile' && (() => {
                            const source = current.type === 'performance' ? performance : challenges;
                            const kra = source.kras[current.ki];
                            const bucket = current.type === 'performance' ? 'performance_ratings' : 'challenge_ratings';
                            const prefix = current.type === 'performance' ? 'p' : 'c';
                            return (
                                <section className="overflow-hidden rounded-2xl border border-border bg-white">
                                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-6 py-4">
                                        <div>
                                            <p className={`text-xs font-extrabold uppercase tracking-wide ${current.type === 'performance' ? 'text-green-700' : 'text-yellow-700'}`}>
                                                {source.title}
                                            </p>
                                            <h2 className="text-lg font-bold text-gray-900">{kra.code}: {kra.title}</h2>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5 text-xs">
                                            {scale.map((sc) => (
                                                <span key={sc.value} className="rounded-full border border-[#EEF2EF] bg-[hsl(var(--canvas))] px-2.5 py-1">
                                                    <strong>{sc.label}</strong> {sc.description}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {kra.items.map((it) => {
                                        const key = `${prefix}_${current.ki}_${it.no}`;
                                        const value = data[bucket][key];
                                        return (
                                            <div key={key} className="flex flex-wrap items-center gap-x-5 gap-y-3 border-b border-gray-100 px-6 py-4 last:border-b-0">
                                                <span
                                                    className={`flex h-[30px] w-[30px] flex-none items-center justify-center rounded-full text-[13px] font-extrabold ${
                                                        value != null ? 'bg-green-700 text-white' : 'bg-gray-100 text-gray-500'
                                                    }`}
                                                >
                                                    {it.no}
                                                </span>
                                                <p className="min-w-0 flex-[1_1_420px] text-[15px] leading-relaxed text-gray-900">{it.text}</p>
                                                <div role="radiogroup" aria-label={`Rating for item ${it.no}`} className="flex gap-1.5">
                                                    {scale.map((sc) => {
                                                        const selected = value === sc.value;
                                                        return (
                                                            <button
                                                                key={sc.value}
                                                                type="button"
                                                                role="radio"
                                                                aria-checked={selected}
                                                                disabled={isSubmitted}
                                                                onClick={() => setRating(bucket, key, sc.value)}
                                                                title={`${sc.description} (${sc.value})`}
                                                                className={`flex h-10 w-12 items-center justify-center rounded-[10px] border text-[13px] font-extrabold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 disabled:opacity-60 ${
                                                                    selected ? 'border-green-700 bg-green-700 text-white' : 'border-border bg-white text-gray-700 hover:border-green-700'
                                                                }`}
                                                            >
                                                                {sc.label}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </section>
                            );
                        })()}

                        {/* Nav + actions */}
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            {!isSubmitted ? (
                                <Button type="button" variant="outline" onClick={handleSaveDraft} disabled={processing} className="h-12 rounded-xl px-5 font-bold">
                                    Save draft
                                </Button>
                            ) : (
                                <span />
                            )}
                            <div className="flex gap-2.5">
                                <Button type="button" variant="outline" onClick={() => goToStep(step - 1)} disabled={step === 0} className="h-12 rounded-xl px-5 font-bold">
                                    <ChevronLeft className="mr-1 h-4 w-4" /> Previous
                                </Button>
                                {!isLastStep && (
                                    <Button type="button" onClick={handleNext} className="h-12 rounded-xl bg-green-700 px-6 font-bold text-white hover:bg-green-800">
                                        Next <ChevronRight className="ml-1 h-4 w-4" />
                                    </Button>
                                )}
                                {isLastStep && !isSubmitted && (
                                    <Button type="submit" disabled={processing} className="h-12 rounded-xl bg-green-700 px-6 font-bold text-white hover:bg-green-800">
                                        <Send className="mr-2 h-4 w-4" /> Submit questionnaire
                                    </Button>
                                )}
                            </div>
                        </div>
                    </form>

                    <Dialog open={showConfirm && !isSubmitted} onOpenChange={setShowConfirm}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Submit this questionnaire?</DialogTitle>
                            </DialogHeader>
                            <p className="text-sm text-gray-600">
                                Once submitted you can no longer edit your answers for SY {schoolYear}.
                            </p>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setShowConfirm(false)}>
                                    Cancel
                                </Button>
                                <Button type="button" onClick={handleConfirmSubmit} disabled={processing} className="bg-green-700 text-white hover:bg-green-800">
                                    Yes, submit
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </main>
            </div>
        </TeacherLayout>
    );
}
