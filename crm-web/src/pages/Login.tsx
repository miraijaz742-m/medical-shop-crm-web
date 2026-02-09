import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Button, Input, Label, Illustration } from '../components/ui/common';
import { Card, CardContent } from '@/components/ui/card';
import { Lock, Mail, Loader2, Stethoscope, Zap, ShieldCheck } from 'lucide-react';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [authMethod, setAuthMethod] = useState<'password' | 'magic-link'>('password');
    const [magicLinkSent, setMagicLinkSent] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (authMethod === 'password') {
            try {
                const { error: authError } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (authError) throw authError;
                navigate('/');
            } catch (err: any) {
                setError(err.message || 'Failed to sign in');
            } finally {
                setLoading(false);
            }
        } else {
            try {
                const { error: authError } = await supabase.auth.signInWithOtp({
                    email,
                    options: {
                        emailRedirectTo: window.location.origin,
                    },
                });

                if (authError) throw authError;
                setMagicLinkSent(true);
            } catch (err: any) {
                setError(err.message || 'Failed to send magic link');
            } finally {
                setLoading(false);
            }
        }
    };

    const handleForgotPassword = async () => {
        if (!email) {
            setError('Please enter your email address first');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });
            if (error) throw error;
            alert('Password reset link has been sent to your email');
        } catch (err: any) {
            setError(err.message || 'Failed to send password reset email');
        } finally {
            setLoading(false);
        }
    };

    if (magicLinkSent) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full space-y-8 text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-100 text-blue-600 mb-6 font-bold">
                        <Zap className="w-10 h-10" />
                    </div>
                    <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                        Check Your Email!
                    </h2>
                    <p className="mt-4 text-slate-600 leading-relaxed text-lg">
                        We've sent a secure login link to <span className="font-bold text-slate-900">{email}</span>.
                        Click the link to sign in instantly.
                    </p>
                    <div className="mt-8">
                        <Button
                            variant="outline"
                            onClick={() => setMagicLinkSent(false)}
                            className="w-full h-12 border-slate-200 text-slate-600 font-bold rounded-xl"
                        >
                            Back to Sign In
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <div className="hidden md:flex flex-col items-center justify-center">
                    <Illustration type="nurse" />
                    <div className="mt-4 text-center">
                        <h3 className="text-lg font-black text-slate-800 uppercase tracking-wider">Healthcare Management</h3>
                        <p className="text-xs text-slate-500 font-bold mt-1">Professional CRM for modern medical shops</p>
                    </div>
                </div>
                <div className="w-full space-y-4">
                    <div className="text-center">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] mb-3 shadow-lg shadow-[hsl(var(--primary))]/20">
                            <Stethoscope className="w-6 h-6" />
                        </div>
                        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                            Medical Shop CRM
                        </h2>
                        <p className="mt-1 text-sm text-slate-500 font-medium">
                            Sign in to manage your inventory and sales
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
                            <form className="space-y-6" onSubmit={handleLogin}>
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
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="password">Password</Label>
                                            <button
                                                type="button"
                                                onClick={handleForgotPassword}
                                                className="text-xs font-semibold text-[hsl(var(--primary))] hover:underline"
                                            >
                                                Forgot Password?
                                            </button>
                                        </div>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                            <Input
                                                id="password"
                                                type="password"
                                                placeholder="••••••••"
                                                className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white shadow-none"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                )}

                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full h-11 bg-[hsl(var(--primary))] hover:opacity-90 text-[hsl(var(--primary-foreground))] font-semibold rounded-lg shadow-lg shadow-[hsl(var(--primary))]/20 active:scale-[0.98]"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            {authMethod === 'password' ? 'Signing in...' : 'Sending Link...'}
                                        </>
                                    ) : (
                                        authMethod === 'password' ? 'Sign In' : 'Send Magic Link'
                                    )}
                                </Button>

                                <div className="text-center">
                                    <Link to="/signup" className="text-sm font-medium text-[hsl(var(--primary))] hover:underline">
                                        Don't have an account? Sign Up
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
