"use client";

import { useEffect, useState, useCallback } from "react";
import { useTimezoneStore } from "@/store/timezone-store";
import { TimezoneRow } from "@/components/TimezoneRow";

export function TimelineGrid() {
  const { zones, reorderZones, tick } = useTimezoneStore();
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  useEffect(() => {
    const interval = setInterval(tick, 60_000);
    return () => clearInterval(interval);
  }, [tick]);

  const handleDragStart = useCallback((index: number) => {
    setDragIndex(index);
  }, []);

  const handleDragOver = useCallback((index: number) => {
    setOverIndex(index);
  }, []);

  const handleDragEnd = useCallback(() => {
    if (dragIndex !== null && overIndex !== null && dragIndex !== overIndex) {
      reorderZones(dragIndex, overIndex);
    }
    setDragIndex(null);
    setOverIndex(null);
  }, [dragIndex, overIndex, reorderZones]);

  if (zones.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <p className="text-lg">No timezones added</p>
        <p className="text-sm">Click &quot;Add timezone&quot; to get started</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {zones.map((zone, index) => (
        <TimezoneRow
          key={zone.id}
          zone={zone}
          index={index}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        />
      ))}
    </div>
  );
}
