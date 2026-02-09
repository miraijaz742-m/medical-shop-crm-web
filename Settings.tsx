import React, { useState, useEffect, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { type AppSettings } from '@/types';
import { Save, Building2, CreditCard, FileText } from 'lucide-react';

const Settings: React.FC = memo(() => {
    const [settings, setSettings] = useState<AppSettings>({
        shopName: 'My Medical Shop',
        licenseNumber: 'DL-12345/67',
        address: '64, Main Road, Near Market, MUMBAI, MAHARASHTRA, 400001',
        mobile: '+91 9999999999',
        bankName: 'HDFC BANK',
        accountNumber: '50100000000000',
        ifsc: 'HDFC0000001',
        branch: 'MUMBAI MAIN',
        terms: [
            '1. Goods once sold cannot be taken back or exchanged.'
        ],
        notes: 'Thank you for your business!'
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await window.electronAPI!.settingsGet();
                if (res.success && res.settings && Object.keys(res.settings).length > 0) {
                    setSettings(prev => ({ ...prev, ...res.settings }));
                }
            } catch (error) {
                console.error('Failed to fetch settings:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleSave = async () => {
        try {
            const res = await window.electronAPI!.settingsSet(settings);
            if (res.success) {
                toast.success('Settings saved successfully');
            } else {
                toast.error('Failed to save settings: ' + res.error);
            }
        } catch (error: any) {
            console.error('Save Settings Error:', error);
            toast.error('An error occurred: ' + (error.message || 'Unknown error'));
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
        <div className="space-y-6 max-w-4xl mx-auto pb-10">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Application Settings</h1>
                    <p className="text-sm text-gray-500 text-pretty">Configure your shop details, bank information, and invoice terms.</p>
                </div>
                <Button onClick={handleSave} className="flex gap-2">
                    <Save className="h-4 w-4" /> Save Settings
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Shop Details */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-sky-600" />
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
                                placeholder="e.g. DL-12345/67"
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
                            <Textarea
                                value={settings.address}
                                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                                rows={3}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Bank Details */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CreditCard className="h-5 w-5 text-sky-600" />
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

                {/* Terms & Conditions */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-sky-600" />
                            Invoice Terms & Notes
                        </CardTitle>
                        <CardDescription>Terms, conditions, and custom notes shown at the bottom of the invoice.</CardDescription>
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
                            {settings.terms.map((term, index) => (
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
