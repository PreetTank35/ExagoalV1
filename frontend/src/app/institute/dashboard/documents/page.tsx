"use client";

import React, { useRef, useState, useEffect } from "react";
import {
  Upload,
  FileText,
  BookOpen,
  Database,
  CheckCircle2,
  Clock,
  Trash2,
  Eye,
  Plus,
  RefreshCw,
  Sparkles,
  Layers,
  FileCode,
  FileSpreadsheet,
  AlertCircle,
  X,
  Search,
  Check,
  Building2,
  Cpu
} from "lucide-react";
import { getApiBaseUrl, safeFetchJson } from "@/lib/api";

interface VectorStatus {
  active: boolean;
  backend: string;
  is_pgvector_active: boolean;
  embedding_model: string;
  dimension: number;
  connection_configured: boolean;
  message: string;
}

interface DocumentItem {
  source_file: string;
  subject: string;
  file_type: string;
  chunk_count: number;
  uploaded_at: string;
  preview: string;
}

interface ChunkItem {
  id?: number;
  chunk_index: number;
  content: string;
  subject: string;
  metadata?: any;
  created_at?: string;
}

interface InstituteSubject {
  subject: string;
  chunks_count: number;
  documents_count: number;
}

const COMMON_SUBJECTS = [
  "Auto-Detect Subject",
  "Mathematics",
  "Physics",
  "Chemistry",
  "Computer Science",
  "Biology",
  "Economics",
  "History",
  "Geography",
  "English Literature",
  "Statistics"
];

const SUBJECT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Mathematics: { bg: "bg-[#DBEAFE]", text: "text-[#1E40AF]", border: "border-[#93C5FD]" },
  Physics: { bg: "bg-[#DCFCE7]", text: "text-[#15803D]", border: "border-[#86EFAC]" },
  Chemistry: { bg: "bg-[#FEF3C7]", text: "text-[#B45309]", border: "border-[#FCD34D]" },
  "Computer Science": { bg: "bg-[#EDE9FE]", text: "text-[#6D28D9]", border: "border-[#DDD6FE]" },
  Biology: { bg: "bg-[#E0F2FE]", text: "text-[#0369A1]", border: "border-[#BAE6FD]" },
  History: { bg: "bg-[#FEE2E2]", text: "text-[#B91C1C]", border: "border-[#FCA5A5]" },
  Economics: { bg: "bg-[#F3E8FF]", text: "text-[#7E22CE]", border: "border-[#E9D5FF]" },
  General: { bg: "bg-[#F1F5F9]", text: "text-[#475569]", border: "border-[#CBD5E1]" }
};

export default function DocumentsPage() {
  const apiBaseUrl = getApiBaseUrl();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tenant / Institute
  const [instituteId, setInstituteId] = useState<string>("default-institute");

  // Data States
  const [docs, setDocs] = useState<DocumentItem[]>([]);
  const [subjects, setSubjects] = useState<InstituteSubject[]>([]);
  const [vectorStatus, setVectorStatus] = useState<VectorStatus | null>(null);
  const [loading, setLoading] = useState(true);

  // Filter & Search
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Upload State
  const [uploadSubject, setUploadSubject] = useState<string>("Auto-Detect Subject");
  const [customSubject, setCustomSubject] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [uploadStage, setUploadStage] = useState<string>("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState<string | null>(null);
  const [uploadErrorMsg, setUploadErrorMsg] = useState<string | null>(null);

  // Chunks Inspection Modal
  const [inspectFile, setInspectFile] = useState<string | null>(null);
  const [chunks, setChunks] = useState<ChunkItem[]>([]);
  const [loadingChunks, setLoadingChunks] = useState(false);

  // Initial fetch
  useEffect(() => {
    fetchDocumentsAndStats();
  }, [instituteId]);

  const fetchDocumentsAndStats = async () => {
    setLoading(true);
    try {
      // 1. Fetch vector status
      const statusRes = await safeFetchJson<VectorStatus>(`${apiBaseUrl}/api/vector/status`);
      if (statusRes.ok && statusRes.data) {
        setVectorStatus(statusRes.data);
      }

      // 2. Fetch institute documents
      const docsRes = await safeFetchJson<DocumentItem[]>(
        `${apiBaseUrl}/api/institute/documents?institute_id=${encodeURIComponent(instituteId)}`
      );
      if (docsRes.ok && Array.isArray(docsRes.data)) {
        setDocs(docsRes.data);
      }

      // 3. Fetch subjects
      const subjRes = await safeFetchJson<InstituteSubject[]>(
        `${apiBaseUrl}/api/institute/subjects?institute_id=${encodeURIComponent(instituteId)}`
      );
      if (subjRes.ok && Array.isArray(subjRes.data)) {
        setSubjects(subjRes.data);
      }
    } catch (err) {
      console.error("Error fetching documents:", err);
    } finally {
      setLoading(false);
    }
  };

  // ── Handle File Upload ─────────────────────────────────────────────────────
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    setUploading(true);
    setUploadErrorMsg(null);
    setUploadSuccessMsg(null);
    setUploadProgress(15);
    setUploadStage("Reading file contents...");

    try {
      const formData = new FormData();
      files.forEach((f) => formData.append("files", f));
      formData.append("institute_id", instituteId);

      const targetSubject =
        uploadSubject === "Auto-Detect Subject"
          ? ""
          : uploadSubject === "Custom..."
          ? customSubject.trim()
          : uploadSubject;

      if (targetSubject) {
        formData.append("subject", targetSubject);
      }

      setUploadProgress(25);
      setUploadStage("Reading document & extracting text...");

      // Dynamic animated progress while backend embeds and saves to pgvector
      const progressTimer = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev < 45) {
            setUploadStage("Parsing document & partitioning curriculum units...");
            return prev + 10;
          } else if (prev < 75) {
            setUploadStage("Generating 384-d semantic vectors with AI model...");
            return prev + 8;
          } else if (prev < 90) {
            setUploadStage("Indexing vectors into Supabase pgvector database...");
            return prev + 3;
          }
          return prev;
        });
      }, 1200);

      let res;
      try {
        res = await safeFetchJson(`${apiBaseUrl}/api/context/upload`, {
          method: "POST",
          body: formData
        });
      } finally {
        clearInterval(progressTimer);
      }

      setUploadProgress(95);
      setUploadStage("Finalizing course materials into institute vault...");

      if (!res.ok) {
        throw new Error(res.error || "Failed to upload and index documents.");
      }

      setUploadProgress(100);
      setUploadSuccessMsg(
        `Successfully indexed ${res.data?.count || files.length} curriculum units into your institute's course vault!`
      );

      // Refresh data
      await fetchDocumentsAndStats();
    } catch (err: any) {
      setUploadErrorMsg(err.message || "An error occurred during document ingestion.");
    } finally {
      setUploading(false);
      if (event.target) event.target.value = "";
      setTimeout(() => {
        setUploadSuccessMsg(null);
        setUploadErrorMsg(null);
        setUploadProgress(0);
        setUploadStage("");
      }, 5000);
    }
  };

  // ── Handle Document Delete ─────────────────────────────────────────────────
  const handleDeleteDoc = async (sourceFile: string) => {
    if (!confirm(`Are you sure you want to delete '${sourceFile}' and its indexed curriculum units?`)) {
      return;
    }

    try {
      const res = await safeFetchJson(
        `${apiBaseUrl}/api/institute/documents?source_file=${encodeURIComponent(
          sourceFile
        )}&institute_id=${encodeURIComponent(instituteId)}`,
        { method: "DELETE" }
      );

      if (!res.ok) {
        throw new Error(res.error || "Failed to delete document.");
      }

      setDocs((current) => current.filter((d) => d.source_file !== sourceFile));
      // Refresh subjects and stats
      fetchDocumentsAndStats();
    } catch (err: any) {
      alert(`Delete error: ${err.message}`);
    }
  };

  // ── Handle Inspect Chunks ──────────────────────────────────────────────────
  const handleInspectChunks = async (sourceFile: string) => {
    setInspectFile(sourceFile);
    setLoadingChunks(true);
    try {
      const res = await safeFetchJson<ChunkItem[]>(
        `${apiBaseUrl}/api/institute/documents/chunks?source_file=${encodeURIComponent(
          sourceFile
        )}&institute_id=${encodeURIComponent(instituteId)}`
      );
      if (res.ok && Array.isArray(res.data)) {
        setChunks(res.data);
      } else {
        setChunks([]);
      }
    } catch (err) {
      console.error("Error inspecting chunks:", err);
      setChunks([]);
    } finally {
      setLoadingChunks(false);
    }
  };

  // Filter docs
  const filteredDocs = docs.filter((doc) => {
    const matchesSubject =
      selectedSubjectFilter === "all" ||
      doc.subject.toLowerCase() === selectedSubjectFilter.toLowerCase();
    const matchesSearch =
      !searchQuery.trim() ||
      doc.source_file.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.subject.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSubject && matchesSearch;
  });

  const totalChunks = docs.reduce((acc, d) => acc + (d.chunk_count || 0), 0);

  const getFormatIcon = (format: string) => {
    const f = format.toLowerCase().replace(".", "");
    if (f === "pdf") return <FileText className="w-5 h-5 text-[#DC2626]" />;
    if (f === "docx" || f === "doc") return <FileText className="w-5 h-5 text-[#2563EB]" />;
    if (f === "pptx" || f === "ppt") return <FileSpreadsheet className="w-5 h-5 text-[#D97706]" />;
    if (f === "json") return <FileCode className="w-5 h-5 text-[#059669]" />;
    return <FileText className="w-5 h-5 text-[#64748B]" />;
  };

  return (
    <div className="space-y-6 text-[#172033] animate-slide-up">
      {/* Header with Multi-Tenant & Knowledge Vault Badges */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-[#102A43] pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#2563EB] bg-[#DBEAFE] px-2.5 py-0.5 border border-[#93C5FD]">
              Course Materials & Syllabus Hub
            </span>
            <span className="text-[11px] font-mono font-semibold text-[#64748B] flex items-center gap-1">
              <Building2 className="w-3 h-3 text-[#2563EB]" />
              Institute ID: <strong className="text-[#172033]">{instituteId}</strong>
            </span>
          </div>

          <h1 className="text-3xl font-serif font-bold text-[#172033] tracking-tight">
            Institute Curriculum & Course Documents
          </h1>
          <p className="text-sm text-[#64748B] mt-1">
            Upload syllabi, textbooks, lecture modules, and previous question papers. All materials are indexed so faculty can generate examinations strictly aligned with your institute&apos;s subjects.
          </p>
        </div>

        {/* Knowledge Vault Status Badge */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchDocumentsAndStats}
            disabled={loading}
            className="px-3 py-2 bg-white border-2 border-[#102A43] shadow-[3px_3px_0_#102A43] hover:bg-[#F8FBFF] neo-btn flex items-center gap-2 text-xs font-bold text-[#172033]"
            title="Refresh repository stats"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#2563EB]" : ""}`} />
            Refresh
          </button>

          <div className="bg-white border-2 border-[#102A43] shadow-[4px_4px_0_#102A43] p-3 flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-[#10B981] animate-pulse" />
            <div className="text-left">
              <div className="text-[10px] font-bold uppercase text-[#64748B] tracking-wider">
                Knowledge Vault
              </div>
              <div className="text-xs font-bold text-[#15803D] flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                Active & Synchronized
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Database Highlights Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="bg-white border-2 border-[#102A43] shadow-[3px_3px_0_#102A43] p-4 flex items-center gap-3 neo-card">
          <div className="w-10 h-10 bg-[#DBEAFE] border border-[#93C5FD] flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 text-[#2563EB]" />
          </div>
          <div>
            <div className="text-2xl font-serif font-bold text-[#172033]">{docs.length}</div>
            <div className="text-[11px] font-semibold text-[#64748B]">Total Documents</div>
          </div>
        </div>

        <div className="bg-white border-2 border-[#102A43] shadow-[3px_3px_0_#102A43] p-4 flex items-center gap-3 neo-card">
          <div className="w-10 h-10 bg-[#DCFCE7] border border-[#86EFAC] flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5 text-[#15803D]" />
          </div>
          <div>
            <div className="text-2xl font-serif font-bold text-[#172033]">{totalChunks}</div>
            <div className="text-[11px] font-semibold text-[#64748B]">Indexed Curriculum Units</div>
          </div>
        </div>

        <div className="bg-white border-2 border-[#102A43] shadow-[3px_3px_0_#102A43] p-4 flex items-center gap-3 neo-card">
          <div className="w-10 h-10 bg-[#FEF3C7] border border-[#FCD34D] flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5 text-[#B45309]" />
          </div>
          <div>
            <div className="text-2xl font-serif font-bold text-[#172033]">{subjects.length}</div>
            <div className="text-[11px] font-semibold text-[#64748B]">Subjects Covered</div>
          </div>
        </div>

        <div className="bg-white border-2 border-[#102A43] shadow-[3px_3px_0_#102A43] p-4 flex items-center gap-3 neo-card">
          <div className="w-10 h-10 bg-[#EDE9FE] border border-[#DDD6FE] flex items-center justify-center shrink-0">
            <Cpu className="w-5 h-5 text-[#6D28D9]" />
          </div>
          <div>
            <div className="text-sm font-bold text-[#172033] truncate">Automated Topic Mapping</div>
            <div className="text-[11px] font-semibold text-[#64748B]">Curriculum Alignment AI</div>
          </div>
        </div>
      </div>

      {/* Upload Notification Alerts */}
      {uploadSuccessMsg && (
        <div className="bg-[#DCFCE7] border-2 border-[#15803D] p-3 shadow-[3px_3px_0_#102A43] flex items-center gap-2 text-sm text-[#15803D] font-bold animate-slide-up">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{uploadSuccessMsg}</span>
        </div>
      )}

      {uploadErrorMsg && (
        <div className="bg-[#FEE2E2] border-2 border-[#B91C1C] p-3 shadow-[3px_3px_0_#102A43] flex items-center gap-2 text-sm text-[#B91C1C] font-bold animate-slide-up">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{uploadErrorMsg}</span>
        </div>
      )}

      {/* Main Content Grid: Left Upload Box & Right Document Library */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Upload Document & Subject Selection */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border-2 border-[#102A43] shadow-[4px_4px_0_#102A43] p-5">
            <div className="flex items-center gap-2 pb-3 mb-4 border-b-2 border-[#102A43]">
              <Upload className="w-5 h-5 text-[#2563EB]" />
              <h2 className="text-base font-serif font-bold text-[#172033]">
                Upload Course Material
              </h2>
            </div>

            {/* Subject Selector */}
            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-xs font-bold text-[#172033] uppercase tracking-wider mb-1">
                  Target Academic Subject
                </label>
                <select
                  value={uploadSubject}
                  onChange={(e) => setUploadSubject(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-[#102A43] bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                >
                  {COMMON_SUBJECTS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                  <option value="Custom...">+ Enter Custom Subject...</option>
                </select>
                <p className="text-[10px] text-[#64748B] mt-1">
                  Tagging the subject ensures teacher searches retrieve only this subject during exam generation.
                </p>
              </div>

              {uploadSubject === "Custom..." && (
                <div>
                  <input
                    type="text"
                    placeholder="e.g. Artificial Intelligence & Robotics"
                    value={customSubject}
                    onChange={(e) => setCustomSubject(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-[#102A43] text-xs font-semibold"
                  />
                </div>
              )}
            </div>

            {/* Drag & Drop Upload Zone */}
            <div
              onClick={() => !uploading && fileInputRef.current?.click()}
              className={`border-2 border-dashed border-[#2563EB] p-6 text-center cursor-pointer transition-all ${
                uploading
                  ? "bg-[#EFF6FF] cursor-not-allowed opacity-75"
                  : "bg-[#F8FBFF] hover:bg-[#EFF6FF] hover:shadow-[3px_3px_0_#2563EB]"
              }`}
            >
              <div className="w-12 h-12 bg-[#DBEAFE] border-2 border-[#2563EB] flex items-center justify-center mx-auto mb-3">
                <Upload className={`w-6 h-6 text-[#2563EB] ${uploading ? "animate-bounce" : ""}`} />
              </div>

              <div className="text-sm font-bold text-[#172033]">
                {uploading ? "Processing Document in Backend..." : "Click or Drop File Here"}
              </div>
              <div className="text-xs text-[#64748B] mt-1">
                Supported: PDF, Word (.docx), PowerPoint (.pptx), Markdown (.md), Text (.txt), JSON
              </div>
              <div className="text-[11px] text-[#2563EB] font-semibold mt-2 underline">
                Browse from your computer
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.pptx,.ppt,.txt,.md,.json,.csv"
              onChange={handleFileUpload}
              className="hidden"
            />

            {/* Upload Progress Bar */}
            {uploading && (
              <div className="mt-4 p-3 bg-[#EFF6FF] border border-[#93C5FD] space-y-2">
                <div className="flex justify-between text-xs font-bold text-[#1E40AF]">
                  <span>{uploadStage}</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-[#DBEAFE] h-2 border border-[#93C5FD] overflow-hidden">
                  <div
                    className="bg-[#2563EB] h-full transition-all duration-300 animate-shimmer"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <div className="text-[10px] text-[#64748B] flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-[#2563EB]" />
                  Embeddings are computed natively in Python on CPU/GPU without external API latency.
                </div>
              </div>
            )}
          </div>

          {/* Subject Breakdown Card */}
          <div className="bg-white border-2 border-[#102A43] shadow-[4px_4px_0_#102A43] p-4">
            <div className="text-xs font-bold uppercase tracking-wider text-[#2563EB] mb-2 flex items-center justify-between">
              <span>Indexed Subjects</span>
              <span>{subjects.length} Total</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {subjects.length === 0 ? (
                <div className="text-xs text-[#64748B] py-2">No documents uploaded yet.</div>
              ) : (
                subjects.map((s) => {
                  const style = SUBJECT_COLORS[s.subject] || SUBJECT_COLORS.General;
                  return (
                    <button
                      key={s.subject}
                      type="button"
                      onClick={() =>
                        setSelectedSubjectFilter(
                          selectedSubjectFilter === s.subject ? "all" : s.subject
                        )
                      }
                      className={`px-2.5 py-1 text-xs font-bold border flex items-center gap-1.5 transition-all ${
                        selectedSubjectFilter === s.subject
                          ? "bg-[#172033] text-white border-[#172033] shadow-[2px_2px_0_#2563EB]"
                          : `${style.bg} ${style.text} ${style.border} hover:opacity-80`
                      }`}
                    >
                      <span>{s.subject}</span>
                      <span className="text-[10px] px-1 bg-white/70 rounded">
                        {s.chunks_count} chunks
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Uploaded Documents Table & Library */}
        <div className="lg:col-span-7 bg-white border-2 border-[#102A43] shadow-[4px_4px_0_#102A43] flex flex-col">
          {/* Table Header & Search */}
          <div className="p-4 border-b-2 border-[#102A43] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.15em] text-[#2563EB] font-bold">
                Institute Documents Library
              </p>
              <h3 className="text-lg font-serif font-bold text-[#172033]">
                {selectedSubjectFilter === "all" ? "All Subjects" : selectedSubjectFilter} ({filteredDocs.length})
              </h3>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#64748B]" />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 border-2 border-[#102A43] text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#2563EB] w-full sm:w-56"
              />
            </div>
          </div>

          {/* Documents Table */}
          <div className="flex-1 overflow-y-auto max-h-[600px] divide-y divide-[#E2E8F0]">
            {filteredDocs.length === 0 ? (
              <div className="p-12 text-center text-[#64748B] space-y-3">
                <FileText className="w-12 h-12 mx-auto text-[#94A3B8] opacity-50" />
                <div className="text-sm font-semibold">No course documents found matching the filter.</div>
                <div className="text-xs text-[#94A3B8]">
                  Upload course syllabi and learning materials from the left panel to populate your curriculum repository.
                </div>
              </div>
            ) : (
              filteredDocs.map((doc, idx) => {
                const subColor = SUBJECT_COLORS[doc.subject] || SUBJECT_COLORS.General;
                return (
                  <div
                    key={`${doc.source_file}-${idx}`}
                    className="p-4 hover:bg-[#F8FBFF] transition-colors flex items-start justify-between gap-3"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="p-2 border border-[#CBD5E1] bg-white shrink-0">
                        {getFormatIcon(doc.file_type || doc.source_file)}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-[#172033] truncate">
                            {doc.source_file}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 border ${subColor.bg} ${subColor.text} ${subColor.border}`}
                          >
                            {doc.subject}
                          </span>
                        </div>

                        <div className="text-xs text-[#64748B] mt-1 line-clamp-2">
                          {doc.preview || "Course material indexed and ready for exam generation."}
                        </div>

                        <div className="flex items-center gap-3 mt-2 text-[11px] text-[#64748B]">
                          <span className="font-semibold text-[#2563EB] flex items-center gap-1">
                            <Layers className="w-3 h-3" />
                            {doc.chunk_count} indexed sections
                          </span>
                          <span>·</span>
                          <span className="uppercase font-semibold">{doc.file_type || "file"}</span>
                          <span>·</span>
                          <span>{doc.uploaded_at}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleInspectChunks(doc.source_file)}
                        className="px-2.5 py-1.5 bg-white border border-[#102A43] shadow-[2px_2px_0_#102A43] hover:bg-[#DBEAFE] text-xs font-bold text-[#2563EB] flex items-center gap-1 neo-btn"
                        title="Preview Document Content"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Preview
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteDoc(doc.source_file)}
                        className="p-1.5 bg-white border border-[#B91C1C] text-[#B91C1C] hover:bg-[#FEE2E2] shadow-[2px_2px_0_#B91C1C] neo-btn"
                        title="Delete Course Document"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Inspect Curriculum Sections Modal */}
      {inspectFile && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border-2 border-[#102A43] shadow-[8px_8px_0_#102A43] w-full max-w-3xl max-h-[85vh] flex flex-col animate-slide-up">
            <div className="p-4 border-b-2 border-[#102A43] flex items-center justify-between bg-[#F8FBFF]">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#2563EB]">
                  Curriculum Content Preview
                </p>
                <h3 className="text-base font-serif font-bold text-[#172033] flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#2563EB]" />
                  {inspectFile}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setInspectFile(null)}
                className="w-8 h-8 border border-[#102A43] bg-white flex items-center justify-center hover:bg-[#FEE2E2]"
              >
                <X className="w-4 h-4 text-[#172033]" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3 flex-1">
              {loadingChunks ? (
                <div className="py-12 text-center text-[#64748B] flex flex-col items-center gap-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-[#2563EB]" />
                  <span>Loading curriculum sections...</span>
                </div>
              ) : chunks.length === 0 ? (
                <div className="py-8 text-center text-[#64748B]">
                  No content sections found for this document.
                </div>
              ) : (
                chunks.map((chk, i) => (
                  <div
                    key={i}
                    className="p-3 border border-[#CBD5E1] bg-[#F8FBFF] space-y-1.5 hover:border-[#2563EB] transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs font-mono font-bold text-[#2563EB]">
                      <span>Section #{chk.chunk_index || i + 1}</span>
                      <span className="text-[10px] px-2 py-0.5 bg-[#DBEAFE] text-[#1E40AF] border border-[#93C5FD]">
                        {chk.subject || "General"}
                      </span>
                    </div>
                    <p className="text-xs text-[#334155] leading-relaxed whitespace-pre-wrap font-sans">
                      {chk.content}
                    </p>
                  </div>
                ))
              )}
            </div>

            <div className="p-3 border-t border-[#CBD5E1] bg-white flex justify-between items-center text-xs text-[#64748B]">
              <span>
                Total <strong>{chunks.length}</strong> curriculum sections indexed and ready for exam generation.
              </span>
              <button
                type="button"
                onClick={() => setInspectFile(null)}
                className="px-4 py-1.5 bg-[#172033] text-white font-bold text-xs hover:bg-[#2563EB]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}