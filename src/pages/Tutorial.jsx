
import React, { useState, useEffect, useCallback } from "react";
import { Tutorial as TutorialEntity, Step, Tool } from "@/api/entities";
import ActivityLog from "../components/tutorial/ActivityLog";
import StepInfo from "../components/tutorial/StepInfo";
import ToolKit from "../components/tutorial/ToolKit";
import Verge3DViewports from "../components/tutorial/Verge3DViewports";

export default function TutorialPage() {
  const [currentTutorial, setCurrentTutorial] = useState(null);
  const [currentStep, setCurrentStep] = useState(null);
  const [allSteps, setAllSteps] = useState([]);
  const [stepNumber, setStepNumber] = useState(1);
  const [tools, setTools] = useState([]);
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const addActivity = useCallback((text, type) => {
    const newActivity = {
        text,
        type,
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };
    setActivities(prev => [newActivity, ...prev].slice(0, 20));
  }, []);

  const loadTutorialData = useCallback(async () => {
    setIsLoading(true);
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const tutorialId = urlParams.get('id');

      let tutorial = null;
      if (tutorialId) {
        const found = await TutorialEntity.filter({ id: tutorialId });
        tutorial = (found && found[0]) || null;
      } 
      if (!tutorial) {
        const tutorials = await TutorialEntity.list();
        tutorial = tutorials.length > 0 ? tutorials[0] : null;
      }

      if (tutorial) {
        setCurrentTutorial(tutorial);
        addActivity(`Tutorial '${tutorial.title}' loaded.`, 'system');
        
        let steps = await Step.filter({ tutorial_id: tutorial.id }, 'step_number');
        // Ensure deterministic numeric order (in case backend sorting differs)
        steps = [...steps].sort((a, b) => (a.step_number || 0) - (b.step_number || 0));
        setAllSteps(steps);

        if (steps.length > 0) {
          const firstStep = steps[0]; // After sorting, this is correctly the first step
          setCurrentStep(firstStep);
          setStepNumber(firstStep.step_number);
          addActivity(`Started Step ${firstStep.step_number}: '${firstStep.title}'`, 'info');
        } else {
          setCurrentStep(null);
          setStepNumber(1);
        }
      } else {
        setCurrentTutorial(null);
        setAllSteps([]);
        setCurrentStep(null);
        setStepNumber(1);
        addActivity('No tutorials found to load.', 'warning');
      }
      
      const toolsData = await Tool.list();
      setTools(toolsData);
    } catch (error) {
      console.error("Error loading tutorial data:", error);
      addActivity(`Error loading tutorial data.`, 'warning');
    } finally {
      setIsLoading(false);
    }
  }, [addActivity]);

  useEffect(() => {
    loadTutorialData();
  }, [loadTutorialData]);

  const handleNextStep = () => {
    // Relax overly strict readiness check to avoid false negatives
    if (!currentStep || allSteps.length === 0) {
      addActivity('Could not advance step: steps not loaded.', 'warning');
      return;
    }

    // Ensure allSteps is in numeric order before processing
    const ordered = [...allSteps].sort((a, b) => (a.step_number || 0) - (b.step_number || 0));
    const currentIndex = ordered.findIndex(s => s.id === currentStep.id);
    if (currentIndex === -1) {
      addActivity('Error: Current step not found in tutorial sequence.', 'warning');
      return;
    }

    addActivity(`Completed Step ${currentStep.step_number}: '${currentStep.title}'`, 'complete');

    const nextIndex = (currentIndex + 1) % ordered.length;
    const nextStep = ordered[nextIndex];

    if (nextIndex === 0 && ordered.length > 1) {
      addActivity(`Tutorial complete. Restarting from the beginning.`, 'system');
    }

    // Update allSteps state with the sorted list if it wasn't already sorted
    setAllSteps(ordered);
    setCurrentStep(nextStep);
    setStepNumber(nextStep.step_number);
    addActivity(`Started Step ${nextStep.step_number}: '${nextStep.title}'`, 'info');
  };

  const handleUpdateStep = async (updatedData) => {
    if (!currentStep) return;
    
    addActivity(`Admin saving updates for Step ${stepNumber}...`, 'user');
    try {
      const payload = {
        sub_step: updatedData.subStep,
        specific_notes: updatedData.specificNotes,
        video_url: (updatedData.videoUrl || '').trim(), // Trim whitespace
        // normalize IDs to strings for consistency
        required_tools: (updatedData.selectedTools || []).map(id => String(id)),
      };
      
      await Step.update(currentStep.id, payload);

      // Re-fetch the updated step to avoid stale UI and ensure values reflect DB state
      const refreshedArr = await Step.filter({ id: currentStep.id });
      const refreshedStep = refreshedArr && refreshedArr.length ? refreshedArr[0] : {
        ...currentStep, // Fallback to current state if refetch fails
        ...payload      // Apply changes from payload to fallback
      };

      // Maintain sorted steps list and replace the updated step
      const updatedSteps = [...allSteps]
        .map(s => s.id === refreshedStep.id ? refreshedStep : s)
        .sort((a, b) => (a.step_number || 0) - (b.step_number || 0));

      setAllSteps(updatedSteps);
      setCurrentStep(refreshedStep); // Set current step to the refreshed data

      addActivity(`Successfully updated Step ${refreshedStep.step_number}.`, 'complete');
    } catch (error) {
      console.error("Error updating step:", error);
      addActivity(`Failed to update Step ${stepNumber}.`, 'warning');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="grid grid-cols-12 gap-6 p-6 max-w-[1800px] mx-auto">
        {/* Left Sidebar - Activity Log */}
        <div className="col-span-12 lg:col-span-2">
          <ActivityLog activities={activities} />
        </div>

        {/* Main Content Area */}
        <div className="col-span-12 lg:col-span-10 space-y-6">
          {/* Step Information */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2">
              <StepInfo
                isLoading={isLoading}
                partNumber={currentTutorial?.part_number}
                idNumber={currentTutorial?.id_number}
                stepNumber={currentStep?.step_number?.toString().padStart(3, '0')}
                subStep={currentStep?.sub_step || ""}
                specificNotes={currentStep?.specific_notes || ""}
                videoUrl={(currentStep?.video_url || "").trim()} // Trim here for display
                availableTools={tools}
                selectedTools={(currentStep?.required_tools || []).map(id => String(id))} // Map IDs to strings for consistency
                onNextStep={handleNextStep}
                onUpdateStep={handleUpdateStep}
                currentStep={currentStep}
              />
            </div>
            
            <div>
              <ToolKit 
                isLoading={isLoading}
                tools={tools} 
                selectedTools={(currentStep?.required_tools || []).map(id => String(id))} // Map IDs to strings for consistency
              />
            </div>
          </div>

          {/* Verge3D synchronized viewports (Detail left, Primary right) */}
          <Verge3DViewports
            isLoading={isLoading}
            modelUrl={(currentTutorial?.model_file_url || "").trim()}
          />
        </div>
      </div>
    </div>
  );
}
