import { Head, Link } from '@inertiajs/react';
import { Eye, ArrowLeft } from 'lucide-react';

export default function Vision() {
    return (
        <>
            <Head title="Vision - ISAT e-TRACES" />
            
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
                {/* Navigation */}
                <nav className="bg-white/95 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50 shadow-lg">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center h-16">
                            <Link href="/" className="flex items-center gap-3 group cursor-pointer">
                                <div className="relative">
                                    <img 
                                        src="/pictures/isat.tmp" 
                                        alt="ISAT Logo" 
                                        className="h-10 w-10 rounded-lg object-cover transition-transform duration-300 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-blue-400/20 to-blue-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">ISAT e-TRACES</h1>
                                    <p className="text-xs text-gray-600">E-Management Portal</p>
                                </div>
                            </Link>
                            
                            <Link
                                href="/"
                                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-blue-600 transition-all duration-300 font-medium group"
                            >
                                <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform duration-300" />
                                Back to Home
                            </Link>
                        </div>
                    </div>
                </nav>

                {/* Content */}
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                    <div className="relative">
                        {/* Decorative background elements */}
                        <div className="absolute top-0 right-0 w-72 h-72 bg-blue-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
                        <div className="absolute bottom-0 left-0 w-72 h-72 bg-blue-600/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
                        
                        <div className="relative bg-white/80 backdrop-blur-md rounded-3xl p-12 shadow-2xl border border-blue-200/50">
                            <div className="flex flex-col items-center text-center mb-8">
                                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center shadow-2xl mb-6 transform hover:scale-110 transition-transform duration-300">
                                    <Eye className="h-10 w-10 text-white" />
                                </div>
                                <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mb-2">Our Vision</h1>
                                <p className="text-blue-700 text-lg font-medium">Isabela School of Arts and Trades</p>
                            </div>
                            
                            <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-10 shadow-lg border-2 border-blue-100">
                                <p className="text-2xl text-gray-800 leading-relaxed text-center font-light italic">
                                    "To produce Filipinos who passionately love their country, realize their full potential, and contribute to nation-building through a continuously improving, learner-centered environment."
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
