import { Head, useForm, Link } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, CheckCircle2, FileText, Plus, Send, Trash2 } from 'lucide-react';
import TeacherLayout from '@/Layouts/TeacherLayout';
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

    return (
        <TeacherLayout user={user}>
            <Head title="SHS Performance & Challenges Questionnaire" />
            <ToastContainer position="top-right" />

            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8 px-4">
                <div className="max-w-5xl mx-auto">
                    <Link
                        href={route('teacher.ipcrf')}
                        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium mb-6"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to IPCRF Tool
                    </Link>

                    {/* Header */}
                    <div className="bg-white rounded-xl shadow-lg p-8 mb-6 border-2 border-blue-200">
                        <div className="text-center mb-6">
                            <FileText className="h-14 w-14 text-blue-600 mx-auto mb-3" />
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{template.title}</h1>
                            {template.description && (
                                <p className="text-gray-600 mt-2">{template.description}</p>
                            )}
                            <p className="text-gray-500 mt-1 text-sm">School Year: {schoolYear}</p>
                        </div>

                        <div className="mb-2 flex justify-between text-sm font-semibold text-gray-700">
                            <span>Progress: {totalAnswered}/{totalItems} rating items</span>
                            <span className="text-blue-600">{progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                            <div
                                className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>

                    {isSubmitted && (
                        <div className="bg-green-50 border-2 border-green-400 rounded-xl p-4 mb-6 flex items-center gap-3">
                            <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0" />
                            <p className="text-green-900 font-semibold">
                                This questionnaire was already submitted for SY {schoolYear}. You may still review your answers below.
                            </p>
                        </div>
                    )}

                    {/* Step tabs */}
                    <div className="bg-white rounded-xl shadow-lg p-4 mb-6 border-2 border-gray-200">
                        <div className="flex flex-wrap gap-2">
                            {steps.map((s, i) => {
                                const done = stepComplete(s);
                                const active = i === step;
                                return (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => goToStep(i)}
                                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                                            active ? 'bg-blue-600 text-white shadow'
                                                : done ? 'bg-green-100 text-green-800'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                    >
                                        {s.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <form onSubmit={handleSubmit}>
                        {/* PART I - PROFILE */}
                        {current.type === 'profile' && (
                            <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 mb-6 border-2 border-blue-200">
                                <h2 className="text-xl font-bold text-gray-900 mb-1">PART I – Profile</h2>
                                <p className="text-sm text-gray-500 mb-6">Fields marked * are required.</p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    {profileFields.filter((f) => f.type !== 'training_table').map((f) => (
                                        <div key={f.key}>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                {f.label}{f.required ? ' *' : ''}
                                            </label>
                                            {f.options ? (
                                                <select
                                                    value={data.profile[f.key] ?? ''}
                                                    disabled={isSubmitted}
                                                    onChange={(e) => setProfile(f.key, e.target.value)}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                                                >
                                                    <option value="">Select</option>
                                                    {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
                                                </select>
                                            ) : (
                                                <input
                                                    type={f.type === 'number' ? 'number' : 'text'}
                                                    value={data.profile[f.key] ?? ''}
                                                    readOnly={isSubmitted}
                                                    onChange={(e) => setProfile(f.key, e.target.value)}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 read-only:bg-gray-50"
                                                />
                                            )}
                                            {isPrefilled(f.key) && !isSubmitted && (
                                                <p className="mt-1 text-xs text-blue-500">Pre-filled from your records — edit if needed.</p>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* Trainings table */}
                                {profileFields.filter((f) => f.type === 'training_table').map((f) => (
                                    <div key={f.key} className="mt-8">
                                        <label className="block text-sm font-semibold text-gray-700 mb-3">{f.label}</label>
                                        <div className="overflow-x-auto rounded-lg border border-gray-200">
                                            <table className="min-w-full text-sm">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        {f.columns.map((c) => (
                                                            <th key={c.key} className="text-left font-semibold text-gray-700 px-3 py-2">{c.label}</th>
                                                        ))}
                                                        <th className="w-10" />
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {data.trainings.map((row, idx) => (
                                                        <tr key={idx} className="border-t border-gray-100">
                                                            {f.columns.map((c) => (
                                                                <td key={c.key} className="px-3 py-2">
                                                                    {(c.options || c.type === 'year') ? (
                                                                        <select
                                                                            value={row[c.key] ?? ''}
                                                                            disabled={isSubmitted}
                                                                            onChange={(e) => setTraining(idx, c.key, e.target.value)}
                                                                            className="w-full px-2 py-1.5 border border-gray-300 rounded-md disabled:bg-gray-50"
                                                                        >
                                                                            <option value="">—</option>
                                                                            {(c.options || YEAR_OPTIONS).map((o) => <option key={o} value={o}>{o}</option>)}
                                                                        </select>
                                                                    ) : (
                                                                        <input
                                                                            type="text"
                                                                            value={row[c.key] ?? ''}
                                                                            readOnly={isSubmitted}
                                                                            onChange={(e) => setTraining(idx, c.key, e.target.value)}
                                                                            className="w-full px-2 py-1.5 border border-gray-300 rounded-md read-only:bg-gray-50"
                                                                        />
                                                                    )}
                                                                </td>
                                                            ))}
                                                            <td className="px-2 text-center">
                                                                {!isSubmitted && (
                                                                    <button type="button" onClick={() => removeTraining(idx)} className="text-gray-400 hover:text-red-600">
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
                                            <button type="button" onClick={addTraining} className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700">
                                                <Plus className="h-4 w-4" /> Add training
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* PART II / III - rating grids */}
                        {current.type !== 'profile' && (() => {
                            const source = current.type === 'performance' ? performance : challenges;
                            const kra = source.kras[current.ki];
                            const bucket = current.type === 'performance' ? 'performance_ratings' : 'challenge_ratings';
                            const prefix = current.type === 'performance' ? 'p' : 'c';
                            return (
                                <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 mb-6 border-2 border-blue-200">
                                    <p className="text-xs font-bold uppercase tracking-wide text-blue-600">{source.title}</p>
                                    <h2 className="text-xl font-bold text-gray-900 mt-1 mb-4">{kra.code}: {kra.title}</h2>

                                    {/* Legend */}
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs bg-amber-50 border border-amber-200 rounded-lg p-3 mb-5">
                                        {scale.map((sc) => (
                                            <div key={sc.value} className="text-center">
                                                <span className="font-bold text-gray-900">{sc.description}</span>
                                                <span className="block text-gray-600">{sc.label} – {sc.value}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="space-y-3">
                                        {kra.items.map((it) => {
                                            const key = `${prefix}_${current.ki}_${it.no}`;
                                            return (
                                                <div key={key} className="rounded-lg border border-gray-200 p-3">
                                                    <p className="text-sm text-gray-800 mb-2">
                                                        <span className="font-semibold text-gray-500 mr-1">{it.no}.</span>{it.text}
                                                    </p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {scale.map((sc) => {
                                                            const selected = data[bucket][key] === sc.value;
                                                            return (
                                                                <button
                                                                    key={sc.value}
                                                                    type="button"
                                                                    disabled={isSubmitted}
                                                                    onClick={() => setRating(bucket, key, sc.value)}
                                                                    className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition-all ${
                                                                        selected
                                                                            ? 'bg-blue-600 text-white border-blue-600 shadow'
                                                                            : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                                                                    } disabled:opacity-60`}
                                                                    title={sc.description}
                                                                >
                                                                    {sc.label} ({sc.value})
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Nav + actions */}
                        <div className="bg-white rounded-xl shadow-lg p-5 mb-6 border-2 border-gray-200 flex flex-wrap items-center justify-between gap-3">
                            <Button type="button" variant="outline" onClick={() => goToStep(step - 1)} disabled={step === 0}>
                                <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                            </Button>

                            <div className="flex gap-2">
                                {!isSubmitted && (
                                    <Button type="button" variant="outline" onClick={handleSaveDraft} disabled={processing}>
                                        Save Draft
                                    </Button>
                                )}
                                {!isLastStep && (
                                    <Button type="button" onClick={handleNext} className="bg-blue-600 hover:bg-blue-700 text-white">
                                        Next <ChevronRight className="h-4 w-4 ml-1" />
                                    </Button>
                                )}
                                {isLastStep && !isSubmitted && (
                                    <Button type="submit" disabled={processing} className="bg-green-600 hover:bg-green-700 text-white">
                                        <Send className="h-4 w-4 mr-2" /> Submit Questionnaire
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
                                <Button type="button" onClick={handleConfirmSubmit} disabled={processing} className="bg-green-600 hover:bg-green-700 text-white">
                                    Yes, submit
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
        </TeacherLayout>
    );
}
