import { useEffect, useState } from "react";
import { fetchPublicSettings } from "@/lib/supabase-data";
import { defaultStoreSettings } from "@/lib/settings-serialization";

export function usePublicStoreSettings() {
  const [settings, setSettings] = useState(defaultStoreSettings);

  useEffect(() => {
    fetchPublicSettings()
      .then((data) => setSettings(data))
      .catch(() => setSettings(defaultStoreSettings));
  }, []);

  return settings;
}
