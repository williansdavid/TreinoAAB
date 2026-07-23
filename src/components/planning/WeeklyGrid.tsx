import { useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
  TouchSensor,
} from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { Dumbbell, GripVertical, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { PlanDay } from "@/hooks/usePlans";

interface WeeklyGridProps {
  days: PlanDay[];
  allDays: string[];
  daysLabels: Record<string, string>;
  selectedDayId: string | null;
  onSelectDay: (dayId: string | null) => void;
  onMoveWorkout: (fromDayId: string, toDayName: string) => Promise<boolean>;
  onSwapWorkouts: (dayId1: string, dayId2: string) => Promise<boolean>;
}

interface DraggableWorkoutProps {
  day: PlanDay;
  label: string;
  isSelected: boolean;
  onSelect: () => void;
}

function DraggableWorkout({ day, label, isSelected, onSelect }: DraggableWorkoutProps) {
  return (
    <div
      onClick={onSelect}
      className={cn(
        "bg-card border rounded-xl p-3 cursor-pointer transition-all",
        isSelected ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/50"
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Dumbbell className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="font-medium text-sm truncate">{day.nome_treino || "Treino"}</p>
        </div>
        <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab active:cursor-grabbing" />
      </div>
      <p className="text-xs text-muted-foreground">
        {day.exercises.length} exercício{day.exercises.length !== 1 ? "s" : ""}
      </p>
    </div>
  );
}

export function WeeklyGrid({
  days,
  allDays,
  daysLabels,
  selectedDayId,
  onSelectDay,
  onMoveWorkout,
  onSwapWorkouts,
}: WeeklyGridProps) {
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [draggedDay, setDraggedDay] = useState<PlanDay | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const dayId = event.active.id as string;
    const day = days.find((d) => d.id === dayId);
    setActiveDragId(dayId);
    setDraggedDay(day || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragId(null);
    setDraggedDay(null);

    if (!over || active.id === over.id) return;

    const fromDayId = active.id as string;
    const targetId = over.id as string;

    // Check if target is an empty slot (day name) or existing workout (day id)
    const targetDay = days.find((d) => d.id === targetId);
    
    if (targetDay) {
      // Swapping with another workout
      await onSwapWorkouts(fromDayId, targetId);
    } else {
      // Moving to empty day
      await onMoveWorkout(fromDayId, targetId);
    }
  };

  const getDayForSlot = (dayName: string) => {
    return days.find((d) => d.dia_semana === dayName);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {allDays.map((dayName) => {
          const day = getDayForSlot(dayName);
          const label = daysLabels[dayName] || dayName;

          return (
            <DroppableSlot
              key={dayName}
              id={day?.id || dayName}
              dayName={dayName}
              label={label}
              day={day}
              isSelected={day?.id === selectedDayId}
              onSelect={() => day && onSelectDay(day.id === selectedDayId ? null : day.id)}
              isDragging={activeDragId === day?.id}
            />
          );
        })}
      </div>

      <DragOverlay>
        {draggedDay && (
          <div className="bg-card border border-primary rounded-xl p-3 shadow-lg opacity-90">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Dumbbell className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">
                  {draggedDay.nome_treino || "Treino"}
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {draggedDay.exercises.length} exercício{draggedDay.exercises.length !== 1 ? "s" : ""}
            </p>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}

interface DroppableSlotProps {
  id: string;
  dayName: string;
  label: string;
  day: PlanDay | undefined;
  isSelected: boolean;
  onSelect: () => void;
  isDragging: boolean;
}

import { useDraggable, useDroppable } from "@dnd-kit/core";

function DroppableSlot({
  id,
  dayName,
  label,
  day,
  isSelected,
  onSelect,
  isDragging,
}: DroppableSlotProps) {
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({ id });
  const {
    attributes,
    listeners,
    setNodeRef: setDraggableRef,
    transform,
  } = useDraggable({ id: day?.id || id, disabled: !day });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  if (!day) {
    return (
      <div
        ref={setDroppableRef}
        className={cn(
          "border-2 border-dashed rounded-xl p-3 min-h-[100px] flex flex-col items-center justify-center transition-all",
          isOver
            ? "border-primary bg-primary/10"
            : "border-muted-foreground/20 bg-muted/30"
        )}
      >
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="text-xs text-muted-foreground mt-1">Sem treino</p>
      </div>
    );
  }

  return (
    <div ref={setDroppableRef} className="relative">
      <div
        ref={setDraggableRef}
        style={style}
        {...attributes}
        {...listeners}
        className={cn(
          "touch-none",
          isDragging && "opacity-50"
        )}
      >
        <DraggableWorkout
          day={day}
          label={label}
          isSelected={isSelected}
          onSelect={onSelect}
        />
      </div>
    </div>
  );
}
