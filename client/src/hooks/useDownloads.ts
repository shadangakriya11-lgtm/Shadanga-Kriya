/**
 * useDownloads Hook
 * React hook for managing offline audio downloads
 */

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getCachedToken } from "@/lib/api";
import {
  getDeviceId,
  registerDevice,
  downloadLesson,
  isLessonDownloaded,
  getDownloadedLessons,
  getDownloadedLessonsForCourse,
  loadEncryptedAudio,
  deleteDownloadedLesson,
  clearAllDownloads,
  getDownloadsStorageSize,
  formatBytes,
  revokeAudioBlobUrl,
  DownloadedLesson,
  DownloadProgress,
} from "@/lib/downloadManager";

export interface UseDownloadsReturn {
  // State
  downloads: DownloadedLesson[];
  isLoading: boolean;
  downloadProgress: Record<string, DownloadProgress>;
  storageUsed: string;
  isDeviceRegistered: boolean;

  // Actions
  startDownload: (lessonId: string, courseId: string) => Promise<void>;
  checkDownloaded: (lessonId: string) => Promise<boolean>;
  getDownloadsForCourse: (courseId: string) => Promise<DownloadedLesson[]>;
  loadAudioForPlayback: (lessonId: string) => Promise<string>;
  releaseAudioUrl: (url: string) => void;
  removeDownload: (lessonId: string) => Promise<void>;
  clearAll: () => Promise<void>;
  refreshDownloads: () => Promise<void>;
}

export function useDownloads(): UseDownloadsReturn {
  const { user, isLoggedIn } = useAuth();
  const [downloads, setDownloads] = useState<DownloadedLesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [downloadProgress, setDownloadProgress] = useState<
    Record<string, DownloadProgress>
  >({});
  const [storageUsed, setStorageUsed] = useState("0 B");
  const [isDeviceRegistered, setIsDeviceRegistered] = useState(false);

  // Get token helper
  const getToken = useCallback(() => getCachedToken(), []);

  // Register device on mount
  useEffect(() => {
    const initDevice = async () => {
      const token = getToken();
      if (!token) return;

      try {
        await registerDevice(token);
        setIsDeviceRegistered(true);
      } catch (error) {
        console.error("Failed to register device:", error);
        // Device might already be registered, that's OK
        setIsDeviceRegistered(true);
      }
    };

    initDevice();
  }, [getToken, isLoggedIn]);

  // Load downloads on mount
  const refreshDownloads = useCallback(async () => {
    setIsLoading(true);
    try {
      const allDownloads = await getDownloadedLessons();
      setDownloads(allDownloads);

      const size = await getDownloadsStorageSize();
      setStorageUsed(formatBytes(size));
    } catch (error) {
      console.error("Failed to load downloads:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshDownloads();
  }, [refreshDownloads]);

  // Start downloading a lesson
  const startDownload = useCallback(
    async (lessonId: string, courseId: string) => {
      const token = getToken();
      if (!token) {
        throw new Error("Not authenticated");
      }

      // Check if already downloading
      if (
        downloadProgress[lessonId]?.status === "downloading" ||
        downloadProgress[lessonId]?.status === "encrypting" ||
        downloadProgress[lessonId]?.status === "saving"
      ) {
        return;
      }

      try {
        await downloadLesson(lessonId, courseId, token, (progress) => {
          setDownloadProgress((prev) => ({
            ...prev,
            [lessonId]: progress,
          }));
        });

        // Refresh downloads list
        await refreshDownloads();

        // Clear progress after success
        setTimeout(() => {
          setDownloadProgress((prev) => {
            const newProgress = { ...prev };
            delete newProgress[lessonId];
            return newProgress;
          });
        }, 2000);
      } catch (error) {
        console.error("Download failed:", error);
        throw error;
      }
    },
    [getToken, downloadProgress, refreshDownloads]
  );

  // Check if a lesson is downloaded
  const checkDownloaded = useCallback(
    async (lessonId: string): Promise<boolean> => {
      return isLessonDownloaded(lessonId);
    },
    []
  );

  // Get downloads for a specific course
  const getDownloadsForCourse = useCallback(
    async (courseId: string): Promise<DownloadedLesson[]> => {
      return getDownloadedLessonsForCourse(courseId);
    },
    []
  );

  // Load encrypted audio for playback
  const loadAudioForPlayback = useCallback(
    async (lessonId: string): Promise<string> => {
      const token = getToken();
      if (!token) {
        throw new Error("Not authenticated");
      }
      return loadEncryptedAudio(lessonId, token);
    },
    [getToken]
  );

  // Release audio blob URL
  const releaseAudioUrl = useCallback((url: string) => {
    revokeAudioBlobUrl(url);
  }, []);

  // Remove a download
  const removeDownload = useCallback(
    async (lessonId: string) => {
      const token = getToken();
      await deleteDownloadedLesson(lessonId, token || undefined);
      await refreshDownloads();
    },
    [getToken, refreshDownloads]
  );

  // Clear all downloads
  const clearAll = useCallback(async () => {
    const token = getToken();
    await clearAllDownloads(token || undefined);
    await refreshDownloads();
  }, [getToken, refreshDownloads]);

  return {
    downloads,
    isLoading,
    downloadProgress,
    storageUsed,
    isDeviceRegistered,
    startDownload,
    checkDownloaded,
    getDownloadsForCourse,
    loadAudioForPlayback,
    releaseAudioUrl,
    removeDownload,
    clearAll,
    refreshDownloads,
  };
}

/**
 * Hook for single lesson download status
 */
export function useLessonDownloadStatus(lessonId: string) {
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    const check = async () => {
      setIsChecking(true);
      try {
        const downloaded = await isLessonDownloaded(lessonId);
        setIsDownloaded(downloaded);
      } catch (error) {
        console.error("Failed to check download status:", error);
      } finally {
        setIsChecking(false);
      }
    };

    check();
  }, [lessonId, refreshKey]);

  return { isDownloaded, isChecking, refresh };
}
