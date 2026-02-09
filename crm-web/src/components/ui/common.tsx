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
            default: "bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--primary))]/80 text-[hsl(var(--primary-foreground))] hover:shadow-xl hover:shadow-[hsl(var(--primary))]/30 shadow-md",
            outline: "border border-slate-200 bg-white/60 backdrop-blur-sm hover:bg-white hover:border-[hsl(var(--primary))] hover:text-slate-900 shadow-sm",
            ghost: "hover:bg-white/80 hover:backdrop-blur-sm text-slate-500 hover:text-slate-900",
        }
        const sizes: Record<string, string> = {
            default: "h-11 px-6 rounded-2xl",
            sm: "h-9 rounded-xl px-4",
            icon: "h-11 w-11 rounded-2xl",
        }
        return (
            <button
                ref={ref}
                className={cn(
                    "inline-flex items-center justify-center text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))]/50 disabled:pointer-events-none disabled:opacity-50",
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
                    "flex h-11 w-full rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-sm px-4 py-2 text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))]/30 focus-visible:border-[hsl(var(--primary))] disabled:cursor-not-allowed disabled:opacity-50 shadow-sm focus:shadow-md",
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
    <td className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)} {...props} />
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
                    "w-full h-11 rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-sm px-4 pr-10 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]/30 cursor-pointer",
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
// Premium Static Illustration Component
export const Illustration = ({ type, className }: { type: 'medical' | 'secure' | 'empty' | 'chart', className?: string }) => {
    const renders = {
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
