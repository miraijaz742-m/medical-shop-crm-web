import React, { useState, useEffect, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button, Input, Label } from '@/components/ui/common';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthContext';
import { Save, Building2, CreditCard, FileText } from 'lucide-react';

const toast = {
    success: (msg: string) => alert("Success: " + msg),
    error: (msg: string) => alert("Error: " + msg)
};

const Settings: React.FC = memo(() => {
    const { user } = useAuth();
    const [settings, setSettings] = useState<any>({
        shopName: '',
        licenseNumber: '',
        address: '',
        mobile: '',
        bankName: '',
        accountNumber: '',
        ifsc: '',
        branch: '',
        terms: [],
        notes: ''
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const { data, error } = await supabase.from('settings').select('value').eq('key', `app_config_${user?.id}`).single();
            if (data) {
                setSettings(data.value);
            }
        } catch (error) {
            console.error('Failed to fetch settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            const { error } = await supabase.from('settings').upsert({
                key: `app_config_${user?.id}`,
                value: settings,
                user_id: user?.id,
                updated_at: new Date().toISOString()
            }, { onConflict: 'key' });

            if (error) throw error;
            toast.success('Settings saved successfully');
        } catch (error: any) {
            toast.error('An error occurred: ' + error.message);
        }
    };

    const handleTermChange = (index: number, value: string) => {
        const newTerms = [...settings.terms];
        newTerms[index] = value;
        setSettings({ ...settings, terms: newTerms });
    };

    if (loading) {
        return <div className="flex items-center justify-center h-full">Loading settings...</div>;
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-10 p-4">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Application Settings</h1>
                    <p className="text-sm text-gray-500">Configure your shop details, bank information, and invoice terms.</p>
                </div>
                <Button onClick={handleSave} className="flex gap-2 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-sm hover:opacity-90">
                    <Save className="h-4 w-4" /> Save Settings
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-[hsl(var(--primary))]" />
                            Shop Details
                        </CardTitle>
                        <CardDescription>Main identity shown on the invoice header.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Shop Name</Label>
                            <Input
                                value={settings.shopName}
                                onChange={(e) => setSettings({ ...settings, shopName: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>License Number</Label>
                            <Input
                                value={settings.licenseNumber}
                                onChange={(e) => setSettings({ ...settings, licenseNumber: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Mobile Number</Label>
                            <Input
                                value={settings.mobile}
                                onChange={(e) => setSettings({ ...settings, mobile: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Shop Address</Label>
                            <Input
                                value={settings.address}
                                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CreditCard className="h-5 w-5 text-[hsl(var(--primary))]" />
                            Bank Details
                        </CardTitle>
                        <CardDescription>Payment information for the invoice footer.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Bank Name</Label>
                            <Input
                                value={settings.bankName}
                                onChange={(e) => setSettings({ ...settings, bankName: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Account Number</Label>
                            <Input
                                value={settings.accountNumber}
                                onChange={(e) => setSettings({ ...settings, accountNumber: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>IFSC Code</Label>
                            <Input
                                value={settings.ifsc}
                                onChange={(e) => setSettings({ ...settings, ifsc: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Branch</Label>
                            <Input
                                value={settings.branch}
                                onChange={(e) => setSettings({ ...settings, branch: e.target.value })}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-[hsl(var(--primary))]" />
                            Invoice Terms & Notes
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Standard Notes</Label>
                            <Input
                                value={settings.notes}
                                onChange={(e) => setSettings({ ...settings, notes: e.target.value })}
                            />
                        </div>
                        <div className="space-y-4">
                            <Label>Terms and Conditions</Label>
                            {settings.terms.map((term: string, index: number) => (
                                <div key={index} className="flex gap-2">
                                    <Input
                                        value={term}
                                        onChange={(e) => handleTermChange(index, e.target.value)}
                                    />
                                </div>
                            ))}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSettings({ ...settings, terms: [...settings.terms, ''] })}
                            >
                                Add Term
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
});

export default Settings;
