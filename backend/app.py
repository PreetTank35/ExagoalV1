import os
import json
import re
from datetime import datetime
from typing import Optional, List, Dict, Any
from contextlib import asynccontextmanager

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Request
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from sqlmodel import SQLModel, Session, create_engine, select

from models import ContextItem, Exam, Question, InstituteConfig
from vector_store import VectorStore
from pgvector_store import PgVectorStore
from llm_client import call_openrouter
from image_utils import render_plot_from_spec, execute_matplotlib_code, generate_plot_code_from_ai
from latex_utils import create_tex
from pdf_utils import create_pdf
from docx_utils import create_docx
from pptx_utils import create_pptx
from chunker import UniversalChunker, detect_subject, SUBJECT_KEYWORDS

# ── Relational SQL Database (Supabase PostgreSQL / SQLite fallback) ─────────
SQL_DATABASE_URL = (
    os.getenv("SQL_DATABASE_URL")
    or os.getenv("DATABASE_URL")
    or os.getenv("SUPABASE_DB_URL")
    or "sqlite:///./examgen.db"
)

# Normalize postgres:// to postgresql:// if copied directly from Supabase/Heroku URI
if SQL_DATABASE_URL.startswith("postgres://"):
    SQL_DATABASE_URL = SQL_DATABASE_URL.replace("postgres://", "postgresql://", 1)

is_sqlite = SQL_DATABASE_URL.startswith("sqlite")

if is_sqlite:
    engine = create_engine(SQL_DATABASE_URL, connect_args={"check_same_thread": False})
else:
    # PostgreSQL / Supabase connection pooling
    engine = create_engine(
        SQL_DATABASE_URL,
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20,
    )

vector_store: Optional[VectorStore] = None
pgvector_store: Optional[PgVectorStore] = None
EXPORTS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static", "exports")
IMAGES_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static", "images")
os.makedirs(EXPORTS_DIR, exist_ok=True)
os.makedirs(IMAGES_DIR, exist_ok=True)


def init_db():
    SQLModel.metadata.create_all(engine)
    # Automatic migration for existing SQLite database tables if columns are missing
    if is_sqlite:
        import sqlite3
        db_file = SQL_DATABASE_URL.replace("sqlite:///", "")
        if os.path.exists(db_file):
            conn = sqlite3.connect(db_file)
            cursor = conn.cursor()
            try:
                # 1. Migrate contextitem table
                cursor.execute("PRAGMA table_info(contextitem)")
                existing_cols = {col[1] for col in cursor.fetchall()}
                if "subject" not in existing_cols:
                    cursor.execute("ALTER TABLE contextitem ADD COLUMN subject VARCHAR DEFAULT 'General'")
                if "source_file" not in existing_cols:
                    cursor.execute("ALTER TABLE contextitem ADD COLUMN source_file VARCHAR DEFAULT NULL")
                if "institute_id" not in existing_cols:
                    cursor.execute("ALTER TABLE contextitem ADD COLUMN institute_id VARCHAR DEFAULT 'default-institute'")

                # 2. Migrate exam table
                cursor.execute("PRAGMA table_info(exam)")
                existing_exam_cols = {col[1] for col in cursor.fetchall()}
                if "institute_id" not in existing_exam_cols:
                    cursor.execute("ALTER TABLE exam ADD COLUMN institute_id VARCHAR DEFAULT 'default-institute'")
                if "subject" not in existing_exam_cols:
                    cursor.execute("ALTER TABLE exam ADD COLUMN subject VARCHAR DEFAULT 'General'")

                conn.commit()
            except Exception as e:
                print(f"[DB Migration Warning] {e}")
            finally:
                conn.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    global vector_store, pgvector_store
    init_db()
    vector_store = VectorStore()
    # Do not download/load the embedding model during API startup. Both stores
    # initialize it lazily on the first upload or semantic query.
    pgvector_store = PgVectorStore()

    # Preload existing context items into local VectorStore only if pgvector is inactive and using SQLite
    if not pgvector_store.is_pgvector_active and is_sqlite:
        with Session(engine) as session:
            items = session.exec(select(ContextItem)).all()
            if items:
                preload_legacy = []
                for item in items:
                    subj = item.subject or detect_subject(item.content)
                    src = item.source_file or "context.json"
                    preload_legacy.append({
                        "id": item.id,
                        "content": item.content,
                        "subject": subj,
                        "source_file": src
                    })
                vector_store.add(preload_legacy)
    yield


# Trigger reload with updated Supabase environment
app = FastAPI(title="ExamGen Studio", lifespan=lifespan)

DEFAULT_INSTITUTE_CONFIG: Dict[str, Any] = {
    "profile": "standard",
    "difficulty": {"easy": 30, "medium": 50, "hard": 20},
    "bloom_levels": ["remember", "understand", "apply", "analyze"],
    "question_types": {"subjective": 60, "numerical": 25, "mcq": 15},
    "co_mapping": True,
    "po_mapping": True,
    "cross_disciplinary": True,
    "formative_mode": False,
    "no_duplicate_topics": True,
    "balanced_marks": True,
    "require_diagram": False,
    "min_hard_questions": 1,
    "time_minutes": 180,
    "max_diagrams": 3,
    "temperature": 0.7,
    "top_p": 0.9,
    "max_tokens": 4000,
}

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static and frontend assets
if os.path.exists(os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")):
    app.mount("/static", StaticFiles(directory=os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")), name="static")
if os.path.exists(os.path.join(os.path.dirname(os.path.abspath(__file__)), "frontend")):
    app.mount("/frontend", StaticFiles(directory=os.path.join(os.path.dirname(os.path.abspath(__file__)), "frontend")), name="frontend")


@app.get("/")
async def root():
    index_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), "frontend", "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    return {"status": "ok", "service": "ExamGen Studio Backend"}


@app.get("/api/database/status")
async def get_database_status():
    """
    Returns the operational status of the SQL Relational Database (Supabase / SQLite)
    and the Vector Database (pgvector / local FAISS), confirming their clean separation.
    """
    sql_backend = "PostgreSQL (Supabase)" if not is_sqlite else "SQLite (Local Dev)"
    sql_connected = True
    exam_count = 0
    question_count = 0
    try:
        with Session(engine) as session:
            exam_count = len(session.exec(select(Exam)).all())
            question_count = len(session.exec(select(Question)).all())
    except Exception as e:
        sql_connected = False
        sql_backend = f"Error: {str(e)}"

    vector_info = pgvector_store.get_vector_status() if pgvector_store else {
        "is_pgvector_active": False,
        "backend": "none",
        "total_chunks": 0
    }

    return {
        "sql_database": {
            "type": "relational_sql",
            "backend": sql_backend,
            "connected": sql_connected,
            "total_exams": exam_count,
            "total_questions": question_count,
            "managed_tables": ["exam", "question", "contextitem"]
        },
        "vector_database": {
            "type": "vector_semantic",
            "backend": vector_info.get("backend", "local-faiss"),
            "is_pgvector_active": vector_info.get("is_pgvector_active", False),
            "total_chunks": vector_info.get("total_chunks", 0),
            "managed_table": "institute_document_chunks"
        }
    }


@app.get("/api/institute/config")
async def get_institute_config(institute_id: str = "default-institute"):
    with Session(engine) as session:
        record = session.exec(
            select(InstituteConfig).where(InstituteConfig.institute_id == institute_id)
        ).first()
        config = dict(DEFAULT_INSTITUTE_CONFIG)
        if record:
            try:
                stored = json.loads(record.config_json)
                config.update(stored if isinstance(stored, dict) else {})
            except json.JSONDecodeError:
                pass
        return {"institute_id": institute_id, "config": config}


@app.put("/api/institute/config")
async def save_institute_config(payload: Dict[str, Any], institute_id: str = "default-institute"):
    incoming = payload.get("config", payload)
    if not isinstance(incoming, dict):
        raise HTTPException(status_code=400, detail="config must be a JSON object")
    config = dict(DEFAULT_INSTITUTE_CONFIG)
    config.update(incoming)
    with Session(engine) as session:
        record = session.exec(
            select(InstituteConfig).where(InstituteConfig.institute_id == institute_id)
        ).first()
        if record:
            record.config_json = json.dumps(config)
            record.updated_at = datetime.utcnow()
        else:
            record = InstituteConfig(
                institute_id=institute_id,
                config_json=json.dumps(config),
            )
        session.add(record)
        session.commit()
    return {"status": "success", "institute_id": institute_id, "config": config}


@app.get("/api/exams")
async def get_exams(
    institute_id: Optional[str] = None,
    subject: Optional[str] = None
):
    """Returns list of recently generated exams from the relational SQL database."""
    with Session(engine) as session:
        query = select(Exam).order_by(Exam.created_at.desc())
        if institute_id:
            query = query.where(Exam.institute_id == institute_id)
        if subject and subject != "All":
            query = query.where(Exam.subject == subject)
        exams = session.exec(query).all()
        result = []
        for e in exams:
            q_count = len(session.exec(select(Question).where(Question.exam_id == e.id)).all())
            result.append({
                "id": e.id,
                "title": e.title,
                "institute_id": getattr(e, "institute_id", "default-institute"),
                "subject": getattr(e, "subject", "General"),
                "max_marks": e.max_marks,
                "n_questions": e.n_questions or q_count,
                "per_unit_weights_json": e.per_unit_weights_json,
                "created_at": e.created_at.isoformat() if hasattr(e.created_at, "isoformat") else str(e.created_at)
            })
        return result


@app.get("/api/exam/{exam_id}")
async def get_exam(exam_id: int):
    """Loads a specific exam and all its questions."""
    with Session(engine) as session:
        exam = session.get(Exam, exam_id)
        if not exam:
            raise HTTPException(status_code=404, detail="Exam not found")
        questions = session.exec(
            select(Question).where(Question.exam_id == exam_id).order_by(Question.q_index)
        ).all()
        return {
            "exam": {
                "id": exam.id,
                "title": exam.title,
                "max_marks": exam.max_marks,
                "n_questions": exam.n_questions,
                "per_unit_weights_json": exam.per_unit_weights_json,
                "created_at": exam.created_at.isoformat() if hasattr(exam.created_at, "isoformat") else str(exam.created_at)
            },
            "questions": [
                {
                    "id": q.id,
                    "exam_id": q.exam_id,
                    "q_index": q.q_index,
                    "text": q.text,
                    "marks": q.marks,
                    "image_path": q.image_path,
                    "image_spec_json": q.image_spec_json,
                    "created_at": q.created_at.isoformat() if hasattr(q.created_at, "isoformat") else str(q.created_at)
                }
                for q in questions
            ]
        }


@app.get("/sample_context.json")
@app.get("/api/context/sample")
async def get_sample_context():
    """Serves the pre-configured sample context JSON."""
    sample_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), "sample_context.json")
    if os.path.exists(sample_file):
        return FileResponse(sample_file, media_type="application/json")
    # Fallback inline sample
    return JSONResponse([
        {
            "type": "course_objective",
            "topic": "Calculus & Differential Equations",
            "content": "Students must understand directional derivatives, gradient vectors, and 3D surface rates of change for multivariable functions u(x,y)."
        },
        {
            "type": "problem_solution",
            "topic": "Damped Harmonic Oscillation",
            "content": "For an underdamped oscillator, the displacement is x(t) = A exp(-gamma*t) cos(omega*t + phi)."
        }
    ])


@app.get("/api/context/stats")
async def get_context_stats(institute_id: str = "default-institute"):
    """Returns the count of indexed items, subject breakdown, and recent items for an institute."""
    if pgvector_store:
        stats = pgvector_store.get_institute_stats(institute_id)
        if stats.get("total_items", 0) > 0:
            return stats

    with Session(engine) as session:
        items = session.exec(
            select(ContextItem).where(ContextItem.institute_id == institute_id)
        ).all()
        # Filter for institute if set
        filtered = [it for it in items if getattr(it, "institute_id", "default-institute") in (institute_id, "default-institute")]
        subject_counts: Dict[str, int] = {}
        for item in filtered:
            subj = item.subject or "General"
            subject_counts[subj] = subject_counts.get(subj, 0) + 1
        recent = [
            {
                "id": item.id,
                "type": item.item_type,
                "subject": item.subject or "General",
                "source_file": item.source_file or "",
                "content": item.content[:150] + ("..." if len(item.content) > 150 else "")
            }
            for item in filtered[-8:]
        ]
        return {
            "status": "success",
            "backend": "local-hybrid",
            "total_items": len(filtered),
            "subject_breakdown": subject_counts,
            "recent_items": recent
        }


@app.get("/api/institute/subjects")
async def get_institute_subjects(institute_id: str = "default-institute"):
    """Returns all subjects indexed for an institute with chunk counts and document counts."""
    if pgvector_store:
        subjects = pgvector_store.get_institute_subjects(institute_id)
        if subjects:
            return subjects

    # Fallback to database query
    with Session(engine) as session:
        items = session.exec(
            select(ContextItem).where(ContextItem.institute_id == institute_id)
        ).all()
        subj_map = {}
        for it in items:
            s = it.subject or "General"
            f = it.source_file or "document"
            if s not in subj_map:
                subj_map[s] = {"chunks": 0, "files": set()}
            subj_map[s]["chunks"] += 1
            subj_map[s]["files"].add(f)

        return [
            {
                "subject": s,
                "chunks_count": data["chunks"],
                "documents_count": len(data["files"])
            }
            for s, data in sorted(subj_map.items(), key=lambda x: x[1]["chunks"], reverse=True)
        ]


@app.get("/api/vector/status")
async def get_vector_status():
    """Returns vector database status, health, active backend and embedding model."""
    if pgvector_store:
        return pgvector_store.get_vector_status()
    return {
        "active": False,
        "backend": "none",
        "message": "Vector store not initialized"
    }


@app.get("/api/institute/documents")
async def get_institute_documents(institute_id: str = "default-institute"):
    """Lists unique uploaded documents for an institute with chunk stats and previews."""
    if pgvector_store:
        docs = pgvector_store.get_institute_documents(institute_id)
        if docs:
            return docs

    # Fallback to SQLite query
    with Session(engine) as session:
        items = session.exec(
            select(ContextItem).where(ContextItem.institute_id == institute_id)
        ).all()
        doc_map: Dict[str, Dict[str, Any]] = {}
        for it in items:
            sf = it.source_file or "document.txt"
            if sf not in doc_map:
                doc_map[sf] = {
                    "source_file": sf,
                    "subject": it.subject or "General",
                    "file_type": sf.split(".")[-1] if "." in sf else "text",
                    "chunk_count": 0,
                    "uploaded_at": str(it.created_at) if hasattr(it, "created_at") else "Recently",
                    "preview": it.content[:200]
                }
            doc_map[sf]["chunk_count"] += 1
        return list(doc_map.values())


@app.get("/api/institute/documents/chunks")
async def get_document_chunks(
    source_file: str,
    institute_id: str = "default-institute"
):
    """Fetches all parsed semantic chunks for a given file and institute for UI inspection."""
    if pgvector_store:
        chunks = pgvector_store.get_document_chunks(institute_id, source_file)
        if chunks:
            return chunks

    with Session(engine) as session:
        items = session.exec(
            select(ContextItem).where(
                ContextItem.institute_id == institute_id,
                ContextItem.source_file == source_file
            )
        ).all()
        return [
            {
                "id": it.id,
                "chunk_index": idx + 1,
                "content": it.content,
                "subject": it.subject or "General",
                "metadata": json.loads(it.metadata_json) if it.metadata_json else {}
            }
            for idx, it in enumerate(items)
        ]


@app.get("/api/institute/subjects")
async def get_institute_subjects(institute_id: str = "default-institute"):
    """Returns all subjects indexed for an institute with chunk and document counts."""
    if pgvector_store:
        subjects = pgvector_store.get_institute_subjects(institute_id)
        if subjects:
            return subjects

    with Session(engine) as session:
        items = session.exec(
            select(ContextItem).where(ContextItem.institute_id == institute_id)
        ).all()
        subj_map: Dict[str, Dict[str, Any]] = {}
        for it in items:
            s = it.subject or "General"
            f = it.source_file or ""
            if s not in subj_map:
                subj_map[s] = {"chunks": 0, "files": set()}
            subj_map[s]["chunks"] += 1
            if f:
                subj_map[s]["files"].add(f)
        return [
            {
                "subject": s,
                "chunks_count": data["chunks"],
                "documents_count": len(data["files"])
            }
            for s, data in sorted(subj_map.items(), key=lambda x: x[1]["chunks"], reverse=True)
        ]


@app.delete("/api/institute/documents")
async def delete_institute_document(
    source_file: str,
    institute_id: str = "default-institute"
):
    """Deletes all chunks belonging to a document from both pgvector and SQLite."""
    deleted_vector = 0
    if pgvector_store:
        deleted_vector = pgvector_store.delete_document(institute_id, source_file)

    deleted_db = 0
    with Session(engine) as session:
        items = session.exec(
            select(ContextItem).where(
                ContextItem.institute_id == institute_id,
                ContextItem.source_file == source_file
            )
        ).all()
        for it in items:
            session.delete(it)
            deleted_db += 1
        session.commit()

    return {
        "status": "success",
        "message": f"Successfully deleted '{source_file}' and all its semantic chunks.",
        "deleted_vector_chunks": deleted_vector,
        "deleted_db_items": deleted_db
    }


# ── Subject Classifier ──────────────────────────────────────────────────────
# Fast rule-based keyword detector covering 12+ academic disciplines at
# primary, secondary, and university levels.  Zero LLM cost.
_SUBJECT_KEYWORDS: Dict[str, List[str]] = {
    "Mathematics": [
        "calculus", "algebra", "geometry", "trigonometry", "matrix", "determinant",
        "integral", "derivative", "equation", "theorem", "proof", "polynomial",
        "vector", "linear", "differential", "series", "sequence", "logarithm",
        "arithmetic", "quadratic", "binomial", "permutation", "combination",
        "coordinate", "gradient", "divergence", "curl", "laplace", "fourier",
        "eigenvalue", "eigenvector", "set theory", "number theory", "topology",
        "modular", "probability", "statistics", "bayes",
    ],
    "Physics": [
        "force", "velocity", "acceleration", "momentum", "energy", "power",
        "wave", "optics", "lens", "mirror", "thermodynamics", "quantum",
        "newton", "electric", "magnetic", "circuit", "oscillation", "relativity",
        "gravitational", "nuclear", "radioactive", "photon", "electron", "proton",
        "capacitor", "resistor", "inductor", "semiconductor", "electrostatics",
        "current", "voltage", "resistance", "refraction", "diffraction", "interference",
        "projectile", "friction", "torque", "angular momentum", "entropy",
    ],
    "Biology": [
        "cell", "organism", "dna", "rna", "protein", "evolution", "ecology",
        "anatomy", "photosynthesis", "mitosis", "meiosis", "gene", "chromosome",
        "neuron", "enzyme", "bacteria", "virus", "tissue", "organ", "respiration",
        "metabolism", "hormone", "immune", "genetics", "heredity", "mutation",
        "biome", "ecosystem", "food chain", "nervous system", "endocrine",
        "cardiovascular", "digestion", "osmosis", "diffusion", "taxonomy",
    ],
    "Chemistry": [
        "atom", "molecule", "reaction", "bond", "acid", "base", "salt",
        "orbital", "periodic", "titration", "oxidation", "reduction", "polymer",
        "hydrocarbon", "electrolysis", "catalyst", "valence", "mole", "stoichiometry",
        "enthalpy", "entropy", "equilibrium", "ph", "isomer", "functional group",
        "organic", "inorganic", "spectroscopy", "chromatography", "thermochemistry",
    ],
    "Computer Science": [
        "algorithm", "data structure", "programming", "database", "network",
        "operating system", "compiler", "recursion", "sorting", "binary tree",
        "complexity", "machine learning", "artificial intelligence", "neural network",
        "software", "hardware", "internet", "encryption", "stack", "queue",
        "linked list", "graph traversal", "dynamic programming", "cpu", "memory",
        "tcp", "http", "sql", "object oriented", "class", "inheritance",
    ],
    "Statistics": [
        "probability", "distribution", "regression", "hypothesis", "variance",
        "mean", "median", "standard deviation", "sampling", "confidence interval",
        "t-test", "chi-square", "anova", "correlation", "normal distribution",
        "poisson", "binomial distribution", "random variable", "expected value",
    ],
    "Economics": [
        "market", "supply", "demand", "inflation", "gdp", "trade", "fiscal",
        "monetary", "elasticity", "microeconomics", "macroeconomics", "utility",
        "marginal", "budget", "equilibrium price", "consumer surplus",
        "monopoly", "oligopoly", "gdp", "recession", "investment", "capital",
    ],
    "History": [
        "civilization", "war", "revolution", "empire", "dynasty", "colonialism",
        "independence", "ancient", "medieval", "modern", "world war", "treaty",
        "monarch", "republic", "democracy", "feudal", "renaissance", "reformation",
        "imperialism", "nationalism", "cold war", "constitution",
    ],
    "Geography": [
        "climate", "topography", "map", "continent", "latitude", "longitude",
        "erosion", "river", "population", "migration", "earthquake", "volcano",
        "biome", "ocean", "atmosphere", "weathering", "landform", "plateau",
        "delta", "watershed", "urbanization", "demographic",
    ],
    "Literature": [
        "novel", "poem", "character", "theme", "metaphor", "prose", "narrative",
        "author", "literary", "symbolism", "allegory", "sonnet", "drama",
        "plot", "protagonist", "antagonist", "genre", "fiction", "non-fiction",
        "stanza", "rhyme", "imagery", "tone", "satire", "tragedy", "comedy",
    ],
    "Science": [
        "experiment", "hypothesis", "observation", "conclusion", "data",
        "scientific method", "measurement", "natural", "environment",
    ],
    "Primary": [
        "addition", "subtraction", "multiplication", "division", "fraction",
        "counting", "shapes", "alphabet", "vowel", "sentence", "paragraph",
        "animals", "plants", "community", "family", "seasons",
    ],
}


def _detect_subject(combined_text: str) -> str:
    """
    Classifies *combined_text* (topic + content) into an academic subject.
    Uses a keyword scoring approach: the subject whose keywords appear most
    frequently in the text wins.  Falls back to 'General' if no match.
    """
    lower = combined_text.lower()
    scores: Dict[str, int] = {}
    for subject, keywords in _SUBJECT_KEYWORDS.items():
        scores[subject] = sum(1 for kw in keywords if kw in lower)
    best_subject = max(scores, key=lambda s: scores[s])
    return best_subject if scores[best_subject] > 0 else "General"


@app.post("/api/context/upload")
async def upload_context(
    files: List[UploadFile] = File(...),
    institute_id: str = Form("default-institute"),
    subject: Optional[str] = Form(None)
):
    """
    Accepts one OR MORE files in ANY format (PDF, Word DOCX, PowerPoint PPTX,
    Plain Text, Markdown, or JSON syllabi / question banks).
    Extracts text, applies universal semantic chunking with subject classification,
    and indexes into the institute-isolated pgvector database partition.
    """
    total_saved: List[Dict] = []
    per_file_results: List[Dict] = []
    all_for_legacy: List[Dict] = []

    for upload_file in files:
        filename = upload_file.filename or "document.txt"
        ext = os.path.splitext(filename)[1].lstrip(".") or "text"
        try:
            content_bytes = await upload_file.read()
            extracted_items = UniversalChunker.parse_and_chunk_file(
                file_bytes=content_bytes,
                filename=filename,
                fallback_subject=subject
            )
        except Exception as e:
            per_file_results.append({
                "file": filename,
                "error": f"Extraction error: {str(e)}",
                "count": 0
            })
            continue

        file_saved: List[Dict] = []
        subject_counts: Dict[str, int] = {}

        # Index vectors before committing relational rows. This prevents the
        # document library from advertising chunks that RAG cannot retrieve.
        vector_indexed = False
        if pgvector_store and extracted_items:
            try:
                pgvector_store.add_document_chunks(
                    institute_id=institute_id,
                    subject=subject or "General",
                    source_file=filename,
                    file_type=ext,
                    chunks=extracted_items
                )
                vector_indexed = True
            except Exception as e:
                per_file_results.append({
                    "file": filename,
                    "error": f"Vector indexing error: {str(e)}",
                    "count": 0
                })
                continue

        with Session(engine) as session:
            for item in extracted_items:
                text = item["content"]
                item_type = item.get("item_type", "document_chunk")
                chunk_subj = item.get("subject") or subject or "General"
                meta = item.get("metadata", {})
                subject_counts[chunk_subj] = subject_counts.get(chunk_subj, 0) + 1

                session.add(ContextItem(
                    institute_id=institute_id,
                    content=text,
                    item_type=item_type,
                    subject=chunk_subj,
                    source_file=filename,
                    metadata_json=json.dumps(meta) if meta else None
                ))

                record = {
                    "id": None,
                    "content": text,
                    "item_type": item_type,
                    "subject": chunk_subj,
                    "source_file": filename,
                    "file_type": ext
                }
                file_saved.append(record)
                total_saved.append(record)
                all_for_legacy.append({
                    "id": None,
                    "content": text,
                    "subject": chunk_subj,
                    "source_file": filename
                })
            session.commit()

        per_file_results.append({
            "file": filename,
            "file_type": ext,
            "count": len(file_saved),
            "subjects": subject_counts
        })

    # Legacy vector store fallback
    if vector_store and all_for_legacy:
        vector_store.add(all_for_legacy)

    # Build aggregate subject summary across all files
    aggregate_subjects: Dict[str, int] = {}
    for r in per_file_results:
        for subj_name, cnt in r.get("subjects", {}).items():
            aggregate_subjects[subj_name] = aggregate_subjects.get(subj_name, 0) + cnt

    vector_backend = "pgvector (PostgreSQL)" if (pgvector_store and pgvector_store.is_pgvector_active) else "local-vector-store"

    return {
        "status": "success",
        "message": f"Successfully parsed and indexed {len(total_saved)} semantic chunks from {len(files)} file(s).",
        "institute_id": institute_id,
        "vector_backend": vector_backend,
        "count": len(total_saved),
        "subject_breakdown": aggregate_subjects,
        "files": per_file_results
    }


# ── Robust LaTeX Escape & JSON Sanitization ────────────────────────────────
_LATEX_CMD_REGEX = re.compile(
    r'(?<!\\)\\'
    r'(?='
    r'frac|dfrac|tfrac|forall|fbox|flat|flushbottom|flushleft|flushright|fontsize|footnote|'
    r'theta|vartheta|tau|text|textbf|textit|textrm|texttt|textsf|tilde|times|to|top|triangle|'
    r'nabla|neg|neq|newcommand|newline|noindent|nonumber|not|nu|'
    r'rangle|rfloor|rceil|right|rightarrow|Rightarrow|rho|varrho|rm|rule|'
    r'bar|begin|beta|bf|big|binom|bmod|boldsymbol|Box|'
    r'alpha|approx|arccos|arcsin|arctan|ast|atop|'
    r'partial|int|iint|iiint|oint|sum|prod|lim|sqrt|infty|pm|mp|cdot|'
    r'leq|geq|equiv|sim|propto|leftarrow|Leftarrow|Leftrightarrow|iff|implies|'
    r'exists|in|notin|subset|subseteq|cup|cap|perp|parallel|angle|degree|circ|'
    r'sin|cos|tan|cot|sec|csc|sinh|cosh|tanh|ln|log|exp|det|dim|ker|deg|'
    r'mathbf|mathbb|mathrm|left|right|limits|end|'
    r'Gamma|Delta|Theta|Lambda|Xi|Pi|Sigma|Upsilon|Phi|Psi|Omega'
    r')'
)


def _pre_fix_latex_backslashes(json_str: str) -> str:
    return _LATEX_CMD_REGEX.sub(r'\\\\', json_str)


def _sanitize_json_latex_escapes(json_str: str) -> str:
    """
    State-machine sanitizer that walks a JSON candidate string and auto-escapes
    any unescaped backslashes inside JSON string literals.
    """
    result = []
    in_string = False
    i = 0
    length = len(json_str)

    while i < length:
        c = json_str[i]

        if c == '"':
            num_preceding_backslashes = 0
            j = len(result) - 1
            while j >= 0 and result[j] == '\\':
                num_preceding_backslashes += 1
                j -= 1
            if num_preceding_backslashes % 2 == 0:
                in_string = not in_string
            result.append(c)
            i += 1
            continue

        if not in_string:
            result.append(c)
            i += 1
            continue

        if c == '\\':
            if i + 1 >= length:
                result.append('\\\\')
                i += 1
                continue

            next_c = json_str[i + 1]

            if next_c == '\\':
                result.append('\\\\')
                i += 2
                continue

            if next_c in ('"', '/'):
                result.append('\\')
                result.append(next_c)
                i += 2
                continue

            if next_c in ('b', 'f', 'n', 'r', 't'):
                # In LaTeX context, \frac, \beta, \nabla, \rho, \theta are commands, not control chars
                if i + 2 < length and json_str[i + 2].isalpha():
                    result.append('\\\\')
                    result.append(next_c)
                    i += 2
                else:
                    result.append('\\')
                    result.append(next_c)
                    i += 2
                continue

            if next_c == 'u' and i + 5 < length:
                hex_chars = json_str[i + 2:i + 6]
                if len(hex_chars) == 4 and all(h in '0123456789abcdefABCDEF' for h in hex_chars):
                    result.append('\\u')
                    result.append(hex_chars)
                    i += 6
                    continue

            result.append('\\\\')
            result.append(next_c)
            i += 2
        else:
            result.append(c)
            i += 1

    return "".join(result)


def _repair_unclosed_json(json_str: str) -> str:
    """Closes unclosed braces and brackets if LLM output was truncated."""
    s = json_str.rstrip().rstrip(",")
    if s.endswith('"') and s.count('"') % 2 != 0:
        s += '"'
    
    open_brackets = s.count("[") - s.count("]")
    open_braces = s.count("{") - s.count("}")
    
    if open_braces > 0:
        s += "}" * open_braces
    if open_brackets > 0:
        s += "]" * open_brackets
    return s


def _extract_objects_iteratively(text: str) -> List[Dict]:
    """
    Parses nested question objects from text with full balanced bracket matching,
    even when conversational thoughts or truncation surrounds the JSON.
    """
    objects = []
    i = 0
    n = len(text)
    while i < n:
        if text[i] == '{':
            depth = 0
            start = i
            in_str = False
            escape = False
            while i < n:
                ch = text[i]
                if escape:
                    escape = False
                elif ch == '\\':
                    escape = True
                elif ch == '"':
                    in_str = not in_str
                elif not in_str:
                    if ch == '{':
                        depth += 1
                    elif ch == '}':
                        depth -= 1
                        if depth == 0:
                            obj_str = text[start:i+1]
                            for fixer in (_sanitize_json_latex_escapes, _pre_fix_latex_backslashes):
                                try:
                                    clean = fixer(obj_str)
                                    clean = re.sub(r",\s*([\]}])", r"\1", clean)
                                    parsed = json.loads(clean)
                                    if isinstance(parsed, dict) and ("text" in parsed or "q_index" in parsed):
                                        objects.append(parsed)
                                        break
                                except Exception:
                                    pass
                            break
                i += 1
        i += 1
    return objects


def _extract_json_from_llm_response(raw_text: str) -> Any:
    """
    Robust multi-strategy JSON extractor with advanced LaTeX backslash sanitization,
    preamble stripping, trailing comma removal, unclosed bracket repair, and
    balanced object extraction.
    """
    if not raw_text or not raw_text.strip():
        raise ValueError("LLM returned an empty response. Please retry or switch models.")

    text = raw_text.strip()
    text = re.sub(r"<think>[\s\S]*?</think>", "", text, flags=re.IGNORECASE)
    text = re.sub(r"<thought>[\s\S]*?</thought>", "", text, flags=re.IGNORECASE)

    # Strip code block fences
    fence_match = re.search(r"```(?:json)?\s*([\s\S]*?)(?:```|$)", text, flags=re.IGNORECASE)
    candidate_str = fence_match.group(1).strip() if fence_match else text

    # Discard any conversational preamble before '[' or '{'
    start_bracket = candidate_str.find("[")
    start_brace = candidate_str.find("{")

    if start_bracket != -1 and (start_brace == -1 or start_bracket < start_brace):
        candidate_str = candidate_str[start_bracket:]
    elif start_brace != -1:
        candidate_str = candidate_str[start_brace:]

    end_bracket = candidate_str.rfind("]")
    end_brace = candidate_str.rfind("}")

    if candidate_str.startswith("[") and end_bracket != -1:
        json_candidate = candidate_str[:end_bracket + 1]
    elif candidate_str.startswith("{") and end_brace != -1:
        json_candidate = candidate_str[:end_brace + 1]
    else:
        json_candidate = candidate_str

    # Strategy 1: Direct parse with sanitization passes
    for attempt in (
        json_candidate,
        _pre_fix_latex_backslashes(json_candidate),
        _sanitize_json_latex_escapes(json_candidate),
        re.sub(r",\s*([\]}])", r"\1", _sanitize_json_latex_escapes(json_candidate)),
        _repair_unclosed_json(_sanitize_json_latex_escapes(json_candidate))
    ):
        try:
            parsed = json.loads(attempt)
            return [parsed] if isinstance(parsed, dict) else parsed
        except Exception:
            pass

    # Strategy 2: Full state-machine iterative balanced object extraction
    extracted = _extract_objects_iteratively(raw_text)
    if extracted:
        return extracted

    raise ValueError(f"Could not parse valid JSON from LLM output. Raw snippet: {raw_text[:250]}")


def _clean_question_text(raw_text: str) -> str:
    """Strips raw/unrendered LaTeX figure environments from the question text."""
    if not raw_text:
        return ""
    cleaned = re.sub(r"\\begin\{figure\}[\s\S]*?\\end\{figure\}", "", raw_text)
    cleaned = re.sub(r"\\includegraphics(\[.*?\])?\{.*?\}", "", cleaned)
    cleaned = re.sub(r"\\caption\{.*?\}", "", cleaned)
    cleaned = re.sub(r"\\centering", "", cleaned)
    return cleaned.strip()


@app.post("/api/generate")
async def generate_exam(
    title: str = Form("Course Examination"),
    n_questions: int = Form(4),
    max_marks: int = Form(100),
    per_unit_weights: Optional[str] = Form(None),
    include_diagrams: Optional[bool] = Form(True),
    model: Optional[str] = Form(None),
    api_key: Optional[str] = Form(None),
    institute_id: str = Form("default-institute"),
    subject: Optional[str] = Form(None),
    syllabus_set: Optional[str] = Form(None),
    blueprint_config: Optional[str] = Form(None)
):
    """
    High-speed, single-pass exam generator that retrieves relevant curriculum context
    from the institute's pgvector database for the specific subject, formats prompts,
    and generates questions with embedded Matplotlib image specs in ONE efficient LLM call.
    """
    # Determine subject before constructing the semantic retrieval query.
    subject_hint = f"{title} {syllabus_set or ''} " + (per_unit_weights or "")
    detected_subj = subject or detect_subject(subject_hint, default_subject="General")
    query_text = f"{title} {detected_subj} {syllabus_set or ''} " + (per_unit_weights or "")

    blueprint = dict(DEFAULT_INSTITUTE_CONFIG)
    if blueprint_config:
        try:
            incoming_blueprint = json.loads(blueprint_config)
            if isinstance(incoming_blueprint, dict):
                blueprint.update(incoming_blueprint)
        except json.JSONDecodeError:
            print("[ExamGen] Ignoring invalid blueprint_config JSON", flush=True)

    # Semantic context retrieval from pgvector store with institute + subject filtering
    contexts = []
    if pgvector_store:
        try:
            contexts = pgvector_store.query(
                query_text=query_text,
                institute_id=institute_id,
                subject=detected_subj,
                k=8
            )
        except Exception as e:
            print(f"[pgvector query error] {e}")

    if not contexts and vector_store:
        contexts = vector_store.query(query_text, k=8, subject=detected_subj if detected_subj != "General" else None)
        if not contexts:
            contexts = vector_store.query(query_text, k=6)

    context_str = "\n\n".join(
        f"[Source: {c.get('source_file', 'institute knowledge base')} | Similarity: {c.get('similarity', c.get('score', 0)):.2f}]\n- {c.get('content', '')}"
        for c in contexts
    ) if contexts else "No institute-specific context was retrieved. Do not claim alignment to an uploaded syllabus."

    # Subject-specific instructions
    if detected_subj == "History":
        subject_guidance = (
            "SUBJECT: HISTORY & HUMANITIES\n"
            "- Include historical context, timeline events, primary source extracts where relevant, and analytical essay questions.\n"
            "- Questions should evaluate cause-and-effect, administrative policies, treaties, historical significance, and source critique.\n"
            "- For diagrams: If asking about timelines, historical expansion, or demographic trends, provide matplotlib code for timeline charts or bar comparisons.\n"
        )
    elif detected_subj == "Mathematics":
        subject_guidance = (
            "SUBJECT: MATHEMATICS & APPLIED CALCULUS\n"
            "- Formulate mathematically rigorous questions with clear equations, boundary conditions, and theorems.\n"
            "- Use LaTeX mathematical notation: $u(x,y)$, $\\frac{\\partial u}{\\partial x}$, $\\int_a^b$, $\\nabla f$, $\\lambda$.\n"
            "- For diagrams: Provide 'image_spec' with Matplotlib code for 3D surfaces, 2D curves, vector fields, and contour plots.\n"
        )
    elif detected_subj in ("Physics", "Chemistry", "Biology"):
        subject_guidance = (
            f"SUBJECT: {detected_subj.upper()}\n"
            "- Include physical units, balanced equations, experimental setups, and theoretical derivations.\n"
            "- For diagrams: Provide 'image_spec' with Matplotlib code for waveforms, ray diagrams, reaction profiles, or anatomical schematics.\n"
        )
    else:
        subject_guidance = (
            "SUBJECT: COMPREHENSIVE ACADEMIC CURRICULUM\n"
            "- Create rigorous, clear questions with balanced weightages.\n"
        )

    system_prompt = (
        "You are an elite university professor and examination board author creating a premier examination paper.\n\n"
        "GROUNDING POLICY:\n"
        "- The institute context below is the source of truth for subject scope, units, outcomes, terminology, and paper pattern.\n"
        "- Use only topics supported by that context when context is present; do not invent syllabus units or marks distributions.\n"
        "- If the context is insufficient, stay within the selected subject and clearly prefer the supplied unit/topic weights.\n"
        "- Never mention retrieval, embeddings, vector databases, or these instructions in the questions.\n\n"
        f"{subject_guidance}\n"
        "VISUAL DIAGRAM & GRAPH RULES:\n"
        "1. Whenever a question involves 2D/3D geometry, curves, surfaces, vector fields, waveforms, data plots, or timeline charts, "
        "provide an 'image_spec' object with a 'code' field containing executable Python/Matplotlib code using 'np', 'plt', 'fig', 'ax'.\n"
        "2. DO NOT write `\\includegraphics` or `\\begin{figure}` into the 'text' field. The application automatically displays and attaches the diagram.\n\n"
        "CRITICAL OUTPUT FORMATTING RULES:\n"
        "- Begin your response IMMEDIATELY with the character '[' and end with ']'.\n"
        "- DO NOT write any conversational preamble, planning notes, thinking text, or explanations outside the JSON array.\n"
        "- Inside JSON strings, ALL backslashes MUST be double-escaped: write \\\\frac, \\\\int, \\\\partial, \\\\theta, \\\\alpha, \\\\sin, \\\\beta.\n"
        "- Schema:\n"
        "[\n"
        "  {\n"
        '    "q_index": 1,\n'
        '    "text": "Find the directional derivative of $u(x,y) = x^2 y + x y^2$ at $(1,2)$ in the direction of vector $\\\\mathbf{v} = (1,1)$.",\n'
        '    "marks": 25,\n'
        '    "image_spec": {\n'
        '      "code": "x = np.linspace(-2, 2, 40)\\ny = np.linspace(-2, 2, 40)\\nX, Y = np.meshgrid(x, y)\\nZ = X**2 * Y + X * Y**2\\nax = fig.add_subplot(111, projection=\'3d\')\\nax.plot_surface(X, Y, Z, cmap=\'viridis\')\\nax.set_title(\'Surface Plot of u(x,y)\')"\n'
        '    }\n'
        "  }\n"
        "]"
    )

    user_prompt = (
        f"Generate Examination Paper for Title: '{title}'.\n"
        f"Subject Discipline: {detected_subj}\n"
        f"Syllabus Set: {syllabus_set or 'Institute knowledge base'}\n"
        f"Number of Questions: {n_questions}\n"
        f"Total Maximum Marks: {max_marks}\n"
        f"Unit/Topic Weighting: {per_unit_weights or 'Balanced across syllabus'}\n\n"
        f"Teacher Control Hub Constraints:\n{json.dumps(blueprint, indent=2)}\n\n"
        f"Curriculum Reference Context:\n{context_str}\n\n"
        f"Create exactly {n_questions} high-quality, distinctive questions whose individual marks sum to {max_marks}. "
        f"Honor the teacher controls: difficulty percentages, Bloom levels, question type percentages, CO/PO mapping, duplicate-topic prevention, minimum hard questions, time limit, and diagram cap. "
        f"{'Include executable matplotlib code in image_spec for relevant questions (maximum 2-3 diagrams across the exam).' if include_diagrams else 'Pure text and equations without image_spec.'} "
        f"Begin directly with '['. Return ONLY the JSON array."
    )

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt}
    ]

    # Dynamically scale max_tokens and timeout to support large question sets (e.g. 15-20 questions)
    scaled_max_tokens = min(8000, max(3500, n_questions * 420))
    scaled_timeout = min(120, max(60, n_questions * 6))

    try:
        raw_llm_output = call_openrouter(
            messages=messages,
            model=model,
            api_key=api_key,
            max_tokens=scaled_max_tokens,
            timeout=scaled_timeout,
            temperature=float(blueprint.get("temperature", 0.7)),
            top_p=float(blueprint.get("top_p", 0.9))
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM Generation Error: {str(e)}")

    try:
        questions_data = _extract_json_from_llm_response(raw_llm_output)
        if not isinstance(questions_data, list):
            raise ValueError("Expected a JSON array of question objects.")
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "error": "Failed to parse JSON from LLM response",
                "detail": str(e),
                "raw_output": raw_llm_output
            }
        )

    with Session(engine) as session:
        exam = Exam(
            title=title,
            institute_id=institute_id,
            subject=detected_subj,
            max_marks=max_marks,
            n_questions=len(questions_data),
            per_unit_weights_json=per_unit_weights
        )
        session.add(exam)
        session.commit()
        session.refresh(exam)

        exam_dict = {
            "id": exam.id,
            "title": exam.title,
            "institute_id": getattr(exam, "institute_id", institute_id),
            "subject": getattr(exam, "subject", detected_subj),
            "max_marks": exam.max_marks,
            "n_questions": exam.n_questions,
            "per_unit_weights_json": exam.per_unit_weights_json,
            "created_at": exam.created_at.isoformat() if hasattr(exam.created_at, "isoformat") else str(exam.created_at)
        }

        saved_questions = []
        for idx, q_data in enumerate(questions_data, start=1):
            raw_text = q_data.get("text", "")
            clean_text = _clean_question_text(raw_text)
            marks = int(q_data.get("marks", round(max_marks / max(1, len(questions_data)))))
            img_spec = q_data.get("image_spec")
            img_path = None

            # Render plot locally in milliseconds
            if img_spec and include_diagrams:
                img_path = render_plot_from_spec(img_spec)

            q_obj = Question(
                exam_id=exam.id,
                q_index=q_data.get("q_index", idx),
                text=clean_text or raw_text,
                marks=marks,
                image_path=img_path,
                image_spec_json=json.dumps(img_spec) if img_spec else None
            )
            session.add(q_obj)
            session.commit()
            session.refresh(q_obj)

            q_dict = {
                "id": q_obj.id,
                "exam_id": q_obj.exam_id,
                "q_index": q_obj.q_index,
                "text": q_obj.text,
                "marks": q_obj.marks,
                "image_path": q_obj.image_path,
                "image_spec_json": q_obj.image_spec_json,
                "created_at": q_obj.created_at.isoformat() if hasattr(q_obj.created_at, "isoformat") else str(q_obj.created_at)
            }
            saved_questions.append(q_dict)

    return {
        "status": "success",
        "exam": exam_dict,
        "questions": saved_questions
    }


@app.post("/api/generate_plot")
async def generate_plot(
    question_id: Optional[int] = Form(None),
    code: Optional[str] = Form(None),
    prompt: Optional[str] = Form(None),
    function_expr: Optional[str] = Form(None),
    x_min: Optional[float] = Form(-10.0),
    x_max: Optional[float] = Form(10.0),
    plot_title: Optional[str] = Form(""),
    model: Optional[str] = Form(None),
    api_key: Optional[str] = Form(None)
):
    """
    Renders or generates a Matplotlib diagram from code, prompt, or function formula,
    and optionally links it to a question.
    """
    image_path = None
    executed_code = None

    # Case 1: Direct Python Matplotlib code provided
    if code and code.strip():
        res = execute_matplotlib_code(code)
        if not res["success"]:
            raise HTTPException(status_code=400, detail=f"Matplotlib Error: {res['error']}")
        image_path = res["image_path"]
        executed_code = res["code"]

    # Case 2: AI Prompt provided to write Matplotlib code
    elif prompt and prompt.strip():
        q_context = ""
        if question_id:
            with Session(engine) as session:
                q = session.get(Question, question_id)
                if q:
                    q_context = q.text

        generated_code = generate_plot_code_from_ai(
            prompt=prompt,
            question_context=q_context,
            model=model,
            api_key=api_key
        )
        res = execute_matplotlib_code(generated_code)
        if not res["success"]:
            raise HTTPException(status_code=400, detail=f"Generated Code Execution Error: {res['error']}")
        image_path = res["image_path"]
        executed_code = generated_code

    # Case 3: Math formula provided
    elif function_expr and function_expr.strip():
        spec = {
            "function": function_expr.strip(),
            "x_range": [x_min, x_max],
            "title": plot_title or f"y = {function_expr}"
        }
        image_path = render_plot_from_spec(spec)
        executed_code = f"# Formula Plot: {function_expr}"

    else:
        raise HTTPException(status_code=400, detail="Please provide Python code, an AI prompt, or a mathematical formula.")

    # If linked to a Question, update Question record in database
    updated_question = None
    if question_id:
        with Session(engine) as session:
            q = session.get(Question, question_id)
            if q:
                q.image_path = image_path
                q.image_spec_json = json.dumps({"code": executed_code}) if executed_code else None
                session.add(q)
                session.commit()
                session.refresh(q)
                updated_question = {
                    "id": q.id,
                    "exam_id": q.exam_id,
                    "q_index": q.q_index,
                    "text": q.text,
                    "marks": q.marks,
                    "image_path": q.image_path,
                    "image_spec_json": q.image_spec_json
                }

    return {
        "status": "success",
        "image_path": image_path,
        "code": executed_code,
        "question": updated_question
    }


@app.post("/api/question/remove_image")
async def remove_question_image(question_id: int = Form(...)):
    """Removes the plot/image from a question."""
    with Session(engine) as session:
        question = session.get(Question, question_id)
        if not question:
            raise HTTPException(status_code=404, detail="Question not found.")
        question.image_path = None
        question.image_spec_json = None
        session.add(question)
        session.commit()
        session.refresh(question)
        return {"status": "success", "question": {"id": question.id, "image_path": None}}


@app.post("/api/edit_question")
async def edit_question(
    question_id: int = Form(...),
    edit_prompt: str = Form(...),
    model: Optional[str] = Form(None),
    api_key: Optional[str] = Form(None)
):
    """
    Calls the secondary editor LLM to perform targeted modifications to a question.
    """
    with Session(engine) as session:
        question = session.get(Question, question_id)
        if not question:
            raise HTTPException(status_code=404, detail=f"Question with ID {question_id} not found.")
        current_text = question.text

    editor_system_prompt = (
        "Given current LaTeX question and instruction, return only the rewritten LaTeX text. "
        "Do NOT include raw \\includegraphics or \\begin{figure} markup in the text."
    )
    editor_user_prompt = (
        f"Current Question:\n{current_text}\n\n"
        f"Teacher Edit Instruction:\n{edit_prompt}\n\n"
        "Return ONLY the rewritten LaTeX question text with no additional explanations."
    )

    messages = [
        {"role": "system", "content": editor_system_prompt},
        {"role": "user", "content": editor_user_prompt}
    ]

    try:
        rewritten_text = call_openrouter(
            messages=messages,
            model=model,
            api_key=api_key,
            max_tokens=1500
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Editor Error: {str(e)}")

    rewritten_text = rewritten_text.strip()
    if rewritten_text.startswith("```latex") or rewritten_text.startswith("```"):
        rewritten_text = re.sub(r"^```(?:latex)?\s*", "", rewritten_text)
        rewritten_text = re.sub(r"\s*```$", "", rewritten_text)

    rewritten_text = _clean_question_text(rewritten_text)

    with Session(engine) as session:
        db_question = session.get(Question, question_id)
        if db_question:
            db_question.text = rewritten_text
            session.add(db_question)
            session.commit()
            session.refresh(db_question)
            return {
                "status": "success",
                "question": {
                    "id": db_question.id,
                    "exam_id": db_question.exam_id,
                    "q_index": db_question.q_index,
                    "text": db_question.text,
                    "marks": db_question.marks,
                    "image_path": db_question.image_path
                }
            }

    return {"status": "success", "text": rewritten_text}


@app.post("/api/save_question")
async def save_question(
    question_id: int = Form(...),
    text: str = Form(...),
    marks: Optional[int] = Form(None)
):
    """Saves manual inline edits to SQLite."""
    with Session(engine) as session:
        question = session.get(Question, question_id)
        if not question:
            raise HTTPException(status_code=404, detail="Question not found.")
        question.text = text
        if marks is not None:
            question.marks = marks
        session.add(question)
        session.commit()
        session.refresh(question)
        return {
            "status": "success",
            "question": {
                "id": question.id,
                "exam_id": question.exam_id,
                "q_index": question.q_index,
                "text": question.text,
                "marks": question.marks,
                "image_path": question.image_path
            }
        }


@app.post("/api/question/create")
async def create_question(
    exam_id: int = Form(...),
    text: str = Form("New question text..."),
    marks: int = Form(10)
):
    """Adds a new question to the exam."""
    with Session(engine) as session:
        exam = session.get(Exam, exam_id)
        if not exam:
            raise HTTPException(status_code=404, detail="Exam not found.")
        existing_count = len(session.exec(select(Question).where(Question.exam_id == exam_id)).all())
        new_q = Question(
            exam_id=exam_id,
            q_index=existing_count + 1,
            text=text,
            marks=marks
        )
        session.add(new_q)
        session.commit()
        session.refresh(new_q)
        return {
            "status": "success",
            "question": {
                "id": new_q.id,
                "exam_id": new_q.exam_id,
                "q_index": new_q.q_index,
                "text": new_q.text,
                "marks": new_q.marks,
                "image_path": new_q.image_path
            }
        }


@app.delete("/api/question/{question_id}")
async def delete_question(question_id: int):
    """Deletes a question from an exam."""
    with Session(engine) as session:
        question = session.get(Question, question_id)
        if not question:
            raise HTTPException(status_code=404, detail="Question not found.")
        session.delete(question)
        session.commit()
        return {"status": "success", "message": f"Question {question_id} deleted."}


@app.post("/api/export")
async def export_exam(
    exam_id: int = Form(...),
    format: str = Form("pdf")
):
    """
    Exports the exam to PDF (standalone ReportLab engine), LaTeX (.tex), or Word (.docx).
    """
    with Session(engine) as session:
        exam = session.get(Exam, exam_id)
        if not exam:
            raise HTTPException(status_code=404, detail=f"Exam with ID {exam_id} not found.")

        questions = session.exec(
            select(Question).where(Question.exam_id == exam_id).order_by(Question.q_index)
        ).all()

    if not questions:
        raise HTTPException(status_code=400, detail="Exam has no questions to export.")

    q_dicts = [
        {
            "id": q.id,
            "q_index": q.q_index,
            "text": q.text,
            "marks": q.marks,
            "image_path": q.image_path
        }
        for q in questions
    ]
    safe_title = re.sub(r"[^\w\-_]", "_", exam.title.lower())
    export_base = f"exam_{exam.id}_{safe_title}"

    fmt = format.strip().lower()

    if fmt == "pdf":
        pdf_path = os.path.join(EXPORTS_DIR, f"{export_base}.pdf")
        try:
            create_pdf(exam.title, q_dicts, exam.max_marks, output_path=pdf_path)
            return FileResponse(
                pdf_path,
                filename=f"{export_base}.pdf",
                media_type="application/pdf"
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"PDF Generation Failed: {str(e)}")

    elif fmt == "tex":
        tex_path = os.path.join(EXPORTS_DIR, f"{export_base}.tex")
        try:
            create_tex(exam.title, q_dicts, exam.max_marks, output_path=tex_path)
            return FileResponse(
                tex_path,
                filename=f"{export_base}.tex",
                media_type="application/x-tex"
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"LaTeX Export Failed: {str(e)}")

    elif fmt in ("docx", "doc"):
        docx_path = os.path.join(EXPORTS_DIR, f"{export_base}.docx")
        try:
            create_docx(exam.title, q_dicts, exam.max_marks, output_path=docx_path)
            return FileResponse(
                docx_path,
                filename=f"{export_base}.docx",
                media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Word Document Export Failed: {str(e)}")

    elif fmt in ("pptx", "ppt", "powerpoint"):
        pptx_path = os.path.join(EXPORTS_DIR, f"{export_base}.pptx")
        try:
            create_pptx(exam.title, q_dicts, exam.max_marks, output_path=pptx_path)
            return FileResponse(
                pptx_path,
                filename=f"{export_base}.pptx",
                media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation"
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"PowerPoint Export Failed: {str(e)}")

    else:
        raise HTTPException(status_code=400, detail=f"Unsupported format '{format}'. Choose 'pdf', 'pptx', 'docx', or 'tex'.")
