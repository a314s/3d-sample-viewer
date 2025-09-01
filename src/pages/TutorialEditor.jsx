
import React, { useEffect, useState, useMemo } from "react";
import { Tutorial, Step, Tool } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit3, Save, FileText, Search } from "lucide-react";
import StepEditorDialog from "@/components/editor/StepEditorDialog";
import ModelSourceField from "@/components/editor/ModelSourceField";
import ToolsManager from "@/components/editor/ToolsManager";

export default function TutorialEditorPage() {
  const [tutorials, setTutorials] = useState([]);
  const [tools, setTools] = useState([]);
  const [selectedTutorial, setSelectedTutorial] = useState(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ title: "", part_number: "", id_number: "", description: "", model_file_url: "" });
  const [steps, setSteps] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStep, setEditingStep] = useState(null);
  const [savingTutorial, setSavingTutorial] = useState(false);

  const filteredTutorials = useMemo(() => {
    if (!search) return tutorials;
    const q = search.toLowerCase();
    return tutorials.filter(t => 
      (t.title || "").toLowerCase().includes(q) ||
      (t.part_number || "").toLowerCase().includes(q)
    );
  }, [tutorials, search]);

  const loadAll = async () => {
    const tuts = await Tutorial.list('-created_date');
    setTutorials(tuts);
    const toolList = await Tool.list();
    setTools(toolList);
    if (!selectedTutorial && tuts.length > 0) {
      handleSelectTutorial(tuts[0]);
    }
  };

  // Refresh tools list and, if a tutorial is selected, refresh its steps (for tool name badges)
  const reloadTools = async () => {
    const toolList = await Tool.list();
    setTools(toolList);
    if (selectedTutorial?.id) {
      await loadSteps(selectedTutorial.id);
    }
  };

  const loadSteps = async (tutorialId) => {
    let data = await Step.filter({ tutorial_id: tutorialId }, 'step_number');
    data = [...data].sort((a, b) => (a.step_number || 0) - (b.step_number || 0));
    setSteps(data);
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectTutorial = async (tut) => {
    setSelectedTutorial(tut);
    setForm({
      title: tut.title || "",
      part_number: tut.part_number || "",
      id_number: tut.id_number || "",
      description: tut.description || "",
      model_file_url: tut.model_file_url || ""
    });
    await loadSteps(tut.id);
  };

  const handleCreateNewTutorial = () => {
    setSelectedTutorial({ id: null });
    setForm({ title: "", part_number: "", id_number: "", description: "", model_file_url: "" });
    setSteps([]);
  };

  const handleSaveTutorial = async () => {
    setSavingTutorial(true);
    try {
      let saved = null;
      const payload = { 
        title: form.title, 
        part_number: form.part_number, 
        id_number: form.id_number, 
        description: form.description,
        model_file_url: form.model_file_url || ""
      };
      if (selectedTutorial?.id) {
        saved = await Tutorial.update(selectedTutorial.id, payload);
      } else {
        saved = await Tutorial.create(payload);
      }
      // refresh list and reselect saved
      const tuts = await Tutorial.list('-created_date');
      setTutorials(tuts);
      const match = tuts.find(t => t.id === saved.id) || saved;
      await handleSelectTutorial(match);
    } finally {
      setSavingTutorial(false);
    }
  };

  const openAddStep = () => {
    setEditingStep(null);
    setDialogOpen(true);
  };

  const openEditStep = (step) => {
    setEditingStep(step);
    setDialogOpen(true);
  };

  const afterSaveStep = async () => {
    if (selectedTutorial?.id) {
      // reload steps and compute accurate count after save
      let data = await Step.filter({ tutorial_id: selectedTutorial.id }, 'step_number');
      const sorted = [...data].sort((a, b) => (a.step_number || 0) - (b.step_number || 0));
      setSteps(sorted);
      await Tutorial.update(selectedTutorial.id, { total_steps: sorted.length });
      const tuts = await Tutorial.list('-created_date');
      setTutorials(tuts);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Tutorials list + Tools library */}
        <div className="lg:col-span-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Tutorials</span>
                <Button size="sm" onClick={handleCreateNewTutorial}>
                  <Plus className="w-4 h-4 mr-1" />
                  New
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative mb-3">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  className="pl-9"
                  placeholder="Search tutorials"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                {filteredTutorials.map(t => (
                  <button
                    key={t.id}
                    onClick={() => handleSelectTutorial(t)}
                    className={`w-full text-left p-3 rounded border ${
                      selectedTutorial?.id === t.id ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <div className="font-medium text-gray-900">{t.title}</div>
                    <div className="text-xs text-gray-500">{t.part_number}</div>
                    <div className="mt-1">
                      <Badge variant="secondary" className="text-xs">{t.total_steps || 0} steps</Badge>
                    </div>
                  </button>
                ))}
                {filteredTutorials.length === 0 && (
                  <div className="text-sm text-gray-500 text-center py-6">
                    No tutorials found.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Tools Library Manager */}
          <ToolsManager onChanged={reloadTools} />
        </div>

        {/* Right: Editor */}
        <div className="lg:col-span-8 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                {selectedTutorial?.id ? "Edit Tutorial" : "New Tutorial"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Title</label>
                  <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium">Part Number</label>
                  <Input value={form.part_number} onChange={(e) => setForm({ ...form, part_number: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium">ID Number</label>
                  <Input value={form.id_number} onChange={(e) => setForm({ ...form, id_number: e.target.value })} />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium">Description</label>
                  <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </div>
                <div className="md:col-span-2">
                  <ModelSourceField
                    value={form.model_file_url}
                    onChange={(url) => setForm({ ...form, model_file_url: url })}
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSaveTutorial} disabled={savingTutorial}>
                  <Save className="w-4 h-4 mr-1" />
                  Save Tutorial
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Steps</span>
                <Button onClick={openAddStep} disabled={!selectedTutorial?.id}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Step
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedTutorial?.id ? (
                steps.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-24">#</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Sub-step</TableHead>
                        <TableHead>Video</TableHead>
                        <TableHead>Tools</TableHead>
                        <TableHead className="w-28">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {steps.map(s => (
                        <TableRow key={s.id}>
                          <TableCell>{String(s.step_number || "").toString().padStart(3, '0')}</TableCell>
                          <TableCell className="font-medium">{s.title}</TableCell>
                          <TableCell>{s.sub_step}</TableCell>
                          <TableCell className="truncate max-w-[200px]">{(s.video_url || "").trim()}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {(s.required_tools || []).map(String).map(toolId => {
                                const tool = tools.find(t => String(t.id) === String(toolId));
                                return <Badge key={toolId} variant="outline" className="text-xs">{tool?.name || `#${toolId}`}</Badge>;
                              })}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm" onClick={() => openEditStep(s)}>
                              <Edit3 className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-sm text-gray-500 py-8 text-center">No steps yet. Click "Add Step" to create one.</div>
                )
              ) : (
                <div className="text-sm text-gray-500 py-8 text-center">Save the tutorial first to add steps.</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <StepEditorDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        tutorialId={selectedTutorial?.id}
        step={editingStep}
        tools={tools}
        onSaved={afterSaveStep}
      />
    </div>
  );
}
