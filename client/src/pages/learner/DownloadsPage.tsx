/**
 * Downloads Management Page
 * Shows all downloaded lessons and storage usage
 */

import React, { useState } from "react";
import {
  Download,
  Trash2,
  HardDrive,
  Play,
  Clock,
  Folder,
  Search,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { useDownloads } from "@/hooks/useDownloads";
import { useToast } from "@/hooks/use-toast";
import { formatBytes } from "@/lib/downloadManager";
import { useNavigate } from "react-router-dom";

export function DownloadsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    downloads,
    isLoading,
    storageUsed,
    removeDownload,
    clearAll,
    refreshDownloads,
  } = useDownloads();

  const [searchQuery, setSearchQuery] = useState("");
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false);

  // Filter downloads by search
  const filteredDownloads = downloads.filter(
    (d) =>
      d.lessonTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.courseTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group downloads by course
  const groupedByCourse = filteredDownloads.reduce((acc, download) => {
    if (!acc[download.courseId]) {
      acc[download.courseId] = {
        courseTitle: download.courseTitle,
        lessons: [],
      };
    }
    acc[download.courseId].lessons.push(download);
    return acc;
  }, {} as Record<string, { courseTitle: string; lessons: typeof downloads }>);

  const handleRemoveDownload = async (
    lessonId: string,
    lessonTitle: string
  ) => {
    try {
      await removeDownload(lessonId);
      toast({
        title: "Download Removed",
        description: `"${lessonTitle}" removed from offline storage`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove download",
        variant: "destructive",
      });
    }
  };

  const handleClearAll = async () => {
    try {
      await clearAll();
      setShowClearAllConfirm(false);
      toast({
        title: "All Downloads Cleared",
        description: "All offline content has been removed",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clear downloads",
        variant: "destructive",
      });
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse text-muted-foreground">
            Loading downloads...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Download className="h-6 w-6" />
            My Downloads
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your offline content
          </p>
        </div>

        {/* Storage indicator */}
        <Card className="px-4 py-2 flex items-center gap-3">
          <HardDrive className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">{storageUsed}</p>
            <p className="text-xs text-muted-foreground">
              {downloads.length} lesson{downloads.length !== 1 ? "s" : ""} saved
            </p>
          </div>
        </Card>
      </div>

      {/* Search and Clear All */}
      {downloads.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search downloads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <AlertDialog
            open={showClearAllConfirm}
            onOpenChange={setShowClearAllConfirm}
          >
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                className="text-red-500 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  Clear All Downloads?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  This will remove all {downloads.length} downloaded lessons
                  from your device. You'll need to download them again to use
                  them offline. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleClearAll}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Clear All Downloads
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}

      {/* Empty State */}
      {downloads.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Download className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Downloads Yet</h3>
            <p className="text-muted-foreground mb-4 max-w-md mx-auto">
              Download lessons from your enrolled courses to listen offline
              during your practice sessions.
            </p>
            <Button onClick={() => navigate("/learner/my-courses")}>
              Browse My Courses
            </Button>
          </CardContent>
        </Card>
      )}

      {/* No search results */}
      {downloads.length > 0 && filteredDownloads.length === 0 && (
        <Card className="text-center py-8">
          <CardContent>
            <Search className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Results Found</h3>
            <p className="text-muted-foreground">
              No downloads match "{searchQuery}"
            </p>
            <Button
              variant="ghost"
              onClick={() => setSearchQuery("")}
              className="mt-4"
            >
              Clear Search
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Downloads grouped by course */}
      {Object.entries(groupedByCourse).map(
        ([courseId, { courseTitle, lessons }]) => (
          <Card key={courseId} className="mb-4">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Folder className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">{courseTitle}</CardTitle>
                <Badge variant="secondary" className="ml-auto">
                  {lessons.length} lesson{lessons.length !== 1 ? "s" : ""}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="divide-y">
                {lessons.map((lesson) => (
                  <div
                    key={lesson.lessonId}
                    className="flex items-center justify-between py-3 gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">
                        {lesson.lessonTitle}
                      </h4>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDuration(lesson.durationSeconds)}
                        </span>
                        <span className="flex items-center gap-1">
                          <HardDrive className="h-3 w-3" />
                          {formatBytes(lesson.fileSizeBytes)}
                        </span>
                        <span>
                          Downloaded {formatDate(lesson.downloadedAt)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          navigate(`/learner/lesson/${lesson.lessonId}`)
                        }
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-600"
                        onClick={() =>
                          handleRemoveDownload(
                            lesson.lessonId,
                            lesson.lessonTitle
                          )
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )
      )}
    </div>
  );
}

export default DownloadsPage;
