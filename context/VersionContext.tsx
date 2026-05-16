import React, { createContext, useContext, useState, useEffect } from 'react';
import { Alert, Linking, Platform } from 'react-native';
import * as Application from 'expo-application';

interface VersionContextType {
  isUpdateAvailable: boolean;
  latestVersion: string | null;
  releaseNotes: string | null;
  downloadUrl: string | null;
  checkUpdates: () => Promise<void>;
}

const VersionContext = createContext<VersionContextType | undefined>(undefined);

export const VersionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [latestVersion, setLatestVersion] = useState<string | null>(null);
  const [releaseNotes, setReleaseNotes] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const GITHUB_REPO_API = "https://api.github.com/repos/user/ledgerly/releases/latest"; // Update with actual repo

  const checkUpdates = async () => {
    if (Platform.OS === 'web') return;

    try {
      const response = await fetch(GITHUB_REPO_API);
      const data = await response.json();

      if (data.tag_name) {
        const currentVersion = Application.nativeApplicationVersion; // e.g. "1.0.0"
        const latestTag = data.tag_name.replace('v', '');

        // Simple version comparison (can be improved with semver)
        if (latestTag !== currentVersion) {
          setIsUpdateAvailable(true);
          setLatestVersion(latestTag);
          setReleaseNotes(data.body);
          
          const apkAsset = data.assets.find((a: any) => a.name.endsWith('.apk'));
          if (apkAsset) {
            setDownloadUrl(apkAsset.browser_download_url);
          }
        }
      }
    } catch (error) {
      console.log("Update check failed:", error);
    }
  };

  useEffect(() => {
    checkUpdates();
  }, []);

  return (
    <VersionContext.Provider value={{ isUpdateAvailable, latestVersion, releaseNotes, downloadUrl, checkUpdates }}>
      {children}
    </VersionContext.Provider>
  );
};

export const useVersion = () => {
  const context = useContext(VersionContext);
  if (!context) throw new Error('useVersion must be used within VersionProvider');
  return context;
};
