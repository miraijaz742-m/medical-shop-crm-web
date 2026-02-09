import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/common';
import { Check, Zap, Shield, Crown } from 'lucide-react';

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
        color: 'text-[hsl(var(--primary-foreground))]',
        bgColor: 'bg-[hsl(var(--primary))]',
        buttonText: 'Upgrade to Pro',
        buttonVariant: 'default',
        popular: true
    }
];

export default function Subscription() {
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
                                    <span className="text-5xl font-black text-slate-900">{plan.price}</span>
                                    {plan.period && (
                                        <span className="text-slate-500 ml-1 font-medium">{plan.period}</span>
                                    )}
                                </div>
                            </div>

                            <ul className="space-y-4 mb-12 flex-1">
                                {plan.features.map((feature) => (
                                    <li key={feature} className="flex items-start gap-3 text-sm text-slate-600">
                                        <div className="mt-0.5 w-5 h-5 bg-[hsl(var(--primary))]/20 rounded-full flex items-center justify-center flex-shrink-0">
                                            <Check className="w-3 h-3 text-[hsl(var(--primary-foreground))]" />
                                        </div>
                                        {feature}
                                    </li>
                                ))}
                            </ul>

                            <Button
                                variant={plan.buttonVariant as any}
                                className={`w-full h-12 text-lg font-bold shadow-lg transition-all ${plan.popular
                                    ? 'bg-[hsl(var(--primary))] hover:opacity-90 text-[hsl(var(--primary-foreground))] shadow-[hsl(var(--primary))]/20'
                                    : 'border-slate-200 hover:bg-slate-50'
                                    }`}
                            >
                                {plan.buttonText}
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
