import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import { Button } from '../components/ui/common';
import {
    Stethoscope,
    ShoppingCart,
    Package,
    BarChart3,
    ShieldCheck,
    Zap,
    ChevronRight,
    ArrowRight,
    Check,
    Shield
} from 'lucide-react';

const plans = [
    {
        name: 'Basic',
        price: 'Free',
        description: 'Perfect for small medical shops just starting out.',
        features: [
            'Up to 100 products',
            'Basic sales reports',
            'Single user access',
            'Email support'
        ],
        icon: Zap,
        color: 'text-gray-600',
        bgColor: 'bg-gray-50',
        buttonText: 'Current Plan',
        buttonVariant: 'outline'
    },
    {
        name: 'Pro',
        price: '₹499',
        period: '/month',
        description: 'Advanced features for growing pharmacies.',
        features: [
            'Unlimited products',
            'Advanced analytics',
            'Up to 5 users',
            'Priority support',
            'Cloud sync backup',
            'Bulk import/export'
        ],
        icon: Shield,
        color: 'text-white',
        bgColor: 'bg-[hsl(var(--primary))]',
        buttonText: 'Upgrade to Pro',
        buttonVariant: 'default',
        popular: true
    }
];

export default function Landing() {
    const { user, loading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading && user) {
            navigate('/dashboard');
        }
    }, [user, loading, navigate]);

    const handleGetStarted = () => {
        if (user) {
            navigate('/dashboard');
        } else {
            navigate('/signup');
        }
    };

    const handleLogin = () => {
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-[hsl(var(--primary))]/20">
            {/* Navigation */}
            <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-xl bg-[hsl(var(--primary))] flex items-center justify-center text-white shadow-lg shadow-[hsl(var(--primary))]/20">
                                <Stethoscope className="w-6 h-6" />
                            </div>
                            <span className="text-xl font-bold tracking-tight text-slate-900">MedCRM</span>
                        </div>
                        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
                            <a href="#features" className="hover:text-[hsl(var(--primary))] transition-colors text-slate-900 font-bold">Features</a>
                            <a href="#pricing" className="hover:text-[hsl(var(--primary))] transition-colors text-slate-900 font-bold">Pricing</a>
                            <a href="#about" className="hover:text-[hsl(var(--primary))] transition-colors text-slate-900 font-bold">About</a>
                            {user ? (
                                <Button
                                    onClick={() => navigate('/dashboard')}
                                    className="bg-[hsl(var(--primary))] hover:opacity-90 text-white rounded-full px-6 shadow-xl shadow-[hsl(var(--primary))]/20"
                                >
                                    Dashboard
                                </Button>
                            ) : (
                                <div className="flex items-center gap-3">
                                    <Button
                                        variant="ghost"
                                        onClick={handleLogin}
                                        className="text-slate-900 font-bold hover:text-[hsl(var(--primary))] bg-transparent"
                                    >
                                        Sign In
                                    </Button>
                                    <Button
                                        onClick={() => navigate('/signup')}
                                        className="bg-[hsl(var(--primary))] hover:opacity-90 text-white rounded-full px-6 shadow-xl shadow-[hsl(var(--primary))]/20"
                                    >
                                        Sign Up
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                    {/* Background Blobs */}
                    <div className="absolute -top-24 -right-24 w-96 h-96 bg-[hsl(var(--primary))]/5 rounded-full blur-3xl" />
                    <div className="absolute top-1/2 -left-24 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl" />

                    <div className="text-center relative z-10">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] text-xs font-bold uppercase tracking-wider mb-6 animate-fade-in">
                            <Zap className="w-3 h-3" />
                            Smart Pharmacy Management
                        </div>
                        <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight text-slate-900 mb-8 max-w-4xl mx-auto leading-[1.1]">
                            Manage your Medical Shop with <span className="text-transparent bg-clip-text bg-gradient-to-r from-[hsl(var(--primary))] to-blue-600">Precision.</span>
                        </h1>
                        <p className="text-lg lg:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
                            The all-in-one CRM designed specifically for pharmacies. Track inventory, manage billing, and analyze your growth—all in one place.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Button
                                size="lg"
                                onClick={handleGetStarted}
                                className="w-full sm:w-auto px-8 h-14 text-lg bg-[hsl(var(--primary))] hover:opacity-90 text-white rounded-full shadow-xl shadow-[hsl(var(--primary))]/20 group"
                            >
                                Get Started Now
                                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Button>
                            <Button
                                variant="outline"
                                size="lg"
                                className="w-full sm:w-auto px-8 h-14 text-lg rounded-full border-slate-200 hover:bg-slate-50 transition-all"
                            >
                                View Demo
                            </Button>
                        </div>
                    </div>

                    {/* Dashboard Preview Mockup */}
                    <div className="mt-20 relative px-4 lg:px-0">
                        <div className="max-w-5xl mx-auto rounded-3xl overflow-hidden shadow-2xl shadow-slate-200/50 border border-slate-200 bg-white">
                            <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center gap-2">
                                <div className="flex gap-1.5">
                                    <div className="w-3 h-3 rounded-full bg-red-400" />
                                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                                    <div className="w-3 h-3 rounded-full bg-emerald-400" />
                                </div>
                                <div className="ml-4 h-6 px-4 bg-white border border-slate-200 rounded-lg text-[10px] text-slate-400 flex items-center">
                                    medcrm-portal.app/dashboard
                                </div>
                            </div>
                            <div className="aspect-[16/9] bg-slate-50 p-8 flex items-center justify-center">
                                <div className="grid grid-cols-3 gap-6 w-full">
                                    <div className="h-32 rounded-2xl bg-white border border-slate-100 shadow-sm p-4">
                                        <div className="w-10 h-10 rounded-lg bg-blue-50 mb-3" />
                                        <div className="h-3 w-2/3 bg-slate-100 rounded-full mb-2" />
                                        <div className="h-2 w-1/3 bg-slate-50 rounded-full" />
                                    </div>
                                    <div className="h-32 rounded-2xl bg-white border border-slate-100 shadow-sm p-4">
                                        <div className="w-10 h-10 rounded-lg bg-[hsl(var(--primary))]/10 mb-3" />
                                        <div className="h-3 w-2/3 bg-slate-100 rounded-full mb-2" />
                                        <div className="h-2 w-1/3 bg-slate-50 rounded-full" />
                                    </div>
                                    <div className="h-32 rounded-2xl bg-white border border-slate-100 shadow-sm p-4">
                                        <div className="w-10 h-10 rounded-lg bg-emerald-50 mb-3" />
                                        <div className="h-3 w-2/3 bg-slate-100 rounded-full mb-2" />
                                        <div className="h-2 w-1/3 bg-slate-50 rounded-full" />
                                    </div>
                                    <div className="col-span-3 h-48 rounded-2xl bg-white border border-slate-100 shadow-sm p-6">
                                        <div className="flex justify-between mb-4">
                                            <div className="h-4 w-32 bg-slate-100 rounded-full" />
                                            <div className="h-4 w-12 bg-slate-50 rounded-full" />
                                        </div>
                                        <div className="flex items-end gap-3 h-24 pt-4">
                                            <div className="flex-1 bg-slate-50 rounded-t-lg h-1/2" />
                                            <div className="flex-1 bg-slate-100 rounded-t-lg h-2/3" />
                                            <div className="flex-1 bg-[hsl(var(--primary))]/30 rounded-t-lg h-3/4" />
                                            <div className="flex-1 bg-[hsl(var(--primary))] rounded-t-lg h-full" />
                                            <div className="flex-1 bg-slate-100 rounded-t-lg h-4/5" />
                                            <div className="flex-1 bg-slate-50 rounded-t-lg h-1/3" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section id="features" className="py-24 bg-slate-50/50 border-y border-slate-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-slate-900 mb-4">Everything you need to thrive</h2>
                        <p className="text-slate-600 max-w-2xl mx-auto">Streamline your operations with our robust set of tools tailored for pharmacy management.</p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[
                            {
                                icon: <Package className="w-6 h-6" />,
                                title: "Smart Inventory",
                                desc: "Real-time stock tracking with low-inventory alerts and automated batch management."
                            },
                            {
                                icon: <ShoppingCart className="w-6 h-6" />,
                                title: "Rapid Billing",
                                desc: "Generate VAT-compliant invoices in seconds. Support for multiple payment methods."
                            },
                            {
                                icon: <BarChart3 className="w-6 h-6" />,
                                title: "Growth Analytics",
                                desc: "Visualize your sales, profits, and customer trends with interactive dashboards."
                            },
                            {
                                icon: <ShieldCheck className="w-6 h-6" />,
                                title: "Secure Cloud Sync",
                                desc: "Your data is automatically backed up and accessible from anywhere, anytime."
                            },
                            {
                                icon: <Stethoscope className="w-6 h-6" />,
                                title: "Patient Records",
                                desc: "Maintain detailed histories of customer purchases for better personalized service."
                            },
                            {
                                icon: <Zap className="w-6 h-6" />,
                                title: "Instant Search",
                                desc: "Lightning-fast search across thousands of medicine items and customer records."
                            }
                        ].map((feature, idx) => (
                            <div key={idx} className="p-8 rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                                <div className="w-12 h-12 rounded-2xl bg-[hsl(var(--primary))]/5 text-[hsl(var(--primary))] flex items-center justify-center mb-6">
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                                <p className="text-slate-600 leading-relaxed">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight sm:text-5xl mb-4">
                            Pricing Plans for Every Pharmacy
                        </h2>
                        <p className="text-xl text-slate-500 max-w-2xl mx-auto">
                            Choose the perfect plan to streamline your medical shop operations and grow your business with Live Cloud Sync.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                        {plans.map((plan) => (
                            <div
                                key={plan.name}
                                className={`relative flex flex-col p-8 rounded-[2.5rem] transition-all hover:scale-[1.02] ${plan.popular ? 'border-2 border-[hsl(var(--primary))] shadow-2xl shadow-[hsl(var(--primary))]/10' : 'border border-slate-100 shadow-xl shadow-slate-200/50'}`}
                            >
                                {plan.popular && (
                                    <div className="absolute top-0 right-8 -translate-y-1/2">
                                        <span className="inline-flex items-center px-4 py-1 rounded-full text-xs font-black bg-[hsl(var(--primary))] text-white shadow-lg uppercase tracking-widest">
                                            MOST POPULAR
                                        </span>
                                    </div>
                                )}
                                <div className="mb-8">
                                    <div className={`w-14 h-14 ${plan.bgColor} ${plan.color} rounded-2xl flex items-center justify-center mb-6 shadow-sm`}>
                                        <plan.icon className="w-7 h-7" />
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">{plan.name}</h3>
                                    <p className="text-slate-500 mt-2 text-sm leading-relaxed">{plan.description}</p>
                                </div>

                                <div className="mb-8">
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-5xl font-black text-slate-900 tracking-tighter">{plan.price}</span>
                                        {plan.period && (
                                            <span className="text-slate-400 font-bold uppercase text-xs tracking-widest">{plan.period}</span>
                                        )}
                                    </div>
                                </div>

                                <ul className="space-y-4 mb-10 flex-1">
                                    {plan.features.map((feature) => (
                                        <li key={feature} className="flex items-start gap-3 text-sm font-medium text-slate-600">
                                            <div className="mt-0.5 w-5 h-5 bg-[hsl(var(--primary))]/10 rounded-full flex items-center justify-center flex-shrink-0">
                                                <Check className="w-3 h-3 text-[hsl(var(--primary))]" />
                                            </div>
                                            {feature}
                                        </li>
                                    ))}
                                </ul>

                                <Button
                                    onClick={handleGetStarted}
                                    variant={plan.buttonVariant as any}
                                    className={`w-full h-14 rounded-2xl text-lg font-bold transition-all ${plan.popular
                                        ? 'bg-[hsl(var(--primary))] hover:opacity-90 text-white shadow-xl shadow-[hsl(var(--primary))]/20'
                                        : 'bg-white border-2 border-slate-100 hover:bg-slate-50 text-slate-900'
                                        }`}
                                >
                                    {plan.buttonText}
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-slate-100 gap-8">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-[hsl(var(--primary))] flex items-center justify-center text-white">
                                <Stethoscope className="w-5 h-5" />
                            </div>
                            <span className="text-lg font-bold tracking-tight text-slate-900">MedCRM</span>
                        </div>
                        <p className="text-slate-500 text-sm">
                            © 2026 Medical Shop CRM. All rights reserved. Developed by Aijaz.
                        </p>
                        <div className="flex gap-6 text-slate-400">
                            <a href="#" className="hover:text-slate-600 transition-colors">Privacy</a>
                            <a href="#" className="hover:text-slate-600 transition-colors">Terms</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
