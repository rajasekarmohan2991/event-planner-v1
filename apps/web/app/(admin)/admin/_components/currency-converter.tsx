'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw, ArrowRightLeft, DollarSign } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface CurrencyRates {
    base: string;
    rates: Record<string, number>;
    lastUpdated: string | null;
}

const COMMON_CURRENCIES = [
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
    { code: 'GBP', name: 'British Pound', symbol: '£' },
    { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
    { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh' },
    { code: 'NGN', name: 'Nigerian Naira', symbol: '₦' },
    { code: 'GHS', name: 'Ghanaian Cedi', symbol: 'GH₵' },
    { code: 'AED', name: 'UAE Dirham', symbol: 'dh' },
    { code: 'CAD', name: 'Canadian Dollar', symbol: '$' },
];

export function CurrencyConverter() {
    const [rates, setRates] = useState<Record<string, number>>({});
    const [amount, setAmount] = useState<string>('1');
    const [fromCurrency, setFromCurrency] = useState<string>('USD');
    const [toCurrency, setToCurrency] = useState<string>('INR');
    const [loading, setLoading] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const { toast } = useToast();

    const fetchRates = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/currency/rates');
            if (!res.ok) throw new Error('Failed to fetch rates');
            const data: CurrencyRates = await res.json();
            setRates(data.rates);
            setLastUpdated(data.lastUpdated ? new Date(data.lastUpdated) : new Date());
        } catch (error) {
            console.error('Error fetching rates:', error);
            toast({
                title: 'Error',
                description: 'Failed to update currency rates',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRates();
    }, []);

    const handleSwap = () => {
        setFromCurrency(toCurrency);
        setToCurrency(fromCurrency);
    };

    const convert = (val: number, from: string, to: string) => {
        if (!rates[from] || !rates[to]) return 0;
        // Base is USD.
        // Amount in USD = val / rates[from]
        // Amount in To = USD * rates[to]
        const valInUsd = val / rates[from];
        return valInUsd * rates[to];
    };

    const result = convert(parseFloat(amount) || 0, fromCurrency, toCurrency);
    const rate = convert(1, fromCurrency, toCurrency);

    const getSymbol = (code: string) => COMMON_CURRENCIES.find(c => c.code === code)?.symbol || code;

    return (
        <Card className="border shadow-sm h-full">
            <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-lg font-medium flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    Currency Converter
                </CardTitle>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400" onClick={fetchRates} disabled={loading}>
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-500">Amount</label>
                    <Input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="text-lg"
                    />
                </div>

                <div className="grid grid-cols-[1fr,auto,1fr] gap-2 items-end">
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-gray-500">From</label>
                        <Select value={fromCurrency} onValueChange={setFromCurrency}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.keys(rates).length > 0 ? Object.keys(rates).map(code => (
                                    <SelectItem key={code} value={code}>
                                        {code}
                                    </SelectItem>
                                )) : COMMON_CURRENCIES.map(c => (
                                    <SelectItem key={c.code} value={c.code}>{c.code}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <Button variant="ghost" size="icon" className="mb-0.5" onClick={handleSwap}>
                        <ArrowRightLeft className="w-4 h-4 text-gray-400" />
                    </Button>

                    <div className="space-y-2">
                        <label className="text-xs font-medium text-gray-500">To</label>
                        <Select value={toCurrency} onValueChange={setToCurrency}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.keys(rates).length > 0 ? Object.keys(rates).map(code => (
                                    <SelectItem key={code} value={code}>
                                        {code}
                                    </SelectItem>
                                )) : COMMON_CURRENCIES.map(c => (
                                    <SelectItem key={c.code} value={c.code}>{c.code}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-4 text-center mt-4 border border-slate-100">
                    <div className="text-xs text-slate-500 mb-1">
                        1 {fromCurrency} = {rate.toFixed(4)} {toCurrency}
                    </div>
                    <div className="text-3xl font-bold text-indigo-600 truncate">
                        {getSymbol(toCurrency)}{result.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </div>
                </div>

                {lastUpdated && (
                    <div className="text-[10px] text-gray-400 text-center">
                        Rates updated: {lastUpdated.toLocaleTimeString()}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
