import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface InvoiceItem {
    name: string;
    quantity: number;
    price: number;
    total: number;
}

interface InvoiceData {
    invoiceNumber: string;
    date: string;
    customerName: string;
    customerPhone?: string;
    items: InvoiceItem[];
    subtotal: number;
    tax: number;
    discount: number;
    total: number;
}

export function generateInvoicePDF(data: InvoiceData) {
    const doc = new jsPDF();

    // Header - Shop Name
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Medical Shop CRM', 105, 20, { align: 'center' });

    // Invoice Title
    doc.setFontSize(16);
    doc.text('INVOICE', 105, 30, { align: 'center' });

    // Invoice Details
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Invoice #: ${data.invoiceNumber}`, 20, 45);
    doc.text(`Date: ${data.date}`, 20, 51);

    // Customer Details
    doc.text(`Customer: ${data.customerName}`, 20, 60);
    if (data.customerPhone) {
        doc.text(`Phone: ${data.customerPhone}`, 20, 66);
    }

    // Items Table
    const tableData = data.items.map(item => [
        item.name,
        item.quantity.toString(),
        `₹${item.price.toFixed(2)}`,
        `₹${item.total.toFixed(2)}`
    ]);

    autoTable(doc, {
        startY: 75,
        head: [['Item Name', 'Qty', 'Price', 'Total']],
        body: tableData,
        theme: 'striped',
        headStyles: {
            fillColor: [129, 119, 234], // Purple
            textColor: [255, 255, 255],
            fontStyle: 'bold'
        },
        styles: {
            fontSize: 10,
            cellPadding: 5
        }
    });

    // Calculate Y position after table
    const finalY = (doc as any).lastAutoTable.finalY + 10;

    // Totals
    doc.setFont('helvetica', 'normal');
    doc.text(`Subtotal:`, 140, finalY);
    doc.text(`₹${data.subtotal.toFixed(2)}`, 180, finalY, { align: 'right' });

    doc.text(`Tax:`, 140, finalY + 6);
    doc.text(`₹${data.tax.toFixed(2)}`, 180, finalY + 6, { align: 'right' });

    doc.text(`Discount:`, 140, finalY + 12);
    doc.text(`-₹${data.discount.toFixed(2)}`, 180, finalY + 12, { align: 'right' });

    // Total (Bold)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(`Total:`, 140, finalY + 20);
    doc.text(`₹${data.total.toFixed(2)}`, 180, finalY + 20, { align: 'right' });

    // Footer
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text('Thank you for your business!', 105, 280, { align: 'center' });

    // Save PDF - Downloads directly to user's device
    doc.save(`invoice-${data.invoiceNumber}.pdf`);
}
