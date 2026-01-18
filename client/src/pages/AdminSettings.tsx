import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Building,
  Bell,
  Shield,
  CreditCard,
  Mail,
  Globe,
  Save,
  Loader2,
  Play,
  Music,
} from "lucide-react";
import { useState, useEffect } from "react";
import { settingsApi, demoApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function AdminSettings() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState({
    razorpayKeyId: "",
    razorpaySecretKey: "",
    razorpayTestMode: false,
    autoActivate: true,
  });
  const [playbackSettings, setPlaybackSettings] = useState({
    screenLockEnabled: true,
    offlineModeRequired: true,
    maxDefaultPauses: 3,
    autoSkipOnMaxPauses: true,
    autoSkipDelaySeconds: 30,
    earphoneCheckEnabled: true,
    flightModeCheckEnabled: true,
  });
  const [isSavingPlayback, setIsSavingPlayback] = useState(false);

  // Media settings state
  const [demoAudioUrl, setDemoAudioUrl] = useState("");
  const [isSavingMedia, setIsSavingMedia] = useState(false);
  const [isLoadingMedia, setIsLoadingMedia] = useState(false);

  useEffect(() => {
    fetchSettings();
    fetchPlaybackSettings();
    fetchMediaSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const data = await settingsApi.getSettings();
      if (data.settings) {
        setSettings({
          razorpayKeyId: String(data.settings.razorpay_key_id || ""),
          razorpaySecretKey: String(data.settings.razorpay_secret_key || ""),
          razorpayTestMode: data.settings.razorpay_test_mode === "true",
          autoActivate: true, // Mocked for now OR could be added to DB later
        });
      }
    } catch (error) {
      console.error("Fetch settings error:", error);
      toast({
        title: "Error",
        description: "Failed to load settings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPlaybackSettings = async () => {
    try {
      const data = await settingsApi.getPlaybackSettings();
      setPlaybackSettings({
        screenLockEnabled: data.screenLockEnabled ?? true,
        offlineModeRequired: data.offlineModeRequired ?? true,
        maxDefaultPauses: data.maxDefaultPauses ?? 3,
        autoSkipOnMaxPauses: data.autoSkipOnMaxPauses ?? true,
        autoSkipDelaySeconds: data.autoSkipDelaySeconds ?? 30,
        earphoneCheckEnabled: data.earphoneCheckEnabled ?? true,
        flightModeCheckEnabled: data.flightModeCheckEnabled ?? true,
      });
    } catch (error) {
      console.error("Fetch playback settings error:", error);
    }
  };

  const handleSavePayments = async () => {
    setIsSaving(true);
    try {
      await settingsApi.updateSettings({
        razorpayKeyId: settings.razorpayKeyId,
        razorpaySecretKey: settings.razorpaySecretKey,
        razorpayTestMode: settings.razorpayTestMode,
      });
      toast({
        title: "Settings Saved",
        description: "Payment settings have been updated successfully",
      });
    } catch (error) {
      console.error("Save settings error:", error);
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePlayback = async () => {
    setIsSavingPlayback(true);
    try {
      await settingsApi.updateSettings({
        screenLockEnabled: playbackSettings.screenLockEnabled,
        offlineModeRequired: playbackSettings.offlineModeRequired,
        maxDefaultPauses: playbackSettings.maxDefaultPauses,
        autoSkipOnMaxPauses: playbackSettings.autoSkipOnMaxPauses,
        autoSkipDelaySeconds: playbackSettings.autoSkipDelaySeconds,
        earphoneCheckEnabled: playbackSettings.earphoneCheckEnabled,
        flightModeCheckEnabled: playbackSettings.flightModeCheckEnabled,
      });
      toast({
        title: "Settings Saved",
        description: "Playback settings have been updated successfully",
      });
    } catch (error) {
      console.error("Save playback settings error:", error);
      toast({
        title: "Error",
        description: "Failed to save playback settings",
        variant: "destructive",
      });
    } finally {
      setIsSavingPlayback(false);
    }
  };

  const fetchMediaSettings = async () => {
    setIsLoadingMedia(true);
    try {
      const data = await settingsApi.getDemoAudioUrl();
      setDemoAudioUrl(data.audioUrl || "");
    } catch (error) {
      console.error("Fetch demo audio URL error:", error);
    } finally {
      setIsLoadingMedia(false);
    }
  };

  const handleSaveMedia = async () => {
    if (!demoAudioUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid URL",
        variant: "destructive",
      });
      return;
    }

    setIsSavingMedia(true);
    try {
      await demoApi.setAudioUrl(demoAudioUrl);
      toast({
        title: "Settings Saved",
        description: "Demo audio URL has been updated successfully",
      });
    } catch (error) {
      console.error("Save media settings error:", error);
      toast({
        title: "Error",
        description: "Failed to save demo audio URL",
        variant: "destructive",
      });
    } finally {
      setIsSavingMedia(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />

      <div className="lg:ml-64">
        <AdminHeader title="Settings" subtitle="Configure platform settings" />

        <main className="p-4 lg:p-6">
          <Tabs defaultValue="organization" className="space-y-6">
            <TabsList>
              <TabsTrigger value="organization" className="gap-2">
                <Building className="h-4 w-4" />
                Organization
              </TabsTrigger>
              <TabsTrigger value="notifications" className="gap-2">
                <Bell className="h-4 w-4" />
                Notifications
              </TabsTrigger>
              <TabsTrigger value="playback" className="gap-2">
                <Play className="h-4 w-4" />
                Playback
              </TabsTrigger>
              <TabsTrigger value="security" className="gap-2">
                <Shield className="h-4 w-4" />
                Security
              </TabsTrigger>
              <TabsTrigger value="payments" className="gap-2">
                <CreditCard className="h-4 w-4" />
                Payments
              </TabsTrigger>
              <TabsTrigger value="media" className="gap-2">
                <Music className="h-4 w-4" />
                Media
              </TabsTrigger>
            </TabsList>

            <TabsContent value="organization">
              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="font-serif">
                      Organization Details
                    </CardTitle>
                    <CardDescription>
                      Update your organization information
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Organization Name</Label>
                        <Input defaultValue="Shadanga Kriya" />
                      </div>
                      <div className="space-y-2">
                        <Label>Contact Email</Label>
                        <Input
                          type="email"
                          defaultValue="admin@Shadanga Kriya.com"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        rows={3}
                        defaultValue="A comprehensive audio-based therapy and training platform designed for mental wellness and personal growth."
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Support Phone</Label>
                        <Input defaultValue="+1 (555) 123-4567" />
                      </div>
                      <div className="space-y-2">
                        <Label>Website</Label>
                        <Input defaultValue="https://Shadanga Kriya.com" />
                      </div>
                    </div>
                    <Button variant="premium">Save Changes</Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="font-serif">Branding</CardTitle>
                    <CardDescription>
                      Customize your platform appearance
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Logo</Label>
                        <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                          <p className="text-sm text-muted-foreground">
                            Click to upload logo
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Favicon</Label>
                        <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                          <p className="text-sm text-muted-foreground">
                            Click to upload favicon
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Primary Color</Label>
                        <Input
                          type="color"
                          defaultValue="#2d9d92"
                          className="h-10"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Accent Color</Label>
                        <Input
                          type="color"
                          defaultValue="#d4a843"
                          className="h-10"
                        />
                      </div>
                    </div>
                    <Button variant="premium">Update Branding</Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="notifications">
              <Card>
                <CardHeader>
                  <CardTitle className="font-serif">
                    Notification Preferences
                  </CardTitle>
                  <CardDescription>
                    Configure when and how you receive notifications
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between py-3 border-b border-border">
                    <div>
                      <p className="font-medium">New User Registrations</p>
                      <p className="text-sm text-muted-foreground">
                        Get notified when new users are created
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-border">
                    <div>
                      <p className="font-medium">Lesson Interruptions</p>
                      <p className="text-sm text-muted-foreground">
                        Alert when users exceed pause limits
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-border">
                    <div>
                      <p className="font-medium">Payment Notifications</p>
                      <p className="text-sm text-muted-foreground">
                        Receive alerts for successful/failed payments
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-border">
                    <div>
                      <p className="font-medium">Course Completions</p>
                      <p className="text-sm text-muted-foreground">
                        Notify when users complete courses
                      </p>
                    </div>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-medium">Weekly Summary</p>
                      <p className="text-sm text-muted-foreground">
                        Receive weekly analytics summary via email
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <Button variant="premium">Save Preferences</Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="playback">
              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="font-serif">
                      Pre-Lesson Protocol
                    </CardTitle>
                    <CardDescription>
                      Configure checks required before lesson playback
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between py-3 border-b border-border">
                      <div>
                        <p className="font-medium">Flight Mode Check</p>
                        <p className="text-sm text-muted-foreground">
                          Require users to enable airplane mode before playback
                        </p>
                      </div>
                      <Switch
                        checked={playbackSettings.flightModeCheckEnabled}
                        onCheckedChange={(checked) =>
                          setPlaybackSettings({
                            ...playbackSettings,
                            flightModeCheckEnabled: checked,
                          })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-border">
                      <div>
                        <p className="font-medium">Earphone Check</p>
                        <p className="text-sm text-muted-foreground">
                          Require earphones/headphones to be connected
                        </p>
                      </div>
                      <Switch
                        checked={playbackSettings.earphoneCheckEnabled}
                        onCheckedChange={(checked) =>
                          setPlaybackSettings({
                            ...playbackSettings,
                            earphoneCheckEnabled: checked,
                          })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between py-3">
                      <div>
                        <p className="font-medium">Offline Mode Required</p>
                        <p className="text-sm text-muted-foreground">
                          Enforce offline playback for downloaded lessons
                        </p>
                      </div>
                      <Switch
                        checked={playbackSettings.offlineModeRequired}
                        onCheckedChange={(checked) =>
                          setPlaybackSettings({
                            ...playbackSettings,
                            offlineModeRequired: checked,
                          })
                        }
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="font-serif">
                      Playback Controls
                    </CardTitle>
                    <CardDescription>
                      Configure pause limits and auto-skip behavior
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between py-3 border-b border-border">
                      <div>
                        <p className="font-medium">Default Max Pauses</p>
                        <p className="text-sm text-muted-foreground">
                          Maximum pauses allowed per lesson (can be overridden
                          per lesson)
                        </p>
                      </div>
                      <Input
                        type="number"
                        min={0}
                        max={10}
                        value={playbackSettings.maxDefaultPauses}
                        onChange={(e) =>
                          setPlaybackSettings({
                            ...playbackSettings,
                            maxDefaultPauses: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-20"
                      />
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-border">
                      <div>
                        <p className="font-medium">Auto-Skip on Max Pauses</p>
                        <p className="text-sm text-muted-foreground">
                          Automatically complete lesson when max pauses
                          exhausted
                        </p>
                      </div>
                      <Switch
                        checked={playbackSettings.autoSkipOnMaxPauses}
                        onCheckedChange={(checked) =>
                          setPlaybackSettings({
                            ...playbackSettings,
                            autoSkipOnMaxPauses: checked,
                          })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-border">
                      <div>
                        <p className="font-medium">Auto-Skip Delay (seconds)</p>
                        <p className="text-sm text-muted-foreground">
                          Time before auto-completing after max pauses
                        </p>
                      </div>
                      <Input
                        type="number"
                        min={10}
                        max={120}
                        value={playbackSettings.autoSkipDelaySeconds}
                        onChange={(e) =>
                          setPlaybackSettings({
                            ...playbackSettings,
                            autoSkipDelaySeconds:
                              parseInt(e.target.value) || 30,
                          })
                        }
                        className="w-20"
                        disabled={!playbackSettings.autoSkipOnMaxPauses}
                      />
                    </div>
                    <div className="flex items-center justify-between py-3">
                      <div>
                        <p className="font-medium">Screen Lock Prevention</p>
                        <p className="text-sm text-muted-foreground">
                          Keep screen awake during playback (wake lock)
                        </p>
                      </div>
                      <Switch
                        checked={playbackSettings.screenLockEnabled}
                        onCheckedChange={(checked) =>
                          setPlaybackSettings({
                            ...playbackSettings,
                            screenLockEnabled: checked,
                          })
                        }
                      />
                    </div>
                    <Button
                      variant="premium"
                      onClick={handleSavePlayback}
                      disabled={isSavingPlayback}
                    >
                      {isSavingPlayback ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Playback Settings
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="security">
              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="font-serif">
                      Authentication Settings
                    </CardTitle>
                    <CardDescription>
                      Configure login and security options
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between py-3 border-b border-border">
                      <div>
                        <p className="font-medium">Two-Factor Authentication</p>
                        <p className="text-sm text-muted-foreground">
                          Require 2FA for all admin accounts
                        </p>
                      </div>
                      <Switch />
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-border">
                      <div>
                        <p className="font-medium">Session Timeout</p>
                        <p className="text-sm text-muted-foreground">
                          Auto-logout after inactivity
                        </p>
                      </div>
                      <Input type="number" defaultValue="30" className="w-20" />
                    </div>
                    <div className="flex items-center justify-between py-3">
                      <div>
                        <p className="font-medium">Password Requirements</p>
                        <p className="text-sm text-muted-foreground">
                          Minimum 8 characters, uppercase, number
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <Button variant="premium">Update Security</Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="font-serif">
                      Playback Security
                    </CardTitle>
                    <CardDescription>
                      Configure audio playback restrictions
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between py-3 border-b border-border">
                      <div>
                        <p className="font-medium">Disable Screenshots</p>
                        <p className="text-sm text-muted-foreground">
                          Prevent screen capture during playback
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-border">
                      <div>
                        <p className="font-medium">Audio Encryption</p>
                        <p className="text-sm text-muted-foreground">
                          Encrypt audio files for secure delivery
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between py-3">
                      <div>
                        <p className="font-medium">Offline Mode</p>
                        <p className="text-sm text-muted-foreground">
                          Allow lessons to be downloaded for offline use
                        </p>
                      </div>
                      <Switch />
                    </div>
                    <Button variant="premium">Save Playback Settings</Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="payments">
              <Card>
                <CardHeader>
                  <CardTitle className="font-serif">Payment Gateway</CardTitle>
                  <CardDescription>
                    Configure Razorpay integration
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Razorpay Key ID</Label>
                    <Input
                      placeholder="rzp_live_xxxxxxxx"
                      value={settings.razorpayKeyId}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          razorpayKeyId: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Razorpay Secret Key</Label>
                    <Input
                      type="password"
                      placeholder="••••••••••••••••"
                      value={settings.razorpaySecretKey}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          razorpaySecretKey: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between py-3 border-t border-border mt-4">
                    <div>
                      <p className="font-medium">Test Mode</p>
                      <p className="text-sm text-muted-foreground">
                        Use test credentials for development
                      </p>
                    </div>
                    <Switch
                      checked={settings.razorpayTestMode}
                      onCheckedChange={(checked) =>
                        setSettings({ ...settings, razorpayTestMode: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between py-3 border-t border-border">
                    <div>
                      <p className="font-medium">Auto-activate on Payment</p>
                      <p className="text-sm text-muted-foreground">
                        Automatically activate courses after successful payment
                      </p>
                    </div>
                    <Switch
                      checked={settings.autoActivate}
                      onCheckedChange={(checked) =>
                        setSettings({ ...settings, autoActivate: checked })
                      }
                    />
                  </div>
                  <Button
                    variant="premium"
                    onClick={handleSavePayments}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Payment Settings
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="media">
              <Card>
                <CardHeader>
                  <CardTitle className="font-serif">Demo Audio Settings</CardTitle>
                  <CardDescription>
                    Configure the demo meditation audio URL. This URL is used for the
                    demo audio that new users can listen to before enrolling.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="demoAudioUrl">Demo Audio URL</Label>
                    <Input
                      id="demoAudioUrl"
                      placeholder="https://example.com/demo.mp3"
                      value={demoAudioUrl}
                      onChange={(e) => setDemoAudioUrl(e.target.value)}
                      disabled={isLoadingMedia}
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter the full URL to your demo meditation audio file (MP3 format recommended).
                      This can be hosted on your backend server, Cloudinary, or any CDN.
                    </p>
                  </div>

                  {demoAudioUrl && (
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm font-medium mb-1">Current URL:</p>
                      <p className="text-xs text-muted-foreground break-all">{demoAudioUrl}</p>
                    </div>
                  )}

                  <Button
                    variant="premium"
                    onClick={handleSaveMedia}
                    disabled={isSavingMedia || isLoadingMedia}
                  >
                    {isSavingMedia ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Media Settings
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
