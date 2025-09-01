import React from "react";
import { Card } from "@/components/ui/card";
import { Wrench } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function ToolKit({ isLoading, tools = [], selectedTools = [] }) {
  const hasTools = tools && tools.length > 0;

  return (
    <Card className="bg-white border border-gray-200 shadow-sm h-full flex flex-col">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Wrench className="w-4 h-4 text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
            Tool Kit
          </h3>
        </div>
      </div>
      
      <div className="p-4 flex-grow">
        {isLoading ? (
          <div className="grid grid-cols-6 gap-3">
             {Array(12).fill(0).map((_, index) => (
                <div key={index} className="flex flex-col items-center gap-2">
                    <Skeleton className="w-3 h-12 rounded-full" />
                    <Skeleton className="w-5 h-5 rounded-full" />
                </div>
             ))}
          </div>
        ) : !hasTools ? (
          <div className="h-full flex items-center justify-center text-sm text-gray-500">
            No tools configured yet.
          </div>
        ) : (
          <div className="grid grid-cols-6 gap-3">
            {tools.map((tool) => {
              const isSelected = (selectedTools || []).map(String).includes(String(tool.id));
              return (
                <div 
                  key={tool.id}
                  className={`relative group cursor-pointer transition-all duration-200 rounded-md p-2
                    ${isSelected 
                      ? 'border-2 border-green-500 bg-green-50' 
                      : 'border border-transparent hover:border-gray-200 hover:bg-gray-50'
                    }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className={`w-3 h-12 rounded-full ${tool.color || 'bg-blue-500'} shadow-sm`} />
                    {/* Make the small top dot neutral (never forced red) */}
                    <div className="w-5 h-5 rounded-full bg-gray-700 shadow-sm" />
                  </div>

                  {/* Remove green dot; use square (border) selection state above */}

                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                    {tool.name || 'Tool'}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
}