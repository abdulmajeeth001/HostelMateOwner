import DesktopLayout from "@/components/layout/DesktopLayout";
import { Bell, MessageSquare, AlertTriangle, Check } from "lucide-react";

const NOTIFICATIONS = [
  { id: 1, title: "Rent Due Reminder", msg: "Sent to 5 tenants for upcoming month.", time: "Just now", icon: Bell, color: "bg-blue-100 text-blue-600" },
  { id: 2, title: "New Message", msg: "Rahul: Sir, fan is not working in room 101.", time: "10m ago", icon: MessageSquare, color: "bg-purple-100 text-purple-600" },
  { id: 3, title: "System Alert", msg: "Your subscription expires in 3 days.", time: "1h ago", icon: AlertTriangle, color: "bg-orange-100 text-orange-600" },
  { id: 4, title: "Maintenance Completed", msg: "Plumber fixed the leak in Room 202.", time: "Yesterday", icon: Check, color: "bg-green-100 text-green-600" },
];

export default function Notifications() {
  return (
    <DesktopLayout title="Notifications">
      <div className="space-y-4">
        {NOTIFICATIONS.map((notif) => (
          <div key={notif.id} className="flex gap-4 p-4 bg-card rounded-xl border border-border shadow-sm hover:bg-secondary/30 transition-colors">
            <div className={`w-10 h-10 rounded-full shrink-0 flex items-center justify-center ${notif.color}`}>
              <notif.icon className="w-5 h-5" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex justify-between items-start">
                <h4 className="font-semibold text-sm">{notif.title}</h4>
                <span className="text-[10px] text-muted-foreground">{notif.time}</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{notif.msg}</p>
            </div>
          </div>
        ))}
      </div>
    </DesktopLayout>
  );
}
