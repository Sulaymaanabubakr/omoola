import { ChangeEvent, useEffect, useState } from "react";
import { Save, Loader2, Store, Truck, Bell, MessageSquare, ImagePlus, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { fetchAdminSettings, saveAdminSettings, uploadImageToCloudinary } from "@/lib/firestore-admin";
import type { StoreSettings } from "@/types";

type SettingsFormState = Omit<StoreSettings, "deliveryFee" | "announcementSpeed"> & {
  deliveryFee: number | "";
  announcementSpeed: number | "";
};

function parseNumberInput(value: string): number | "" {
  if (value === "") return "";
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : "";
}

const defaultSettings: SettingsFormState = {
  storeName: "",
  logoUrl: "",
  storeAddress: "",
  phone: "",
  email: "",
  whatsapp: "",
  heroImages: [],
  deliveryFee: 0,
  announcementEnabled: false,
  announcementText: "",
  announcementSpeed: 20,
  updatedAt: "",
};

export function AdminSettingsPage() {
  const [settings, setSettings] = useState<SettingsFormState>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const item = await fetchAdminSettings();
        setSettings({
          ...item,
          deliveryFee: item.deliveryFee ?? 0,
          announcementSpeed: item.announcementSpeed ?? 20,
        });
      } catch (err: any) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const success = await saveAdminSettings({
        ...settings,
        deliveryFee: settings.deliveryFee === "" ? 0 : settings.deliveryFee,
        announcementSpeed: settings.announcementSpeed === "" ? 20 : settings.announcementSpeed,
      });
      if (!success) throw new Error("Failed to save settings");
      toast.success("Store settings updated successfully.");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleHeroUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingHero(true);
    try {
      const { url } = await uploadImageToCloudinary(file);
      setSettings((prev) => ({
        ...prev,
        heroImages: [...prev.heroImages, url].filter(Boolean),
      }));
      toast.success("Hero image uploaded.");
    } catch (err: any) {
      toast.error(err.message || "Failed to upload hero image");
    } finally {
      setUploadingHero(false);
      e.target.value = "";
    }
  };

  const handleLogoUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const { url } = await uploadImageToCloudinary(file);
      setSettings((prev) => ({
        ...prev,
        logoUrl: url,
      }));
      toast.success("Logo uploaded.");
    } catch (err: any) {
      toast.error(err.message || "Failed to upload logo");
    } finally {
      setUploadingLogo(false);
      e.target.value = "";
    }
  };

  const removeHeroImage = (index: number) => {
    setSettings((prev) => ({
      ...prev,
      heroImages: prev.heroImages.filter((_, currentIndex) => currentIndex !== index),
    }));
  };

  if (loading) return <div className="py-20 text-center text-muted-foreground">Loading settings...</div>;

  return (
    <form onSubmit={handleSave} className="space-y-6 pt-4 pb-12 w-full max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-2">Manage your store's configuration and contact details.</p>
        </div>
        <Button type="submit" disabled={saving} className="gap-2 w-full sm:w-auto">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Changes
        </Button>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Store className="h-5 w-5 text-muted-foreground" />
              General Information
            </CardTitle>
            <CardDescription>Primary details displayed to your customers.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Store Name</Label>
              <Input
                value={settings.storeName || ""}
                onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                placeholder="Omoola Pharmacy & Stores"
              />
            </div>
            <div className="space-y-2">
              <Label>Email Address</Label>
              <Input
                type="email"
                value={settings.email || ""}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                placeholder="support@omoolasupermarket.com"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Store Address</Label>
              <Input
                value={settings.storeAddress || ""}
                onChange={(e) => setSettings({ ...settings, storeAddress: e.target.value })}
                placeholder="123 Main St, Lagos"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ImagePlus className="h-5 w-5 text-muted-foreground" />
              Site Logo
            </CardTitle>
            <CardDescription>Upload the logo shown in the storefront header and footer.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <div className="flex h-28 w-40 items-center justify-center overflow-hidden rounded-md border bg-zinc-50 p-3">
                <img
                  src={settings.logoUrl || "/logo.png"}
                  alt="Store logo preview"
                  className="max-h-full max-w-full object-contain"
                />
              </div>

              <div className="flex flex-1 flex-col gap-3">
                <label className="inline-flex h-11 cursor-pointer items-center justify-center rounded-md border border-dashed border-zinc-300 bg-zinc-50 px-4 text-sm font-medium transition-colors hover:bg-zinc-100">
                  {uploadingLogo ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImagePlus className="mr-2 h-4 w-4" />}
                  {uploadingLogo ? "Uploading..." : "Upload Logo"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoUpload}
                    disabled={uploadingLogo}
                  />
                </label>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSettings((prev) => ({ ...prev, logoUrl: "" }))}
                  disabled={!settings.logoUrl || uploadingLogo}
                  className="sm:w-fit"
                >
                  Remove Custom Logo
                </Button>

                <p className="text-xs text-muted-foreground">
                  Leave this empty to fall back to the default logo bundled with the site.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <MessageSquare className="h-5 w-5 text-muted-foreground" />
                Support & Reach
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input
                  value={settings.phone || ""}
                  onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                  placeholder="+234..."
                />
              </div>
              <div className="space-y-2">
                <Label>WhatsApp Number</Label>
                <Input
                  value={settings.whatsapp || ""}
                  onChange={(e) => setSettings({ ...settings, whatsapp: e.target.value })}
                  placeholder="Number for WhatsApp chat link"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Truck className="h-5 w-5 text-muted-foreground" />
                Shipping & Delivery
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Base Delivery Fee (₦)</Label>
                <Input
                  type="number"
                  min="0"
                  value={settings.deliveryFee}
                  onChange={(e) => setSettings({ ...settings, deliveryFee: parseNumberInput(e.target.value) })}
                />
                <p className="text-xs text-muted-foreground">This fee is added to all checkout totals.</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ImagePlus className="h-5 w-5 text-muted-foreground" />
              Hero Images
            </CardTitle>
            <CardDescription>Upload the images that rotate in the homepage hero section.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {settings.heroImages.map((image, index) => (
                <div key={`${image}-${index}`} className="group relative overflow-hidden rounded-md border bg-zinc-100">
                  <img src={image} alt={`Hero slide ${index + 1}`} className="h-40 w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeHeroImage(index)}
                    className="absolute right-2 top-2 rounded-md bg-black/70 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
                    aria-label={`Remove hero image ${index + 1}`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <div className="absolute bottom-2 left-2 rounded bg-black/70 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-white">
                    Slide {index + 1}
                  </div>
                </div>
              ))}

              <label className="flex h-40 cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-zinc-300 bg-zinc-50 text-center transition-colors hover:bg-zinc-100">
                {uploadingHero ? <Loader2 className="mb-3 h-6 w-6 animate-spin text-muted-foreground" /> : <ImagePlus className="mb-3 h-6 w-6 text-muted-foreground" />}
                <span className="text-sm font-medium text-zinc-900">{uploadingHero ? "Uploading..." : "Upload Hero Image"}</span>
                <span className="mt-1 text-xs text-muted-foreground">PNG, JPG, WEBP</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleHeroUpload}
                  disabled={uploadingHero}
                />
              </label>
            </div>
            <p className="text-xs text-muted-foreground">
              Images rotate automatically on the homepage in the order shown here. Remove any image you do not want to display.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Bell className="h-5 w-5 text-muted-foreground" />
                Announcement Banner
              </CardTitle>
              <Switch
                checked={Boolean(settings.announcementEnabled)}
                onCheckedChange={(val) => setSettings({ ...settings, announcementEnabled: val })}
              />
            </div>
            <CardDescription>Configure the scrolling text banner shown at the top of the storefront.</CardDescription>
          </CardHeader>
          {settings.announcementEnabled && (
            <CardContent className="grid sm:grid-cols-[1fr_150px] gap-4">
              <div className="space-y-2">
                <Label>Announcement Text</Label>
                <Input
                  value={settings.announcementText || ""}
                  onChange={(e) => setSettings({ ...settings, announcementText: e.target.value })}
                  placeholder="Flash Sale! Use code SAVE20 at checkout..."
                />
              </div>
              <div className="space-y-2">
                <Label>Scroll Speed (s)</Label>
                <Input
                  type="number"
                  min="8"
                  max="60"
                  value={settings.announcementSpeed}
                  onChange={(e) => setSettings({ ...settings, announcementSpeed: parseNumberInput(e.target.value) })}
                />
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </form>
  );
}
