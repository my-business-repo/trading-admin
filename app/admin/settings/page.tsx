"use client";

import { useTheme } from "next-themes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Sun, Moon } from "lucide-react";// Import the TradingSettings component
import TradingSettings from "../../../components/ui/TradingSettings";
import { useState } from "react";
import { getOpenToTradeStatus, isAutoDecideWinLoseEnabled, updateAutoDecideWinLoseStatus, updateOpenToTradeStatus } from "@/app/actions/tradingActions";
import { useEffect } from "react";

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const [openToTrade, setOpenToTrade] = useState<boolean>(false);
  const [autoDecideWinLose, setAutoDecideWinLose] = useState<boolean>(false);


  const fetchOpenToTradeStatus = async () => {
    const status = await getOpenToTradeStatus();
    setOpenToTrade(status);
  };

  const fetchAutoDecideWinLoseStatus = async () => {
    const status = await isAutoDecideWinLoseEnabled();
    setAutoDecideWinLose(status);
  };

  useEffect(() => {
    fetchOpenToTradeStatus();
    fetchAutoDecideWinLoseStatus();
  }, []);

  const handleOpenToTradeChange = async (status: boolean) => {
    const res = await updateOpenToTradeStatus(status);
    setOpenToTrade(res);
  };

  const handleAutoDecideWinLoseChange = async (status: boolean) => {
    const res = await updateAutoDecideWinLoseStatus(status);
    setAutoDecideWinLose(res);
  };


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Customize your application preferences
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-2">
                  {theme === "dark" ? (
                    <Moon className="h-5 w-5" />
                  ) : (
                    <Sun className="h-5 w-5" />
                  )}
                  <Label htmlFor="theme-mode">Dark Mode</Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Switch between light and dark themes
                </p>
              </div>
              <Switch
                id="theme-mode"
                checked={theme === "dark"}
                onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Trading Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex flex-col space-y-1">
                <div className="flex items-center space-x-2">
                  <Label htmlFor="open-trade">Open to Trade</Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Enable or disable trading (if disabled, trading will always be Lose)
                </p>
              </div>
              <Switch
                id="open-trade"
                checked={openToTrade}
                onCheckedChange={(status) => handleOpenToTradeChange(status)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex flex-col space-y-1">
                <div className="flex items-center space-x-2">
                  <Label htmlFor="auto-trade">Auto Decide Win/Lose</Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Enable or disable automatic win/lose decisions for trades. If disabled, you can manually decide win/lose for each trade in the trading request page
                </p>
              </div>
              <Switch
                id="auto-trade"
                checked={autoDecideWinLose}
                onCheckedChange={(status) => handleAutoDecideWinLoseChange(status)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <TradingSettings /> {/* Use the TradingSettings component here */}
    </div>
  );
}