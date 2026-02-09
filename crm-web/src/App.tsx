import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Billing from './pages/Billing';
import Customers from './pages/Customers';
import Expenses from './pages/Expenses';
import Settings from './pages/Settings';
import Subscription from './pages/Subscription';
import Login from './pages/Login';
import ResetPassword from './pages/ResetPassword';
import Landing from './pages/Landing';
import Signup from './pages/Signup';
import { AuthProvider, useAuth } from './components/AuthContext';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(var(--primary))]"></div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
};

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<Landing />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/reset-password" element={<ResetPassword />} />

                    {/* Protected App Routes */}
                    <Route element={<Layout />}>
                        <Route path="/dashboard" element={
                            <ProtectedRoute>
                                <Dashboard />
                            </ProtectedRoute>
                        } />
                        <Route path="/subscription" element={
                            <ProtectedRoute>
                                <Subscription />
                            </ProtectedRoute>
                        } />
                        <Route path="/inventory" element={
                            <ProtectedRoute>
                                <Inventory />
                            </ProtectedRoute>
                        } />
                        <Route path="/billing" element={
                            <ProtectedRoute>
                                <Billing />
                            </ProtectedRoute>
                        } />
                        <Route path="/customers" element={
                            <ProtectedRoute>
                                <Customers />
                            </ProtectedRoute>
                        } />
                        <Route path="/expenses" element={
                            <ProtectedRoute>
                                <Expenses />
                            </ProtectedRoute>
                        } />
                        <Route path="/settings" element={
                            <ProtectedRoute>
                                <Settings />
                            </ProtectedRoute>
                        } />
                    </Route>

                    {/* Catch-all redirect to landing or dashboard could go here */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;
