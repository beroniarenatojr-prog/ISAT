import { useState, useEffect } from 'react';
import { X, AlertCircle, Clock, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DeadlineReminder({ activeConfig, submissions, signedIpcrf }) {
    const [showReminder, setShowReminder] = useState(false);
    const [daysLeft, setDaysLeft] = useState(null);
    const [urgency, setUrgency] = useState('normal');

    useEffect(() => {
        if (!activeConfig || !activeConfig.submission_end_date) {
            return;
        }

        // Calculate days left
        const endDate = new Date(activeConfig.submission_end_date);
        const today = new Date();
        const diffTime = endDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        setDaysLeft(diffDays);

        // Determine urgency level
        if (diffDays <= 0) {
            setUrgency('expired');
        } else if (diffDays <= 1) {
            setUrgency('critical');
        } else if (diffDays <= 3) {
            setUrgency('urgent');
        } else if (diffDays <= 7) {
            setUrgency('warning');
        } else {
            setUrgency('normal');
        }

        // Check if user has dismissed reminder in this session
        const dismissedKey = `reminder_dismissed_${activeConfig.school_year}`;
        const isDismissed = sessionStorage.getItem(dismissedKey);

        // Show reminder if deadline is within 7 days and not dismissed
        if (diffDays > 0 && diffDays <= 7 && !isDismissed) {
            setShowReminder(true);
        }
    }, [activeConfig]);

    const handleDismiss = () => {
        setShowReminder(false);
        // Store dismissal in session storage
        if (activeConfig) {
            sessionStorage.setItem(`reminder_dismissed_${activeConfig.school_year}`, 'true');
        }
    };

    if (!showReminder || !activeConfig) {
        return null;
    }

    const urgencyStyles = {
        critical: {
            bg: 'bg-red-50',
            border: 'border-red-500',
            text: 'text-red-900',
            icon: 'text-red-600',
            badge: 'bg-red-600 text-white',
        },
        urgent: {
            bg: 'bg-orange-50',
            border: 'border-orange-500',
            text: 'text-orange-900',
            icon: 'text-orange-600',
            badge: 'bg-orange-600 text-white',
        },
        warning: {
            bg: 'bg-yellow-50',
            border: 'border-yellow-500',
            text: 'text-yellow-900',
            icon: 'text-yellow-600',
            badge: 'bg-yellow-600 text-white',
        },
        normal: {
            bg: 'bg-blue-50',
            border: 'border-blue-500',
            text: 'text-blue-900',
            icon: 'text-blue-600',
            badge: 'bg-blue-600 text-white',
        },
    };

    const style = urgencyStyles[urgency] || urgencyStyles.normal;

    const getUrgencyMessage = () => {
        if (daysLeft <= 1) {
            return 'URGENT: Deadline is tomorrow!';
        } else if (daysLeft <= 3) {
            return `URGENT: Only ${daysLeft} days left!`;
        } else if (daysLeft <= 7) {
            return `Reminder: ${daysLeft} days until deadline`;
        }
        return 'Upcoming deadline';
    };

    // Check completion status
    const hasSubmissions = submissions && submissions.length > 0;
    const hasSignedIpcrf = signedIpcrf && signedIpcrf.status;

    return (
        <div className={`fixed top-20 right-4 z-40 max-w-md animate-slide-in-right shadow-2xl`}>
            <div className={`${style.bg} ${style.border} border-l-4 rounded-lg p-4 relative`}>
                <button
                    onClick={handleDismiss}
                    className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 transition-colors"
                >
                    <X className="h-5 w-5" />
                </button>

                <div className="flex items-start gap-3 pr-8">
                    <div className={`w-10 h-10 ${style.bg} rounded-full flex items-center justify-center flex-shrink-0 ring-2 ring-offset-2 ${style.border}`}>
                        <AlertCircle className={`h-6 w-6 ${style.icon}`} />
                    </div>

                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <h3 className={`font-bold text-lg ${style.text}`}>
                                {getUrgencyMessage()}
                            </h3>
                            <span className={`px-2 py-1 rounded text-xs font-bold ${style.badge}`}>
                                {daysLeft} {daysLeft === 1 ? 'day' : 'days'}
                            </span>
                        </div>

                        <p className={`text-sm ${style.text} mb-3`}>
                            IPCRF submission deadline for SY {activeConfig.school_year}
                        </p>

                        <div className="space-y-2 mb-3">
                            <div className="flex items-center gap-2 text-sm">
                                <Calendar className={`h-4 w-4 ${style.icon}`} />
                                <span className={style.text}>
                                    Deadline: {new Date(activeConfig.submission_end_date).toLocaleDateString('en-US', {
                                        month: 'long',
                                        day: 'numeric',
                                        year: 'numeric'
                                    })}
                                </span>
                            </div>

                            <div className="flex items-center gap-2 text-sm">
                                <Clock className={`h-4 w-4 ${style.icon}`} />
                                <span className={style.text}>
                                    Time remaining: {daysLeft} {daysLeft === 1 ? 'day' : 'days'}
                                </span>
                            </div>
                        </div>

                        {/* Progress Checklist */}
                        <div className={`bg-white/50 rounded-lg p-3 space-y-2 border ${style.border}`}>
                            <p className={`text-xs font-semibold ${style.text} mb-2`}>Your Progress:</p>
                            
                            <div className="flex items-center gap-2">
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                                    hasSubmissions ? 'bg-green-500' : 'bg-gray-300'
                                }`}>
                                    {hasSubmissions && <span className="text-white text-xs">✓</span>}
                                </div>
                                <span className={`text-sm ${hasSubmissions ? 'font-semibold' : ''} ${style.text}`}>
                                    MOV Submissions {hasSubmissions ? '✓' : '(Pending)'}
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                                    hasSignedIpcrf ? 'bg-green-500' : 'bg-gray-300'
                                }`}>
                                    {hasSignedIpcrf && <span className="text-white text-xs">✓</span>}
                                </div>
                                <span className={`text-sm ${hasSignedIpcrf ? 'font-semibold' : ''} ${style.text}`}>
                                    Signed IPCRF {hasSignedIpcrf ? '✓' : '(Pending)'}
                                </span>
                            </div>
                        </div>

                        <div className="mt-3 flex gap-2">
                            <Button
                                onClick={() => window.location.href = route('teacher.ipcrf')}
                                size="sm"
                                className={`${style.badge} hover:opacity-90`}
                            >
                                Submit Now
                            </Button>
                            <Button
                                onClick={handleDismiss}
                                size="sm"
                                variant="outline"
                            >
                                Remind Later
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
