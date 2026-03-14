import { Transaction } from '../App';

/**
 * Utility function to export transactions to a CSV file.
 * Creates a Blob with CSV data and triggers a download.
 */
export const exportTransactionsToCSV = (transactions: Transaction[]): void => {
  if (!transactions || transactions.length === 0) {
    alert('No transactions to export.');
    return;
  }

  // 1. Define CSV columns
  const headers = ['Date', 'Type', 'Category', 'Description', 'Amount'];

  // 2. Format the data to match the headers
  const rows = transactions.map((t) => {
    // Escape quotes and handle commas in the description
    const escapedDescription =
      t.description.includes(',') || t.description.includes('"')
        ? `"${t.description.replace(/"/g, '""')}"`
        : t.description;

    // Capitalize type appropriately
    const typeLabel = t.type.charAt(0).toUpperCase() + t.type.slice(1);

    // Amount representation: neg for expenses, pos for incomes
    const formattedAmount = t.type === 'expense' ? `-${t.amount}` : `${t.amount}`;

    return [
      t.date,
      typeLabel,
      t.category,
      escapedDescription,
      formattedAmount,
    ].join(',');
  });

  // 3. Construct CSV string contents
  const csvContent = [headers.join(','), ...rows].join('\n');

  // 4. Create a Blob and Object URL
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  // 5. Trigger download programmatically
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'spendwise-transactions.csv');
  
  document.body.appendChild(link);
  link.click();
  
  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
