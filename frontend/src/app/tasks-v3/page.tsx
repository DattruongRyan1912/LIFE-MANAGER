"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import KanbanView from "@/components/tasks-v3/KanbanView";
import CalendarView from "@/components/tasks-v3/CalendarView";
import TimelineView from "@/components/tasks-v3/TimelineView";
import { LayoutGrid, Calendar, GanttChart } from "lucide-react";

export default function TasksV3Page() {
  const [activeView, setActiveView] = useState("kanban");

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tasks v3</h1>
          <p className="text-muted-foreground">
            Advanced task management with Kanban, Calendar, and Timeline views
          </p>
        </div>
      </div>

      <Tabs value={activeView} onValueChange={setActiveView} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="kanban" className="flex items-center gap-2">
            <LayoutGrid className="h-4 w-4" />
            Kanban
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Calendar
          </TabsTrigger>
          <TabsTrigger value="timeline" className="flex items-center gap-2">
            <GanttChart className="h-4 w-4" />
            Timeline
          </TabsTrigger>
        </TabsList>

        <TabsContent value="kanban" className="mt-6">
          <KanbanView />
        </TabsContent>

        <TabsContent value="calendar" className="mt-6">
          <CalendarView />
        </TabsContent>

        <TabsContent value="timeline" className="mt-6">
          <TimelineView />
        </TabsContent>
      </Tabs>
    </div>
  );
}
