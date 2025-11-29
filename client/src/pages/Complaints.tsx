import DesktopLayout from "@/components/layout/DesktopLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle, Clock, Zap } from "lucide-react";

const COMPLAINTS = [
  { id: 1, room: "204", tenant: "John Doe", issue: "Fan not working", date: "Nov 25", status: "open", priority: "high" },
  { id: 2, room: "102", tenant: "Amit Singh", issue: "Water leakage in bathroom", date: "Nov 24", status: "in-progress", priority: "high" },
  { id: 3, room: "301", tenant: "Sneha Gupta", issue: "Light bulb replacement", date: "Nov 22", status: "resolved", priority: "low" },
  { id: 4, room: "103", tenant: "Priya", issue: "WiFi not working", date: "Nov 20", status: "open", priority: "medium" },
  { id: 5, room: "205", tenant: "Unknown", issue: "Noise complaint", date: "Nov 19", status: "resolved", priority: "medium" },
];

export default function Complaints() {
  return (
    <DesktopLayout 
      title="Complaints & Issues" 
      showNav={false}
    >
      <div className="space-y-4">
        {COMPLAINTS.map((complaint) => (
          <Card key={complaint.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                    complaint.status === 'resolved' ? 'bg-green-100 text-green-600' :
                    complaint.status === 'in-progress' ? 'bg-blue-100 text-blue-600' :
                    'bg-red-100 text-red-600'
                  }`}>
                    {complaint.status === 'resolved' ? <CheckCircle className="w-5 h-5" /> :
                     complaint.status === 'in-progress' ? <Clock className="w-5 h-5" /> :
                     <AlertCircle className="w-5 h-5" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground">{complaint.issue}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        complaint.priority === 'high' ? 'bg-red-100 text-red-700' :
                        complaint.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {complaint.priority === 'high' ? '🔴' : complaint.priority === 'medium' ? '🟡' : '🔵'} {complaint.priority}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">Room {complaint.room} • {complaint.tenant}</p>
                    <p className="text-xs text-muted-foreground">{complaint.date}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm">View</Button>
                  {complaint.status !== 'resolved' && (
                    <Button size="sm" variant="default">Update</Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </DesktopLayout>
  );
}
