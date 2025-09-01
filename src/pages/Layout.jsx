

import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Book, Settings, User } from "lucide-react";

export default function Layout({ children, currentPageName }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <style>{`
        :root {
          --primary-blue: #1e40af;
          --secondary-blue: #3b82f6;
          --accent-green: #10b981;
          --neutral-800: #1f2937;
          --neutral-600: #4b5563;
          --neutral-200: #e5e7eb;
          --neutral-100: #f3f4f6;
        }
      `}</style>
      
      {/* Top Navigation */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
              <Book className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900">TutorialCAD</h1>
          </div>
          
          <nav className="flex items-center gap-6">
            <Link 
              to={createPageUrl("Tutorials")}
              className={`text-sm font-medium transition-colors duration-200 ${
                currentPageName === "Tutorials" 
                  ? "text-blue-600" 
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Tutorials
            </Link>
            <Link 
              to={createPageUrl("Dashboard")}
              className={`text-sm font-medium transition-colors duration-200 ${
                currentPageName === "Dashboard" 
                  ? "text-blue-600" 
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Dashboard
            </Link>
            <Link 
              to={createPageUrl("TutorialEditor")}
              className={`text-sm font-medium transition-colors duration-200 ${
                currentPageName === "TutorialEditor" 
                  ? "text-blue-600" 
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Editor
            </Link>
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
              <User className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Login</span>
            </div>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}

