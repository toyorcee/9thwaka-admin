import React, { useState } from 'react';
import { BanknotesIcon, PresentationChartLineIcon, InformationCircleIcon } from "@heroicons/react/24/outline";
import ValidatedInput from "./ValidatedInput";

/**
 * ProfitabilitySimulator Component
 * 
 * A high-fidelity financial tool for administrators to trace the actual 
 * profitability of user withdrawals after accounting for:
 * 1. Revenue (Base Fee + VAT + Stamp Duty collected from user)
 * 2. Inbound Leakage (1% Collection fee + Stamp Duty lost during wallet funding)
 * 3. Payout Costs (Tiered fees charged by the payment provider/Payscribe)
 */
const ProfitabilitySimulator = ({ settings }) => {
    const [simulationAmount, setSimulationAmount] = useState(100000);

    // 🧮 Pure Business Logic Simulation (Synced with LIVE Settings)
    const calculateTrace = (amount, key, isCustom = false) => {
        // Determine which fee tier to use
        const feeKey = isCustom 
            ? (amount < (Number(settings.tier1Limit) || 5000) ? 'tier1' : amount < (Number(settings.tier2Limit) || 50000) ? 'tier2' : 'tier3')
            : key;

        // 1. REVENUE (Collected from User)
        const baseFee = Number(settings[`${feeKey}Fee`]) || 0;
        const vatPercent = Number(settings.vatPercent) || 7.5;
        const vat = Math.round(baseFee * (vatPercent / 100) * 100) / 100;
        
        const stampThreshold = Number(settings.stampDutyThreshold) || 10000;
        const stampAmount = Number(settings.stampDutyAmount) || 50;
        const userStampCharge = amount >= stampThreshold ? stampAmount : 0;
        
        const totalRevenue = baseFee + vat + userStampCharge;

        // 2. COSTS (Paid by Platform)
        // A) Inbound Leakage (Temporarily zeroed for audit)
        const inboundFeePercent = 0;
        const bankInboundFee = 0;
        const bankInboundStamp = amount >= 10000 ? 50 : 0;
        const totalInboundCost = bankInboundFee + bankInboundStamp;

        // B) Payout Fee (Payscribe standard tiers)
        const payscribePayoutFee = amount < 10000 ? 25 : amount < 50000 ? 50 : 250; 
        
        const totalCost = totalInboundCost + payscribePayoutFee;
        const platformNet = Math.round((totalRevenue - totalCost) * 100) / 100;

        return {
            amount,
            baseFee,
            vat,
            userStampCharge,
            totalInboundCost,
            payscribePayoutFee,
            totalRevenue,
            platformNet,
            isLoss: platformNet < 0,
            inboundFeePercent
        };
    };

    const tiers = [
        { name: 'Tier 1 (Small)', key: 'tier1', amount: 2500 },
        { name: 'Tier 2 (Medium)', key: 'tier2', amount: 15000 },
        { name: 'Tier 3 (Large)', key: 'tier3', amount: 60000 },
        { name: 'Playground', key: 'custom', amount: simulationAmount, isCustom: true }
    ];

    return (
        <div className="mt-8 pt-8 border-t border-gray-100">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
                <h4 className="text-sm font-black text-indigo-900 uppercase tracking-tight flex items-center gap-2">
                    <PresentationChartLineIcon className="h-5 w-5 text-indigo-600" />
                    Platform Profitability Trace (Simulator)
                </h4>
                <div className="flex items-center gap-3 bg-indigo-50/50 p-2 pl-4 rounded-2xl border border-indigo-100/50">
                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Test Amount (₦)</span>
                    <div className="w-32">
                        <ValidatedInput
                            value={simulationAmount}
                            onChange={(val) => setSimulationAmount(Number(val))}
                            isCurrency={true}
                            className="text-xs font-black text-indigo-900 border-none shadow-none bg-transparent h-8"
                        />
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto rounded-[2rem] border border-gray-200 shadow-xl bg-white overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                            <th className="text-left p-6 text-[10px] font-black text-gray-500 uppercase tracking-widest">Withdrawal Tier</th>
                            <th className="text-right p-6 text-[10px] font-black text-gray-500 uppercase tracking-widest">Amount</th>
                            <th className="text-right p-6 text-[10px] font-black text-indigo-600 uppercase tracking-widest">User Rev</th>
                            <th className="text-center p-6 text-[10px] font-black text-rose-600 uppercase tracking-widest">Inbound Leakage</th>
                            <th className="text-right p-6 text-[10px] font-black text-gray-500 uppercase tracking-widest">Provider Fee</th>
                            <th className="text-right p-6 text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50/30">True Net</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {tiers.map((t, i) => {
                            const d = calculateTrace(t.amount, t.key, t.isCustom);
                            return (
                                <tr key={i} className={`group transition-all ${d.isLoss ? 'bg-rose-50/20' : t.isCustom ? 'bg-indigo-50/20' : 'hover:bg-gray-50/50'}`}>
                                    <td className="p-6">
                                        <div className="font-bold text-gray-900 text-sm">{t.name}</div>
                                        {t.isCustom && <div className="text-[10px] text-indigo-500 font-bold uppercase mt-1">Manual Test Mode</div>}
                                    </td>
                                    <td className="p-6 text-right font-black text-gray-900">
                                        ₦{d.amount.toLocaleString()}
                                    </td>
                                    <td className="p-6 text-right">
                                        <div className="font-bold text-indigo-700">₦{d.totalRevenue.toLocaleString()}</div>
                                        <div className="text-[9px] text-gray-400 font-medium">Base: ₦{d.baseFee} + VAT</div>
                                    </td>
                                    <td className="p-6 text-center">
                                        <div className="inline-flex flex-col items-center">
                                            <span className="text-rose-600 font-bold text-xs">-₦{d.totalInboundCost.toLocaleString()}</span>
                                            <span className="text-[8px] font-black uppercase text-rose-400 tracking-tighter mt-0.5">
                                                {d.inboundFeePercent}% COLL + STAMP
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-6 text-right font-bold text-gray-400 text-xs">
                                        ₦{d.payscribePayoutFee}
                                    </td>
                                    <td className={`p-6 text-right font-black text-base bg-emerald-50/10 group-hover:bg-emerald-50/20 transition-colors ${d.isLoss ? 'text-rose-600' : 'text-emerald-600'}`}>
                                        <div className="flex flex-col items-end">
                                            <span>{!d.isLoss ? '+' : ''}₦{d.platformNet.toLocaleString()}</span>
                                            {d.isLoss && (
                                                <span className="text-[8px] bg-rose-600 text-white px-2 py-0.5 rounded-full uppercase tracking-tighter mt-1">
                                                    Subsidized
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div className="mt-4 p-4 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-start gap-3">
                <InformationCircleIcon className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
                <p className="text-[10px] text-blue-700 leading-relaxed font-medium">
                    <span className="font-bold">Accounting Truth:</span> The "True Net" represents the actual liquid gain remaining in the platform wallet after accounting for bank collection fees (lost during deposit) and provider payout fees. 
                    If a tier is marked as <span className="text-rose-600 font-bold uppercase">Subsidized</span>, the platform is losing money on that transaction.
                </p>
            </div>
        </div>
    );
};

export default ProfitabilitySimulator;
