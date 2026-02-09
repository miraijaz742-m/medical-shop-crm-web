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
                    "inline-flex items-center justify-center text-sm font-bold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))]/50 disabled:pointer-events-none disabled:opacity-50 active:scale-95",
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
                    "flex h-11 w-full rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-sm px-4 py-2 text-sm transition-all duration-300 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))]/30 focus-visible:border-[hsl(var(--primary))] disabled:cursor-not-allowed disabled:opacity-50 shadow-sm focus:shadow-md",
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
    <tr className={cn("border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted", className)} {...props} />
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
                    "w-full h-11 rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-sm px-4 pr-10 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]/30 transition-all duration-300 cursor-pointer",
                    className
                )}
            >
                {children}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-slate-600 transition-colors">
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
