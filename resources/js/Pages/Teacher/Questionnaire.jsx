import { Head, useForm, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { useState, useRef } from 'react';
import { Send, FileText, ArrowLeft, Star, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import TeacherLayout from '@/Layouts/TeacherLayout';
import PageHeader from '@/Components/Teacher/PageHeader';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const QUESTIONS_PER_STEP = 10;

export default function Questionnaire({ questionnaire, schoolYear, user, template }) {
    const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
    const [step, setStep] = useState(0);
    const confirmRef = useRef(null);
    const isSubmitted = questionnaire?.status === 'submitted';

    // Auto-fill Sex from the teacher's profile gender when it exists.
    const profileGender = user?.gender || '';

    const { data, setData, post, processing, errors, transform } = useForm({
        school_year: schoolYear,
        name: questionnaire?.name || user.name || '',
        sex: profileGender || questionnaire?.sex || '',
        years_of_service: questionnaire?.years_of_service || '',
        last_ipcr_rating: questionnaire?.last_ipcr_rating || '',
        responses: questionnaire?.responses || {},
        status: 'draft',
    });

    // e-TRACES DMS Satisfaction Survey Questions (30 items). Used only when the
    // editable "flat" template hasn't been seeded yet - see below.
    const DEFAULT_QUESTIONS = [
        "This DMS platform has much that is of interest to me.",
        "It is easy to move around the platform.",
        "I can quickly find what I want on e-TRACES.",
        "e-TRACES helps me monitor my progress.",
        "It is easy to store, retrieve, and reproduce files using e-TRACES",
        "The files/documents on e-TRACES are very useful",
        "I feel in control when I'm using this DMS platform",
        "This DMS platform is fast when tracing needed documents.",
        "e-TRACES is useful in producing my portfolio.",
        "Learning to find my way around this DMS platform is user-friendly",
        "I like using this DMS platform",
        "I can easily access documents in the e-TRACES contacts anywhere I am as long as there is internet connectivity",
        "I feel efficient when I'm using e-TRACES",
        "The e-TRACES has some simple and attractive features",
        "Using e-TRACES for the first time is easy to operate and control.",
        "The e-TRACES enables pleasing and satisfying interaction for the user",
        "The DMS platform can be used by specified users to achieve specified goals, freedom from risk, and satisfaction in a specified context of use.",
        "The system can delete, edit, and recover uploaded files.",
        "The system ensures that data are accessible only to those authorized to have access.",
        "The system prevents unauthorized access to, or modification of computer, or programs data.",
        "The system can perform its required functions efficiently while sharing a common environment and resources with other documents or files without a detrimental impact to any other files.",
        "e-TRACES is indeed useful to me especially when tracing my loss files.",
        "Using DMS is not a waste of time",
        "e-TRACES can help me manage my documents/files",
        "DMS platform is efficient in providing relevant work files even in the needed personnel is distant",
        "e-TRACES is useful in justifying authenticity of MOVs aligned to IPCR",
        "the DMS platform made my e-portfolio easier",
        "Uploaded MOVs can be monitored easily by the rater using e-TRACES",
        "e-TRACES can serve as devise scheme for peer mentoring, coaching, and evaluation",
        "e-TRACES help rater and ratees in PMES collaboration and feedbacking."
    ];

    const DEFAULT_SCALE = [
        { value: 5, label: 'VS', description: 'Very Satisfied' },
        { value: 4, label: 'S', description: 'Satisfied' },
        { value: 3, label: 'N', description: 'Neither' },
        { value: 2, label: 'DS', description: 'Dissatisfied' },
        { value: 1, label: 'VD', description: 'Very Dissatisfied' }
    ];

    // Prefer the Administrator-editable template; fall back to the defaults.
    const tplItems = template?.structure?.items;
    const tplScale = template?.structure?.scale;
    const surveyQuestions = (Array.isArray(tplItems) && tplItems.length)
        ? tplItems.map((i) => i.text)
        : DEFAULT_QUESTIONS;
    const ratingScale = (Array.isArray(tplScale) && tplScale.length)
        ? tplScale.map((s) => ({ value: s.value, label: s.label, description: s.description }))
        : DEFAULT_SCALE;
    const surveyInstructions = template?.structure?.instructions;

    const handleRatingChange = (questionIndex, rating) => {
        setData('responses', {
            ...data.responses,
            [`question_${questionIndex + 1}`]: rating
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Check if all questions are answered
        const totalQuestions = surveyQuestions.length;
        const answeredQuestions = Object.keys(data.responses).length;
        
        if (answeredQuestions < totalQuestions) {
            toast.error(`Please answer all questions. ${answeredQuestions}/${totalQuestions} answered.`);
            return;
        }
        
        if (showSubmitConfirm) {
            // Force the payload status regardless of React state batching timing
            transform((payload) => ({ ...payload, status: 'submitted' }));
            post(route('teacher.questionnaire.store'), {
                onSuccess: () => {
                    transform((payload) => payload);
                    toast.success('Thank you! Your feedback has been submitted successfully.');
                    setShowSubmitConfirm(false);
                },
                onError: () => {
                    transform((payload) => payload);
                    toast.error('Failed to submit questionnaire. Please try again.');
                }
            });
        } else {
            setShowSubmitConfirm(true);
            setTimeout(() => {
                confirmRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 50);
        }
    };

    const handleSaveDraft = () => {
        transform((payload) => ({ ...payload, status: 'draft' }));
        post(route('teacher.questionnaire.store'), {
            onSuccess: () => {
                transform((payload) => payload);
                toast.success('Draft saved successfully!');
            },
            onError: () => {
                transform((payload) => payload);
                toast.error('Failed to save draft.');
            }
        });
    };

    const getAnsweredCount = () => {
        return Object.values(data.responses).filter(value => value !== null && value !== undefined && value !== '').length;
    };

    const getProgress = () => {
        return Math.round((getAnsweredCount() / surveyQuestions.length) * 100);
    };

    // ---- Stepper: show QUESTIONS_PER_STEP questions per batch ----
    const totalSteps = Math.ceil(surveyQuestions.length / QUESTIONS_PER_STEP);
    const stepStart = step * QUESTIONS_PER_STEP;
    const stepEnd = Math.min(stepStart + QUESTIONS_PER_STEP, surveyQuestions.length);
    const stepQuestions = surveyQuestions
        .map((question, index) => ({ question, index }))
        .slice(stepStart, stepEnd);
    const isLastStep = step === totalSteps - 1;

    const isAnswered = (index) => {
        const value = data.responses[`question_${index + 1}`];
        return value !== null && value !== undefined && value !== '';
    };

    const stepAnsweredCount = (stepIndex) => {
        const start = stepIndex * QUESTIONS_PER_STEP;
        const end = Math.min(start + QUESTIONS_PER_STEP, surveyQuestions.length);
        let count = 0;
        for (let i = start; i < end; i++) {
            if (isAnswered(i)) count++;
        }
        return count;
    };

    const stepSize = (stepIndex) => {
        const start = stepIndex * QUESTIONS_PER_STEP;
        return Math.min(start + QUESTIONS_PER_STEP, surveyQuestions.length) - start;
    };

    const currentStepComplete = stepAnsweredCount(step) === stepQuestions.length;

    const goToStep = (target) => {
        setShowSubmitConfirm(false);
        setStep(Math.max(0, Math.min(target, totalSteps - 1)));
        if (typeof window !== 'undefined') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleNext = () => {
        if (!currentStepComplete) {
            toast.error(`Please answer all ${stepQuestions.length} questions in this section before continuing.`);
            return;
        }
        goToStep(step + 1);
    };

    // Legend chip colours by scale value (5 = best), in the Admin Panel palette.
    const legendClass = (value) =>
        ({
            5: 'bg-green-900 text-white',
            4: 'bg-green-700 text-white',
            3: 'bg-white text-gray-700',
            2: 'bg-yellow-100 text-yellow-800',
            1: 'bg-red-100 text-red-800',
        })[value] || 'bg-white text-gray-700';

    const answeredCount = getAnsweredCount();
    const progress = getProgress();

    return (
        <TeacherLayout user={user}>
            <Head title="Teacher Satisfaction Questionnaire" />
            <ToastContainer position="top-right" />

            <div className="min-h-screen bg-[hsl(var(--canvas))] text-foreground">
                <PageHeader
                    title="e-TRACES: Teachers Level of Satisfaction and Performance"
                    subtitle={`SY ${schoolYear} · required before you file your signed IPCRF`}
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
                                {answeredCount} of {surveyQuestions.length} statements answered
                            </span>
                            <strong className="text-yellow-300">{isSubmitted ? 'Submitted' : `${progress}% · draft`}</strong>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-white/20">
                            <div className="h-full rounded-full bg-yellow-400 transition-all duration-300" style={{ width: `${progress}%` }} />
                        </div>
                    </div>
                </PageHeader>

                <main className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-7 sm:px-6 lg:px-12">
                    {/* Already submitted */}
                    {isSubmitted && (
                        <div className="flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 p-5">
                            <CheckCircle2 className="h-6 w-6 flex-shrink-0 text-green-700" />
                            <p className="font-semibold text-green-900">
                                This questionnaire has already been submitted for SY {schoolYear}. Your Signed IPCRF submission is now unlocked.
                            </p>
                        </div>
                    )}

                    {/* Answered everything but not submitted yet */}
                    {!isSubmitted && answeredCount === surveyQuestions.length && (
                        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-yellow-200 bg-yellow-50 p-5">
                            <div className="flex items-start gap-3">
                                <Send className="mt-0.5 h-6 w-6 flex-shrink-0 text-yellow-700" />
                                <div>
                                    <p className="text-lg font-bold text-yellow-900">One more step — you haven't submitted yet</p>
                                    <p className="mt-1 text-sm text-yellow-800">
                                        All {surveyQuestions.length} statements are answered, but this is still a <span className="font-semibold">draft</span>.
                                        Click <span className="font-semibold">Submit questionnaire</span>, then confirm — otherwise your Signed IPCRF stays locked.
                                    </p>
                                </div>
                            </div>
                            <Button
                                type="button"
                                onClick={() => { goToStep(totalSteps - 1); handleSubmit({ preventDefault: () => {} }); }}
                                className="h-11 rounded-xl bg-yellow-400 px-5 font-bold text-green-900 hover:bg-yellow-300"
                            >
                                <Send className="mr-2 h-4 w-4" />
                                Go to submit
                            </Button>
                        </div>
                    )}

                    {/* Basic Information */}
                    <section className="flex flex-col gap-4 rounded-2xl border border-border bg-white px-6 py-5">
                        <div className="flex flex-col gap-1.5">
                            <span className="h-1 w-10 rounded-full bg-yellow-400" />
                            <h2 className="text-lg font-bold text-gray-900">Basic information</h2>
                        </div>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="q-name" className="text-[13px] font-semibold text-gray-900">Name</label>
                                <input
                                    id="q-name"
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    className="h-11 rounded-[10px] border border-border px-3 text-sm focus:border-green-600 focus:ring-2 focus:ring-yellow-300"
                                    placeholder="Your name"
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="q-sex" className="text-[13px] font-semibold text-gray-900">Sex</label>
                                {profileGender ? (
                                    <>
                                        <input
                                            id="q-sex"
                                            type="text"
                                            value={data.sex}
                                            readOnly
                                            className="h-11 rounded-[10px] border border-border bg-[hsl(var(--canvas))] px-3 text-sm text-gray-700"
                                        />
                                        <p className="text-xs text-gray-500">Auto-filled from your profile</p>
                                    </>
                                ) : (
                                    <select
                                        id="q-sex"
                                        value={data.sex}
                                        onChange={(e) => setData('sex', e.target.value)}
                                        className="h-11 rounded-[10px] border border-border px-3 text-sm focus:border-green-600 focus:ring-2 focus:ring-yellow-300"
                                    >
                                        <option value="">Select</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                    </select>
                                )}
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="q-years" className="text-[13px] font-semibold text-gray-900">Years in the service</label>
                                <select
                                    id="q-years"
                                    value={data.years_of_service}
                                    onChange={(e) => setData('years_of_service', e.target.value)}
                                    className="h-11 rounded-[10px] border border-border px-3 text-sm focus:border-green-600 focus:ring-2 focus:ring-yellow-300"
                                >
                                    <option value="">Select</option>
                                    <option value="0-5">0-5 years</option>
                                    <option value="6-10">6-10 years</option>
                                    <option value="11-15">11-15 years</option>
                                    <option value="15-20">15-20 years</option>
                                    <option value="20+">longer than 20 years</option>
                                </select>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="q-ipcr" className="text-[13px] font-semibold text-gray-900">Last IPCR numerical rating</label>
                                <input
                                    id="q-ipcr"
                                    type="text"
                                    value={data.last_ipcr_rating}
                                    onChange={(e) => setData('last_ipcr_rating', e.target.value)}
                                    className="h-11 rounded-[10px] border border-border px-3 text-sm focus:border-green-600 focus:ring-2 focus:ring-yellow-300"
                                    placeholder="e.g., 4.5"
                                />
                            </div>
                        </div>
                    </section>

                    {/* Instructions */}
                    <section className="rounded-2xl border border-border bg-white px-6 py-5 text-sm leading-relaxed text-gray-700">
                        {surveyInstructions ? (
                            <p className="whitespace-pre-line">{surveyInstructions}</p>
                        ) : (
                            <div className="flex flex-col gap-3">
                                <p>
                                    A series of statements are listed below. Each one describes a situation which may be related to a certain extent to what you do or feel. Mark with a <span className="font-bold">✓</span> the option that best applies to how often you engaged in the mentioned activity.
                                </p>
                                <p>
                                    It is important for you to know that this questionnaire is completely independent and that there is not a correct or incorrect answer. The information you provide will be kept confidentially. Thank you very much.
                                </p>
                            </div>
                        )}
                    </section>

                    {/* Legend - sticky while answering */}
                    <div className="sticky top-0 z-20 flex flex-wrap items-center gap-2 rounded-2xl border border-yellow-200 bg-yellow-50/95 px-4 py-3 shadow-sm backdrop-blur-sm">
                        <span className="text-[13px] font-bold text-yellow-900">Legend</span>
                        {ratingScale.map((scale) => (
                            <span key={scale.value} className={`rounded-full px-2.5 py-1 text-xs font-bold ${legendClass(scale.value)}`}>
                                {scale.label} · {scale.description} ({scale.value})
                            </span>
                        ))}
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                        {/* Section tabs */}
                        <div role="tablist" aria-label="Survey sections" className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                            {Array.from({ length: totalSteps }).map((_, i) => {
                                const answered = stepAnsweredCount(i);
                                const size = stepSize(i);
                                const done = answered === size;
                                const active = i === step;
                                const first = i * QUESTIONS_PER_STEP + 1;
                                return (
                                    <button
                                        key={i}
                                        type="button"
                                        role="tab"
                                        aria-selected={active}
                                        onClick={() => goToStep(i)}
                                        className={`flex items-center justify-between gap-3 rounded-[14px] border-2 px-4 py-3.5 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 ${
                                            active ? 'border-green-700 bg-green-50' : 'border-border bg-white hover:border-green-300'
                                        }`}
                                    >
                                        <span className="flex flex-col gap-0.5">
                                            <strong className="text-sm text-gray-900">Section {i + 1}</strong>
                                            <span className="text-xs text-gray-500">
                                                Items {first}–{first + size - 1} · {answered}/{size} answered
                                            </span>
                                        </span>
                                        {done && <CheckCircle2 className="h-5 w-5 flex-none text-green-700" aria-label="Section complete" />}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Questions */}
                        <section className="overflow-hidden rounded-2xl border border-border bg-white">
                            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-gray-100 px-6 py-4">
                                <h2 className="text-lg font-bold text-gray-900">Survey questions</h2>
                                <span className="text-[13px] text-gray-500">
                                    Section {step + 1} of {totalSteps} · Items {stepStart + 1}–{stepEnd} of {surveyQuestions.length}
                                </span>
                            </div>

                            {stepQuestions.map(({ question, index }) => {
                                const value = data.responses[`question_${index + 1}`];
                                const answered = isAnswered(index);
                                return (
                                    <fieldset key={index} className="flex flex-wrap items-center gap-x-5 gap-y-3 border-b border-gray-100 px-6 py-4 last:border-b-0">
                                        <legend className="sr-only">Statement {index + 1}</legend>
                                        <span
                                            className={`flex h-[30px] w-[30px] flex-none items-center justify-center rounded-full text-[13px] font-extrabold ${
                                                answered ? 'bg-green-700 text-white' : 'bg-gray-100 text-gray-500'
                                            }`}
                                        >
                                            {index + 1}
                                        </span>
                                        <p className="min-w-0 flex-[1_1_420px] text-[15px] leading-relaxed text-gray-900">{question}</p>
                                        <div className="flex gap-1.5">
                                            {ratingScale.map((scale) => {
                                                const on = value === scale.value;
                                                return (
                                                    <label
                                                        key={scale.value}
                                                        title={`${scale.description} (${scale.value})`}
                                                        className={`flex h-10 w-12 cursor-pointer items-center justify-center rounded-[10px] border text-[13px] font-extrabold transition-colors focus-within:ring-2 focus-within:ring-yellow-400 ${
                                                            on ? 'border-green-700 bg-green-700 text-white' : 'border-border bg-white text-gray-700 hover:border-green-700'
                                                        }`}
                                                    >
                                                        <input
                                                            type="radio"
                                                            name={`question_${index + 1}`}
                                                            value={scale.value}
                                                            checked={on}
                                                            onChange={() => handleRatingChange(index, scale.value)}
                                                            className="sr-only"
                                                        />
                                                        {scale.label}
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </fieldset>
                                );
                            })}

                            {/* Step navigation */}
                            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-gray-100 bg-[hsl(var(--canvas))] px-6 py-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => goToStep(step - 1)}
                                    disabled={step === 0}
                                    className="h-11 rounded-xl font-bold"
                                >
                                    <ChevronLeft className="mr-1 h-4 w-4" />
                                    Previous
                                </Button>

                                <span className="text-sm text-gray-500">
                                    {stepAnsweredCount(step)}/{stepQuestions.length} answered in this section
                                </span>

                                {!isLastStep ? (
                                    <Button
                                        type="button"
                                        onClick={handleNext}
                                        disabled={!currentStepComplete}
                                        className="h-11 rounded-xl bg-green-700 px-5 font-bold text-white hover:bg-green-800 disabled:opacity-40"
                                    >
                                        Next section
                                        <ChevronRight className="ml-1 h-4 w-4" />
                                    </Button>
                                ) : (
                                    <span className="text-sm font-semibold text-green-700">Final section</span>
                                )}
                            </div>
                        </section>

                        {/* Submit Confirmation */}
                        {isLastStep && showSubmitConfirm && (
                            <div ref={confirmRef} className="flex flex-col gap-4 rounded-2xl border border-yellow-200 bg-yellow-50 p-6">
                                <p className="font-semibold text-yellow-900">
                                    Are you sure you want to submit? You won't be able to edit your responses after submission.
                                </p>
                                <div className="flex flex-wrap gap-3">
                                    <Button type="submit" disabled={processing} className="h-11 rounded-xl bg-green-700 px-5 font-bold text-white hover:bg-green-800">
                                        <Send className="mr-2 h-4 w-4" />
                                        Yes, submit now
                                    </Button>
                                    <Button type="button" variant="outline" onClick={() => setShowSubmitConfirm(false)} className="h-11 rounded-xl font-bold">
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-2 rounded-2xl border border-border bg-white px-6 py-4">
                            <div className="flex flex-wrap justify-end gap-3">
                                <Button type="button" variant="outline" onClick={handleSaveDraft} disabled={processing} className="h-12 rounded-xl px-5 font-bold">
                                    Save draft
                                </Button>
                                {isLastStep && (
                                    <Button
                                        type="submit"
                                        disabled={processing || answeredCount < surveyQuestions.length}
                                        className="h-12 rounded-xl bg-green-700 px-6 font-bold text-white hover:bg-green-800"
                                    >
                                        <Send className="mr-2 h-4 w-4" />
                                        {showSubmitConfirm ? 'Confirm submit' : 'Submit questionnaire'}
                                    </Button>
                                )}
                            </div>
                            {isLastStep && answeredCount < surveyQuestions.length && (
                                <p className="text-right text-sm text-red-600">
                                    Please answer all {surveyQuestions.length} questions (across every section) before submitting
                                </p>
                            )}
                        </div>
                    </form>
                </main>
            </div>
        </TeacherLayout>
    );
}
