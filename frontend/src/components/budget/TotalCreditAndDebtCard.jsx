import React from 'react';
import { Pie, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js';
ChartJS.register(ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

function TotalCreditAndDebtCard({ recurringExpenses }) {
    // Filter and sort credit cards
    const creditCards = (recurringExpenses || [])
        .filter(item => item.category === 'credit-card')
        .sort((a, b) => parseFloat(b.outstanding_balance || 0) - parseFloat(a.outstanding_balance || 0));
    // Filter and sort loans
    const loans = (recurringExpenses || [])
        .filter(item => item.category === 'loan')
        .sort((a, b) => parseFloat(b.principal_balance || 0) - parseFloat(a.principal_balance || 0));

    // Calculate totals for chart
    const totalCreditCardDebt = creditCards.reduce((sum, c) => sum + (parseFloat(c.outstanding_balance) || 0), 0);
    const totalLoanDebt = loans.reduce((sum, l) => sum + (parseFloat(l.principal_balance) || 0), 0);
    const totalDebt = totalCreditCardDebt + totalLoanDebt;
    const totalLimit = creditCards.reduce((sum, c) => sum + (parseFloat(c.spending_limit || 0)), 0);
    const totalAvailable = creditCards.reduce((sum, c) => sum + ((parseFloat(c.spending_limit || 0) - parseFloat(c.outstanding_balance || 0)) || 0), 0);

    // Bar chart data for total debt breakdown
    const debtBarData = {
        labels: [''],
        datasets: [
            {
                label: 'Credit Cards',
                data: [totalCreditCardDebt],
                backgroundColor: '#f87171',
                borderWidth: 1,
                barPercentage: 0.7,
                categoryPercentage: 0.7,
            },
            {
                label: 'Loans',
                data: [totalLoanDebt],
                backgroundColor: '#fbbf24', // orange-400
                borderWidth: 1,
                barPercentage: 0.7,
                categoryPercentage: 0.7,
            },
        ],
    };
    // Bar chart data for credit card utilization
    const creditCardBarData = {
        labels: [''],
        datasets: [
            {
                label: 'Outstanding',
                data: [totalCreditCardDebt],
                backgroundColor: '#f87171',
                borderWidth: 1,
                barPercentage: 0.7,
                categoryPercentage: 0.7,
            },
            {
                label: 'Available',
                data: [totalAvailable],
                backgroundColor: '#60a5fa',
                borderWidth: 1,
                barPercentage: 0.7,
                categoryPercentage: 0.7,
            },
        ],
    };
    const pieOptions = {
        plugins: { legend: { display: false } },
        cutout: '60%',
        responsive: true,
        maintainAspectRatio: false,
    };
    const barOptions = {
        indexAxis: 'y',
        plugins: { legend: { display: false } },
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: {
                stacked: true,
                beginAtZero: true,
                grid: { color: '#374151' },
                ticks: { color: '#d1d5db' },
            },
            y: {
                stacked: true,
                grid: { color: '#374151' },
                ticks: { color: '#d1d5db' },
            },
        },
    };
    const creditCardBarOptions = {
        indexAxis: 'y',
        plugins: { legend: { display: false } },
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: {
                stacked: true,
                min: 0,
                max: totalLimit > 0 ? totalLimit : undefined,
                grid: { color: '#374151' },
                ticks: { color: '#d1d5db' },
            },
            y: {
                stacked: true,
                grid: { color: '#374151' },
                ticks: { color: '#d1d5db' },
            },
        },
    };

    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-xl flex flex-col md:flex-row gap-8">
            <div className="flex-1">
                <h3 className="text-lg font-bold text-white-300 border-b border-gray-700 mb-2">Total Credit & Debt</h3>
                <div className="mb-4">
                    <h4 className="font-semibold text-green-400 mb-2">Credit Cards</h4>
                    {creditCards.length === 0 && <div className="text-gray-400 text-sm">No credit cards found.</div>}
                    <ul className="space-y-2">
                        {creditCards.map(card => (
                            <li key={card.id} className="bg-gray-700 p-3 rounded-md">
                                <div className="flex flex-wrap items-center justify-between mb-1">
                                    <span className="font-semibold text-white">{card.label}</span>
                                    <span className="text-xs font-bold text-white">Available: <span className="text-green-400">${(parseFloat(card.spending_limit || 0) - parseFloat(card.outstanding_balance || 0)).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</span></span>
                                </div>
                                <div className="text-xs text-gray-400 flex flex-wrap gap-2">
                                    <span>Outstanding: <span className="text-red-400">${parseFloat(card.outstanding_balance || 0).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</span></span>
                                    <span>Limit: <span className="text-blue-300">${parseFloat(card.spending_limit || 0).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</span></span>
                                    <span>Interest: <span className="text-yellow-300">{parseFloat(card.interest_rate || 0).toFixed(2)}%</span></span>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
                <div>
                    <h4 className="font-semibold text-blue-400 mb-2">Loans</h4>
                    {loans.length === 0 && <div className="text-gray-400 text-sm">No loans found.</div>}
                    <ul className="space-y-2">
                        {loans.map(loan => (
                            <li key={loan.id} className="bg-gray-700 p-3 rounded-md flex flex-col sm:flex-row sm:justify-between sm:items-center">
                                <div>
                                    <span className="font-semibold text-white">{loan.label}</span>
                                    <div className="text-xs text-gray-400 flex flex-wrap gap-2">
                                        <span>Principal: <span className="text-red-400">${parseFloat(loan.principal_balance || 0).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</span></span>
                                        <span>Interest: <span className="text-yellow-300">{parseFloat(loan.interest_rate || 0).toFixed(2)}%</span></span>
                                        {loan.maturity_date && <span>Maturity: <span className="text-indigo-300">{loan.maturity_date}</span></span>}
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
            <div className="flex flex-col items-center justify-center min-w-[180px]">
                <h4 className="font-semibold text-gray-300 mb-2">Debt Breakdown</h4>
                <div className="text-lg font-bold text-white mb-2">${totalDebt.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})} Total Debt</div>
                {/* Debt Breakdown Bar Chart */}
                <div className="w-52 h-20 flex items-center justify-center bg-gray-900 rounded mb-2">
                    <Bar data={debtBarData} options={barOptions} style={{ width: '100%', height: '100%' }} />
                </div>
                {/* Legend for Debt Breakdown */}
                <div className="flex items-center gap-4 justify-center mb-6">
                    <div className="flex items-center gap-2">
                        <span className="inline-block w-3 h-3 rounded-full" style={{background: '#f87171'}}></span>
                        <span className="text-xs text-gray-400">Credit Cards</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="inline-block w-3 h-3 rounded-full" style={{background: '#fbbf24'}}></span>
                        <span className="text-xs text-gray-400">Loans</span>
                    </div>
                </div>
                {/* Second chart: Credit Card Utilization Breakdown */}
                <h4 className="font-semibold text-gray-300 mb-2 mt-4">Credit Card Utilization</h4>
                {/* Credit Card Utilization Bar Chart */}
                <div className="w-52 h-20 flex items-center justify-center bg-gray-900 rounded mb-2">
                    <Bar data={creditCardBarData} options={creditCardBarOptions} style={{ width: '100%', height: '100%' }} />
                </div>
                {/* Legend for Credit Card Utilization */}
                <div className="flex flex-col gap-1 items-center mb-4">
                    <div className="flex items-center gap-2">
                        <span className="inline-block w-3 h-3 rounded-full" style={{background: '#f87171'}}></span>
                        <span className="text-xs text-gray-400">Outstanding: <span className="text-white font-bold">${totalCreditCardDebt.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</span></span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="inline-block w-3 h-3 rounded-full" style={{background: '#60a5fa'}}></span>
                        <span className="text-xs text-gray-400">Available: <span className="text-white font-bold">${totalAvailable.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</span></span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="inline-block w-3 h-3 rounded-full" style={{background: '#a3e635'}}></span>
                        <span className="text-xs text-gray-400">Limit: <span className="text-white font-bold">${totalLimit.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</span></span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default TotalCreditAndDebtCard;
