import React from "react";
import { Card } from "@/components/ui/card";
import { Clock, CheckCircle, AlertTriangle, User, GitBranch } from "lucide-react";

export default function ActivityLog({ activities = [] }) {
  const defaultActivities = [
    { type: "complete", text: "Step 2: 'Component Alignment' completed.", time: "2 min ago" },
    { type: "warning", text: "Torque value out of tolerance on bolt #4.", time: "5 min ago" },
    { type: "info", text: "User switched to 'Detail View'.", time: "6 min ago" },
    { type: "complete", text: "Step 1: 'Initial Setup' completed.", time: "15 min ago" },
    { type: "user", text: "User John Doe started tutorial.", time: "25 min ago" },
    { type: "system", text: "Tutorial 'NX-003790' loaded successfully.", time: "25 min ago" },
  ];

  const displayActivities = activities.length > 0 ? activities : defaultActivities;

  const ICONS = {
    complete: <CheckCircle className="text-green-500" />,
    warning: <AlertTriangle className="text-amber-500" />,
    info: <Clock className="text-blue-500" />,
    user: <User className="text-purple-500" />,
    system: <GitBranch className="text-gray-500" />,
  };
  
  return (
    <Card className="h-full bg-white border border-gray-200 shadow-sm">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
            Activity Log
          </h3>
        </div>
      </div>
      
      <div className="p-2 space-y-1 max-h-[calc(100vh-12rem)] overflow-y-auto">
        {displayActivities.map((activity, index) => (
          <div 
            key={index}
            className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-150"
          >
            <div className="w-5 h-5 flex-shrink-0 mt-0.5">
              {ICONS[activity.type] || <Clock className="text-blue-500" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm text-gray-800">
                {activity.text}
              </div>
              <div className="text-xs font-medium text-gray-500 mt-1">
                {activity.time}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}