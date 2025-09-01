
import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronRight, Play, FileText, AlertTriangle, Edit, Save, X, Video } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { User } from "@/api/entities";

export default function StepInfo({ 
  isLoading,
  partNumber = "NX - 003790",
  idNumber = "00653678", 
  stepNumber = "001",
  subStep = "",
  specificNotes = "",
  videoUrl = "",
  availableTools = [],
  selectedTools = [],
  onNextStep,
  onUpdateStep,
  currentStep
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    subStep: subStep,
    specificNotes: specificNotes,
    videoUrl: videoUrl,
    selectedTools: selectedTools
  });
  const [user, setUser] = useState(null);

  React.useEffect(() => {
    checkUserRole();
  }, []);

  // Update editData when step changes (but not during editing)
  React.useEffect(() => {
    if (!isEditing) {
      setEditData({
        subStep: subStep,
        specificNotes: specificNotes,
        videoUrl: videoUrl,
        selectedTools: (selectedTools || []).map(id => String(id))
      });
    }
  }, [subStep, specificNotes, videoUrl, selectedTools, isEditing]);

  const checkUserRole = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);
    } catch (error) {
      console.log("User not authenticated");
    }
  };

  const handleReportIssue = () => {
    console.log("Issue reported for step:", stepNumber);
    // Here you would implement issue reporting logic
  };

  const handleSaveEdit = () => {
    onUpdateStep?.({
      ...editData,
      videoUrl: (editData.videoUrl || "").trim(),
      selectedTools: (editData.selectedTools || []).map(id => String(id))
    });
    setIsEditing(false);
  };

  const handleToolSelection = (toolId, isChecked) => {
    const idStr = String(toolId);
    const checked = Boolean(isChecked);
    setEditData(prev => ({
      ...prev,
      selectedTools: checked 
        ? Array.from(new Set([...(prev.selectedTools || []).map(String), idStr]))
        : (prev.selectedTools || []).map(String).filter(id => id !== idStr)
    }));
  };

  const handleEditDialogOpen = (open) => {
    setIsEditing(open);
    if (open) {
      setEditData({
        subStep: subStep,
        specificNotes: specificNotes,
        videoUrl: videoUrl,
        selectedTools: (selectedTools || []).map(id => String(id))
      });
    }
  };

  const getYouTubeEmbedUrl = (url) => {
    const u = (url || "").trim();
    if (!u) return null;
    let videoId = null;
    try {
      const urlObj = new URL(u);
      if (urlObj.hostname === 'www.youtube.com' || urlObj.hostname === 'youtube.com') {
        videoId = urlObj.searchParams.get('v');
      } else if (urlObj.hostname === 'youtu.be') {
        videoId = urlObj.pathname.substring(1);
      }
      return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1` : null;
    } catch {
      return null;
    }
  };

  const isAdmin = user?.role === 'admin';
  // Always use the saved videoUrl (from props) to control the "Watch" button availability
  const currentVideoUrl = (videoUrl || "").trim(); 
  const embedUrl = getYouTubeEmbedUrl(currentVideoUrl);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card className="bg-white border border-gray-200 shadow-sm">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-64" />
              </div>
              <Skeleton className="h-10 w-32" />
            </div>
            <Skeleton className="h-6 w-40" />
          </div>
        </Card>
        <Card className="bg-white border border-gray-200 shadow-sm">
          <div className="p-4 border-b border-gray-100">
             <Skeleton className="h-5 w-32" />
          </div>
          <div className="p-4 space-y-2">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Section */}
      <Card className="bg-white border border-gray-200 shadow-sm">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="text-2xl font-bold text-gray-900">
                Part {partNumber}
              </div>
              <div className="text-sm text-gray-500">
                ID: {idNumber}
              </div>
              <div className="text-sm text-gray-500">
                Step: {stepNumber}
              </div>
              {isAdmin && (
                <Dialog open={isEditing} onOpenChange={handleEditDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="ml-2">
                      <Edit className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Edit Step Details</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 py-4 max-h-96 overflow-y-auto">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Sub Step</label>
                        <Input
                          value={editData.subStep}
                          onChange={(e) => setEditData({...editData, subStep: e.target.value})}
                          placeholder="Enter sub step description"
                        />
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium mb-2 block">Video Tutorial URL</label>
                        <Input
                          value={editData.videoUrl}
                          onChange={(e) => setEditData({...editData, videoUrl: e.target.value})}
                          placeholder="https://youtube.com/watch?v=..."
                        />
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium mb-3 block">Required Tools</label>
                        <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto border rounded-lg p-3">
                          {availableTools.map((tool) => (
                            <div key={tool.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`tool-${tool.id}`}
                                checked={(editData.selectedTools || []).map(String).includes(String(tool.id))}
                                onCheckedChange={(checked) => handleToolSelection(tool.id, checked)}
                              />
                              <label 
                                htmlFor={`tool-${tool.id}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                {tool.name}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium mb-2 block">Specific Notes</label>
                        <Textarea
                          value={editData.specificNotes}
                          onChange={(e) => setEditData({...editData, specificNotes: e.target.value})}
                          placeholder="Enter specific notes"
                          rows={4}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsEditing(false)}>
                        <X className="w-4 h-4 mr-1" />
                        Cancel
                      </Button>
                      <Button onClick={handleSaveEdit}>
                        <Save className="w-4 h-4 mr-1" />
                        Save Changes
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Button 
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 font-semibold"
                onClick={onNextStep}
                disabled={isLoading || !currentStep}
              >
                Next Step
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 font-semibold"
                  >
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Report Issue
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Report Issue</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to report an issue with this step? This will notify the administrators and may pause the tutorial for review.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleReportIssue}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Report Issue
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700">Sub step:</span>
              <span className="text-sm text-gray-900">{subStep}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Notes Section */}
      <Card className="bg-white border border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-semibold text-gray-900">Specific Notes</span>
              <span className="text-red-500 text-sm">*</span>
            </div>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  className={`${
                    currentVideoUrl 
                      ? "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100" 
                      : "bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed"
                  }`}
                  disabled={!currentVideoUrl}
                >
                  <Video className="w-4 h-4 mr-2" />
                  Watch Video Tutorial
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl w-full p-0 bg-black border-0">
                {embedUrl ? (
                  <div className="aspect-video">
                    <iframe
                      width="100%"
                      height="100%"
                      src={embedUrl}
                      title="YouTube video player"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  </div>
                ) : (
                  <div className="p-6 bg-white rounded-lg">
                    <DialogHeader>
                      <DialogTitle>Invalid Video URL</DialogTitle>
                    </DialogHeader>
                    <p className="mt-4">The provided URL could not be embedded. Please ensure it's a valid YouTube link.</p>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <div className="p-4">
          <div className="min-h-24 bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-700">
            {specificNotes || "No specific notes for this step. Please proceed with standard procedures."}
          </div>
        </div>
      </Card>
    </div>
  );
}
