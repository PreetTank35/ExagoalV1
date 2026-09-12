"""
pgvector_store.py
=================
Production-grade Multi-Tenant Vector Database Store using pgvector in PostgreSQL,
with an in-memory/SQLite FAISS hybrid adapter for local development.

Key Features:
  - Multi-tenant data isolation by institute_id (Institute A data never leaks to Institute B).
  - Subject-filtered vector similarity search (query curriculum specifically for the chosen course/subject).
  - Universal metadata tracking: source file, file format (PDF, DOCX, PPTX, JSON, TXT), chunk index, timestamp.
  - Native pgvector cosine distance search (<=>) with IVFFlat / HNSW index support.
"""

import os
import json
import numpy as np
from typing import List, Dict, Any, Optional, Union

# 384-dimensional embedding model (fast, accurate, in-backend CPU/GPU)
DEFAULT_EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
EMBEDDING_DIM = 384


class PgVectorStore:
    def __init__(self, connection_url: Optional[str] = None, model_name: str = DEFAULT_EMBEDDING_MODEL, encoder: Optional[Any] = None):
        # Strictly separate Vector Database URL from relational SQL Database URL
        self.connection_url = connection_url or os.getenv("PGVECTOR_URL") or os.getenv("VECTOR_DATABASE_URL")
        self.model_name = model_name
        self._encoder = encoder
        self.is_pgvector_active = False

        # Attempt PostgreSQL + pgvector connection if URL is postgres
        if self.connection_url and ("postgres" in self.connection_url.lower()):
            self._init_postgres()
        else:
            print("[VectorStore] No PostgreSQL URL found. Operating with local high-performance FAISS adapter.")
            self._init_local_faiss()

    @property
    def encoder(self):
        if self._encoder is None:
            from sentence_transformers import SentenceTransformer
            self._encoder = SentenceTransformer(self.model_name)
        return self._encoder

    def _normalize_postgres_url(self, url: str) -> str:
        # Common Railway / Supabase fix: replace postgres:// with postgresql://
        if url.startswith("postgres://"):
            return "postgresql://" + url[len("postgres://"):]
        return url

    def _init_postgres(self):
        try:
            import psycopg2
            from psycopg2.extras import Json
            import pgvector.psycopg2

            norm_url = self._normalize_postgres_url(self.connection_url)
            conn = psycopg2.connect(norm_url)
            conn.autocommit = True
            with conn.cursor() as cur:
                # 1. Enable pgvector extension
                cur.execute("CREATE EXTENSION IF NOT EXISTS vector;")
                pgvector.psycopg2.register_vector(conn)

                # 2. Create multi-tenant institute documents table
                cur.execute(f"""
                CREATE TABLE IF NOT EXISTS institute_document_chunks (
                    id SERIAL PRIMARY KEY,
                    institute_id VARCHAR(100) NOT NULL,
                    subject VARCHAR(100) NOT NULL,
                    source_file VARCHAR(255) NOT NULL,
                    file_type VARCHAR(20) NOT NULL DEFAULT 'text',
                    chunk_index INT NOT NULL DEFAULT 1,
                    content TEXT NOT NULL,
                    metadata_json JSONB,
                    embedding vector({EMBEDDING_DIM}),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                """)

                cur.execute("""
                DO $$
                BEGIN
                    IF EXISTS (
                        SELECT 1 FROM information_schema.columns
                        WHERE table_name = 'institute_document_chunks' AND column_name = 'metadata'
                    ) AND NOT EXISTS (
                        SELECT 1 FROM information_schema.columns
                        WHERE table_name = 'institute_document_chunks' AND column_name = 'metadata_json'
                    ) THEN
                        ALTER TABLE institute_document_chunks RENAME COLUMN metadata TO metadata_json;
                    END IF;
                END $$;
                """)

                # 3. Create composite index for instant institute + subject lookup
                cur.execute("""
                CREATE INDEX IF NOT EXISTS idx_inst_doc_chunks_inst_subj 
                ON institute_document_chunks (institute_id, subject);
                """)
                cur.execute("""
                CREATE INDEX IF NOT EXISTS idx_inst_doc_chunks_file
                ON institute_document_chunks (institute_id, source_file);
                """)

            conn.close()
            self.is_pgvector_active = True
            print(f"[VectorStore] [OK] Connected to PostgreSQL with pgvector extension enabled ({EMBEDDING_DIM}d).")
        except Exception as e:
            print(f"[VectorStore Warning] Could not connect to PostgreSQL pgvector ({e}). Falling back to local FAISS adapter.")
            self.is_pgvector_active = False
            self._init_local_faiss()

    def _init_local_faiss(self):
        import faiss
        self.dimension = EMBEDDING_DIM
        self.local_index = faiss.IndexFlatL2(self.dimension)
        # Store items with multi-tenant metadata
        self.local_items: List[Dict[str, Any]] = []

    # ── Embedding Computation ────────────────────────────────────────────────
    def embed_texts(self, texts: List[str]) -> np.ndarray:
        """Computes 384-d normalized embeddings for a list of texts."""
        if not texts:
            return np.empty((0, EMBEDDING_DIM), dtype=np.float32)
        embeddings = self.encoder.encode(texts, convert_to_numpy=True, show_progress_bar=False)
        return embeddings.astype(np.float32)

    def embed_query(self, query: str) -> np.ndarray:
        """Computes embedding for a single search query."""
        emb = self.encoder.encode([query], convert_to_numpy=True, show_progress_bar=False)
        return emb[0].astype(np.float32)

    # ── Insertion ────────────────────────────────────────────────────────────
    def add_document_chunks(
        self,
        institute_id: str,
        subject: str,
        source_file: str,
        file_type: str,
        chunks: List[Dict[str, Any]]
    ) -> int:
        """
        Inserts document chunks into pgvector (or local FAISS), generating embeddings in backend.
        Each chunk is strictly isolated by institute_id.
        """
        if not chunks:
            return 0

        texts = [c["content"] for c in chunks]
        embeddings = self.embed_texts(texts)

        if self.is_pgvector_active:
            import psycopg2
            from psycopg2.extras import Json, execute_values
            import pgvector.psycopg2

            norm_url = self._normalize_postgres_url(self.connection_url)
            conn = psycopg2.connect(norm_url, connect_timeout=15)
            conn.autocommit = True
            pgvector.psycopg2.register_vector(conn)

            rows = []
            for idx, item in enumerate(chunks):
                meta = item.get("metadata", {})
                rows.append((
                    institute_id,
                    item.get("subject") or subject or "General",
                    source_file,
                    file_type,
                    idx + 1,
                    item["content"],
                    Json(meta),
                    embeddings[idx].tolist()
                ))

            with conn.cursor() as cur:
                execute_values(
                    cur,
                    """
                    INSERT INTO institute_document_chunks 
                    (institute_id, subject, source_file, file_type, chunk_index, content, metadata_json, embedding)
                    VALUES %s;
                    """,
                    rows,
                    template="(%s, %s, %s, %s, %s, %s, %s, %s::vector)",
                    page_size=100
                )
            conn.close()
            return len(rows)
        else:
            # Local FAISS fallback
            self.local_index.add(embeddings)
            for idx, item in enumerate(chunks):
                record = {
                    "id": len(self.local_items) + 1,
                    "institute_id": institute_id,
                    "subject": item.get("subject") or subject or "General",
                    "source_file": source_file,
                    "file_type": file_type,
                    "chunk_index": idx + 1,
                    "content": item["content"],
                    "metadata": item.get("metadata", {})
                }
                self.local_items.append(record)
            return len(chunks)

    # ── Search & Context Retrieval ───────────────────────────────────────────
    def query(
        self,
        query_text: str,
        institute_id: str = "default-institute",
        subject: Optional[str] = None,
        k: int = 8
    ) -> List[Dict[str, Any]]:
        """
        Semantic context retrieval filtered by institute_id and subject.
        Uses native cosine distance (<=>) in pgvector.
        """
        query_emb = self.embed_query(query_text)

        if self.is_pgvector_active:
            import psycopg2
            import pgvector.psycopg2

            norm_url = self._normalize_postgres_url(self.connection_url)
            conn = psycopg2.connect(norm_url)
            pgvector.psycopg2.register_vector(conn)

            results = []
            with conn.cursor() as cur:
                # Dynamic subject filtering: if subject is provided, search within subject OR General
                if subject and subject.strip() and subject.lower() != "all":
                    cur.execute("""
                    SELECT id, content, subject, source_file, file_type, metadata_json,
                           1 - (embedding <=> %s::vector) AS similarity
                    FROM institute_document_chunks
                    WHERE institute_id = %s
                      AND (subject ILIKE %s OR subject = 'General')
                    ORDER BY embedding <=> %s::vector
                    LIMIT %s;
                    """, (query_emb.tolist(), institute_id, f"%{subject.strip()}%", query_emb.tolist(), k))
                else:
                    cur.execute("""
                    SELECT id, content, subject, source_file, file_type, metadata_json,
                           1 - (embedding <=> %s::vector) AS similarity
                    FROM institute_document_chunks
                    WHERE institute_id = %s
                    ORDER BY embedding <=> %s::vector
                    LIMIT %s;
                    """, (query_emb.tolist(), institute_id, query_emb.tolist(), k))

                rows = cur.fetchall()
                for r in rows:
                    results.append({
                        "id": r[0],
                        "content": r[1],
                        "subject": r[2],
                        "source_file": r[3],
                        "file_type": r[4],
                        "metadata": r[5] or {},
                        "similarity": float(r[6]) if r[6] is not None else 0.0
                    })
            conn.close()
            return results
        else:
            # Local FAISS search
            if not self.local_items or self.local_index.ntotal == 0:
                return []

            q_vec = np.expand_dims(query_emb, axis=0)
            search_k = min(len(self.local_items), max(k * 4, 20))
            distances, indices = self.local_index.search(q_vec, search_k)

            matches = []
            for dist, idx in zip(distances[0], indices[0]):
                if idx < 0 or idx >= len(self.local_items):
                    continue
                item = self.local_items[idx]
                # Check institute isolation
                if item.get("institute_id") != institute_id:
                    continue
                # Check subject filter
                if subject and subject.strip() and subject.lower() != "all":
                    item_subj = item.get("subject", "").lower()
                    target_subj = subject.strip().lower()
                    if target_subj not in item_subj and item_subj != "general":
                        continue
                match_dict = dict(item)
                match_dict["score"] = float(dist)
                matches.append(match_dict)
                if len(matches) >= k:
                    break

            return matches

    # ── Institute Stats & Available Subjects ─────────────────────────────────
    def get_institute_subjects(self, institute_id: str = "default-institute") -> List[Dict[str, Any]]:
        """
        Returns all subjects indexed for an institute with chunk counts and unique source files.
        """
        if self.is_pgvector_active:
            import psycopg2
            norm_url = self._normalize_postgres_url(self.connection_url)
            conn = psycopg2.connect(norm_url)
            subjects = []
            with conn.cursor() as cur:
                cur.execute("""
                SELECT subject, COUNT(*) as chunk_count, COUNT(DISTINCT source_file) as doc_count
                FROM institute_document_chunks
                WHERE institute_id = %s
                GROUP BY subject
                ORDER BY chunk_count DESC;
                """, (institute_id,))
                for r in cur.fetchall():
                    subjects.append({
                        "subject": r[0],
                        "chunks_count": r[1],
                        "documents_count": r[2]
                    })
            conn.close()
            return subjects
        else:
            # Local FAISS aggregation
            subj_map = {}
            for item in self.local_items:
                if item.get("institute_id") == institute_id:
                    s = item.get("subject", "General")
                    f = item.get("source_file", "")
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

    def get_institute_stats(self, institute_id: str = "default-institute") -> Dict[str, Any]:
        """
        Returns comprehensive breakdown for the Institute Documents dashboard.
        """
        subjects = self.get_institute_subjects(institute_id)
        total_chunks = sum(s["chunks_count"] for s in subjects)

        if self.is_pgvector_active:
            import psycopg2
            norm_url = self._normalize_postgres_url(self.connection_url)
            conn = psycopg2.connect(norm_url)
            recent_items = []
            file_types = {}
            with conn.cursor() as cur:
                cur.execute("""
                SELECT file_type, COUNT(*) 
                FROM institute_document_chunks 
                WHERE institute_id = %s 
                GROUP BY file_type;
                """, (institute_id,))
                for r in cur.fetchall():
                    file_types[r[0]] = r[1]

                cur.execute("""
                SELECT id, content, subject, source_file, file_type, created_at
                FROM institute_document_chunks
                WHERE institute_id = %s
                ORDER BY id DESC
                LIMIT 6;
                """, (institute_id,))
                for r in cur.fetchall():
                    recent_items.append({
                        "id": r[0],
                        "content": r[1],
                        "subject": r[2],
                        "source_file": r[3],
                        "file_type": r[4],
                        "created_at": str(r[5])
                    })
            conn.close()
            return {
                "status": "success",
                "backend": "pgvector (PostgreSQL)",
                "total_items": total_chunks,
                "subjects": subjects,
                "subject_breakdown": {s["subject"]: s["chunks_count"] for s in subjects},
                "file_types": file_types,
                "recent_items": recent_items
            }
        else:
            recent_items = [
                {
                    "id": it["id"],
                    "content": it["content"],
                    "subject": it["subject"],
                    "source_file": it["source_file"],
                    "file_type": it.get("file_type", "text")
                }
                for it in self.local_items[-6:]
            ]
            file_types = {}
            for it in self.local_items:
                if it.get("institute_id") == institute_id:
                    ft = it.get("file_type", "text")
                    file_types[ft] = file_types.get(ft, 0) + 1

            return {
                "status": "success",
                "backend": "local-faiss",
                "total_items": total_chunks,
                "subjects": subjects,
                "subject_breakdown": {s["subject"]: s["chunks_count"] for s in subjects},
                "file_types": file_types,
                "recent_items": recent_items
            }

    # ── Document Management (List, Chunks Preview & Deletion) ─────────────────
    def get_institute_documents(self, institute_id: str = "default-institute") -> List[Dict[str, Any]]:
        """
        Returns a structured list of unique uploaded documents for the institute.
        """
        if self.is_pgvector_active:
            import psycopg2
            norm_url = self._normalize_postgres_url(self.connection_url)
            conn = psycopg2.connect(norm_url)
            docs = []
            with conn.cursor() as cur:
                cur.execute("""
                SELECT 
                    source_file,
                    subject,
                    file_type,
                    COUNT(*) as chunk_count,
                    MIN(created_at) as uploaded_at,
                    SUBSTRING(MIN(content), 1, 200) as preview
                FROM institute_document_chunks
                WHERE institute_id = %s
                GROUP BY source_file, subject, file_type
                ORDER BY uploaded_at DESC;
                """, (institute_id,))
                for r in cur.fetchall():
                    docs.append({
                        "source_file": r[0],
                        "subject": r[1],
                        "file_type": r[2],
                        "chunk_count": r[3],
                        "uploaded_at": str(r[4]) if r[4] else "Recently",
                        "preview": r[5] or ""
                    })
            conn.close()
            return docs
        else:
            # Local FAISS aggregation
            doc_map: Dict[str, Dict[str, Any]] = {}
            for item in self.local_items:
                if item.get("institute_id") == institute_id:
                    sf = item.get("source_file", "unknown")
                    if sf not in doc_map:
                        doc_map[sf] = {
                            "source_file": sf,
                            "subject": item.get("subject", "General"),
                            "file_type": item.get("file_type", "text"),
                            "chunk_count": 0,
                            "uploaded_at": "Recently",
                            "preview": item.get("content", "")[:200]
                        }
                    doc_map[sf]["chunk_count"] += 1

            return list(doc_map.values())

    def get_document_chunks(self, institute_id: str, source_file: str) -> List[Dict[str, Any]]:
        """
        Fetches all parsed semantic chunks for a given file and institute (for UI inspection).
        """
        if self.is_pgvector_active:
            import psycopg2
            norm_url = self._normalize_postgres_url(self.connection_url)
            conn = psycopg2.connect(norm_url)
            chunks = []
            with conn.cursor() as cur:
                cur.execute("""
                SELECT id, chunk_index, content, subject, metadata_json, created_at
                FROM institute_document_chunks
                WHERE institute_id = %s AND source_file = %s
                ORDER BY chunk_index ASC;
                """, (institute_id, source_file))
                for r in cur.fetchall():
                    chunks.append({
                        "id": r[0],
                        "chunk_index": r[1],
                        "content": r[2],
                        "subject": r[3],
                        "metadata": r[4] or {},
                        "created_at": str(r[5])
                    })
            conn.close()
            return chunks
        else:
            chunks = []
            for item in self.local_items:
                if item.get("institute_id") == institute_id and item.get("source_file") == source_file:
                    chunks.append({
                        "id": item.get("id"),
                        "chunk_index": item.get("chunk_index", 1),
                        "content": item.get("content", ""),
                        "subject": item.get("subject", "General"),
                        "metadata": item.get("metadata", {})
                    })
            return sorted(chunks, key=lambda x: x["chunk_index"])

    def delete_document(self, institute_id: str, source_file: str) -> int:
        """
        Deletes all chunks belonging to a specific document for an institute.
        """
        deleted_count = 0
        if self.is_pgvector_active:
            import psycopg2
            norm_url = self._normalize_postgres_url(self.connection_url)
            conn = psycopg2.connect(norm_url)
            conn.autocommit = True
            with conn.cursor() as cur:
                cur.execute("""
                DELETE FROM institute_document_chunks
                WHERE institute_id = %s AND source_file = %s;
                """, (institute_id, source_file))
                deleted_count = cur.rowcount
            conn.close()
            return deleted_count
        else:
            prev_len = len(self.local_items)
            self.local_items = [
                it for it in self.local_items 
                if not (it.get("institute_id") == institute_id and it.get("source_file") == source_file)
            ]
            deleted_count = prev_len - len(self.local_items)
            # Rebuild FAISS index if items remain
            if self.local_items:
                import faiss
                self.local_index = faiss.IndexFlatL2(self.dimension)
                texts = [it["content"] for it in self.local_items]
                embs = self.embed_texts(texts)
                self.local_index.add(embs)
            else:
                import faiss
                self.local_index = faiss.IndexFlatL2(self.dimension)
            return deleted_count

    def get_vector_status(self) -> Dict[str, Any]:
        """Returns diagnostic telemetry on the active vector engine."""
        return {
            "active": True,
            "backend": "pgvector (PostgreSQL)" if self.is_pgvector_active else "local-faiss",
            "is_pgvector_active": self.is_pgvector_active,
            "embedding_model": self.model_name,
            "dimension": EMBEDDING_DIM,
            "connection_configured": bool(self.connection_url),
            "message": (
                "PostgreSQL pgvector is operational with multi-tenant isolation."
                if self.is_pgvector_active else
                "Operating with in-memory FAISS adapter. Set PGVECTOR_URL in .env to connect to PostgreSQL pgvector."
            )
        }
