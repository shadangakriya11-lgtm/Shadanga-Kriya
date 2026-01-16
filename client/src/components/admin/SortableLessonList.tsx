import { useState } from "react";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    TouchSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    GripVertical,
    Clock,
    Pause,
    KeyRound,
    MoreHorizontal,
    Save,
    X,
    ArrowUpDown,
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface Lesson {
    id: string;
    title: string;
    courseName: string;
    courseId: string;
    orderIndex?: number;
    order_index?: number;
    durationMinutes?: number;
    duration_seconds?: number;
    max_pauses?: number;
    maxPauses?: number;
    audioUrl?: string;
    accessCodeEnabled?: boolean;
    hasAccessCode?: boolean;
    accessCodeExpired?: boolean;
}

interface SortableLessonItemProps {
    lesson: Lesson;
    isReorderMode: boolean;
    onEdit: (lesson: Lesson) => void;
    onPreview: (lesson: Lesson) => void;
    onManageAccessCode: (lesson: Lesson) => void;
    onDelete: (lessonId: string) => void;
}

function SortableLessonItem({
    lesson,
    isReorderMode,
    onEdit,
    onPreview,
    onManageAccessCode,
    onDelete,
}: SortableLessonItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: lesson.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        touchAction: isReorderMode ? "none" : "auto",
    };

    const orderIndex = lesson.orderIndex ?? lesson.order_index ?? 0;
    const maxPauses = lesson.maxPauses ?? lesson.max_pauses ?? 3;
    const durationMinutes = lesson.durationMinutes
        ? `${lesson.durationMinutes} min`
        : lesson.duration_seconds
            ? `${Math.round(lesson.duration_seconds / 60)} min`
            : "0 min";

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "flex items-center gap-2 sm:gap-4 p-3 sm:p-4 bg-card border border-border/50 rounded-lg transition-all",
                isDragging && "opacity-50 shadow-lg ring-2 ring-primary z-50",
                isReorderMode && "cursor-grab active:cursor-grabbing hover:bg-muted/50"
            )}
        >
            {/* Drag Handle - Only visible in reorder mode */}
            {isReorderMode && (
                <div
                    {...attributes}
                    {...listeners}
                    className="flex-shrink-0 p-1 sm:p-2 rounded hover:bg-muted cursor-grab active:cursor-grabbing touch-none"
                >
                    <GripVertical className="h-5 w-5 text-muted-foreground" />
                </div>
            )}

            {/* Order Number */}
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-medium text-primary">
                    #{orderIndex + 1}
                </span>
            </div>

            {/* Lesson Info */}
            <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{lesson.title}</p>
                <p className="text-sm text-muted-foreground truncate">
                    {lesson.courseName || "Unknown Course"}
                </p>
            </div>

            {/* Meta Info - Hidden on mobile in reorder mode */}
            <div
                className={cn(
                    "hidden sm:flex items-center gap-4 text-sm text-muted-foreground",
                    isReorderMode && "hidden lg:flex"
                )}
            >
                <div className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    <span>{durationMinutes}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <Pause className="h-4 w-4" />
                    <span>{maxPauses}</span>
                </div>
            </div>

            {/* Audio Status Badge */}
            <Badge
                variant={lesson.audioUrl ? "active" : "locked"}
                className={cn("hidden sm:flex", isReorderMode && "hidden lg:flex")}
            >
                {lesson.audioUrl ? "Uploaded" : "Pending"}
            </Badge>

            {/* Access Code Badge */}
            <div
                className={cn(
                    "hidden md:flex items-center gap-2",
                    isReorderMode && "hidden xl:flex"
                )}
            >
                {lesson.accessCodeEnabled ? (
                    <Badge
                        variant={
                            lesson.hasAccessCode
                                ? lesson.accessCodeExpired
                                    ? "destructive"
                                    : "default"
                                : "secondary"
                        }
                    >
                        <KeyRound className="h-3 w-3 mr-1" />
                        {lesson.hasAccessCode
                            ? lesson.accessCodeExpired
                                ? "Expired"
                                : "Active"
                            : "No Code"}
                    </Badge>
                ) : (
                    <Badge variant="outline">Disabled</Badge>
                )}
            </div>

            {/* Actions - Hidden in reorder mode */}
            {!isReorderMode && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(lesson)}>
                            Edit Lesson
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit(lesson)}>
                            Upload Audio
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => onPreview(lesson)}
                            disabled={!lesson.audioUrl}
                        >
                            Preview
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onManageAccessCode(lesson)}>
                            <KeyRound className="h-4 w-4 mr-2" />
                            Manage Access Code
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => onDelete(lesson.id)}
                        >
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
        </div>
    );
}

interface SortableLessonListProps {
    lessons: Lesson[];
    courseId: string;
    courseName: string;
    onEdit: (lesson: Lesson) => void;
    onPreview: (lesson: Lesson) => void;
    onManageAccessCode: (lesson: Lesson) => void;
    onDelete: (lessonId: string) => void;
    onReorder: (courseId: string, lessonIds: string[]) => Promise<void>;
    isReordering: boolean;
}

export function SortableLessonList({
    lessons,
    courseId,
    courseName,
    onEdit,
    onPreview,
    onManageAccessCode,
    onDelete,
    onReorder,
    isReordering,
}: SortableLessonListProps) {
    const [isReorderMode, setIsReorderMode] = useState(false);
    const [localLessons, setLocalLessons] = useState(lessons);
    const [hasChanges, setHasChanges] = useState(false);

    // Reset local lessons when lessons prop changes
    if (
        !isReorderMode &&
        JSON.stringify(lessons.map((l) => l.id)) !==
        JSON.stringify(localLessons.map((l) => l.id))
    ) {
        setLocalLessons(lessons);
    }

    // Sensors for drag and drop - supports mouse, touch, and keyboard
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // 8px movement required before drag starts
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 200, // 200ms hold before drag starts on touch
                tolerance: 5, // 5px tolerance
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setLocalLessons((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over.id);
                const newOrder = arrayMove(items, oldIndex, newIndex);
                setHasChanges(true);
                return newOrder;
            });
        }
    };

    const handleSaveOrder = async () => {
        const lessonIds = localLessons.map((l) => l.id);
        await onReorder(courseId, lessonIds);
        setHasChanges(false);
        setIsReorderMode(false);
    };

    const handleCancelReorder = () => {
        setLocalLessons(lessons);
        setHasChanges(false);
        setIsReorderMode(false);
    };

    const handleEnterReorderMode = () => {
        setLocalLessons(lessons);
        setIsReorderMode(true);
    };

    if (lessons.length === 0) {
        return null;
    }

    return (
        <div className="space-y-4">
            {/* Course Header with Reorder Button */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 pb-2 border-b">
                <div>
                    <h3 className="font-serif text-lg font-semibold text-foreground">
                        {courseName}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        {lessons.length} lesson{lessons.length !== 1 ? "s" : ""}
                    </p>
                </div>

                {!isReorderMode ? (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleEnterReorderMode}
                        className="w-full sm:w-auto"
                    >
                        <ArrowUpDown className="h-4 w-4 mr-2" />
                        Reorder Lessons
                    </Button>
                ) : (
                    <div className="flex gap-2 w-full sm:w-auto">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCancelReorder}
                            className="flex-1 sm:flex-none"
                        >
                            <X className="h-4 w-4 mr-2" />
                            Cancel
                        </Button>
                        <Button
                            variant="premium"
                            size="sm"
                            onClick={handleSaveOrder}
                            disabled={!hasChanges || isReordering}
                            className="flex-1 sm:flex-none"
                        >
                            <Save className="h-4 w-4 mr-2" />
                            {isReordering ? "Saving..." : "Save Order"}
                        </Button>
                    </div>
                )}
            </div>

            {/* Reorder Mode Instructions */}
            {isReorderMode && (
                <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg text-sm text-primary">
                    <p className="font-medium">
                        📱 Drag lessons to reorder them. On mobile, hold for a moment before
                        dragging.
                    </p>
                </div>
            )}

            {/* Sortable Lesson List */}
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={localLessons.map((l) => l.id)}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="space-y-2">
                        {localLessons.map((lesson) => (
                            <SortableLessonItem
                                key={lesson.id}
                                lesson={lesson}
                                isReorderMode={isReorderMode}
                                onEdit={onEdit}
                                onPreview={onPreview}
                                onManageAccessCode={onManageAccessCode}
                                onDelete={onDelete}
                            />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>
        </div>
    );
}
