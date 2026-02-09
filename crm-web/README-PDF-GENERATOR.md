# 📄 Medical Shop CRM - Invoice PDF Generator

> **✨ Professional client-side PDF generation with zero server costs**

---

## 🎯 Overview

Generate beautiful, professional invoices as PDF files directly in the browser. This implementation uses **jsPDF** and **jspdf-autotable** to create pixel-perfect invoices that download instantly to your users' devices.

### 💰 Cost-Free Client-Side Generation

> [!IMPORTANT]
> **Zero Storage Costs!** This implementation generates PDFs **100% client-side** (in the user's browser). The PDF is created in the user's device memory and immediately downloaded to their computer/mobile. **No files are uploaded to your server or cloud storage**, which means:
> 
> | Benefit | Description |
> |---------|-------------|
> | 💵 **Zero Storage Costs** | No cloud storage fees - ever! |
> | 🚀 **Zero Bandwidth Costs** | PDFs never touch your server |
> | 🔐 **Complete Privacy** | Customer data stays on their device |
> | 📱 **Works Offline** | Generate PDFs without internet |
> | ⚡ **Instant Generation** | No server delays or queues |

---

## 📦 Installation

Install the required dependencies:

```bash
npm install jspdf jspdf-autotable
```

---

## 🛠️ Implementation Guide

### Step 1️⃣ Create PDF Utility File

Create a new file `src/utils/pdfGenerator.ts`:

```typescript
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
  
  // 🎉 Save PDF - Downloads directly to user's device!
  doc.save(`invoice-${data.invoiceNumber}.pdf`);
}
```

---

### Step 2️⃣ Integrate into Billing Page

Update your `src/pages/Billing.tsx` to add a "Download PDF" button:

```typescript
import { generateInvoicePDF } from '@/utils/pdfGenerator';
import { Download } from 'lucide-react';

// Inside your component, add this function:
const handleDownloadPDF = () => {
  const invoiceData = {
    invoiceNumber: `INV-${Date.now()}`,
    date: new Date().toLocaleDateString(),
    customerName: selectedCustomer?.name || 'Walk-in Customer',
    customerPhone: selectedCustomer?.phone,
    items: cart.map(item => ({
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      total: item.quantity * item.price
    })),
    subtotal: subtotal,
    tax: tax,
    discount: discount,
    total: total
  };
  
  generateInvoicePDF(invoiceData);
};

// Add the button to your UI:
<Button 
  onClick={handleDownloadPDF}
  variant="outline"
  className="flex items-center gap-2"
>
  <Download className="w-4 h-4" />
  Download PDF
</Button>
```

---

### Step 3️⃣ TypeScript Configuration (if needed)

If you encounter TypeScript errors with jspdf-autotable, add this to your `src/types/jspdf-autotable.d.ts`:

```typescript
declare module 'jspdf' {
  interface jsPDF {
    lastAutoTable: {
      finalY: number;
    };
  }
}
```

---

## 🎨 Customization Options

### 📷 Logo Support

To add your shop logo:

```typescript
// Add this in generateInvoicePDF before the header
const logoUrl = '/path/to/logo.png';
doc.addImage(logoUrl, 'PNG', 15, 10, 30, 30);
```

### 🎨 Custom Colors

Change the primary color by modifying the `headStyles.fillColor`:

```typescript
headStyles: {
  fillColor: [129, 119, 234], // RGB values for purple
  textColor: [255, 255, 255],
  fontStyle: 'bold'
}
```

> [!TIP]
> Use RGB values in the format `[R, G, B]` where each value is between 0-255.

### 📋 Additional Fields

Add GST number, address, or other details:

```typescript
doc.text(`GST No: ${shopGSTNumber}`, 20, 72);
doc.text(`Address: ${shopAddress}`, 20, 78);
```

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🎯 **Professional Layout** | Clean, modern invoice design |
| 📊 **Itemized Lists** | Detailed product breakdown |
| 🧮 **Auto Calculations** | Subtotal, tax, and discount |
| 👤 **Customer Info** | Name and contact details |
| 🏷️ **Branded Header** | Your shop name and logo |
| 📑 **Table Format** | Easy-to-read data tables |
| 💾 **Instant Download** | One-click PDF generation |

---

## 🌐 Browser Compatibility

jsPDF works in all modern browsers:

| Browser | Minimum Version |
|---------|----------------|
| 🌐 Chrome | 60+ |
| 🦊 Firefox | 55+ |
| 🧭 Safari | 11+ |
| 🔷 Edge | 79+ |

---

## 🔧 Troubleshooting

### 🚨 PDF not downloading?

> [!WARNING]
> - Check browser console for errors
> - Ensure all required data is provided
> - Verify jsPDF is properly installed

### 📄 Table not displaying correctly?

- Make sure jspdf-autotable is imported correctly
- Check that table data is in the correct format

### 🔤 Fonts look incorrect?

- jsPDF includes standard fonts by default
- For custom fonts, you'll need to convert and embed them

---

## 🚀 Next Steps

Consider adding:

- 📧 **Email PDF** functionality
- 🖨️ **Print** functionality
- 📋 **Custom templates** for different invoice types
- 📊 **Batch PDF generation** for reports
- 💬 **WhatsApp sharing** integration

---

## 📚 Resources

For more information, visit:
- [jsPDF Documentation](https://github.com/parallax/jsPDF)
- [jspdf-autotable Documentation](https://github.com/simonbengtsson/jsPDF-AutoTable)

---

<div align="center">

**Made with ❤️ for Medical Shop CRM**

*Developed by Aijaz*

</div>
