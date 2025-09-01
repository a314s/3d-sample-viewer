import React, { useEffect, useState, useMemo } from "react";
import { Tool } from "@/api/entities";
import { UploadFile } from "@/api/uploads";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Save, Plus, Upload, Edit3, X } from "lucide-react";

export default function ToolsManager({ onChanged }) {
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    set_designator: "",
    color: "#3B82F6",
    image_url: "",
  });
  const [editRow, setEditRow] = useState(null);
  const [editForm, setEditForm] = useState(null);

  const sets = useMemo(
    () => Array.from(new Set((tools || []).map(t => (t.set_designator || "").trim()).filter(Boolean))).sort(),
    [tools]
  );

  const loadTools = async () => {
    setLoading(true);
    try {
      const list = await Tool.list();
      setTools(list);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTools();
  }, []);

  const startEdit = (tool) => {
    setEditRow(tool.id);
    setEditForm({
      name: tool.name || "",
      set_designator: tool.set_designator || "",
      color: tool.color || "",
      image_url: tool.image_url || "",
    });
  };

  const cancelEdit = () => {
    setEditRow(null);
    setEditForm(null);
  };

  const saveEdit = async (toolId) => {
    setSaving(true);
    try {
      const payload = {
        name: (editForm.name || "").trim(),
        set_designator: (editForm.set_designator || "").trim() || null,
        color: (editForm.color || "").trim() || null,
        image_url: (editForm.image_url || "").trim() || null,
      };
      await Tool.update(toolId, payload);
      await loadTools();
      onChanged?.();
      cancelEdit();
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = async () => {
    if (!createForm.name.trim()) return;
    setCreating(true);
    try {
      const payload = {
        name: createForm.name.trim(),
        set_designator: (createForm.set_designator || "").trim() || null,
        color: (createForm.color || "").trim() || null,
        image_url: (createForm.image_url || "").trim() || null,
      };
      await Tool.create(payload);
      setCreateForm({ name: "", set_designator: "", color: "#3B82F6", image_url: "" });
      await loadTools();
      onChanged?.();
    } finally {
      setCreating(false);
    }
  };

  const pickImage = async (onUrl) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const { file_url } = await UploadFile({ file });
        onUrl(file_url);
      } catch (e2) {
        console.error("Upload failed", e2);
      } finally {
        input.value = "";
      }
    };
    input.click();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Tools Library</span>
          <div className="flex items-center gap-2">
            {sets.length > 0 && (
              <div className="hidden md:flex items-center gap-1">
                <span className="text-xs text-gray-500">Sets:</span>
                {sets.map(s => (
                  <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                ))}
              </div>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Create form */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
          <div className="md:col-span-2">
            <label className="text-sm font-medium">Name</label>
            <Input
              value={createForm.name}
              onChange={e => setCreateForm({ ...createForm, name: e.target.value })}
              placeholder="e.g., Torque Wrench"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Set Designator</label>
            <Input
              value={createForm.set_designator}
              onChange={e => setCreateForm({ ...createForm, set_designator: e.target.value })}
              placeholder="e.g., A1"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Color</label>
            <Input
              type="color"
              value={createForm.color}
              onChange={e => setCreateForm({ ...createForm, color: e.target.value })}
            />
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => pickImage((url) => setCreateForm({ ...createForm, image_url: url }))}
              title="Upload tool image"
            >
              <Upload className="w-4 h-4 mr-1" />
              Image
            </Button>
            <Button onClick={handleCreate} disabled={creating || !createForm.name.trim()}>
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          </div>
        </div>
        {createForm.image_url ? (
          <div className="text-xs text-gray-500">Image: {createForm.image_url}</div>
        ) : null}

        {/* Tools table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Tool</TableHead>
                <TableHead>Set</TableHead>
                <TableHead>Color</TableHead>
                <TableHead>Image</TableHead>
                <TableHead className="w-36">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-sm text-gray-500">
                    Loading tools...
                  </TableCell>
                </TableRow>
              ) : tools.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-sm text-gray-500">
                    No tools yet. Add your first tool above.
                  </TableCell>
                </TableRow>
              ) : (
                tools.map((t, idx) => {
                  const editing = editRow === t.id;
                  return (
                    <TableRow key={t.id}>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell className="min-w-[200px]">
                        {editing ? (
                          <Input
                            value={editForm?.name || ""}
                            onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                          />
                        ) : (
                          <div className="font-medium text-gray-900">{t.name}</div>
                        )}
                      </TableCell>
                      <TableCell className="min-w-[120px]">
                        {editing ? (
                          <Input
                            value={editForm?.set_designator || ""}
                            onChange={e => setEditForm({ ...editForm, set_designator: e.target.value })}
                            placeholder="e.g., A1"
                          />
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            {(t.set_designator || "").trim() || "-"}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="min-w-[100px]">
                        {editing ? (
                          <Input
                            type="color"
                            value={editForm?.color || "#3B82F6"}
                            onChange={e => setEditForm({ ...editForm, color: e.target.value })}
                          />
                        ) : (
                          <div className="flex items-center gap-2">
                            <div
                              className="w-4 h-4 rounded"
                              style={{ background: t.color || "#3B82F6" }}
                              title={t.color || "#3B82F6"}
                            />
                            <span className="text-xs text-gray-500">{t.color || ""}</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="min-w-[220px]">
                        {editing ? (
                          <div className="flex items-center gap-2">
                            <Input
                              value={editForm?.image_url || ""}
                              onChange={e => setEditForm({ ...editForm, image_url: e.target.value })}
                              placeholder="https://..."
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => pickImage((url) => setEditForm({ ...editForm, image_url: url }))}
                              title="Upload"
                            >
                              <Upload className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : t.image_url ? (
                          <div className="flex items-center gap-2">
                            <img
                              src={t.image_url}
                              alt={t.name}
                              className="w-10 h-10 object-cover rounded border"
                            />
                            <span className="text-xs text-gray-500 truncate max-w-[140px]">{t.image_url}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {editing ? (
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              onClick={() => saveEdit(t.id)}
                              disabled={saving || !editForm?.name?.trim()}
                            >
                              <Save className="w-4 h-4 mr-1" />
                              Save
                            </Button>
                            <Button size="sm" variant="outline" onClick={cancelEdit}>
                              <X className="w-4 h-4 mr-1" />
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => startEdit(t)}>
                            <Edit3 className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}