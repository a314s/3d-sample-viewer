import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload } from "lucide-react";
import { UploadFile } from "@/api/uploads";

export default function ModelSourceField({ value, onChange }) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleFilePick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await UploadFile({ file });
      onChange?.(file_url);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <Label>Model file or URL</Label>
      <div className="flex gap-2">
        <Input
          placeholder="https://example.com/model.glb | .gltf | .obj | .stl"
          value={value || ""}
          onChange={(e) => onChange?.(e.target.value)}
        />
        <Button type="button" variant="secondary" onClick={handleFilePick} disabled={uploading}>
          <Upload className="w-4 h-4 mr-2" />
          {uploading ? "Uploading..." : "Upload"}
        </Button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".glb,.gltf,.obj,.stl"
        className="hidden"
        onChange={handleFileChange}
      />
      <p className="text-xs text-gray-500">
        Supported: glTF/GLB (recommended), OBJ, STL. You can upload a file or paste a direct URL.
      </p>
    </div>
  );
}