/**
 * DownloadButton Component
 * Shows download status and handles downloading lessons for offline use
 */

import React, { useState, useEffect } from "react";
import { Download, Check, Loader2, Trash2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useDownloads, useLessonDownloadStatus } from "@/hooks/useDownloads";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface DownloadButtonProps {
  lessonId: string;
  courseId: string;
  lessonTitle?: string;
  variant?: "default" | "icon" | "compact";
  className?: string;
  onDownloadComplete?: () => void;
}

export function DownloadButton({
  lessonId,
  courseId,
  lessonTitle,
  variant = "default",
  className,
  onDownloadComplete,
}: DownloadButtonProps) {
  const { toast } = useToast();
  const { isDownloaded, isChecking } = useLessonDownloadStatus(lessonId);
  const { startDownload, downloadProgress, removeDownload } = useDownloads();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const progress = downloadProgress[lessonId];
  const isDownloading =
    progress &&
    ["pending", "downloading", "encrypting", "saving"].includes(
      progress.status
    );
  const hasError = progress?.status === "error";
  const isComplete = progress?.status === "completed" || isDownloaded;

  // Auto-refresh when download completes
  useEffect(() => {
    if (progress?.status === "completed") {
      onDownloadComplete?.();
    }
  }, [progress?.status, onDownloadComplete]);

  const handleDownload = async () => {
    try {
      await startDownload(lessonId, courseId);
      toast({
        title: "Download Complete",
        description: lessonTitle
          ? `"${lessonTitle}" is now available offline`
          : "Lesson downloaded for offline use",
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description:
          error instanceof Error ? error.message : "Failed to download lesson",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    try {
      await removeDownload(lessonId);
      setShowDeleteConfirm(false);
      toast({
        title: "Download Removed",
        description: "Lesson removed from offline storage",
      });
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: "Failed to remove downloaded lesson",
        variant: "destructive",
      });
    }
  };

  // Get status text
  const getStatusText = () => {
    if (isChecking) return "Checking...";
    if (hasError) return "Error";
    if (!progress) {
      return isDownloaded ? "Downloaded" : "Download";
    }

    switch (progress.status) {
      case "pending":
        return "Preparing...";
      case "downloading":
        return "Downloading...";
      case "encrypting":
        return "Securing...";
      case "saving":
        return "Saving...";
      case "completed":
        return "Downloaded";
      default:
        return "Download";
    }
  };

  // Icon-only variant
  if (variant === "icon") {
    if (isChecking) {
      return (
        <Button variant="ghost" size="icon" disabled className={className}>
          <Loader2 className="h-4 w-4 animate-spin" />
        </Button>
      );
    }

    if (isDownloading) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className={cn(
                  "relative inline-flex items-center justify-center",
                  className
                )}
              >
                <Button variant="ghost" size="icon" disabled>
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                </Button>
                {progress && (
                  <span className="absolute -bottom-1 text-[10px] text-muted-foreground">
                    {Math.round(progress.progress)}%
                  </span>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{getStatusText()}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    if (isComplete) {
      return (
        <AlertDialog
          open={showDeleteConfirm}
          onOpenChange={setShowDeleteConfirm}
        >
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "text-green-600 hover:text-red-600",
                      className
                    )}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Downloaded - Click to remove</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove Download?</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove the downloaded audio from your device. You can
                download it again later.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );
    }

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDownload}
              className={className}
            >
              <Download className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Download for offline use</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Compact variant
  if (variant === "compact") {
    return (
      <Button
        variant={isComplete ? "outline" : "secondary"}
        size="sm"
        disabled={isChecking || isDownloading}
        onClick={isComplete ? () => setShowDeleteConfirm(true) : handleDownload}
        className={cn(
          isComplete && "border-green-500 text-green-600",
          className
        )}
      >
        {isChecking && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        {isDownloading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        {isComplete && !isDownloading && <Check className="h-4 w-4 mr-2" />}
        {!isChecking && !isDownloading && !isComplete && (
          <Download className="h-4 w-4 mr-2" />
        )}
        {hasError && <AlertCircle className="h-4 w-4 mr-2 text-red-500" />}
        <span className="text-xs">{getStatusText()}</span>
      </Button>
    );
  }

  // Default variant with progress
  return (
    <div className={cn("space-y-2", className)}>
      {isDownloading && progress && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{getStatusText()}</span>
            <span>{Math.round(progress.progress)}%</span>
          </div>
          <Progress value={progress.progress} className="h-2" />
        </div>
      )}

      {!isDownloading && (
        <div className="flex items-center gap-2">
          {isComplete ? (
            <>
              <Button
                variant="outline"
                className="flex-1 border-green-500 text-green-600"
                disabled
              >
                <Check className="h-4 w-4 mr-2" />
                Downloaded
              </Button>
              <AlertDialog
                open={showDeleteConfirm}
                onOpenChange={setShowDeleteConfirm}
              >
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remove Download?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will remove "{lessonTitle || "this lesson"}" from
                      your device. You can download it again later.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Remove
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          ) : (
            <Button
              variant="secondary"
              className="w-full"
              onClick={handleDownload}
              disabled={isChecking}
            >
              {isChecking ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : hasError ? (
                <AlertCircle className="h-4 w-4 mr-2 text-red-500" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              {hasError ? "Retry Download" : "Download for Offline"}
            </Button>
          )}
        </div>
      )}

      {hasError && progress?.error && (
        <p className="text-xs text-red-500">{progress.error}</p>
      )}
    </div>
  );
}

export default DownloadButton;
