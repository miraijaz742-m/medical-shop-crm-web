import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Button, Input, Label, Illustration } from '../components/ui/common';
import { Card, CardContent } from '@/components/ui/card';
import { Lock, Mail, Loader2, Stethoscope, UserPlus, Zap, ShieldCheck } from 'lucide-react';

export default function Signup() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [authMethod, setAuthMethod] = useState<'password' | 'magic-link'>('password');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (authMethod === 'password') {
            if (password !== confirmPassword) {
                setError('Passwords do not match');
                setLoading(false);
                return;
            }

            try {
                const { error: authError } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        emailRedirectTo: window.location.origin,
                    },
                });

                if (authError) throw authError;
                setSuccess(true);
            } catch (err: any) {
                setError(err.message || 'Failed to create account');
            } finally {
                setLoading(false);
            }
        } else {
            // Magic Link flow
            try {
                const { error: authError } = await supabase.auth.signInWithOtp({
                    email,
                    options: {
                        emailRedirectTo: window.location.origin,
                        shouldCreateUser: true,
                    },
                });

                if (authError) throw authError;
                setSuccess(true);
            } catch (err: any) {
                setError(err.message || 'Failed to send magic link');
            } finally {
                setLoading(false);
            }
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full space-y-8 text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 mb-6 font-bold">
                        {authMethod === 'password' ? <UserPlus className="w-10 h-10" /> : <Zap className="w-10 h-10" />}
                    </div>
                    <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                        {authMethod === 'password' ? 'Account Created!' : 'Check Your Email!'}
                    </h2>
                    <p className="mt-4 text-slate-600 leading-relaxed text-lg">
                        {authMethod === 'password'
                            ? 'Please check your email for a confirmation link to activate your account.'
                            : 'We\'ve sent a secure magic link to your email. Click it to finish your registration.'}
                    </p>
                    <div className="mt-8">
                        <Link to="/login">
                            <Button className="w-full h-12 bg-[hsl(var(--primary))] text-white font-bold rounded-xl shadow-lg">
                                Back to Sign In
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                <div className="hidden md:block">
                    <Illustration type="secure" className="scale-110" />
                    <div className="mt-8 text-center">
                        <h3 className="text-xl font-black text-slate-800 uppercase tracking-wider">Secure Access</h3>
                        <p className="text-sm text-slate-500 font-bold mt-2">Enterprise-grade security for your data</p>
                    </div>
                </div>
                <div className="w-full space-y-8">
                    <div className="text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] mb-4 shadow-lg shadow-[hsl(var(--primary))]/20">
                            <Stethoscope className="w-8 h-8" />
                        </div>
                        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                            Create Your Account
                        </h2>
                        <p className="mt-2 text-sm text-slate-500 font-medium">
                            Join MedCRM and start managing your pharmacy smarter.
                        </p>
                    </div>

                    <div className="flex p-1 bg-slate-200/50 rounded-xl mb-6">
                        <button
                            onClick={() => setAuthMethod('password')}
                            className={`flex-1 py-2 text-sm font-bold rounded-lg ${authMethod === 'password' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Password
                        </button>
                        <button
                            onClick={() => setAuthMethod('magic-link')}
                            className={`flex-1 py-2 text-sm font-bold rounded-lg ${authMethod === 'magic-link' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Magic Link
                        </button>
                    </div>

                    <Card className="border-none shadow-xl shadow-slate-200/50 bg-white/80 backdrop-blur-sm">
                        <CardContent className="p-8">
                            <form className="space-y-6" onSubmit={handleSignup}>
                                {error && (
                                    <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm font-medium">
                                        {error}
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="name@pharmacy.com"
                                            className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white transition-all shadow-none"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                {authMethod === 'password' && (
                                    <>
                                        <div className="space-y-2">
                                            <Label htmlFor="password">Password</Label>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                                <Input
                                                    id="password"
                                                    type="password"
                                                    placeholder="Min 6 characters"
                                                    className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white shadow-none"
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    required
                                                    minLength={6}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                                <Input
                                                    id="confirmPassword"
                                                    type="password"
                                                    placeholder="Confirm your password"
                                                    className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white shadow-none"
                                                    value={confirmPassword}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </>
                                )}

                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full h-11 bg-[hsl(var(--primary))] hover:opacity-90 text-[hsl(var(--primary-foreground))] font-semibold rounded-lg shadow-lg shadow-[hsl(var(--primary))]/20 active:scale-[0.98]"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            {authMethod === 'password' ? 'Creating Account...' : 'Sending Link...'}
                                        </>
                                    ) : (
                                        authMethod === 'password' ? 'Create Account' : 'Send Magic Link'
                                    )}
                                </Button>

                                <div className="text-center">
                                    <Link to="/login" className="text-sm font-medium text-[hsl(var(--primary))] hover:underline">
                                        Already have an account? Sign In
                                    </Link>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                </div>
            </div>
        </div>
    );
}
