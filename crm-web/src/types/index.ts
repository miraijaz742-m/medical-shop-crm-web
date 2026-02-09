export interface Product {
    id: string;
    name: string;
    category: string;
    selling_price: number;
    purchase_price: number;
    stock: number;
    shelf_number: string;
    expiry_date: string;
    created_at?: string;
    updated_at?: string;
}

export interface Customer {
    id: string;
    name: string;
    phone: string;
    email: string;
    address: string;
    created_at?: string;
    updated_at?: string;
}

export interface Bill {
    id: string;
    customer_id: string;
    total_amount: number;
    date: string;
    items: any[];
    created_at?: string;
}

export interface Expense {
    id: string;
    description: string;
    amount: number;
    category: string;
    date: string;
    created_at?: string;
}

export interface DashboardStats {
    totalSales: number;
    totalBills: number;
    totalCustomers: number;
    totalProducts: number;
    lowStockProducts: number;
    totalExpenses: number;
    todaySales: number;
    todayBills: number;
}
