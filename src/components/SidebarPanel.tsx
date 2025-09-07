"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { 
  Settings, 
  SlidersVertical, 
  Keyboard, 
  Settings2,
  SlidersHorizontal,
  ToggleRight,
  ToggleLeft,
  Contrast
} from "lucide-react";

interface UserSettings {
  // Model & Search
  selectedModel: string;
  internetSearchEnabled: boolean;
  autonomousSearchEnabled: boolean;
  searchCacheTTL: number;
  
  // Speech
  speechRecognitionEnabled: boolean;
  ttsEnabled: boolean;
  selectedVoice: string;
  speechSpeed: number;
  speechPitch: number;
  
  // Data & Privacy
  persistenceMode: string;
  retentionDays: number;
  
  // Appearance
  theme: string;
  motionReduced: boolean;
  fontSize: number;
  expertMode: boolean;
  
  // Creator
  showCreatorBadge: boolean;
}

interface SidebarPanelProps {
  onSettingsChange?: (settings: UserSettings) => void;
  className?: string;
}

const defaultSettings: UserSettings = {
  selectedModel: "gpt-4-turbo",
  internetSearchEnabled: true,
  autonomousSearchEnabled: false,
  searchCacheTTL: 3600,
  speechRecognitionEnabled: false,
  ttsEnabled: false,
  selectedVoice: "natural",
  speechSpeed: 1.0,
  speechPitch: 1.0,
  persistenceMode: "localStorage",
  retentionDays: 30,
  theme: "system",
  motionReduced: false,
  fontSize: 16,
  expertMode: false,
  showCreatorBadge: true,
};

export default function SidebarPanel({ onSettingsChange, className = "" }: SidebarPanelProps) {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem("userSettings");
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...defaultSettings, ...parsed });
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
      toast.error("Failed to load saved preferences");
    }
  }, []);

  // Save settings to localStorage and notify parent
  const saveSettings = useCallback((newSettings: UserSettings) => {
    try {
      localStorage.setItem("userSettings", JSON.stringify(newSettings));
      setSettings(newSettings);
      onSettingsChange?.(newSettings);
      toast.success("Preferences saved");
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast.error("Failed to save preferences");
    }
  }, [onSettingsChange]);

  const updateSetting = useCallback(<K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K]
  ) => {
    const newSettings = { ...settings, [key]: value };
    saveSettings(newSettings);
  }, [settings, saveSettings]);

  const runDiagnosticTest = useCallback(async () => {
    setIsLoading(true);
    try {
      // Simulate diagnostic test
      await new Promise(resolve => setTimeout(resolve, 2000));
      const success = Math.random() > 0.3; // 70% success rate for demo
      
      if (success) {
        toast.success("Search connectivity test passed");
      } else {
        toast.error("Search connectivity test failed");
      }
    } catch (error) {
      toast.error("Diagnostic test failed");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const exportBackup = useCallback(() => {
    try {
      const backup = {
        settings,
        timestamp: new Date().toISOString(),
        version: "1.0"
      };
      
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ai-assistant-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success("Backup exported successfully");
    } catch (error) {
      toast.error("Failed to export backup");
    }
  }, [settings]);

  const clearAllConversations = useCallback(() => {
    if (confirm("Are you sure you want to clear all conversations? This action cannot be undone.")) {
      try {
        // Clear conversation data from localStorage
        localStorage.removeItem("conversations");
        toast.success("All conversations cleared");
      } catch (error) {
        toast.error("Failed to clear conversations");
      }
    }
  }, []);

  const testMicrophone = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      toast.success("Microphone access granted");
    } catch (error) {
      toast.error("Microphone access denied or unavailable");
    }
  }, []);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Creator Profile */}
      <Card className="bg-sidebar border-sidebar-border">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-primary-foreground font-semibold text-lg">
              NP
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-sidebar-foreground text-base">Ntare Shema Prince</CardTitle>
              <CardDescription className="text-sidebar-accent-foreground text-sm">
                AI Engineer & Developer
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          <p className="text-sidebar-accent-foreground text-sm leading-relaxed">
            Building intelligent conversational experiences with a focus on privacy and user control.
          </p>
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" asChild className="text-xs">
              <a href="https://github.com/ntare" target="_blank" rel="noopener noreferrer">
                Creator Info
              </a>
            </Button>
            <div className="flex items-center gap-2">
              <Label htmlFor="creator-badge" className="text-xs text-sidebar-accent-foreground">
                Show badge
              </Label>
              <Switch
                id="creator-badge"
                checked={settings.showCreatorBadge}
                onCheckedChange={(checked) => updateSetting("showCreatorBadge", checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Model & Search Controls */}
      <Card className="bg-sidebar border-sidebar-border">
        <CardHeader>
          <CardTitle className="text-sidebar-foreground flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Model & Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sidebar-foreground text-sm">AI Model</Label>
            <Select value={settings.selectedModel} onValueChange={(value) => updateSetting("selectedModel", value)}>
              <SelectTrigger className="bg-sidebar-accent border-sidebar-border">
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                <SelectItem value="gpt-4">GPT-4</SelectItem>
                <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                <SelectItem value="claude-3">Claude 3</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="internet-search" className="text-sidebar-foreground text-sm">
              Internet Search
            </Label>
            <Switch
              id="internet-search"
              checked={settings.internetSearchEnabled}
              onCheckedChange={(checked) => updateSetting("internetSearchEnabled", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="autonomous-search" className="text-sidebar-foreground text-sm">
              Autonomous Search
            </Label>
            <Switch
              id="autonomous-search"
              checked={settings.autonomousSearchEnabled}
              onCheckedChange={(checked) => updateSetting("autonomousSearchEnabled", checked)}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sidebar-foreground text-sm">Cache TTL (seconds)</Label>
            <Input
              type="number"
              value={settings.searchCacheTTL}
              onChange={(e) => updateSetting("searchCacheTTL", parseInt(e.target.value) || 3600)}
              className="bg-sidebar-accent border-sidebar-border"
              min="60"
              max="86400"
            />
          </div>

          <Button 
            onClick={runDiagnosticTest} 
            disabled={isLoading}
            variant="outline" 
            size="sm" 
            className="w-full"
          >
            {isLoading ? "Running Test..." : "Test Connectivity"}
          </Button>
        </CardContent>
      </Card>

      {/* Speech Settings */}
      <Card className="bg-sidebar border-sidebar-border">
        <CardHeader>
          <CardTitle className="text-sidebar-foreground flex items-center gap-2">
            <SlidersVertical className="w-4 h-4" />
            Speech Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="speech-recognition" className="text-sidebar-foreground text-sm">
              Speech Recognition
            </Label>
            <Switch
              id="speech-recognition"
              checked={settings.speechRecognitionEnabled}
              onCheckedChange={(checked) => updateSetting("speechRecognitionEnabled", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="tts-enabled" className="text-sidebar-foreground text-sm">
              Text-to-Speech
            </Label>
            <Switch
              id="tts-enabled"
              checked={settings.ttsEnabled}
              onCheckedChange={(checked) => updateSetting("ttsEnabled", checked)}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sidebar-foreground text-sm">Voice</Label>
            <Select value={settings.selectedVoice} onValueChange={(value) => updateSetting("selectedVoice", value)}>
              <SelectTrigger className="bg-sidebar-accent border-sidebar-border">
                <SelectValue placeholder="Select voice" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="natural">Natural</SelectItem>
                <SelectItem value="robotic">Robotic</SelectItem>
                <SelectItem value="whisper">Whisper</SelectItem>
                <SelectItem value="echo">Echo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sidebar-foreground text-sm">
              Speed: {settings.speechSpeed.toFixed(1)}x
            </Label>
            <Slider
              value={[settings.speechSpeed]}
              onValueChange={([value]) => updateSetting("speechSpeed", value)}
              min={0.5}
              max={2.0}
              step={0.1}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sidebar-foreground text-sm">
              Pitch: {settings.speechPitch.toFixed(1)}
            </Label>
            <Slider
              value={[settings.speechPitch]}
              onValueChange={([value]) => updateSetting("speechPitch", value)}
              min={0.5}
              max={2.0}
              step={0.1}
              className="w-full"
            />
          </div>

          <Button onClick={testMicrophone} variant="outline" size="sm" className="w-full">
            Test Microphone
          </Button>

          <p className="text-xs text-sidebar-accent-foreground">
            Speech features require microphone permissions and may process audio locally.
          </p>
        </CardContent>
      </Card>

      {/* Data & Privacy */}
      <Card className="bg-sidebar border-sidebar-border">
        <CardHeader>
          <CardTitle className="text-sidebar-foreground flex items-center gap-2">
            <Settings2 className="w-4 h-4" />
            Data & Privacy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sidebar-foreground text-sm">Data Storage</Label>
            <Select value={settings.persistenceMode} onValueChange={(value) => updateSetting("persistenceMode", value)}>
              <SelectTrigger className="bg-sidebar-accent border-sidebar-border">
                <SelectValue placeholder="Select storage mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="localStorage">Local Storage</SelectItem>
                <SelectItem value="serverSQLite">Server SQLite</SelectItem>
                <SelectItem value="clientSQL">Client SQL.js</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sidebar-foreground text-sm">Retention (days)</Label>
            <Input
              type="number"
              value={settings.retentionDays}
              onChange={(e) => updateSetting("retentionDays", parseInt(e.target.value) || 30)}
              className="bg-sidebar-accent border-sidebar-border"
              min="1"
              max="365"
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={exportBackup} variant="outline" size="sm" className="flex-1">
              Export Backup
            </Button>
            <Button 
              onClick={clearAllConversations} 
              variant="destructive" 
              size="sm" 
              className="flex-1"
            >
              Clear All
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card className="bg-sidebar border-sidebar-border">
        <CardHeader>
          <CardTitle className="text-sidebar-foreground flex items-center gap-2">
            <Contrast className="w-4 h-4" />
            Appearance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sidebar-foreground text-sm">Theme</Label>
            <Select value={settings.theme} onValueChange={(value) => updateSetting("theme", value)}>
              <SelectTrigger className="bg-sidebar-accent border-sidebar-border">
                <SelectValue placeholder="Select theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="motion-reduced" className="text-sidebar-foreground text-sm">
              Reduce Motion
            </Label>
            <Switch
              id="motion-reduced"
              checked={settings.motionReduced}
              onCheckedChange={(checked) => updateSetting("motionReduced", checked)}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sidebar-foreground text-sm">
              Font Size: {settings.fontSize}px
            </Label>
            <Slider
              value={[settings.fontSize]}
              onValueChange={([value]) => updateSetting("fontSize", value)}
              min={12}
              max={24}
              step={1}
              className="w-full"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="expert-mode" className="text-sidebar-foreground text-sm">
              Expert Mode
            </Label>
            <Switch
              id="expert-mode"
              checked={settings.expertMode}
              onCheckedChange={(checked) => updateSetting("expertMode", checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Shortcuts & Help */}
      <Card className="bg-sidebar border-sidebar-border">
        <CardHeader>
          <CardTitle className="text-sidebar-foreground flex items-center gap-2">
            <Keyboard className="w-4 h-4" />
            Shortcuts & Help
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <h4 className="text-sidebar-foreground text-sm font-medium">Keyboard Shortcuts</h4>
            <div className="space-y-1 text-xs text-sidebar-accent-foreground">
              <div className="flex justify-between">
                <span>New Conversation</span>
                <Badge variant="secondary" className="text-xs">Ctrl+N</Badge>
              </div>
              <div className="flex justify-between">
                <span>Toggle Sidebar</span>
                <Badge variant="secondary" className="text-xs">Ctrl+B</Badge>
              </div>
              <div className="flex justify-between">
                <span>Focus Chat Input</span>
                <Badge variant="secondary" className="text-xs">Ctrl+/</Badge>
              </div>
              <div className="flex justify-between">
                <span>Toggle Voice</span>
                <Badge variant="secondary" className="text-xs">Ctrl+M</Badge>
              </div>
            </div>
          </div>

          <Separator className="bg-sidebar-border" />

          <div className="space-y-2">
            <h4 className="text-sidebar-foreground text-sm font-medium">Quick Tips</h4>
            <ul className="space-y-1 text-xs text-sidebar-accent-foreground">
              <li>• Use @ to reference previous messages</li>
              <li>• Type /help for command assistance</li>
              <li>• Enable search for real-time information</li>
              <li>• Export conversations before clearing data</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}