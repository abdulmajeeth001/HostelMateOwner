import DesktopLayout from "@/components/layout/DesktopLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Wrench, Plus, AlertCircle } from "lucide-react";

const MAINTENANCE = [
  { id: 1, task: "Monthly HVAC Inspection", date: "Nov 30, 2024", assigned: "Service Provider A", status: "pending" },
  { id: 2, task: "Plumbing Check - All Rooms", date: "Dec 5, 2024", assigned: "Plumber B", status: "scheduled" },
  { id: 3, task: "Electrical Audit", date: "Nov 28, 2024", assigned: "Electrician C", status: "in-progress" },
  { id: 4, task: "Water Tank Cleaning", date: "Nov 25, 2024", assigned: "Service Provider D", status: "completed" },
  { id: 5, task: "Fire Safety Check", date: "Dec 10, 2024", assigned: "Safety Inspector E", status: "scheduled" },
];

export default function Maintenance() {
  return (
    <DesktopLayout 
      title="Maintenance Schedule" 
      action={
        <Button className="gap-2">
          <Plus className="w-4 h-4" /> Schedule Maintenance
        </Button>
      }
      showNav={false}
    >
      <div className="space-y-4">
        {MAINTENANCE.map((task) => (
          <Card key={task.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center shrink-0">
                    <Wrench className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-1">{task.task}</h3>
                    <p className="text-sm text-muted-foreground mb-2">Assigned: {task.assigned}</p>
                    <p className="text-xs text-muted-foreground">{task.date}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    task.status === 'completed' ? 'bg-green-100 text-green-700' :
                    task.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                    task.status === 'scheduled' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                  </span>
                  <Button variant="ghost" size="sm">Edit</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </DesktopLayout>
  );
}
