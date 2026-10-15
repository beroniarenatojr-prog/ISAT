import { Head, Link } from '@inertiajs/react';
import { Award, ArrowLeft, Heart, Users, Leaf, Flag } from 'lucide-react';

export default function CoreValues() {
    const coreValues = [
        {
            name: 'Maka-Diyos',
            icon: Heart,
            color: 'from-red-500 to-red-700',
            bgColor: 'from-red-50 to-red-100',
            borderColor: 'border-red-200',
            textColor: 'text-red-700',
            description: 'Faith in God and devotion to spiritual values'
        },
        {
            name: 'Maka-tao',
            icon: Users,
            color: 'from-blue-500 to-blue-700',
            bgColor: 'from-blue-50 to-blue-100',
            borderColor: 'border-blue-200',
            textColor: 'text-blue-700',
            description: 'Respect for human dignity and compassion'
        },
        {
            name: 'Makakalikasan',
            icon: Leaf,
            color: 'from-green-500 to-green-700',
            bgColor: 'from-green-50 to-green-100',
            borderColor: 'border-green-200',
            textColor: 'text-green-700',
            description: 'Care for the environment and nature'
        },
        {
            name: 'Makabansa',
            icon: Flag,
            color: 'from-yellow-500 to-yellow-700',
            bgColor: 'from-yellow-50 to-yellow-100',
            borderColor: 'border-yellow-200',
            textColor: 'text-yellow-700',
            description: 'Love for country and national pride'
        }
    ];

    return (
        <>
            <Head title="Core Values - ISAT e-TRACES" />
            
            <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-yellow-100">
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
                                    <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-yellow-400/20 to-yellow-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-gray-900 group-hover:text-yellow-600 transition-colors duration-300">ISAT e-TRACES</h1>
                                    <p className="text-xs text-gray-600">E-Management Portal</p>
                                </div>
                            </Link>
                            
                            <Link
                                href="/"
                                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-yellow-600 transition-all duration-300 font-medium group"
                            >
                                <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform duration-300" />
                                Back to Home
                            </Link>
                        </div>
                    </div>
                </nav>

                {/* Content */}
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                    <div className="relative">
                        {/* Decorative background elements */}
                        <div className="absolute top-0 right-0 w-72 h-72 bg-yellow-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
                        <div className="absolute bottom-0 left-0 w-72 h-72 bg-yellow-600/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
                        
                        <div className="relative">
                            {/* Header */}
                            <div className="flex flex-col items-center text-center mb-12">
                                <div className="w-20 h-20 bg-gradient-to-br from-yellow-500 to-yellow-700 rounded-2xl flex items-center justify-center shadow-2xl mb-6 transform hover:scale-110 transition-transform duration-300">
                                    <Award className="h-10 w-10 text-white" />
                                </div>
                                <h1 className="text-5xl font-bold bg-gradient-to-r from-yellow-600 to-yellow-800 bg-clip-text text-transparent mb-2">Our Core Values</h1>
                                <p className="text-yellow-700 text-lg font-medium">Isabela School of Arts and Trades</p>
                            </div>

                            {/* Core Values Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {coreValues.map((value, index) => {
                                    const Icon = value.icon;
                                    return (
                                        <div 
                                            key={index}
                                            className={`bg-white/80 backdrop-blur-md rounded-2xl p-8 shadow-xl border-2 ${value.borderColor} hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2`}
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className={`w-16 h-16 bg-gradient-to-br ${value.color} rounded-xl flex items-center justify-center shadow-lg flex-shrink-0`}>
                                                    <Icon className="h-8 w-8 text-white" />
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className={`text-2xl font-bold ${value.textColor} mb-2`}>
                                                        {value.name}
                                                    </h3>
                                                    <p className="text-gray-600 leading-relaxed">
                                                        {value.description}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Additional Info */}
                            <div className="mt-12 bg-white/80 backdrop-blur-md rounded-2xl p-8 shadow-xl border-2 border-yellow-200">
                                <p className="text-center text-gray-700 text-lg leading-relaxed">
                                    These four core values guide our actions, decisions, and commitment to excellence in education. 
                                    They reflect our dedication to developing well-rounded individuals who contribute positively to society.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
