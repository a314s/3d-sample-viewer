import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Save, X } from "lucide-react";
import { Step } from "@/api/entities";

export default function StepEditorDialog({ open, onOpenChange, tutorialId, step, tools = [], onSaved }) {
  const isEdit = Boolean(step?.id);
  const [form, setForm] = useState({
    step_number: step?.step_number || 1,
    title: step?.title || "",
    sub_step: step?.sub_step || "",
    specific_notes: step?.specific_notes || "",
    video_url: (step?.video_url || "").trim(),
    required_tools: (step?.required_tools || []).map(String),
  });
 
  // Compute available tool set designators (unique, non-empty)
  const setKeys = React.useMemo(
    () => Array.from(new Set((tools || [])
      .map(t => (t.set_designator || "").trim())
      .filter(Boolean)
    )),
    [tools]
  );

  // Track which sets are fully included in required_tools (UX convenience)
  const [selectedSets, setSelectedSets] = useState([]);

  useEffect(() => {
    // Re-evaluate selected sets whenever dialog opens or selection changes
    const req = new Set((form.required_tools || []).map(String));
    const sel = setKeys.filter(setKey => {
      const idsInSet = (tools || [])
        .filter(t => (t.set_designator || "").trim() === setKey)
        .map(t => String(t.id));
      return idsInSet.length > 0 && idsInSet.every(id => req.has(id));
    });
    setSelectedSets(sel);
  }, [open, form.required_tools, tools, setKeys]);
 
  useEffect(() => {
    if (open) {
      setForm({
        step_number: step?.step_number || 1,
        title: step?.title || "",
        sub_step: step?.sub_step || "",
        specific_notes: step?.specific_notes || "",
        video_url: (step?.video_url || "").trim(),
        required_tools: (step?.required_tools || []).map(String),
      });
    }
  }, [open, step]);

  const handleSave = async () => {
    const payload = {
      tutorial_id: tutorialId,
      step_number: Number(form.step_number) || 1,
      title: form.title,
      sub_step: form.sub_step,
      specific_notes: form.specific_notes,
      video_url: (form.video_url || "").trim(),
      required_tools: (form.required_tools || []).map(String),
    };
    if (isEdit) {
      await Step.update(step.id, payload);
    } else {
      await Step.create(payload);
    }
    onSaved?.();
    onOpenChange(false);
  };

  const toggleTool = (toolId, checked) => {
    const id = String(toolId);
    setForm(prev => ({
      ...prev,
      required_tools: checked
        ? Array.from(new Set([...(prev.required_tools || []), id]))
        : (prev.required_tools || []).filter(t => t !== id),
    }));
  };

  // Toggle an entire tool set by set_designator, expanding to tool IDs for persistence
  const toggleSet = (setKey, checked) => {
    const idsInSet = (tools || [])
      .filter(t => (t.set_designator || "").trim() === setKey)
      .map(t => String(t.id));

    setSelectedSets(prev =>
      checked
        ? Array.from(new Set([...(prev || []), setKey]))
        : (prev || []).filter(s => s !== setKey)
    );

    setForm(prev => {
      const current = new Set((prev.required_tools || []).map(String));
      if (checked) {
        idsInSet.forEach(id => current.add(id));
      } else {
        idsInSet.forEach(id => current.delete(id));
      }
      return { ...prev, required_tools: Array.from(current) };
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Step" : "Add Step"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Step Number</label>
              <Input
                type="number"
                value={form.step_number}
                onChange={(e) => setForm({ ...form, step_number: e.target.value })}
                min={1}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Title</label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Step title"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Sub-step</label>
            <Input
              value={form.sub_step}
              onChange={(e) => setForm({ ...form, sub_step: e.target.value })}
              placeholder="Sub-step description"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Video URL</label>
            <Input
              value={form.video_url}
              onChange={(e) => setForm({ ...form, video_url: e.target.value })}
              placeholder="https://youtube.com/watch?v=..."
            />
          </div>

          <div>
            <label className="text-sm font-medium">Specific Notes</label>
            <Textarea
              rows={4}
              value={form.specific_notes}
              onChange={(e) => setForm({ ...form, specific_notes: e.target.value })}
              placeholder="Notes for this step"
            />
          </div>

          {/* Tool Sets (select entire sets at once; expands to tool IDs for storage) */}
          <div>
            <label className="text-sm font-medium mb-2 block">Tool Sets</label>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded p-3">
              {setKeys.length > 0 ? (
                setKeys.map(setKey => (
                  <div key={setKey} className="flex items-center gap-2">
                    <Checkbox
                      id={`set-${setKey}`}
                      checked={(selectedSets || []).includes(setKey)}
                      onCheckedChange={(checked) => toggleSet(setKey, Boolean(checked))}
                    />
                    <label htmlFor={`set-${setKey}`} className="text-sm">
                      Set {setKey}
                    </label>
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-500">No sets defined. Add set designators to tools.</div>
              )}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Required Tools</label>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded p-3">
              {tools.map(tool => (
                <div key={tool.id} className="flex items-center gap-2">
                  <Checkbox
                    id={`tool-${tool.id}`}
                    checked={(form.required_tools || []).includes(String(tool.id))}
                    onCheckedChange={(checked) => toggleTool(tool.id, checked)}
                  />
                  <label htmlFor={`tool-${tool.id}`} className="text-sm">{tool.name}</label>
                </div>
              ))}
              {tools.length === 0 && (
                <div className="text-sm text-gray-500">No tools configured yet.</div>
              )}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="w-4 h-4 mr-1" />
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <Save className="w-4 h-4 mr-1" />
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}