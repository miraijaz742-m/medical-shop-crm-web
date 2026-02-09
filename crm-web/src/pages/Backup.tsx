import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/common';
import { Database, Download, ShieldCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const toast = {
    success: (msg: string) => alert("Success: " + msg),
    error: (msg: string) => alert("Error: " + msg)
};

export default memo(function Backup() {
    const handleExport = async (table: string) => {
        try {
            const { data, error } = await supabase.from(table).select('*');
            if (error) throw error;

            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${table}_backup_${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            toast.success(`${table} data exported successfully`);
        } catch (err: any) {
            toast.error(`Export failed: ${err.message}`);
        }
    };

    return (
        <div className="space-y-6 p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-[hsl(var(--primary))]/20 shadow-sm">
                    <CardHeader className="bg-[hsl(var(--primary))]/10 rounded-t-xl border-b border-[hsl(var(--primary))]/20">
                        <CardTitle className="text-[hsl(var(--primary-foreground))] flex items-center gap-2">
                            <Download className="h-5 w-5" />
                            Export Data
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                        <p className="text-sm text-gray-500">
                            Download your data from the cloud as JSON files for local storage or analysis.
                        </p>
                        <div className="grid grid-cols-1 gap-2">
                            <Button onClick={() => handleExport('medicines')} variant="outline" className="justify-start">
                                <Database className="h-4 w-4 mr-2" /> Export Medicines
                            </Button>
                            <Button onClick={() => handleExport('customers')} variant="outline" className="justify-start">
                                <Database className="h-4 w-4 mr-2" /> Export Customers
                            </Button>
                            <Button onClick={() => handleExport('bills')} variant="outline" className="justify-start">
                                <Database className="h-4 w-4 mr-2" /> Export Bills
                            </Button>
                            <Button onClick={() => handleExport('expenses')} variant="outline" className="justify-start">
                                <Database className="h-4 w-4 mr-2" /> Export Expenses
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6 flex items-center gap-4 bg-gray-50 text-gray-600 h-full">
                        <ShieldCheck className="h-8 w-8 text-green-500" />
                        <div>
                            <h4 className="font-bold text-gray-800">Cloud Protection Active</h4>
                            <p className="text-sm">
                                Your data is securely stored and backed up automatically by Supabase.
                                Manual exports are provided for your peace of mind.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
});
