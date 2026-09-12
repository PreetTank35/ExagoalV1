"use client";

import React, { useState, useEffect } from "react";
import {
  Cpu, Brain, FileText, Download, Zap, ChevronRight,
  BarChart3, Clock, CheckCircle2, Sliders, BookOpen,
  ExternalLink, ArrowRight, Sparkles, Image as ImageIcon,
  Edit3, Trash2, ArrowUp, ArrowDown, RefreshCw, AlertCircle,
  FolderOpen, Layers, Presentation, FileCode2, Printer, Plus, X,
  KeyRound, HelpCircle, Check, Eye
} from "lucide-react";
import LatexRenderer from "@/components/shared/LatexRenderer";
import AiEditModal from "@/components/institute/AiEditModal";
import PlotStudioModal from "@/components/institute/PlotStudioModal";
import { getApiBaseUrl, safeFetchJson } from "@/lib/api";

interface ContextStats {
  total_items: number;
  subject_breakdown: Record<string, number>;
  recent_items: Array<{
    id: number;
    type: string;
    subject: string;
    source_file: string;
    content: string;
  }>;
}

interface QuestionItem {
  id: number;
  exam_id: number;
  q_index: number;
  text: string;
  marks: number;
  image_path?: string | null;
  image_spec_json?: string | null;
  created_at?: string;
}

interface ExamItem {
  id: number;
  title: string;
  max_marks: number;
  n_questions: number;
  per_unit_weights_json?: string | null;
  created_at: string;
}

const PIPELINE_STEPS = [
  { step: 1, label: "Exam Setup & Context Retrieval", icon: BookOpen, desc: "Select the subject and syllabus set. Existing context documents are retrieved automatically during exam generation." },
  { step: 2, label: "Blueprint & Weight Constraints", icon: Sliders, desc: "Configure title, target questions, marks total, and unit percentage weightages." },
  { step: 3, label: "AI Question & Plot Generation", icon: Brain, desc: "Single-pass LLM generates LaTeX questions with embedded executable Matplotlib diagrams." },
  { step: 4, label: "Studio Review & AI Refinement", icon: Sparkles, desc: "Inline math editing, teacher-prompt AI rewrites, and Matplotlib visual design stage." },
  { step: 5, label: "Multi-Format Publication", icon: Download, desc: "One-click export to 16:9 PowerPoint (.pptx), print-ready PDF, Word (.docx), and LaTeX (.tex)." },
];

export default function ExamPage() {
  const [activeStep, setActiveStep] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<"workflow" | "history" | "pipeline">("workflow");

  // API Base
  const apiBaseUrl = getApiBaseUrl();

  // Context / Ingestion State
  const [contextStats, setContextStats] = useState<ContextStats | null>(null);
  const [contextLoading, setContextLoading] = useState(false);

  // Tenant / Multi-tenant ID
  const [instituteId, setInstituteId] = useState("default-institute");
  const [instituteSubjects, setInstituteSubjects] = useState<
    Array<{ subject: string; chunks_count: number; documents_count: number }>
  >([]);

  // Subject / Syllabus Selection
  const [selectedSubject, setSelectedSubject] = useState("Mathematics");
  const [selectedSyllabusSet, setSelectedSyllabusSet] = useState("SPPU 2024-25");

  const FALLBACK_SUBJECTS = [
    "Mathematics",
    "Physics",
    "Chemistry",
    "Computer Science",
    "Biology",
    "Economics",
    "History",
    "Geography",
    "Advanced Calculus & Differential Equations",
    "Data Structures & Algorithms",
    "Database Management Systems",
    "Operating Systems"
  ];

  const SYLLABUS_SETS = [
    "SPPU 2024-25",
    "SPPU 2025-26",
    "Institute Syllabus 2025-26",
    "CBSE / University Standard",
  ];

  // Blueprint / Generation State
  const [examTitle, setExamTitle] = useState("Mathematics Examination");
  const [nQuestions, setNQuestions] = useState(4);
  const [maxMarks, setMaxMarks] = useState(100);
  const [unitWeights, setUnitWeights] = useState('{"Unit 1 - Core Concepts": 35, "Unit 2 - Analytical Problems": 35, "Unit 3 - Advanced Theory": 30}');
  const [includeDiagrams, setIncludeDiagrams] = useState(true);
  const [overrideModel, setOverrideModel] = useState("");
  const [overrideApiKey, setOverrideApiKey] = useState("");
  const [generating, setGenerating] = useState(false);
  const [genStatus, setGenStatus] = useState<string | null>(null);
  const [blueprintConfig, setBlueprintConfig] = useState<Record<string, unknown> | null>(null);

  // Workspace / Questions State
  const [currentExam, setCurrentExam] = useState<ExamItem | null>(null);
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [editingQId, setEditingQId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [editMarks, setEditMarks] = useState<number>(10);
  const [inlineSaving, setInlineSaving] = useState(false);

  // Modals
  const [aiModalQuestion, setAiModalQuestion] = useState<QuestionItem | null>(null);
  const [plotStudioQuestion, setPlotStudioQuestion] = useState<QuestionItem | null>(null);
  const [imageZoomPath, setImageZoomPath] = useState<string | null>(null);

  // Export State
  const [exportingFormat, setExportingFormat] = useState<string | null>(null);
  const [exportStatus, setExportStatus] = useState<string | null>(null);

  // History State
  const [pastExams, setPastExams] = useState<ExamItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Load existing context and exam history on page load.
  useEffect(() => {
    fetchContextStats();
    fetchPastExams();
  }, [instituteId]);

  const fetchContextStats = async () => {
    setContextLoading(true);
    try {
      const res = await safeFetchJson<ContextStats>(
        `${apiBaseUrl}/api/context/stats?institute_id=${encodeURIComponent(instituteId)}`
      );
      if (res.ok && res.data) {
        setContextStats(res.data);
      }

      const subjRes = await safeFetchJson<
        Array<{ subject: string; chunks_count: number; documents_count: number }>
      >(
        `${apiBaseUrl}/api/institute/subjects?institute_id=${encodeURIComponent(instituteId)}`
      );
      if (subjRes.ok && Array.isArray(subjRes.data) && subjRes.data.length > 0) {
        setInstituteSubjects(subjRes.data);
        setSelectedSubject(subjRes.data[0].subject);
        setExamTitle(`${subjRes.data[0].subject} Examination`);
      }

      const configRes = await safeFetchJson<{ config: Record<string, unknown> }>(
        `${apiBaseUrl}/api/institute/config?institute_id=${encodeURIComponent(instituteId)}`
      );
      if (configRes.ok && configRes.data?.config) setBlueprintConfig(configRes.data.config);
    } catch (error) {
      console.error("Error fetching context stats:", error);
    } finally {
      setContextLoading(false);
    }
  };

  // ── API: Generate Exam ──────────────────────────────────────────────────
  const handleGenerateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!examTitle.trim()) return;

    setGenerating(true);
    setGenStatus(`Aligning syllabus for '${selectedSubject}' and authoring examination paper (this may take 15–30 seconds)...`);

    try {
      const formData = new FormData();
      formData.append("title", examTitle.trim());
      formData.append("subject", selectedSubject);
      formData.append("institute_id", instituteId);
      formData.append("syllabus_set", selectedSyllabusSet);
      formData.append("n_questions", nQuestions.toString());
      formData.append("max_marks", maxMarks.toString());
      if (unitWeights.trim()) formData.append("per_unit_weights", unitWeights.trim());
      formData.append("include_diagrams", includeDiagrams ? "true" : "false");
      if (blueprintConfig) formData.append("blueprint_config", JSON.stringify(blueprintConfig));
      if (overrideModel.trim()) formData.append("model", overrideModel.trim());
      if (overrideApiKey.trim()) formData.append("api_key", overrideApiKey.trim());

      const res = await safeFetchJson(`${apiBaseUrl}/api/generate`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok || !res.data?.exam) {
        throw new Error(res.error || "Exam generation failed.");
      }

      setCurrentExam(res.data.exam);
      setQuestions(res.data.questions || []);
      setGenStatus(null);
      setActiveStep(3);
      fetchPastExams();
    } catch (err: any) {
      setGenStatus(`Error: ${err.message || "Failed to generate examination."}`);
    } finally {
      setGenerating(false);
    }
  };

  // ── API: Load Past Exams ────────────────────────────────────────────────
  const fetchPastExams = async () => {
    setHistoryLoading(true);
    try {
      const res = await safeFetchJson<ExamItem[]>(`${apiBaseUrl}/api/exams`);
      if (res.ok && res.data) {
        setPastExams(res.data);
      }
    } catch (e) {
      console.error("Error fetching exams history:", e);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleLoadExam = async (examId: number) => {
    try {
      const res = await safeFetchJson(`${apiBaseUrl}/api/exam/${examId}`);
      if (!res.ok || !res.data) throw new Error(res.error || "Failed to load exam.");
      setCurrentExam(res.data.exam);
      setQuestions(res.data.questions);
      setActiveTab("workflow");
      setActiveStep(3);
    } catch (err: any) {
      alert(`Could not load exam: ${err.message}`);
    }
  };

  // ── Inline Question Editing ─────────────────────────────────────────────
  const startInlineEdit = (q: QuestionItem) => {
    setEditingQId(q.id);
    setEditText(q.text);
    setEditMarks(q.marks);
  };

  const cancelInlineEdit = () => {
    setEditingQId(null);
    setEditText("");
  };

  const saveInlineEdit = async (qId: number) => {
    setInlineSaving(true);
    try {
      const formData = new FormData();
      formData.append("question_id", qId.toString());
      formData.append("text", editText);
      formData.append("marks", editMarks.toString());

      const res = await safeFetchJson(`${apiBaseUrl}/api/save_question`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error(res.error || "Failed to save question.");

      setQuestions((prev) =>
        prev.map((q) => (q.id === qId ? { ...q, text: editText, marks: editMarks } : q))
      );
      setEditingQId(null);
    } catch (err: any) {
      alert(`Save failed: ${err.message}`);
    } finally {
      setInlineSaving(false);
    }
  };

  // ── Reorder Questions ───────────────────────────────────────────────────
  const moveQuestion = (index: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= questions.length) return;

    const updated = [...questions];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;

    // Update q_index
    const reindexed = updated.map((q, idx) => ({ ...q, q_index: idx + 1 }));
    setQuestions(reindexed);
  };

  // ── Create New Question ─────────────────────────────────────────────────
  const handleAddNewQuestion = async () => {
    if (!currentExam) return;
    try {
      const formData = new FormData();
      formData.append("exam_id", currentExam.id.toString());
      formData.append("text", "New Question: State and prove the fundamental theorem...");
      formData.append("marks", "10");

      const res = await safeFetchJson(`${apiBaseUrl}/api/question/create`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok || !res.data?.question) throw new Error(res.error || "Failed to add question.");

      setQuestions((prev) => [...prev, res.data.question]);
    } catch (err: any) {
      alert(`Add question failed: ${err.message}`);
    }
  };

  // ── Delete Question ─────────────────────────────────────────────────────
  const handleDeleteQuestion = async (qId: number) => {
    if (!confirm("Are you sure you want to delete this question?")) return;
    try {
      const res = await safeFetchJson(`${apiBaseUrl}/api/question/${qId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(res.error || "Failed to delete question.");

      setQuestions((prev) => prev.filter((q) => q.id !== qId));
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  // ── Remove Image from Question Inline ───────────────────────────────────
  const handleRemoveImageInline = async (qId: number) => {
    try {
      const formData = new FormData();
      formData.append("question_id", qId.toString());

      const res = await safeFetchJson(`${apiBaseUrl}/api/question/remove_image`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error(res.error || "Failed to remove diagram.");

      setQuestions((prev) =>
        prev.map((q) => (q.id === qId ? { ...q, image_path: null, image_spec_json: null } : q))
      );
    } catch (err: any) {
      alert(`Remove image failed: ${err.message}`);
    }
  };

  // ── Export Handler ──────────────────────────────────────────────────────
  const handleExport = async (format: string) => {
    if (!currentExam) return;

    if (format === "print") {
      window.print();
      return;
    }

    setExportingFormat(format);
    setExportStatus(`Compiling and downloading .${format} document...`);

    try {
      const formData = new FormData();
      formData.append("exam_id", currentExam.id.toString());
      formData.append("format", format);

      const res = await fetch(`${apiBaseUrl}/api/export`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        let errMessage = `Export to ${format} failed.`;
        try {
          const text = await res.text();
          const errJson = JSON.parse(text);
          errMessage = errJson.detail || errJson.error || errMessage;
        } catch {}
        throw new Error(errMessage);
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const safeTitle = (currentExam.title || "exam").toLowerCase().replace(/[^a-z0-9_-]/g, "_");
      a.download = `exam_${currentExam.id}_${safeTitle}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      setExportStatus(`Successfully exported .${format}!`);
      setTimeout(() => setExportStatus(null), 4000);
    } catch (err: any) {
      setExportStatus(`Export error: ${err.message}`);
    } finally {
      setExportingFormat(null);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* ── Top Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-slate-900 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black text-slate-950 tracking-tight">ExamGen Studio</span>
            <span className="px-2.5 py-0.5 rounded-none text-[10px] font-bold bg-blue-100 text-blue-700 uppercase tracking-wider">
              Autonomous AI
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Curriculum-grounded question authoring · Publication-ready technical diagrams · Multi-format (.pdf, .docx, .pptx, .tex) exports
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Course Repository status pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white border-2 border-slate-900 rounded-none shadow-[3px_3px_0_0_#0f172a] text-xs font-semibold text-slate-800">
            <span className="w-2 h-2 rounded-none bg-emerald-500 animate-pulse" />
            <span>
              Course Materials:{" "}
              <strong className="text-blue-600">
                {contextStats ? `${contextStats.total_items} Topics Indexed` : "Synchronized"}
              </strong>
            </span>
          </div>

        </div>
      </div>

      {/* ── Main Navigation Bar ────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-slate-900 pb-2">
        {/* Tab Selector */}
        <div className="flex gap-1 bg-slate-100 p-1 border-2 border-slate-900 rounded-none shadow-[3px_3px_0_0_#0f172a]">
          {[
            { key: "workflow", label: "⚡ Exam Workflow Studio" },
            { key: "history", label: `📋 Exam Archive (${pastExams.length})` },
            { key: "pipeline", label: "💡 How It Works" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`px-4 py-2 rounded-none text-xs font-bold transition-all ${
                activeTab === key
                  ? "bg-blue-600 text-white border-2 border-slate-900 shadow-[2px_2px_0_0_#0f172a]"
                  : "text-slate-700 hover:bg-blue-50 hover:text-blue-800"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Workflow Stepper Navigation (visible when activeTab === 'workflow') */}
        {activeTab === "workflow" && (
          <div className="flex items-center gap-1 bg-white border-2 border-slate-900 p-1 rounded-none shadow-[3px_3px_0_0_#0f172a]">
            {[
              { step: 1, label: "1. Exam Setup" },
              { step: 2, label: "2. Blueprint" },
              { step: 3, label: "3. Studio" },
              { step: 4, label: "4. Export" },
            ].map(({ step, label }) => (
              <button
                key={step}
                onClick={() => setActiveStep(step)}
                className={`px-3 py-1.5 rounded-none text-xs font-semibold transition-all ${
                  activeStep === step
                    ? "bg-blue-600 text-white border-2 border-slate-900 shadow-[2px_2px_0_0_#0f172a]"
                    : "text-slate-700 hover:bg-blue-50"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* TAB 1: WORKFLOW STUDIO                                            */}
      {/* ───────────────────────────────────────────────────────────────── */}
      {activeTab === "workflow" && (
        <div>
          {/* STEP 1: EXAM SETUP */}
          {activeStep === 1 && (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Left 3 cols: Subject & Syllabus Selection */}
              <div className="lg:col-span-3 bg-white rounded-none border-2 border-slate-900 p-6 space-y-6 shadow-[4px_4px_0_0_#0f172a]">
                <div>
                  <span className="px-2.5 py-0.5 rounded-none text-[10px] font-bold bg-blue-100 text-blue-700 uppercase">
                    Exam Setup
                  </span>
                  <h3 className="text-lg font-bold text-gray-900 mt-1">Select Subject & Syllabus</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Choose the subject and specific syllabus set to use for this examination.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5 flex items-center justify-between">
                      <span>Subject <span className="text-red-500">*</span></span>
                      {instituteSubjects.length > 0 && (
                        <span className="text-[10px] text-[#2563EB] font-mono">
                          {instituteSubjects.length} subjects in Course Vault
                        </span>
                      )}
                    </label>
                    <select
                      value={selectedSubject}
                      onChange={(e) => {
                        setSelectedSubject(e.target.value);
                        setExamTitle(`${e.target.value} Examination`);
                      }}
                      className="w-full px-4 py-3 border-2 border-slate-900 rounded-none text-sm font-semibold bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                    >
                      {/* 1. Group by Institute Course Vault Uploads */}
                      {instituteSubjects.length > 0 && (
                        <optgroup label="📚 Institute Course Vault">
                          {instituteSubjects.map((s) => (
                            <option key={`inst-${s.subject}`} value={s.subject}>
                              {s.subject} ({s.chunks_count} units, {s.documents_count} docs)
                            </option>
                          ))}
                        </optgroup>
                      )}

                      {/* 2. Standard Academic Subjects */}
                      <optgroup label="🎓 Standard Curriculum Disciplines">
                        {FALLBACK_SUBJECTS.filter(
                          (fs) => !instituteSubjects.some((is) => is.subject.toLowerCase() === fs.toLowerCase())
                        ).map((subject) => (
                          <option key={`std-${subject}`} value={subject}>
                            {subject}
                          </option>
                        ))}
                      </optgroup>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                      Syllabus Set <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedSyllabusSet}
                      onChange={(e) => setSelectedSyllabusSet(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-slate-900 rounded-none text-sm font-semibold bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                    >
                      {SYLLABUS_SETS.map((syllabus) => (
                        <option key={syllabus} value={syllabus}>{syllabus}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Grounded Curriculum Context Indicator */}
                {(() => {
                  const match = instituteSubjects.find(
                    (s) => s.subject.toLowerCase() === selectedSubject.toLowerCase()
                  );
                  const count = match ? match.chunks_count : 0;
                  const docsNum = match ? match.documents_count : 0;

                  return (
                    <div
                      className={`p-4 border-2 rounded-none space-y-2 transition-all ${
                        count > 0
                          ? "bg-[#DCFCE7] border-[#15803D] text-[#15803D] shadow-[3px_3px_0_#15803D]"
                          : "bg-[#EFF6FF] border-[#2563EB] text-[#1E40AF]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold flex items-center gap-1.5">
                          {count > 0 ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 text-[#15803D]" />
                              Institute Syllabus Grounding Active
                            </>
                          ) : (
                            <>
                              <BookOpen className="w-4 h-4 text-[#2563EB]" />
                              Standard Academic Curriculum
                            </>
                          )}
                        </span>
                        <span className="text-[11px] font-mono font-bold">
                          {count > 0 ? `${count} Curriculum Units` : "Standard Coursework"}
                        </span>
                      </div>

                      <p className="text-xs leading-relaxed opacity-90">
                        {count > 0 ? (
                          <>
                            Found <strong>{count} curriculum units</strong> across <strong>{docsNum} uploaded document(s)</strong>. Examination questions will strictly cite and test topics from this course material.
                          </>
                        ) : (
                          <>
                            No documents uploaded yet for <em>&ldquo;{selectedSubject}&rdquo;</em>. Questions will generate from academic domain knowledge. You can upload course materials in the <strong>Course Documents Hub</strong> for tailored results.
                          </>
                        )}
                      </p>
                    </div>
                  );
                })()}

                <div className="flex items-center justify-end pt-2 border-t-2 border-slate-900">
                  <button
                    type="button"
                    onClick={() => setActiveStep(2)}
                    disabled={!selectedSubject || !selectedSyllabusSet}
                    className="flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-none text-xs font-bold shadow-[3px_3px_0_0_#0f172a] transition-all neo-btn"
                  >
                    <span>Continue to Blueprint</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Right 2 cols: Existing Context Status */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-white rounded-none border-2 border-slate-900 p-5 space-y-4 shadow-[4px_4px_0_0_#0f172a]">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                      Context Library
                    </h4>
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-none text-[11px] font-bold">
                      {contextStats ? `${contextStats.total_items} Items Indexed` : "Loading..."}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-gray-500 block mb-1.5">Available Subjects:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {contextStats && Object.keys(contextStats.subject_breakdown).length > 0 ? (
                        Object.entries(contextStats.subject_breakdown).map(([subject, count]) => (
                          <button
                            type="button"
                            key={subject}
                            onClick={() => {
                              setSelectedSubject(subject);
                              setExamTitle(subject);
                            }}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-none text-xs font-semibold border transition-colors ${
                              selectedSubject === subject
                                ? "bg-blue-50 text-blue-700 border-slate-900"
                                : "bg-slate-100 text-gray-800 border-gray-200 hover:border-blue-600"
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-none ${selectedSubject === subject ? "bg-blue-500" : "bg-gray-400"}`} />
                            <span>{subject}</span>
                            <strong className="text-blue-600">({count})</strong>
                          </button>
                        ))
                      ) : (
                        <p className="text-xs text-gray-400 italic">No indexed items yet.</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-slate-900 rounded-none p-5 space-y-2">
                  <div className="flex items-center gap-2 text-blue-800">
                    <BookOpen className="w-4 h-4" />
                    <h4 className="text-sm font-bold">Context is already available</h4>
                  </div>
                  <p className="text-xs text-blue-700 leading-relaxed">
                    Context documents are uploaded and processed from the Context Documents page. Exam Generation uses the indexed knowledge when generating questions.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: EXAM BLUEPRINT CONFIGURATION */}
          {activeStep === 2 && (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Left 3 cols: Form */}
              <div className="lg:col-span-3 bg-white rounded-none border-2 border-slate-900 p-6 space-y-5 shadow-[4px_4px_0_0_#0f172a]">
                <div>
                  <span className="px-2.5 py-0.5 rounded-none text-[10px] font-bold bg-blue-100 text-blue-700 uppercase">
                    Exam Configuration
                  </span>
                  <h3 className="text-lg font-bold text-gray-900 mt-1">Examination Blueprint</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Define the syllabus target, question distribution, marks totals, and visual plot requirements.
                  </p>
                </div>

                <form onSubmit={handleGenerateExam} className="space-y-4">
                  {/* Subject / Title */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                      Subject / Examination Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={examTitle}
                      onChange={(e) => setExamTitle(e.target.value)}
                      placeholder="e.g. Advanced Calculus & Differential Equations"
                      className="w-full px-4 py-2.5 border-2 border-slate-900 rounded-none text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold"
                      required
                    />
                  </div>

                  {/* Questions Count & Total Marks */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                        Number of Questions (1 – 25)
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={25}
                        value={nQuestions}
                        onChange={(e) => setNQuestions(parseInt(e.target.value) || 1)}
                        className="w-full px-4 py-2.5 border-2 border-slate-900 rounded-none text-sm focus:outline-none focus:border-blue-500 font-semibold"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                        Total Marks (10 – 500)
                      </label>
                      <input
                        type="number"
                        min={10}
                        max={500}
                        value={maxMarks}
                        onChange={(e) => setMaxMarks(parseInt(e.target.value) || 10)}
                        className="w-full px-4 py-2.5 border-2 border-slate-900 rounded-none text-sm focus:outline-none focus:border-blue-500 font-semibold"
                        required
                      />
                    </div>
                  </div>

                  {/* Unit / Topic Weights */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                      Unit / Topic Weights (JSON or Syllabus Distribution)
                    </label>
                    <textarea
                      rows={2}
                      value={unitWeights}
                      onChange={(e) => setUnitWeights(e.target.value)}
                      placeholder='{"Calculus & Rates": 35, "Surface Integrals": 35, "Differential Equations": 30}'
                      className="w-full px-4 py-2.5 border-2 border-slate-900 rounded-none text-xs font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Checkbox: Diagrams */}
                  <div className="p-3.5 bg-blue-50 rounded-none border border-slate-900 flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="includeDiagramsCheckbox"
                      checked={includeDiagrams}
                      onChange={(e) => setIncludeDiagrams(e.target.checked)}
                      className="w-4 h-4 mt-0.5 accent-blue-600"
                    />
                    <label htmlFor="includeDiagramsCheckbox" className="text-xs text-gray-700 cursor-pointer">
                      <strong className="text-gray-900 block font-semibold">Generate Technical Diagrams & Visuals</strong>
                      Automatically generates accurate 3D geometry, 2D plots, physics waveforms, and technical figures for questions that require them.
                    </label>
                  </div>

                  {/* Collapsible Overrides */}
                  <details className="group border-2 border-slate-900 rounded-none p-3 text-xs">
                    <summary className="font-bold text-gray-700 cursor-pointer flex items-center justify-between">
                      <span>⚙️ Advanced AI Model & Provider Preferences (Optional)</span>
                      <ChevronRight className="w-4 h-4 group-open:rotate-90 transition-transform text-gray-400" />
                    </summary>
                    <div className="mt-3 space-y-3 pt-3 border-t-2 border-slate-900">
                      <div>
                        <label className="block text-[11px] font-bold text-gray-600 mb-1">
                          Select AI Model
                        </label>
                        <select
                          value={overrideModel}
                          onChange={(e) => setOverrideModel(e.target.value)}
                          className="w-full px-3 py-2 border-2 border-slate-900 rounded-none text-xs font-semibold bg-white"
                        >
                          <option value="">Default: DeepSeek Chat (Recommended & Verified)</option>
                          <option value="deepseek/deepseek-chat">DeepSeek Chat (High Speed & Rigorous Math)</option>
                          <option value="nvidia/nemotron-3-nano-30b-a3b:free">NVIDIA Nemotron 3 Nano (Free Tier)</option>
                          <option value="nvidia/nemotron-3-super-120b-a12b:free">NVIDIA Nemotron 3 Super 120B (Free Tier)</option>
                          <option value="google/gemma-4-31b-it:free">Google Gemma 4 31B (Free Tier)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-600 mb-1 flex items-center justify-between">
                          <span>Custom AI Provider Key (Optional)</span>
                          <span className="text-[10px] text-green-700 font-normal">🟢 System Key Active in Backend</span>
                        </label>
                        <input
                          type="password"
                          value={overrideApiKey}
                          onChange={(e) => setOverrideApiKey(e.target.value.trim())}
                          placeholder="Leave empty to use built-in system key, or paste sk-or-v1-..."
                          className="w-full px-3 py-1.5 border-2 border-slate-900 rounded-none text-xs"
                        />
                        <p className="text-[10px] text-gray-500 mt-1">
                          Leave this field blank to automatically use the pre-configured system key.
                        </p>
                      </div>
                    </div>
                  </details>

                  {/* Status Banner */}
                  {genStatus && (
                    <div
                      className={`p-3.5 border border-slate-900 rounded-none flex items-start gap-2.5 text-xs ${
                        genStatus.toLowerCase().includes("error")
                          ? "bg-red-50 text-red-900 border-red-800"
                          : "bg-blue-50 text-blue-900"
                      }`}
                    >
                      {genStatus.toLowerCase().includes("error") ? (
                        <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                      ) : (
                        <RefreshCw className="w-4 h-4 animate-spin text-blue-600 mt-0.5 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <span className="font-bold block mb-1">
                          {genStatus.toLowerCase().includes("error") ? "Generation Error" : "Processing"}
                        </span>
                        <span className="font-medium whitespace-pre-wrap">{genStatus}</span>
                        {genStatus.includes("401") && (
                          <div className="mt-2 pt-2 border-t border-red-200 text-[11px] text-red-800">
                            💡 <strong>Fix:</strong> Your AI provider key is invalid or expired (<code>401: User not found</code>). Please expand the <strong>&ldquo;Advanced AI Model & Provider Preferences&rdquo;</strong> section above and paste a valid OpenRouter API Key (<code>sk-or-v1-...</code>).
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2 border-t-2 border-slate-900">
                    <button
                      type="button"
                      onClick={() => setActiveStep(1)}
                      className="px-4 py-2 border-2 border-slate-900 rounded-none text-xs font-bold hover:bg-slate-50 transition-colors"
                    >
                      Back: Unit Weights
                    </button>
                    <button
                      type="submit"
                      disabled={generating || !examTitle.trim()}
                      className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-none text-xs font-bold shadow-[4px_4px_0_0_#0f172a] disabled:opacity-50 flex items-center gap-2 transition-colors"
                    >
                      {generating ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Authoring Exam...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Generate Examination
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Right 2 cols: Info & Blueprint Card */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-white rounded-none border-2 border-slate-900 p-5 space-y-3.5 shadow-[4px_4px_0_0_#0f172a]">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    AI Exam Pipeline Guarantee
                  </h4>
                  <div className="space-y-3 text-xs text-gray-600">
                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-none bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">
                        1
                      </div>
                      <p><strong>Syllabus Alignment:</strong> Automatically references your course textbooks, learning targets, and formulas.</p>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-none bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">
                        2
                      </div>
                      <p><strong>Strict Mark Summing:</strong> Guaranteed {maxMarks} total marks distributed accurately across {nQuestions} questions.</p>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-none bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">
                        3
                      </div>
                      <p><strong>Single-Pass Visual Engine:</strong> Scientific plots are rendered in milliseconds via local Python/Matplotlib sandbox.</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-blue-500 rounded-none text-white space-y-2 shadow-[3px_3px_0_0_#0f172a]">
                  <p className="text-xs font-bold text-blue-100">💡 Tip for Institute Faculty</p>
                  <p className="text-[11px] leading-relaxed text-white/90">
                    Once generated, questions can be individually refined using secondary teacher AI, reordered, edited inline with full KaTeX math support, and published to PowerPoint, PDF, Word, and LaTeX.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: QUESTION & PLOT STUDIO (WORKSPACE) */}
          {activeStep === 3 && (
            <div className="space-y-5">
              {/* Workspace Topbar */}
              <div className="bg-white rounded-none border-2 border-slate-900 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-[4px_4px_0_0_#0f172a]">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-lg font-bold text-gray-900 truncate">
                      {currentExam ? currentExam.title : "Exam Paper Workspace"}
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-none text-xs font-bold bg-blue-100 text-blue-700">
                      {questions.reduce((sum, q) => sum + (q.marks || 0), 0)} / {currentExam?.max_marks || maxMarks} Marks
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {questions.length} Questions · KaTeX LaTeX Math · Matplotlib Visualizations
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAddNewQuestion}
                    className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-gray-200 text-gray-800 rounded-none text-xs font-bold transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Question</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveStep(4)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-none text-xs font-bold shadow-[3px_3px_0_0_#0f172a] transition-all"
                  >
                    <span>Proceed to Export</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Questions List or Empty State */}
              {questions.length === 0 ? (
                <div className="bg-white rounded-none border border-dashed border-slate-900 p-12 text-center space-y-3">
                  <div className="w-14 h-14 bg-blue-50 rounded-none flex items-center justify-center text-blue-600 mx-auto shadow-[4px_4px_0_0_#0f172a]">
                    <FileText className="w-7 h-7" />
                  </div>
                  <h4 className="text-base font-bold text-gray-900">No Exam Loaded in Workspace</h4>
                  <p className="text-xs text-gray-500 max-w-md mx-auto">
                    Go to <strong>Step 2 (Blueprint)</strong> to generate an exam, or load a previously generated exam from the <strong>Exam Archive</strong>.
                  </p>
                  <button
                    onClick={() => setActiveStep(2)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-none text-xs font-bold shadow-[3px_3px_0_0_#0f172a] transition-all"
                  >
                    Go to Step 2: Blueprint
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {questions.map((q, idx) => {
                    const isEditing = editingQId === q.id;

                    return (
                      <div
                        key={q.id}
                        className="bg-white rounded-none border-2 border-slate-900 overflow-hidden shadow-[4px_4px_0_0_#0f172a] hover:border-blue-600 transition-all"
                      >
                        {/* Question Header */}
                        <div className="px-5 py-3 bg-blue-50 border-b-2 border-slate-900 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-7 h-7 rounded-none bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-[4px_4px_0_0_#0f172a]">
                              Q{idx + 1}
                            </span>
                            <span className="text-xs font-bold text-gray-700">Question #{idx + 1}</span>
                            <span className="px-2 py-0.5 rounded-none text-[11px] font-bold bg-blue-50 text-blue-700 border border-slate-900">
                              {q.marks} Marks
                            </span>
                          </div>

                          {/* Action Toolbar */}
                          <div className="flex items-center gap-1">
                            {/* Reorder Buttons */}
                            <button
                              type="button"
                              onClick={() => moveQuestion(idx, "up")}
                              disabled={idx === 0}
                              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 rounded-none disabled:opacity-30 transition-colors"
                              title="Move Up"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveQuestion(idx, "down")}
                              disabled={idx === questions.length - 1}
                              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 rounded-none disabled:opacity-30 transition-colors"
                              title="Move Down"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>

                            <div className="w-px h-4 bg-gray-200 mx-1" />

                            {/* Inline Edit Button */}
                            {!isEditing && (
                              <button
                                type="button"
                                onClick={() => startInlineEdit(q)}
                                className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-200/60 rounded-none transition-colors"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>Edit</span>
                              </button>
                            )}

                            {/* AI Refine Button */}
                            <button
                              type="button"
                              onClick={() => setAiModalQuestion(q)}
                              className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded-none transition-colors"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>AI Refine</span>
                            </button>

                            {/* Diagram Studio Button */}
                            <button
                              type="button"
                              onClick={() => setPlotStudioQuestion(q)}
                              className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded-none transition-colors"
                            >
                              <ImageIcon className="w-3.5 h-3.5" />
                              <span>{q.image_path ? "Edit Diagram" : "Add Diagram"}</span>
                            </button>

                            <div className="w-px h-4 bg-gray-200 mx-1" />

                            {/* Delete Question */}
                            <button
                              type="button"
                              onClick={() => handleDeleteQuestion(q.id)}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-none transition-colors"
                              title="Delete Question"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Question Content */}
                        <div className="p-5 space-y-4">
                          {isEditing ? (
                            <div className="space-y-3">
                              <div className="flex items-center gap-3">
                                <div className="flex-1">
                                  <label className="block text-[11px] font-bold uppercase text-gray-400 mb-1">
                                    Question Text (KaTeX LaTeX supported)
                                  </label>
                                  <textarea
                                    rows={4}
                                    value={editText}
                                    onChange={(e) => setEditText(e.target.value)}
                                    className="w-full px-3.5 py-2.5 border-2 border-slate-900 rounded-none text-xs font-mono focus:outline-none focus:border-blue-500"
                                  />
                                </div>
                                <div className="w-28">
                                  <label className="block text-[11px] font-bold uppercase text-gray-400 mb-1">
                                    Marks
                                  </label>
                                  <input
                                    type="number"
                                    min={1}
                                    max={100}
                                    value={editMarks}
                                    onChange={(e) => setEditMarks(parseInt(e.target.value) || 1)}
                                    className="w-full px-3 py-2 border-2 border-slate-900 rounded-none text-xs font-semibold text-center"
                                  />
                                </div>
                              </div>

                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={cancelInlineEdit}
                                  disabled={inlineSaving}
                                  className="px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-slate-100 rounded-none"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={() => saveInlineEdit(q.id)}
                                  disabled={inlineSaving}
                                  className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-none text-xs font-bold"
                                >
                                  {inlineSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                  <span>Save Changes</span>
                                </button>
                              </div>
                            </div>
                          ) : (
                            <LatexRenderer text={q.text} className="text-sm font-medium" />
                          )}

                          {/* Attached Diagram / Plot Section */}
                          {q.image_path && (
                            <div className="p-3 bg-slate-50 rounded-none border-2 border-slate-900 flex flex-col sm:flex-row items-center gap-4">
                              <div
                                onClick={() => setImageZoomPath(q.image_path!)}
                                className="w-36 h-28 bg-white rounded-none border-2 border-slate-900 flex items-center justify-center overflow-hidden cursor-zoom-in group relative flex-shrink-0"
                              >
                                <img
                                  src={q.image_path.startsWith("http") || q.image_path.startsWith("/") ? q.image_path : `/${q.image_path}`}
                                  alt={`Diagram for Q${idx + 1}`}
                                  className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform"
                                />
                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-opacity">
                                  <Eye className="w-4 h-4 mr-1" /> Zoom
                                </div>
                              </div>

                              <div className="flex-1 space-y-1.5 text-xs">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-gray-800">Scientific Visualization Attached</span>
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700">
                                    Matplotlib
                                  </span>
                                </div>
                                <p className="text-gray-500 text-[11px]">
                                  This diagram will be automatically rendered in PDF, PowerPoint (.pptx), and Word documents.
                                </p>
                                <div className="flex items-center gap-2 pt-1">
                                  <button
                                    type="button"
                                    onClick={() => setPlotStudioQuestion(q)}
                                    className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
                                  >
                                    Edit in Plot Studio →
                                  </button>
                                  <span className="text-gray-300">·</span>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveImageInline(q.id)}
                                    className="text-xs text-red-500 hover:text-red-700 font-medium"
                                  >
                                    Remove Diagram
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* STEP 4: EXPORT & PUBLISH */}
          {activeStep === 4 && (
            <div className="space-y-6">
              <div className="bg-white rounded-none border-2 border-slate-900 p-6 shadow-[4px_4px_0_0_#0f172a]">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="px-2.5 py-0.5 rounded-none text-[10px] font-bold bg-blue-100 text-blue-700 uppercase">
                      Publishing Studio
                    </span>
                    <h3 className="text-lg font-bold text-gray-900 mt-1">Export & Distribute Examination</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Download your exam paper in publication formats or print directly for classroom distribution.
                    </p>
                  </div>
                </div>

                {/* Export Status Toast */}
                {exportStatus && (
                  <div className="mb-4 p-3.5 bg-blue-50 border border-slate-900 rounded-none text-xs text-blue-900 flex items-center gap-2">
                    <Download className="w-4 h-4 text-blue-600 animate-bounce" />
                    <span className="font-semibold">{exportStatus}</span>
                  </div>
                )}

                {/* Export Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {/* PPTX Export Card (Featured) */}
                  <div className="border-2 border-slate-900 bg-blue-50 rounded-none p-5 space-y-3.5 flex flex-col justify-between shadow-[4px_4px_0_0_#0f172a] hover:shadow-[5px_5px_0_0_#0f172a] transition-shadow">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="w-10 h-10 rounded-none bg-blue-200 text-blue-900 flex items-center justify-center shadow-[4px_4px_0_0_#0f172a]">
                          <Presentation className="w-5 h-5" />
                        </div>
                        <span className="px-2 py-0.5 bg-blue-200 text-blue-900 rounded text-[10px] font-bold uppercase">
                          16:9 Widescreen
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-gray-900">PowerPoint Deck (.pptx)</h4>
                      <p className="text-xs text-gray-500 leading-relaxed">
                        Publication-quality slides with standard mathematical equations, subject-specific formatting, blueprint tables, embedded diagrams, and examiner marking rubrics.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleExport("pptx")}
                      disabled={exportingFormat !== null || !currentExam}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-none text-xs font-bold shadow-[3px_3px_0_0_#0f172a] transition-all flex items-center justify-center gap-2"
                    >
                      {exportingFormat === "pptx" ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                      <span>Download PowerPoint (.pptx)</span>
                    </button>
                  </div>

                  {/* PDF Export Card */}
                  <div className="border-2 border-slate-900 bg-white rounded-none p-5 space-y-3.5 flex flex-col justify-between shadow-[4px_4px_0_0_#0f172a] hover:shadow-[5px_5px_0_0_#0f172a] transition-shadow">
                    <div className="space-y-2">
                      <div className="w-10 h-10 rounded-none bg-red-50 text-red-600 flex items-center justify-center shadow-[4px_4px_0_0_#0f172a]">
                        <FileText className="w-5 h-5" />
                      </div>
                      <h4 className="text-base font-bold text-gray-900">Adobe PDF Document</h4>
                      <p className="text-xs text-gray-500 leading-relaxed">
                        Publication-ready PDF with university header, formatted question marks, page numbering, and embedded high-res Matplotlib diagrams.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleExport("pdf")}
                      disabled={exportingFormat !== null || !currentExam}
                      className="w-full py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-none text-xs font-bold shadow-[3px_3px_0_0_#0f172a] transition-all flex items-center justify-center gap-2"
                    >
                      {exportingFormat === "pdf" ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                      <span>Download PDF</span>
                    </button>
                  </div>

                  {/* Word DOCX Export Card */}
                  <div className="border-2 border-slate-900 bg-white rounded-none p-5 space-y-3.5 flex flex-col justify-between shadow-[4px_4px_0_0_#0f172a] hover:shadow-[5px_5px_0_0_#0f172a] transition-shadow">
                    <div className="space-y-2">
                      <div className="w-10 h-10 rounded-none bg-blue-100 text-blue-700 flex items-center justify-center shadow-[4px_4px_0_0_#0f172a]">
                        <Layers className="w-5 h-5" />
                      </div>
                      <h4 className="text-base font-bold text-gray-900">Microsoft Word (.docx)</h4>
                      <p className="text-xs text-gray-500 leading-relaxed">
                        Fully editable Word document with clean mathematical formulas, styled tables, instructions, and centered plot figures.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleExport("docx")}
                      disabled={exportingFormat !== null || !currentExam}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-none text-xs font-bold shadow-[3px_3px_0_0_#0f172a] transition-all flex items-center justify-center gap-2"
                    >
                      {exportingFormat === "docx" ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                      <span>Download .DOCX</span>
                    </button>
                  </div>

                  {/* LaTeX Source Export Card */}
                  <div className="border-2 border-slate-900 bg-white rounded-none p-5 space-y-3.5 flex flex-col justify-between shadow-[4px_4px_0_0_#0f172a] hover:shadow-[5px_5px_0_0_#0f172a] transition-shadow">
                    <div className="space-y-2">
                      <div className="w-10 h-10 rounded-none bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-[4px_4px_0_0_#0f172a]">
                        <FileCode2 className="w-5 h-5" />
                      </div>
                      <h4 className="text-base font-bold text-gray-900">LaTeX Source (.tex)</h4>
                      <p className="text-xs text-gray-500 leading-relaxed">
                        Complete LaTeX markup using standard mathematical packages (amsmath, graphicx) ready for Overleaf or local TeX Live.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleExport("tex")}
                      disabled={exportingFormat !== null || !currentExam}
                      className="w-full py-2.5 bg-gray-800 hover:bg-gray-900 disabled:opacity-50 text-white rounded-none text-xs font-bold shadow-[3px_3px_0_0_#0f172a] transition-all flex items-center justify-center gap-2"
                    >
                      {exportingFormat === "tex" ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                      <span>Download .TEX</span>
                    </button>
                  </div>

                  {/* Direct Browser Print Card */}
                  <div className="border-2 border-slate-900 bg-white rounded-none p-5 space-y-3.5 flex flex-col justify-between shadow-[4px_4px_0_0_#0f172a] hover:shadow-[5px_5px_0_0_#0f172a] transition-shadow">
                    <div className="space-y-2">
                      <div className="w-10 h-10 rounded-none bg-blue-100 text-blue-700 flex items-center justify-center shadow-[4px_4px_0_0_#0f172a]">
                        <Printer className="w-5 h-5" />
                      </div>
                      <h4 className="text-base font-bold text-gray-900">Direct Browser Print</h4>
                      <p className="text-xs text-gray-500 leading-relaxed">
                        Print directly to your local physical printer or save as clean paper exam format via browser print preview.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleExport("print")}
                      disabled={!currentExam}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-none text-xs font-bold shadow-[3px_3px_0_0_#0f172a] transition-all flex items-center justify-center gap-2"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print Exam Paper</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-6 border-t-2 border-slate-900 mt-6">
                  <button
                    type="button"
                    onClick={() => setActiveStep(3)}
                    className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-slate-100 rounded-none transition-colors"
                  >
                    ← Back to Question Studio
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* TAB 2: EXAM ARCHIVE & HISTORY                                     */}
      {/* ───────────────────────────────────────────────────────────────── */}
      {activeTab === "history" && (
        <div className="bg-white rounded-none border-2 border-slate-900 overflow-hidden shadow-[4px_4px_0_0_#0f172a]">
          <div className="px-6 py-4 border-b-2 border-slate-900 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-gray-900">Exam Generation Archive</h3>
              <p className="text-xs text-gray-500">Previously generated exams stored in database</p>
            </div>
            <button
              onClick={fetchPastExams}
              className="p-2 text-gray-500 hover:text-gray-800 hover:bg-slate-100 rounded-none transition-colors"
              title="Refresh History"
            >
              <RefreshCw className={`w-4 h-4 ${historyLoading ? "animate-spin" : ""}`} />
            </button>
          </div>

          {pastExams.length === 0 ? (
            <div className="p-12 text-center text-gray-400 space-y-2">
              <FolderOpen className="w-10 h-10 mx-auto text-gray-300" />
              <p className="text-sm font-semibold">No generated exams found</p>
              <p className="text-xs">Exams generated in the workflow will automatically appear here.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {pastExams.map((exam) => (
                <div
                  key={exam.id}
                  className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-blue-50 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <span className="font-bold text-sm text-gray-900">{exam.title}</span>
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-700">
                        {exam.max_marks} Marks
                      </span>
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-gray-600">
                        {exam.n_questions} Questions
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">
                      Generated on {new Date(exam.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleLoadExam(exam.id)}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-none text-xs font-bold shadow-[4px_4px_0_0_#0f172a] transition-colors"
                    >
                      Open in Studio
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* TAB 3: PIPELINE ARCHITECTURE & GUIDE                              */}
      {/* ───────────────────────────────────────────────────────────────── */}
      {activeTab === "pipeline" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-none border-2 border-slate-900 p-6 space-y-6 shadow-[4px_4px_0_0_#0f172a]">
            <div>
              <span className="px-2.5 py-0.5 rounded-none text-[10px] font-bold bg-blue-100 text-blue-700 uppercase">
                Model Architecture
              </span>
              <h3 className="text-lg font-bold text-gray-900 mt-1">Autonomous Exam Generation Pipeline</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                End-to-end overview of data processing, constraint verification, and mathematical rendering.
              </p>
            </div>

            <div className="space-y-4">
              {PIPELINE_STEPS.map(({ step, label, icon: Icon, desc }) => (
                <div key={step} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-none bg-blue-600 text-white flex items-center justify-center flex-shrink-0 font-bold text-xs shadow-[4px_4px_0_0_#0f172a]">
                      {step}
                    </div>
                    {step < PIPELINE_STEPS.length && <div className="w-0.5 h-8 bg-blue-100 mt-1" />}
                  </div>
                  <div className="pt-0.5 pb-2">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="w-4 h-4 text-blue-500" />
                      <p className="text-sm font-bold text-gray-900">{label}</p>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-none border-2 border-slate-900 p-5 space-y-2 shadow-[4px_4px_0_0_#0f172a]">
              <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <Brain className="w-4 h-4 text-blue-600" />
                Intelligent Curriculum Alignment
              </h4>
              <p className="text-xs text-gray-500 leading-relaxed">
                ExaGo indexes your course syllabi, textbooks, and notes into structured learning topics. During examination generation, the system references exact topic objectives, boundary conditions, and theorems to draft questions tailored specifically to your coursework.
              </p>
            </div>

            <div className="bg-white rounded-none border-2 border-slate-900 p-5 space-y-2 shadow-[4px_4px_0_0_#0f172a]">
              <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-blue-600" />
                Automated Diagram & Graph Generator
              </h4>
              <p className="text-xs text-gray-500 leading-relaxed">
                Rather than generic web image searches, diagrams are custom-drawn specifically for each question. 3D surfaces, coordinate curves, circuit diagrams, and scientific waveforms are rendered cleanly directly onto the question paper.
              </p>
            </div>

            <div className="bg-blue-50 border border-slate-900 rounded-none p-4">
              <p className="text-xs text-blue-800 leading-relaxed">
                <strong>Publication Ready:</strong> Generated exams are immediately exportable to 16:9 PowerPoint (.pptx), print-ready PDF via ReportLab, Microsoft Word (.docx), and LaTeX (.tex) for academic archiving.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Modals ─────────────────────────────────────────────────────── */}
      {/* AI Edit Modal */}
      <AiEditModal
        question={aiModalQuestion}
        isOpen={aiModalQuestion !== null}
        onClose={() => setAiModalQuestion(null)}
        onSuccess={(updated) => {
          setQuestions((prev) => prev.map((q) => (q.id === updated.id ? updated : q)));
          setAiModalQuestion(null);
        }}
        modelOverride={overrideModel}
        apiKeyOverride={overrideApiKey}
        apiBaseUrl={apiBaseUrl}
      />

      {/* Plot Studio Modal */}
      <PlotStudioModal
        question={plotStudioQuestion}
        isOpen={plotStudioQuestion !== null}
        onClose={() => setPlotStudioQuestion(null)}
        onSuccess={(updated) => {
          setQuestions((prev) => prev.map((q) => (q.id === updated.id ? updated : q)));
          setPlotStudioQuestion(null);
        }}
        modelOverride={overrideModel}
        apiKeyOverride={overrideApiKey}
        apiBaseUrl={apiBaseUrl}
      />

      {/* Image Zoom Modal */}
      {imageZoomPath && (
        <div
          onClick={() => setImageZoomPath(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm cursor-zoom-out"
        >
          <div className="relative max-w-4xl max-h-[90vh] bg-white rounded-none p-2 shadow-2xl overflow-hidden">
            <button
              onClick={() => setImageZoomPath(null)}
              className="absolute top-4 right-4 p-2 bg-gray-900/60 text-white rounded-none hover:bg-gray-900 transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={imageZoomPath.startsWith("http") || imageZoomPath.startsWith("/") ? imageZoomPath : `/${imageZoomPath}`}
              alt="Diagram Preview"
              className="max-h-[85vh] max-w-full object-contain rounded-none"
            />
          </div>
        </div>
      )}

      {/* ── Hidden Print Container for Browser Printing ────────────────── */}
      <div className="hidden print:block print:p-8 space-y-6">
        <div className="text-center border-b-2 border-black pb-4">
          <h1 className="text-2xl font-black uppercase tracking-wide">{currentExam?.title || examTitle}</h1>
          <div className="flex justify-between text-sm font-bold mt-2">
            <span>Total Marks: {currentExam?.max_marks || maxMarks}</span>
            <span>Duration: 3 Hours</span>
            <span>No. of Questions: {questions.length}</span>
          </div>
        </div>

        <div className="space-y-6">
          {questions.map((q, idx) => (
            <div key={q.id} className="space-y-3 pb-4 border-b border-slate-900">
              <div className="flex justify-between items-start font-bold">
                <span className="text-base">Q{idx + 1}.</span>
                <span className="text-sm">[{q.marks} Marks]</span>
              </div>
              <LatexRenderer text={q.text} className="text-sm leading-relaxed" />
              {q.image_path && (
                <div className="text-center py-2">
                  <img
                    src={q.image_path.startsWith("http") || q.image_path.startsWith("/") ? q.image_path : `/${q.image_path}`}
                    alt={`Plot for Q${idx + 1}`}
                    className="max-h-64 mx-auto object-contain"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
