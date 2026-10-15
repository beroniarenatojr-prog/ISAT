import { useState } from 'react';
import { X, Star, Send, ThumbsUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { router } from '@inertiajs/react';

export default function SurveyModal({ isOpen, onClose, ratingData }) {
    const [responses, setResponses] = useState({
        process_clarity: 0,
        submission_ease: 0,
        admin_feedback: 0,
        objectives_clarity: 0,
        system_usability: 0,
    });
    const [overallSatisfaction, setOverallSatisfaction] = useState(0);
    const [comments, setComments] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const questions = [
        {
            key: 'process_clarity',
            question: 'How clear was the IPCRF evaluation process?',
            description: 'Understanding of criteria and expectations'
        },
        {
            key: 'submission_ease',
            question: 'How easy was it to submit your evidence (MOVs)?',
            description: 'Upload process and system usability'
        },
        {
            key: 'admin_feedback',
            question: 'How helpful was the feedback from your evaluator?',
            description: 'Quality and constructiveness of remarks'
        },
        {
            key: 'objectives_clarity',
            question: 'How clear were the objectives and competencies?',
            description: 'Understanding what was expected'
        },
        {
            key: 'system_usability',
            question: 'How user-friendly was the e-TRACES system?',
            description: 'Overall system experience'
        },
    ];

    const handleRatingClick = (questionKey, rating) => {
        setResponses(prev => ({
            ...prev,
            [questionKey]: rating
        }));
    };

    const handleSubmit = () => {
        // Check if all questions are answered
        const allAnswered = Object.values(responses).every(r => r > 0) && overallSatisfaction > 0;
        
        if (!allAnswered) {
            alert('Please answer all questions before submitting');
            return;
        }

        setIsSubmitting(true);

        router.post(route('teacher.survey.store'), {
            ipcrf_rating_id: ratingData.rating_id,
            school_year: ratingData.school_year,
            responses: responses,
            overall_satisfaction: overallSatisfaction,
            comments: comments,
        }, {
            onSuccess: () => {
                onClose();
            },
            onError: () => {
                setIsSubmitting(false);
                alert('Failed to submit survey. Please try again.');
            }
        });
    };

    const StarRating = ({ value, onChange }) => {
        return (
            <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        onClick={() => onChange(star)}
                        className={`transition-all duration-200 ${
                            star <= value
                                ? 'text-yellow-400 scale-110'
                                : 'text-gray-300 hover:text-yellow-200'
                        }`}
                    >
                        <Star className="h-8 w-8" fill={star <= value ? 'currentColor' : 'none'} />
                    </button>
                ))}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-6 py-6 rounded-t-2xl sticky top-0 z-10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                                <ThumbsUp className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">IPCRF Feedback Survey</h2>
                                <p className="text-blue-100 text-sm">Help us improve the evaluation process</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white hover:text-gray-200 transition-colors p-2 hover:bg-white/10 rounded-lg"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Introduction */}
                    <div className="bg-blue-50 rounded-xl p-4 border-2 border-blue-200">
                        <p className="text-blue-900 font-semibold mb-2">
                            Your rating for SY {ratingData?.school_year} has been completed!
                        </p>
                        <p className="text-blue-700 text-sm">
                            We'd appreciate your feedback on the IPCRF process. Your responses will help us improve the system for future evaluations.
                        </p>
                    </div>

                    {/* Questions */}
                    <div className="space-y-6">
                        {questions.map((q, index) => (
                            <div key={q.key} className="bg-gray-50 rounded-xl p-5 border-2 border-gray-200">
                                <div className="flex items-start gap-3 mb-3">
                                    <span className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                                        {index + 1}
                                    </span>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-gray-900 mb-1">{q.question}</h3>
                                        <p className="text-sm text-gray-600">{q.description}</p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-center py-2">
                                    <StarRating 
                                        value={responses[q.key]} 
                                        onChange={(rating) => handleRatingClick(q.key, rating)}
                                    />
                                </div>
                                <div className="flex justify-between text-xs text-gray-500 mt-2 px-2">
                                    <span>Poor</span>
                                    <span>Excellent</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Overall Satisfaction */}
                    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 border-2 border-purple-200">
                        <h3 className="font-bold text-purple-900 text-lg mb-3 text-center">
                            Overall Satisfaction
                        </h3>
                        <p className="text-purple-700 text-sm text-center mb-4">
                            How satisfied are you with the overall IPCRF evaluation experience?
                        </p>
                        <div className="flex justify-center py-2">
                            <StarRating 
                                value={overallSatisfaction} 
                                onChange={setOverallSatisfaction}
                            />
                        </div>
                        <div className="flex justify-between text-xs text-purple-600 mt-2 px-8">
                            <span>Very Dissatisfied</span>
                            <span>Very Satisfied</span>
                        </div>
                    </div>

                    {/* Comments */}
                    <div>
                        <label className="block font-semibold text-gray-900 mb-2">
                            Additional Comments or Suggestions (Optional)
                        </label>
                        <textarea
                            value={comments}
                            onChange={(e) => setComments(e.target.value)}
                            rows="4"
                            className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            placeholder="Share any additional thoughts, concerns, or suggestions for improvement..."
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4">
                        <Button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 py-6 text-lg"
                        >
                            {isSubmitting ? (
                                <>Submitting...</>
                            ) : (
                                <>
                                    <Send className="h-5 w-5 mr-2" />
                                    Submit Survey
                                </>
                            )}
                        </Button>
                        <Button
                            onClick={onClose}
                            variant="outline"
                            className="px-8 py-6"
                        >
                            Skip for Now
                        </Button>
                    </div>

                    <p className="text-xs text-gray-500 text-center">
                        Your responses are confidential and will be used solely for improving the IPCRF process.
                    </p>
                </div>
            </div>
        </div>
    );
}
