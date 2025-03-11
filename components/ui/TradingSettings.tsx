import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input"; // Import Button component
import { TradingSetting } from "@/type"; // Import the TradingSetting type
import { getTradingSettings, updateTradingSetting } from "@/app/actions/tradingActions"; // Assume this function fetches trading settings
import { toast, Toaster } from "sonner";

export default function TradingSettings() {
    const [tradingSettings, setTradingSettings] = useState<TradingSetting[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editedWinRates, setEditedWinRates] = useState<{ [key: number]: number }>({});
    const [isSaveEnabled, setIsSaveEnabled] = useState(false);

    useEffect(() => {
        const fetchTradingSettings = async () => {
            const settings = await getTradingSettings(); // Fetch trading settings
            setTradingSettings(settings);
            setIsLoading(false);
        };
        fetchTradingSettings();
    }, []);

    const handleWinRateChange = (id: number, value: number) => {
        setEditedWinRates((prev) => ({ ...prev, [id]: value }));
        setIsSaveEnabled(true); // Enable save button when any win rate changes
    };

    const handleSave = async () => {
        // for each edited win rate, update the trading setting
        for (const [id, winRate] of Object.entries(editedWinRates)) {
            console.log("Updating win rate for setting:", id, "to", winRate);

            const updatedSetting = await updateTradingSetting(parseInt(id), winRate);
            // update the trading settings
            setTradingSettings((prev) =>
                prev.map((setting) =>
                    setting.id === parseInt(id) ? updatedSetting : setting
                )
            );
            console.log("Updated setting:", updatedSetting);
        }

        setEditedWinRates({});
        setIsSaveEnabled(false);
        toast.success("Win rates updated successfully");
    };

    if (isLoading) {
        return <div>Loading...</div>; // Loading state
    }

    return (
        <Card>
            <Toaster position="top-center" richColors />
            <CardHeader>
                <CardTitle>Trading Settings</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 gap-4">
                    {tradingSettings.map((setting) => (
                        <div key={setting.id} className="border border-gray-200 p-4 rounded-md">
                            <div>
                                <label htmlFor={`seconds-${setting.id}`}>Seconds</label>
                                <Input id={`seconds-${setting.id}`} value={setting.seconds} readOnly />
                            </div>
                            <div>
                                <label htmlFor={`percentage-${setting.id}`}>Percentage</label>
                                <Input id={`percentage-${setting.id}`} value={setting.percentage} readOnly />
                            </div>
                            <div>
                                <label htmlFor={`tradingType-${setting.id}`}>Trading Type</label>
                                <Input id={`tradingType-${setting.id}`} value={setting.tradingType} readOnly />
                            </div>
                            <div>
                                <label htmlFor={`winRate-${setting.id}`}>Win Rate</label>
                                <Input 
                                    id={`winRate-${setting.id}`} 
                                    type="number" 
                                    step="0.01" 
                                    min="0" 
                                    max="1" 
                                    value={editedWinRates[setting.id] !== undefined ? editedWinRates[setting.id] : setting.winRate} 
                                    onChange={(e) => handleWinRateChange(setting.id, Math.min(1, Math.max(0, Number(e.target.value))))} 
                                />
                            </div>
                        </div>
                    ))}
                </div>
                <button
                    className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-md"
                    onClick={handleSave} 
                    disabled={!isSaveEnabled} 
                >
                    Save
                </button>
            </CardContent>
        </Card>
    );
}
