import { useState, useEffect, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Database, Save, RotateCcw, ShieldCheck, HardDrive } from 'lucide-react';
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils';

interface BackupFile {
    name: string;
    path: string;
    date: Date;
}

export default memo(function Backup() {
    const [backups, setBackups] = useState<BackupFile[]>([]);
    const [loading, setLoading] = useState(false);
    const [externalPath, setExternalPath] = useState('');

    useEffect(() => {
        loadBackups();
    }, []);

    const loadBackups = async () => {
        if (window.electronAPI) {
            const list = await window.electronAPI.backupList();
            setBackups(list);
        }
    };

    const handleCreateBackup = async (useExternal: boolean) => {
        if (!window.electronAPI) return;
        setLoading(true);
        try {
            const options = useExternal && externalPath ? { targetPath: externalPath } : {};
            const result = await window.electronAPI.backupCreate(options);

            if (result.success) {
                toast.success('Backup created successfully!');
                loadBackups();
            } else {
                toast.error('Backup failed: ' + result.error);
            }
        } catch (error) {
            toast.error('Backup error');
        } finally {
            setLoading(false);
        }
    };

    const handleRestore = async (path: string) => {
        if (!confirm('WARNING: Restoring will overwrite the current database. A snapshot of the current state will be saved before restoring. Continue?')) {
            return;
        }

        if (!window.electronAPI) return;
        setLoading(true);
        try {
            const result = await window.electronAPI.backupRestore({ backupPath: path });
            if (result.success) {
                toast.success('System restored successfully! Please restart the app.');
                // specific logic to force reload if needed
                setTimeout(() => window.location.reload(), 2000);
            } else {
                toast.error('Restore failed: ' + result.error);
            }
        } catch (error) {
            toast.error('Restore error');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectDirectory = async () => {
        if (!window.electronAPI) {
            toast.error("System interface not ready. Please restart the app.");
            return;
        }
        try {
            const path = await window.electronAPI.selectDirectory();
            if (path) {
                setExternalPath(path);
                toast.success("Folder selected: " + path);
            }
        } catch (error) {
            console.error(error);
            toast.error("Could not open folder picker");
        }
    };

    const handleRestoreFromFile = async () => {
        if (!window.electronAPI) return;
        const path = await window.electronAPI.selectFile({
            filters: [{ name: 'Backups', extensions: ['zip'] }]
        });
        if (path) {
            handleRestore(path);
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Create Backup */}
                <Card className="border-sky-200 shadow-sm">
                    <CardHeader className="bg-sky-50 rounded-t-xl border-b border-sky-100">
                        <CardTitle className="text-sky-800 flex items-center gap-2">
                            <Save className="h-5 w-5" />
                            Create Backup
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                        <div className="bg-sky-50/50 p-4 rounded-lg border border-sky-100">
                            <h3 className="font-semibold text-sky-800 mb-2 flex items-center gap-2">
                                <HardDrive className="h-4 w-4" /> Default Storage
                            </h3>
                            <p className="text-sm text-sky-600 mb-4">
                                Backups are automatically saved to your Application Data folder.
                            </p>
                            <Button
                                onClick={() => handleCreateBackup(false)}
                                disabled={loading}
                                className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold"
                            >
                                {loading ? 'Processing...' : 'BACKUP NOW (Internal)'}
                            </Button>
                        </div>

                        <div className="border-t pt-4">
                            <h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                <Database className="h-4 w-4" /> External Storage (USB)
                            </h3>
                            <div className="grid gap-2">
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="E:\MyBackups"
                                        value={externalPath}
                                        onChange={(e) => setExternalPath(e.target.value)}
                                        className="border-gray-300"
                                    />
                                    <Button
                                        onClick={handleSelectDirectory}
                                        variant="outline"
                                        className="px-3"
                                        title="Select Folder"
                                    >
                                        Browse
                                    </Button>
                                </div>
                                <Button
                                    onClick={() => handleCreateBackup(true)}
                                    disabled={loading || !externalPath}
                                    variant="outline"
                                    className="w-full border-sky-600 text-sky-600 hover:bg-sky-50 font-bold"
                                >
                                    BACKUP TO SELECTED FOLDER
                                </Button>
                            </div>
                            <p className="text-xs text-gray-400 mt-2">
                                Select or paste the folder path of your USB drive or external hard disk.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Restore Backup */}
                <Card className="border-red-100 shadow-sm">
                    <CardHeader className="bg-red-50 rounded-t-xl border-b border-red-100">
                        <div className="flex justify-between items-center w-full">
                            <CardTitle className="text-red-800 flex items-center gap-2">
                                <RotateCcw className="h-5 w-5" />
                                Restore Data
                            </CardTitle>
                            <Button
                                onClick={handleRestoreFromFile}
                                size="sm"
                                variant="outline"
                                className="border-red-200 bg-white text-red-600 hover:bg-red-50"
                            >
                                Select .zip File
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="max-h-[400px] overflow-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Filename</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {backups.map((backup) => (
                                        <TableRow key={backup.name}>
                                            <TableCell className="font-medium text-gray-600">
                                                {formatDate(backup.date)} {new Date(backup.date).toLocaleTimeString()}
                                            </TableCell>
                                            <TableCell className="text-xs text-gray-400 font-mono">
                                                {backup.name}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => handleRestore(backup.path)}
                                                    disabled={loading}
                                                >
                                                    <RotateCcw className="h-4 w-4 mr-1" /> Restore
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {backups.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center py-8 text-gray-400 italic">
                                                No local backups found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Auto Backup Info */}
            <Card>
                <CardContent className="p-6 flex items-center gap-4 bg-gray-50 text-gray-600">
                    <ShieldCheck className="h-8 w-8 text-green-500" />
                    <div>
                        <h4 className="font-bold text-gray-800">Automatic Protection Active</h4>
                        <p className="text-sm">
                            The system automatically backs up all data every 24 hours upon launch.
                            Snapshots are also taken before any restore operation.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
});
