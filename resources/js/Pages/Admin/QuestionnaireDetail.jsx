import { Head, router, Link } from '@inertiajs/react';
import { useState } from 'react';
import { ArrowLeft, Calendar, User, Star, ClipboardCheck, FileText, ExternalLink } from 'lucide-react';
import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const SURVEY_QUESTIONS = [
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
  "e-TRACES help rater and ratees in PMES collaboration and feedbacking.",
];

const statusBadge = (status) => {
  const v = { draft: 'bg-gray-200 text-gray-800', submitted: 'bg-blue-200 text-blue-800', reviewed: 'bg-green-200 text-green-800' };
  return <Badge className={v[status] || 'bg-gray-200 text-gray-800'}>{status ? status[0].toUpperCase() + status.slice(1) : '—'}</Badge>;
};

const avg = (nums) => (nums.length ? (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2) : null);

function RatingPart({ group, ratings, prefix }) {
  if (!group?.kras?.length) return null;
  const scaleMap = Object.fromEntries((group.scale || []).map((s) => [s.value, s]));
  const all = [];

  return (
    <div className="space-y-5">
      {group.kras.map((kra, ki) => {
        const rows = kra.items.map((it) => {
          const val = ratings?.[`${prefix}_${ki}_${it.no}`] ?? null;
          if (val != null) all.push(val);
          return { ...it, val };
        });
        const kraNums = rows.map((r) => r.val).filter((v) => v != null);
        return (
          <div key={ki} className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 flex items-center justify-between">
              <p className="font-semibold text-gray-800 text-sm">{kra.code}: {kra.title}</p>
              <span className="text-xs text-gray-500">Avg {avg(kraNums) ?? '—'}</span>
            </div>
            <table className="w-full text-sm">
              <tbody>
                {rows.map((r) => {
                  const sc = scaleMap[r.val];
                  return (
                    <tr key={r.no} className="border-t border-gray-100">
                      <td className="px-4 py-2 text-gray-400 w-8 align-top">{r.no}.</td>
                      <td className="px-2 py-2 text-gray-700">{r.text}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-right">
                        {r.val != null
                          ? <span className="font-semibold text-blue-700">{sc ? `${sc.label} (${sc.description})` : r.val} · {r.val}</span>
                          : <span className="text-gray-400">Not rated</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      })}
      <div className="bg-emerald-50 border-2 border-emerald-200 rounded-lg p-4 text-center">
        <p className="text-sm font-semibold text-emerald-900">Section average</p>
        <p className="text-3xl font-bold text-emerald-700">{avg(all) ?? '—'} <span className="text-lg">/ 5</span></p>
      </div>
    </div>
  );
}

export default function QuestionnaireDetail({ teacher, year, availableYears = [], survey, surveyTemplate, shs, shsTemplate, selfRatings = [] }) {
  const surveyItems = surveyTemplate?.structure?.items;
  const questionText = (n) => (Array.isArray(surveyItems) && surveyItems[n - 1]?.text) || SURVEY_QUESTIONS[n - 1] || 'Question';
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState(0);
  const PER = 10;

  const setStatus = (status) => {
    if (!survey || !confirm(`Mark the self-assessment survey as ${status}?`)) return;
    setBusy(true);
    router.post(route('admin.questionnaire.update-status', survey.id), { status }, {
      preserveScroll: true, onFinish: () => setBusy(false),
    });
  };

  const surveyResponses = survey?.responses ? Object.entries(survey.responses)
    .map(([k, v]) => [parseInt(k.replace('question_', ''), 10), v])
    .sort((a, b) => a[0] - b[0]) : [];
  const surveyAvg = surveyResponses.length
    ? (surveyResponses.reduce((a, [, v]) => a + v, 0) / surveyResponses.length).toFixed(2) : null;
  const totalSteps = Math.ceil(surveyResponses.length / PER);
  const curStep = Math.min(step, Math.max(0, totalSteps - 1));

  const profileFields = (shsTemplate?.structure?.profile_fields || []).filter((f) => f.type !== 'training_table');
  const trainingCols = (shsTemplate?.structure?.profile_fields || []).find((f) => f.type === 'training_table')?.columns || [];

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Head title={`Submissions — ${teacher.name}`} />
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem><BreadcrumbLink href={route('admin.questionnaire-results')}>Questionnaires</BreadcrumbLink></BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem><BreadcrumbPage>Detail</BreadcrumbPage></BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex-1 p-6 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
          <Link href={route('admin.questionnaire-results')} className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium mb-6">
            <ArrowLeft className="h-4 w-4" /> Back to Questionnaires
          </Link>

          {/* Header */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border-2 border-blue-200">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{teacher.name}</h1>
                <p className="text-sm text-gray-500">{teacher.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">School Year:</span>
                {availableYears.length ? availableYears.map((y) => (
                  <Link key={y} href={route('admin.questionnaire.show', [teacher.id, y])}
                    className={`px-2.5 py-1 rounded text-sm font-semibold ${y === year ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                    {y}
                  </Link>
                )) : <span className="font-semibold">{year || '—'}</span>}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100 text-sm">
              <Badge className={survey ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-400'}>Self-Assessment Survey {survey ? '✓' : '—'}</Badge>
              <Badge className={shs ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-400'}>SHS Performance &amp; Challenges {shs ? '✓' : '—'}</Badge>
              <Badge className={selfRatings.length ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-400'}>Self-Rating Uploads ({selfRatings.length})</Badge>
            </div>
          </div>

          {/* ---------- Self-Rating uploads ---------- */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border-2 border-amber-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-amber-600" /> Self-Rating for KRA's
            </h2>
            {selfRatings.length === 0 ? (
              <p className="text-sm text-gray-500">No self-rating documents uploaded.</p>
            ) : (
              <div className="space-y-3">
                {selfRatings.map((sr) => (
                  <div key={sr.id} className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg border border-amber-200 bg-amber-50/50">
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 text-sm">{sr.kra}</p>
                      <p className="text-xs text-gray-500">
                        {sr.original_name || 'document.pdf'} · uploaded {sr.uploaded_at ? new Date(sr.uploaded_at).toLocaleString() : '—'}
                        {sr.self_rating != null ? ` · self-rating ${sr.self_rating.toFixed(2)}/5` : ''}
                      </p>
                      {sr.notes && <p className="text-xs text-gray-600 italic mt-1">{sr.notes}</p>}
                    </div>
                    {sr.file_url && (
                      <a href={sr.file_url} target="_blank" rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700">
                        <ExternalLink className="h-4 w-4" /> Open PDF
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ---------- SHS Performance & Challenges ---------- */}
          {shs && (
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border-2 border-emerald-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-emerald-600" /> SHS Performance &amp; Challenges
                </h2>
                {statusBadge(shs.status)}
              </div>

              {/* Part I */}
              <h3 className="font-semibold text-gray-800 mb-2">Part I – Profile</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                {profileFields.map((f) => (
                  <div key={f.key} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <p className="text-xs font-semibold text-gray-500">{f.label}</p>
                    <p className="text-sm text-gray-900">{shs.profile?.[f.key] || '—'}</p>
                  </div>
                ))}
              </div>
              {Array.isArray(shs.trainings) && shs.trainings.length > 0 && (
                <div className="overflow-x-auto rounded-lg border border-gray-200 mb-6">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>{trainingCols.map((c) => <th key={c.key} className="text-left font-semibold text-gray-700 px-3 py-2">{c.label}</th>)}</tr>
                    </thead>
                    <tbody>
                      {shs.trainings.map((row, i) => (
                        <tr key={i} className="border-t border-gray-100">
                          {trainingCols.map((c) => <td key={c.key} className="px-3 py-2 text-gray-700">{row[c.key] || '—'}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <h3 className="font-semibold text-gray-800 mb-2">{shsTemplate?.structure?.performance?.title || 'Part II – Performance Rating'}</h3>
              <RatingPart group={shsTemplate?.structure?.performance} ratings={shs.performance_ratings} prefix="p" />

              <h3 className="font-semibold text-gray-800 mt-6 mb-2">{shsTemplate?.structure?.challenges?.title || 'Part III – Challenges Encountered'}</h3>
              <RatingPart group={shsTemplate?.structure?.challenges} ratings={shs.challenge_ratings} prefix="c" />

              <p className="text-xs text-gray-400 mt-4">
                Submitted {shs.submitted_at ? new Date(shs.submitted_at).toLocaleString() : 'not yet'} · last updated {new Date(shs.updated_at).toLocaleString()}
              </p>
            </div>
          )}

          {/* ---------- Self-Assessment Survey (e-TRACES) ---------- */}
          {survey && (
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border-2 border-yellow-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-600" /> Ready for Self-Assessment — e-TRACES Survey
                </h2>
                <div className="flex items-center gap-2">
                  {statusBadge(survey.status)}
                  {survey.status === 'draft' && <Button size="sm" disabled={busy} onClick={() => setStatus('submitted')} className="bg-blue-600 hover:bg-blue-700">Mark Submitted</Button>}
                  {survey.status === 'submitted' && <Button size="sm" disabled={busy} onClick={() => setStatus('reviewed')} className="bg-green-600 hover:bg-green-700">Mark Reviewed</Button>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                <div className="bg-gray-50 rounded-lg p-3 border"><p className="text-xs font-semibold text-gray-500">Name</p><p className="text-sm">{survey.name || '—'}</p></div>
                <div className="bg-gray-50 rounded-lg p-3 border"><p className="text-xs font-semibold text-gray-500">Sex</p><p className="text-sm">{survey.sex || '—'}</p></div>
                <div className="bg-gray-50 rounded-lg p-3 border"><p className="text-xs font-semibold text-gray-500">Years of Service</p><p className="text-sm">{survey.years_of_service || '—'}</p></div>
                <div className="bg-gray-50 rounded-lg p-3 border"><p className="text-xs font-semibold text-gray-500">Last IPCR Rating</p><p className="text-sm">{survey.last_ipcr_rating || '—'}</p></div>
              </div>

              {surveyResponses.length > 0 ? (
                <>
                  {totalSteps > 1 && (
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm text-gray-600">Questions {curStep * PER + 1}–{Math.min((curStep + 1) * PER, surveyResponses.length)} of {surveyResponses.length}</p>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" disabled={curStep === 0} onClick={() => setStep((s) => s - 1)}>Prev</Button>
                        <Button size="sm" variant="outline" disabled={curStep >= totalSteps - 1} onClick={() => setStep((s) => s + 1)}>Next</Button>
                      </div>
                    </div>
                  )}
                  <div className="space-y-2">
                    {surveyResponses.slice(curStep * PER, curStep * PER + PER).map(([n, rating]) => (
                      <div key={n} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start justify-between gap-3">
                        <p className="text-sm text-gray-700"><span className="font-bold text-yellow-800 mr-1">{n}.</span>{questionText(n)}</p>
                        <span className="text-sm font-bold text-yellow-900 whitespace-nowrap">{rating} / 5</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 bg-emerald-50 border-2 border-emerald-200 rounded-lg p-4 text-center">
                    <p className="text-sm font-semibold text-emerald-900">Overall average</p>
                    <p className="text-3xl font-bold text-emerald-700">{surveyAvg} / 5.0</p>
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-500">No survey answers recorded yet.</p>
              )}
            </div>
          )}

          {!survey && !shs && selfRatings.length === 0 && (
            <div className="bg-white rounded-xl shadow-lg p-10 border-2 border-gray-200 text-center">
              <User className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600">Nothing submitted by this teacher for {year || 'the selected year'}.</p>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-lg p-4 border-2 border-gray-200 text-xs text-gray-500 flex items-center gap-2">
            <Calendar className="h-4 w-4" /> School year {year || '—'}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
