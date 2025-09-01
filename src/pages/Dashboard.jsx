
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom"; // Added Link import
import { createPageUrl } from "@/utils"; // Fixed import path
import { Tutorial, Step, Tool } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { FileText, Play, Users, Clock, TrendingUp, Plus } from "lucide-react";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalTutorials: 0,
    totalSteps: 0,
    totalTools: 0,
    avgStepsPerTutorial: 0
  });
  const [recentTutorials, setRecentTutorials] = useState([]);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const tutorials = await Tutorial.list('-created_date');
      const steps = await Step.list();
      const tools = await Tool.list();

      setStats({
        totalTutorials: tutorials.length,
        totalSteps: steps.length,
        totalTools: tools.length,
        avgStepsPerTutorial: tutorials.length > 0 ? Math.round(steps.length / tutorials.length) : 0
      });

      setRecentTutorials(tutorials.slice(0, 5));

      // Create chart data
      const monthlyData = tutorials.reduce((acc, tutorial) => {
        const month = new Date(tutorial.created_date).toLocaleDateString('en', { month: 'short' });
        acc[month] = (acc[month] || 0) + 1;
        return acc;
      }, {});

      setChartData(
        Object.entries(monthlyData).map(([month, count]) => ({
          month,
          tutorials: count
        }))
      );
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color = "blue" }) => (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          </div>
          <div className={`w-12 h-12 bg-${color}-100 rounded-lg flex items-center justify-center`}>
            <Icon className={`w-6 h-6 text-${color}-600`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Monitor your 3D tutorial platform performance</p>
          </div>
          <Link to={createPageUrl("TutorialEditor")}> {/* Link added here */}
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Tutorial
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Tutorials"
            value={stats.totalTutorials}
            icon={FileText}
            color="blue"
          />
          <StatCard
            title="Total Steps"
            value={stats.totalSteps}
            icon={Play}
            color="green"
          />
          <StatCard
            title="Available Tools"
            value={stats.totalTools}
            icon={Users}
            color="purple"
          />
          <StatCard
            title="Avg Steps/Tutorial"
            value={stats.avgStepsPerTutorial}
            icon={TrendingUp}
            color="orange"
          />
        </div>

        {/* Charts and Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Tutorial Creation Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Tutorial Creation Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="tutorials" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Recent Tutorials */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Tutorials</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentTutorials.map((tutorial) => (
                  <Link key={tutorial.id} to={createPageUrl("TutorialEditor", { tutorialId: tutorial.id })} className="block"> {/* Wrapped with Link */}
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-150">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{tutorial.title}</p>
                          <p className="text-sm text-gray-500">{tutorial.part_number}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {tutorial.total_steps || 0} steps
                        </Badge>
                        {/* The play button can remain if it has a separate function, or be removed if the whole card is clickable */}
                        <Button variant="ghost" size="sm" onClick={(e) => { e.preventDefault(); /* handle play action if different from edit */ }}>
                          <Play className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Link>
                ))}

                {recentTutorials.length === 0 && (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No tutorials created yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
