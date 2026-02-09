import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button, Input } from '@/components/ui/common';
import { Check, Zap, Shield, X, Smartphone, CreditCard, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/components/AuthContext';
import { supabase } from '@/lib/supabase';
import { useSearchParams, useNavigate } from 'react-router-dom';

const plans = [
    {
        id: 'basic',
        name: 'Basic',
        price: 0,
        priceDisplay: 'Free',
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
        id: 'pro',
        name: 'Pro',
        price: 499,
        priceDisplay: '₹499',
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
        color: 'text-[hsl(var(--primary-foreground))]',
        bgColor: 'bg-[hsl(var(--primary))]',
        buttonText: 'Upgrade to Pro',
        buttonVariant: 'default',
        popular: true
    }
];

type PaymentStep = 'select' | 'processing' | 'success' | 'failed';

export default function Subscription() {
    const { user } = useAuth();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<typeof plans[0] | null>(null);
    const [paymentStep, setPaymentStep] = useState<PaymentStep>('select');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [paymentCompleted, setPaymentCompleted] = useState(false);

    // Handle redirect back from PhonePe
    useEffect(() => {
        const status = searchParams.get('status');
        const plan = searchParams.get('plan');

        if (status === 'success' && plan) {
            // Get stored transaction info
            const pendingTxn = localStorage.getItem('pendingTransaction');
            if (pendingTxn) {
                const txnData = JSON.parse(pendingTxn);

                // Update subscription in database
                const updateSubscription = async () => {
                    const { error } = await supabase.from('subscriptions').upsert({
                        user_id: user?.id,
                        plan: txnData.plan,
                        status: 'active',
                        started_at: new Date().toISOString(),
                        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                        payment_method: 'phonepe',
                        amount: txnData.amount,
                        transaction_id: txnData.transactionId
                    }, { onConflict: 'user_id' });

                    if (error) console.error('Error updating subscription:', error);

                    // Clear stored transaction
                    localStorage.removeItem('pendingTransaction');
                    setPaymentCompleted(true);
                };

                if (user?.id) {
                    updateSubscription();
                }
            }

            // Clear URL params
            navigate('/subscription', { replace: true });
        }
    }, [searchParams, user, navigate]);

    const handleUpgrade = (plan: typeof plans[0]) => {
        if (plan.id === 'basic') return;
        setSelectedPlan(plan);
        setShowPaymentModal(true);
        setPaymentStep('select');
    };


    const handlePhonePePayment = async () => {
        if (!phoneNumber || phoneNumber.length < 10) {
            alert('Please enter a valid phone number');
            return;
        }

        setPaymentStep('processing');

        try {
            // Call the PhonePe Edge Function to initiate payment
            const response = await fetch('https://pnnzmvdcafaqjtkbavdc.supabase.co/functions/v1/phonepe-payment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'initiate',
                    amount: selectedPlan?.price,
                    userId: user?.id,
                    phone: phoneNumber,
                    redirectUrl: `${window.location.origin}/subscription?status=success&plan=${selectedPlan?.id}`
                })
            });

            const result = await response.json();

            if (result.success && result.redirectUrl) {
                // Store transaction ID for later verification
                localStorage.setItem('pendingTransaction', JSON.stringify({
                    transactionId: result.transactionId,
                    plan: selectedPlan?.id,
                    amount: selectedPlan?.price
                }));

                // Redirect to PhonePe payment page
                window.location.href = result.redirectUrl;
            } else {
                console.error('Payment initiation failed:', result.error);
                setPaymentStep('failed');
            }
        } catch (error) {
            console.error('Payment error:', error);
            setPaymentStep('failed');
        }
    };


    const closeModal = () => {
        setShowPaymentModal(false);
        setSelectedPlan(null);
        setPaymentStep('select');
        setPhoneNumber('');
    };

    return (
        <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <div className="text-center space-y-4 mb-16">
                <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight sm:text-5xl">
                    Pricing Plans for Every Pharmacy
                </h1>
                <p className="text-xl text-slate-500 max-w-2xl mx-auto">
                    Choose the perfect plan to streamline your medical shop operations and grow your business with Live Cloud Sync.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                {plans.map((plan) => (
                    <Card
                        key={plan.name}
                        className={`relative flex flex-col border-none shadow-xl transition-all hover:scale-[1.02] ${plan.popular ? 'ring-2 ring-[hsl(var(--primary))]' : ''}`}
                    >
                        {plan.popular && (
                            <div className="absolute top-0 right-8 -translate-y-1/2">
                                <span className="inline-flex items-center px-4 py-1 rounded-full text-sm font-bold bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-lg">
                                    MOST POPULAR
                                </span>
                            </div>
                        )}
                        <CardContent className="p-8 flex flex-col flex-1">
                            <div className="mb-8">
                                <div className={`w-12 h-12 ${plan.bgColor} ${plan.color} rounded-xl flex items-center justify-center mb-4`}>
                                    <plan.icon className="w-6 h-6" />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-900">{plan.name}</h3>
                                <p className="text-slate-500 mt-2 h-12">{plan.description}</p>
                            </div>

                            <div className="mb-8">
                                <div className="flex items-baseline">
                                    <span className="text-5xl font-black text-slate-900">{plan.priceDisplay}</span>
                                    {plan.period && (
                                        <span className="text-slate-500 ml-1 font-medium">{plan.period}</span>
                                    )}
                                </div>
                            </div>

                            <ul className="space-y-4 mb-12 flex-1">
                                {plan.features.map((feature) => (
                                    <li key={feature} className="flex items-start gap-3 text-sm text-slate-600">
                                        <div className="mt-0.5 w-5 h-5 bg-[hsl(var(--primary))]/20 rounded-full flex items-center justify-center flex-shrink-0">
                                            <Check className="w-3 h-3 text-[hsl(var(--primary))]" />
                                        </div>
                                        {feature}
                                    </li>
                                ))}
                            </ul>

                            <Button
                                onClick={() => handleUpgrade(plan)}
                                variant={plan.buttonVariant as any}
                                className={`w-full h-12 text-lg font-bold shadow-lg transition-all ${plan.popular
                                    ? 'bg-[hsl(var(--primary))] hover:opacity-90 text-[hsl(var(--primary-foreground))] shadow-[hsl(var(--primary))]/20'
                                    : 'border-slate-200 hover:bg-slate-50'
                                    }`}
                                disabled={plan.id === 'basic'}
                            >
                                {plan.buttonText}
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Payment Modal */}
            {showPaymentModal && selectedPlan && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-[hsl(var(--primary))] to-purple-600 p-6 text-white relative">
                            <button
                                onClick={closeModal}
                                className="absolute top-4 right-4 text-white/80 hover:text-white"
                                aria-label="Close payment modal"
                            >
                                <X className="w-6 h-6" />
                            </button>
                            <h2 className="text-2xl font-bold">Upgrade to {selectedPlan.name}</h2>
                            <p className="text-white/80 mt-1">Complete your payment</p>
                        </div>

                        <div className="p-6">
                            {paymentStep === 'select' && (
                                <>
                                    {/* Order Summary */}
                                    <div className="bg-slate-50 rounded-xl p-4 mb-6">
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-600">{selectedPlan.name} Plan</span>
                                            <span className="font-bold text-slate-900">{selectedPlan.priceDisplay}/month</span>
                                        </div>
                                        <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-200">
                                            <span className="font-bold text-slate-900">Total</span>
                                            <span className="text-2xl font-black text-[hsl(var(--primary))]">{selectedPlan.priceDisplay}</span>
                                        </div>
                                    </div>

                                    {/* Phone Number Input */}
                                    <div className="mb-6">
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            PhonePe Registered Mobile Number
                                        </label>
                                        <div className="relative">
                                            <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                            <Input
                                                type="tel"
                                                placeholder="Enter 10-digit mobile number"
                                                value={phoneNumber}
                                                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                                className="pl-10 h-12"
                                                maxLength={10}
                                            />
                                        </div>
                                    </div>

                                    {/* Payment Methods */}
                                    <div className="space-y-3">
                                        <Button
                                            onClick={handlePhonePePayment}
                                            className="w-full h-14 bg-[#5f259f] hover:bg-[#4a1d7a] text-white font-bold text-lg rounded-xl shadow-lg"
                                        >
                                            <img
                                                src="https://download.logo.wine/logo/PhonePe/PhonePe-Logo.wine.png"
                                                alt="PhonePe"
                                                className="w-8 h-8 mr-3 object-contain bg-white rounded-lg p-1"
                                            />
                                            Pay with PhonePe
                                        </Button>

                                        <div className="relative">
                                            <div className="absolute inset-0 flex items-center">
                                                <div className="w-full border-t border-slate-200"></div>
                                            </div>
                                            <div className="relative flex justify-center text-sm">
                                                <span className="px-2 bg-white text-slate-500">or pay with</span>
                                            </div>
                                        </div>

                                        <Button
                                            variant="outline"
                                            className="w-full h-12 border-2 border-dashed border-slate-200 text-slate-500"
                                            disabled
                                        >
                                            <CreditCard className="w-5 h-5 mr-2" />
                                            Card Payment (Coming Soon)
                                        </Button>
                                    </div>

                                    <p className="text-xs text-slate-400 text-center mt-4">
                                        Secure payment powered by PhonePe. Your payment details are encrypted.
                                    </p>
                                </>
                            )}

                            {paymentStep === 'processing' && (
                                <div className="text-center py-12">
                                    <div className="w-20 h-20 bg-[#5f259f]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <Loader2 className="w-10 h-10 text-[#5f259f] animate-spin" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 mb-2">Processing Payment</h3>
                                    <p className="text-slate-500">Please wait while we connect with PhonePe...</p>
                                    <p className="text-sm text-slate-400 mt-4">Do not close this window</p>
                                </div>
                            )}

                            {paymentStep === 'success' && (
                                <div className="text-center py-12">
                                    <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <CheckCircle className="w-10 h-10 text-emerald-600" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 mb-2">Payment Successful!</h3>
                                    <p className="text-slate-500 mb-6">Your {selectedPlan.name} subscription is now active.</p>
                                    <Button onClick={closeModal} className="w-full">
                                        Continue to Dashboard
                                    </Button>
                                </div>
                            )}

                            {paymentStep === 'failed' && (
                                <div className="text-center py-12">
                                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <AlertCircle className="w-10 h-10 text-red-600" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 mb-2">Payment Failed</h3>
                                    <p className="text-slate-500 mb-6">Something went wrong. Please try again.</p>
                                    <div className="space-y-3">
                                        <Button onClick={() => setPaymentStep('select')} className="w-full">
                                            Try Again
                                        </Button>
                                        <Button onClick={closeModal} variant="outline" className="w-full">
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
