import * as React from "react"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { X, ChevronDown } from "lucide-react"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

// Button
export const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: string, size?: string }>(
    ({ className, variant = "default", size = "default", ...props }, ref) => {
        const variants: Record<string, string> = {
            default: "bg-[hsl(var(--primary))] text-white font-semibold shadow-lg shadow-[hsl(var(--primary))]/25 hover:shadow-xl hover:shadow-[hsl(var(--primary))]/40 hover:brightness-110 border-2 border-[hsl(var(--primary))]",
            outline: "border-2 border-dashed border-[hsl(var(--primary))]/40 bg-white text-[hsl(var(--primary))] font-semibold hover:border-solid hover:border-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/5",
            ghost: "bg-transparent text-slate-600 font-medium hover:bg-slate-100 hover:text-slate-900",
            secondary: "bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 border-2 border-slate-200",
            destructive: "bg-red-500 text-white font-semibold shadow-lg shadow-red-500/25 hover:shadow-xl hover:shadow-red-500/40 hover:brightness-110 border-2 border-red-500",
            success: "bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/40 hover:brightness-110 border-2 border-emerald-500",
        }
        const sizes: Record<string, string> = {
            default: "h-10 px-5 rounded-xl text-sm",
            sm: "h-8 px-3 rounded-lg text-xs",
            lg: "h-12 px-8 rounded-xl text-base",
            icon: "h-9 w-9 rounded-lg",
        }
        return (
            <button
                ref={ref}
                className={cn(
                    "inline-flex items-center justify-center gap-2 font-medium tracking-wide uppercase focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))]/50 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 transition-all duration-200",
                    variants[variant] || variants.default,
                    sizes[size] || sizes.default,
                    className
                )}
                {...props}
            />
        )
    }
)

// Input
export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
    ({ className, type, ...props }, ref) => {
        return (
            <input
                type={type}
                className={cn(
                    "flex h-9 w-full rounded-xl border border-slate-200 bg-white/60 backdrop-blur-sm px-3 py-1 text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))]/30 focus-visible:border-[hsl(var(--primary))] disabled:cursor-not-allowed disabled:opacity-50 shadow-sm focus:shadow-md",
                    className
                )}
                ref={ref}
                {...props}
            />
        )
    }
)

// Label
export const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
    ({ className, ...props }, ref) => (
        <label
            ref={ref}
            className={cn("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70", className)}
            {...props}
        />
    )
)

// Table
export const Table = ({ className, ...props }: React.HTMLAttributes<HTMLTableElement>) => (
    <div className="relative w-full overflow-auto">
        <table className={cn("w-full caption-bottom text-sm", className)} {...props} />
    </div>
)
export const TableHeader = ({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
    <thead className={cn("[&_tr]:border-b", className)} {...props} />
)
export const TableBody = ({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
    <tbody className={cn("[&_tr:last-child]:border-0", className)} {...props} />
)
export const TableRow = ({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) => (
    <tr className={cn("border-b hover:bg-muted/50 data-[state=selected]:bg-muted", className)} {...props} />
)
export const TableHead = ({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) => (
    <th className={cn("h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0", className)} {...props} />
)
export const TableCell = ({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) => (
    <td className={cn("p-2 align-middle [&:has([role=checkbox])]:pr-0", className)} {...props} />
)

// Dialog Context
const DialogContext = React.createContext<{ open: boolean, onOpenChange: (open: boolean) => void }>({
    open: false,
    onOpenChange: () => { }
})

export const Dialog = ({ children, open, onOpenChange }: any) => {
    return (
        <DialogContext.Provider value={{ open, onOpenChange }}>
            {children}
        </DialogContext.Provider>
    )
}

export const DialogTrigger = ({ children, asChild }: any) => {
    const { onOpenChange } = React.useContext(DialogContext)
    if (asChild && React.isValidElement(children)) {
        return React.cloneElement(children as React.ReactElement, {
            onClick: (e: React.MouseEvent) => {
                const childProps = (children as React.ReactElement).props
                if (childProps.onClick) childProps.onClick(e)
                onOpenChange(true)
            }
        })
    }
    return <div onClick={() => onOpenChange(true)}>{children}</div>
}

export const DialogContent = ({ children, className }: any) => {
    const { open, onOpenChange } = React.useContext(DialogContext)
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className={cn("bg-white rounded-lg shadow-lg p-6 relative", className)}>
                <button
                    onClick={() => onOpenChange(false)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-black"
                >
                    <X className="h-4 w-4" />
                </button>
                {children}
            </div>
        </div>
    )
}

export const DialogHeader = ({ children }: any) => <div className="mb-4">{children}</div>
export const DialogTitle = ({ children }: any) => <h2 className="text-xl font-bold">{children}</h2>

// Select (Simplified but flexible)
export const Select = ({ children, value, onValueChange, className, title }: any) => {
    return (
        <div className={cn("relative w-full group", className)}>
            <select
                value={value}
                onChange={(e) => onValueChange(e.target.value)}
                title={title}
                className={cn(
                    "w-full h-9 rounded-xl border border-slate-200 bg-white/60 backdrop-blur-sm px-3 pr-8 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]/30 cursor-pointer",
                    className
                )}
            >
                {children}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-slate-600">
                <ChevronDown className="h-4 w-4" />
            </div>
        </div>
    )
}
export const SelectTrigger = ({ children }: any) => children;
export const SelectValue = ({ placeholder }: any) => <option value="" disabled>{placeholder}</option>;
export const SelectContent = ({ children }: any) => children;
export const SelectItem = ({ children, value, className }: any) => (
    <option value={value} className={className}>
        {children}
    </option>
);
// Modern Graphic Healthcare Illustrations
export const Illustration = ({ type, className }: { type: 'medical' | 'secure' | 'empty' | 'chart' | 'nurse' | 'pharmacy-team' | 'inventory' | 'billing', className?: string }) => {
    const renders = {
        nurse: (
            <div className={cn("relative w-full aspect-square max-w-[240px] mx-auto", className)}>
                <svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Background circles */}
                    <circle cx="200" cy="200" r="180" fill="#F0F4FF" opacity="0.5" />
                    <circle cx="200" cy="200" r="140" fill="#E0E7FF" opacity="0.6" />

                    {/* Nurse character */}
                    <ellipse cx="200" cy="320" rx="60" ry="15" fill="#D1D5DB" opacity="0.3" />

                    {/* Body */}
                    <path d="M160 240 L160 310 L240 310 L240 240 Z" fill="#A78BFA" />
                    <path d="M150 240 L150 260 L250 260 L250 240 Z" fill="#8B5CF6" />

                    {/* Arms */}
                    <rect x="130" y="250" width="20" height="50" rx="10" fill="#F3E8FF" />
                    <rect x="250" y="250" width="20" height="50" rx="10" fill="#F3E8FF" />

                    {/* Clipboard */}
                    <rect x="240" y="260" width="35" height="45" rx="3" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="2" />
                    <line x1="248" y1="270" x2="267" y2="270" stroke="#CBD5E1" strokeWidth="2" />
                    <line x1="248" y1="280" x2="267" y2="280" stroke="#CBD5E1" strokeWidth="2" />
                    <line x1="248" y1="290" x2="260" y2="290" stroke="#CBD5E1" strokeWidth="2" />

                    {/* Head */}
                    <circle cx="200" cy="200" r="35" fill="#FDE68A" />

                    {/* Hair */}
                    <path d="M165 190 Q165 165 200 165 Q235 165 235 190 L235 200 L165 200 Z" fill="#7C3AED" />

                    {/* Face details */}
                    <circle cx="190" cy="200" r="3" fill="#374151" />
                    <circle cx="210" cy="200" r="3" fill="#374151" />
                    <path d="M190 210 Q200 215 210 210" stroke="#374151" strokeWidth="2" fill="none" />

                    {/* Medical cross badge */}
                    <circle cx="170" cy="250" r="12" fill="#FFFFFF" />
                    <path d="M170 244 L170 256 M164 250 L176 250" stroke="#EF4444" strokeWidth="3" />

                    {/* Stethoscope */}
                    <path d="M180 270 Q180 285 195 290" stroke="#475569" strokeWidth="3" fill="none" />
                    <circle cx="195" cy="290" r="5" fill="#475569" />
                </svg>
            </div>
        ),
        'pharmacy-team': (
            <div className={cn("relative w-full aspect-square max-w-[240px] mx-auto", className)}>
                <svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Background */}
                    <rect x="0" y="0" width="400" height="400" fill="#F8FAFC" />
                    <circle cx="200" cy="200" r="160" fill="#E0E7FF" opacity="0.4" />

                    {/* Pharmacy shelves */}
                    <rect x="50" y="100" width="300" height="15" fill="#94A3B8" opacity="0.3" />
                    <rect x="50" y="150" width="300" height="15" fill="#94A3B8" opacity="0.3" />

                    {/* Medicine boxes */}
                    <rect x="60" y="110" width="25" height="35" fill="#10B981" opacity="0.7" />
                    <rect x="90" y="110" width="25" height="35" fill="#3B82F6" opacity="0.7" />
                    <rect x="120" y="110" width="25" height="35" fill="#F59E0B" opacity="0.7" />

                    {/* Person 1 - Pharmacist */}
                    <ellipse cx="140" cy="340" rx="40" ry="10" fill="#D1D5DB" opacity="0.3" />
                    <rect x="120" y="260" width="40" height="80" rx="5" fill="#FFFFFF" />
                    <rect x="115" y="260" width="50" height="20" rx="3" fill="#8B5CF6" />
                    <circle cx="140" cy="235" r="20" fill="#FCD34D" />
                    <path d="M125 225 Q125 215 140 215 Q155 215 155 225 L155 235 L125 235 Z" fill="#6366F1" />
                    <circle cx="135" cy="235" r="2" fill="#374151" />
                    <circle cx="145" cy="235" r="2" fill="#374151" />

                    {/* Person 2 - Assistant */}
                    <ellipse cx="260" cy="340" rx="40" ry="10" fill="#D1D5DB" opacity="0.3" />
                    <rect x="240" y="260" width="40" height="80" rx="5" fill="#A78BFA" />
                    <circle cx="260" cy="235" r="20" fill="#F3E8FF" />
                    <path d="M245 225 Q245 215 260 215 Q275 215 275 225 L275 235 L245 235 Z" fill="#4C1D95" />
                    <circle cx="255" cy="235" r="2" fill="#374151" />
                    <circle cx="265" cy="235" r="2" fill="#374151" />

                    {/* Tablet/device */}
                    <rect x="230" y="270" width="30" height="40" rx="3" fill="#1F2937" opacity="0.8" />
                    <rect x="235" y="275" width="20" height="25" fill="#60A5FA" opacity="0.5" />

                    {/* Medical cross */}
                    <circle cx="320" cy="120" r="25" fill="#FFFFFF" opacity="0.9" />
                    <path d="M320 105 L320 135 M305 120 L335 120" stroke="#EF4444" strokeWidth="5" />
                </svg>
            </div>
        ),
        inventory: (
            <div className={cn("relative w-full aspect-square max-w-[200px] mx-auto", className)}>
                <svg viewBox="0 0 300 300" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="150" cy="150" r="130" fill="#F0F9FF" opacity="0.6" />

                    {/* Shelving unit */}
                    <rect x="80" y="80" width="140" height="10" fill="#64748B" />
                    <rect x="80" y="140" width="140" height="10" fill="#64748B" />
                    <rect x="80" y="200" width="140" height="10" fill="#64748B" />

                    {/* Medicine boxes */}
                    <rect x="90" y="90" width="30" height="45" fill="#10B981" opacity="0.8" />
                    <rect x="125" y="90" width="30" height="45" fill="#3B82F6" opacity="0.8" />
                    <rect x="160" y="90" width="30" height="45" fill="#F59E0B" opacity="0.8" />
                    <rect x="195" y="90" width="20" height="45" fill="#EF4444" opacity="0.8" />

                    <rect x="90" y="150" width="25" height="45" fill="#8B5CF6" opacity="0.8" />
                    <rect x="120" y="150" width="35" height="45" fill="#EC4899" opacity="0.8" />
                    <rect x="160" y="150" width="30" height="45" fill="#14B8A6" opacity="0.8" />

                    {/* Barcode scanner */}
                    <rect x="200" y="220" width="50" height="30" rx="5" fill="#1F2937" />
                    <rect x="205" y="225" width="40" height="15" fill="#60A5FA" opacity="0.6" />
                    <line x1="210" y1="230" x2="210" y2="235" stroke="#FFFFFF" strokeWidth="1" />
                    <line x1="215" y1="230" x2="215" y2="235" stroke="#FFFFFF" strokeWidth="2" />
                    <line x1="220" y1="230" x2="220" y2="235" stroke="#FFFFFF" strokeWidth="1" />
                    <line x1="225" y1="230" x2="225" y2="235" stroke="#FFFFFF" strokeWidth="2" />
                    <line x1="230" y1="230" x2="230" y2="235" stroke="#FFFFFF" strokeWidth="1" />

                    {/* Checkmark */}
                    <circle cx="60" cy="100" r="20" fill="#10B981" />
                    <path d="M52 100 L58 106 L70 94" stroke="#FFFFFF" strokeWidth="3" fill="none" />
                </svg>
            </div>
        ),
        billing: (
            <div className={cn("relative w-full aspect-square max-w-[200px] mx-auto", className)}>
                <svg viewBox="0 0 300 300" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="150" cy="150" r="130" fill="#FEF3C7" opacity="0.4" />

                    {/* Receipt/Invoice */}
                    <rect x="90" y="60" width="120" height="180" rx="8" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="3" />

                    {/* Receipt header */}
                    <rect x="100" y="75" width="100" height="8" rx="4" fill="#8B5CF6" opacity="0.3" />
                    <rect x="100" y="90" width="80" height="6" rx="3" fill="#CBD5E1" opacity="0.5" />

                    {/* Receipt lines */}
                    <line x1="100" y1="110" x2="190" y2="110" stroke="#E5E7EB" strokeWidth="2" />
                    <line x1="100" y1="125" x2="190" y2="125" stroke="#E5E7EB" strokeWidth="2" />
                    <line x1="100" y1="140" x2="190" y2="140" stroke="#E5E7EB" strokeWidth="2" />
                    <line x1="100" y1="155" x2="190" y2="155" stroke="#E5E7EB" strokeWidth="2" />

                    {/* Total section */}
                    <rect x="100" y="170" width="100" height="25" fill="#10B981" opacity="0.1" />
                    <rect x="105" y="175" width="50" height="8" rx="4" fill="#10B981" opacity="0.6" />
                    <rect x="160" y="175" width="25" height="8" rx="4" fill="#10B981" />

                    {/* Coins */}
                    <circle cx="240" cy="200" r="18" fill="#F59E0B" opacity="0.8" />
                    <circle cx="255" cy="215" r="15" fill="#FBBF24" opacity="0.8" />
                    <circle cx="230" cy="220" r="12" fill="#FCD34D" opacity="0.8" />

                    {/* Dollar signs */}
                    <text x="235" y="207" fill="#FFFFFF" fontSize="16" fontWeight="bold">₹</text>

                    {/* Credit card */}
                    <rect x="40" y="200" width="60" height="40" rx="5" fill="#6366F1" />
                    <rect x="45" y="210" width="50" height="8" rx="2" fill="#FFFFFF" opacity="0.3" />
                    <circle cx="55" cy="228" r="6" fill="#FFFFFF" opacity="0.5" />
                    <circle cx="70" cy="228" r="6" fill="#FFFFFF" opacity="0.5" />
                </svg>
            </div>
        ),
        medical: (
            <div className={cn("relative w-full aspect-square max-w-[280px] mx-auto", className)}>
                <div className="absolute inset-0 bg-[hsl(var(--primary))]/5 rounded-3xl -rotate-6" />
                <div className="absolute inset-0 border-2 border-slate-200 rounded-3xl" />
                <div className="relative h-full w-full flex items-center justify-center">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-[hsl(var(--primary))]/10 rounded-full blur-2xl" />
                    <Stethoscope className="w-24 h-24 text-[hsl(var(--primary))] opacity-80" />
                    <div className="absolute top-8 right-8 w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20">
                        <Package className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div className="absolute bottom-12 left-6 w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center border border-blue-500/20 text-blue-600">
                        <Users className="w-5 h-5" />
                    </div>
                </div>
            </div>
        ),
        secure: (
            <div className={cn("relative w-full aspect-square max-w-[280px] mx-auto", className)}>
                <div className="absolute inset-0 bg-blue-500/5 rounded-[40px] rotate-3" />
                <div className="absolute inset-0 border-2 border-slate-100 rounded-[40px]" />
                <div className="relative h-full w-full flex items-center justify-center">
                    <ShieldCheck className="w-28 h-28 text-blue-500 opacity-70" />
                    <div className="absolute -top-4 -right-2 p-3 bg-white rounded-2xl shadow-lg border border-slate-100 text-blue-600">
                        <Lock className="w-6 h-6" />
                    </div>
                </div>
            </div>
        ),
        empty: (
            <div className={cn("flex flex-col items-center justify-center py-12", className)}>
                <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-4 border-2 border-dashed border-slate-200">
                    <Package className="h-10 w-10 text-slate-300" />
                </div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">No data found</p>
            </div>
        ),
        chart: (
            <div className={cn("relative w-full h-40 bg-slate-50 rounded-2xl border border-slate-100 flex items-end justify-around px-4 pb-4 overflow-hidden", className)}>
                <div className="w-6 h-24 bg-[hsl(var(--primary))]/20 rounded-t-lg" />
                <div className="w-6 h-16 bg-[hsl(var(--primary))]/30 rounded-t-lg" />
                <div className="w-6 h-28 bg-[hsl(var(--primary))] rounded-t-lg" />
                <div className="w-6 h-20 bg-[hsl(var(--primary))]/40 rounded-t-lg" />
            </div>
        )
    }

    return renders[type] || renders.empty;
}

import { Stethoscope, ShieldCheck, Lock, Users, Package } from "lucide-react"
