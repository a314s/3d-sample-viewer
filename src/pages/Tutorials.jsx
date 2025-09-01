
import React, { useState, useEffect } from "react";
import { Tutorial } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Search, Play, FileText, Clock } from "lucide-react";

export default function TutorialsPage() {
  const [tutorials, setTutorials] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTutorials();
  }, []);

  const loadTutorials = async () => {
    try {
      const data = await Tutorial.list('-created_date');
      setTutorials(data);
    } catch (error) {
      console.error("Error loading tutorials:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTutorials = tutorials.filter(tutorial =>
    tutorial.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tutorial.part_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">3D Tutorials</h1>
          <p className="text-gray-600">Interactive step-by-step tutorials for complex assemblies</p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search tutorials..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Tutorials Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                <CardHeader>
                  <div className="h-6 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTutorials.map((tutorial) => (
              <Card key={tutorial.id} className="group hover:shadow-lg transition-all duration-200">
                <div className="h-48 bg-gradient-to-br from-blue-50 to-blue-100 rounded-t-lg flex items-center justify-center">
                  <FileText className="w-16 h-16 text-blue-400" />
                </div>
                
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg mb-2">{tutorial.title}</CardTitle>
                      <div className="space-y-1">
                        <Badge variant="secondary" className="text-xs">
                          {tutorial.part_number}
                        </Badge>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Clock className="w-3 h-3" />
                          <span>{tutorial.total_steps || 0} steps</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                    {tutorial.description || "Interactive 3D tutorial with detailed step-by-step instructions."}
                  </p>
                </CardHeader>
                
                <CardContent>
                  <Link to={createPageUrl(`Tutorial?id=${tutorial.id}`)} className="w-full">
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                      <Play className="w-4 h-4 mr-2" />
                      Start Tutorial
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!isLoading && filteredTutorials.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No tutorials found</h3>
            <p className="text-gray-600">
              {searchTerm ? "Try adjusting your search terms" : "Create your first tutorial to get started"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
