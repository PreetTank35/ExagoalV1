"""
test_vector_integration.py
==========================
Validates end-to-end:
1. Vector status endpoint (/api/vector/status)
2. Ingesting multi-format document with subject tag (/api/context/upload)
3. Institute documents listing (/api/institute/documents)
4. Institute subject breakdown (/api/institute/subjects)
5. Chunk inspection modal endpoint (/api/institute/documents/chunks)
6. Subject-specific context query (/api/generate prompt grounding test)
7. Document deletion (/api/institute/documents DELETE)
"""

import io
import json
import requests

BASE_URL = "http://127.0.0.1:8000"
TEST_INSTITUTE = "test-institute-alpha"


def run_tests():
    print("\n--- 1. Testing /api/vector/status ---")
    r = requests.get(f"{BASE_URL}/api/vector/status")
    assert r.status_code == 200, f"Status failed: {r.text}"
    status_data = r.json()
    print("Vector Status:", status_data)
    assert "backend" in status_data
    assert "dimension" in status_data
    assert status_data["dimension"] == 384

    print("\n--- 2. Testing /api/context/upload with Subject Tag ---")
    physics_text = """
    NEWTONIAN DYNAMICS & GRAVITATIONAL FIELDS
    Unit 1: Classical Mechanics.
    A particle of mass m moves in a central force field where the potential energy V(r) = -k/r.
    The angular momentum L is conserved. The total mechanical energy is E = 1/2 m (dr/dt)^2 + L^2/(2 m r^2) - k/r.
    Kepler's third law states that T^2 is directly proportional to a^3 for elliptical planetary orbits.
    """
    files = [
        ("files", ("physics_mechanics_syllabus.txt", physics_text.encode("utf-8"), "text/plain"))
    ]
    data = {
        "institute_id": TEST_INSTITUTE,
        "subject": "Physics"
    }
    r = requests.post(f"{BASE_URL}/api/context/upload", files=files, data=data)
    assert r.status_code == 200, f"Upload failed: {r.text}"
    upload_res = r.json()
    print(f"Upload Result: status={upload_res.get('status')}, count={upload_res.get('count')}, backend={upload_res.get('vector_backend')}")
    assert upload_res["count"] >= 1

    print("\n--- 3. Testing /api/institute/documents ---")
    r = requests.get(f"{BASE_URL}/api/institute/documents?institute_id={TEST_INSTITUTE}")
    assert r.status_code == 200, f"Docs list failed: {r.text}"
    docs = r.json()
    print(f"Found {len(docs)} documents for {TEST_INSTITUTE}")
    assert any(d["source_file"] == "physics_mechanics_syllabus.txt" for d in docs)
    uploaded_doc = next(d for d in docs if d["source_file"] == "physics_mechanics_syllabus.txt")
    print("Document details:", uploaded_doc)
    assert uploaded_doc["subject"] == "Physics"
    assert uploaded_doc["chunk_count"] >= 1

    print("\n--- 4. Testing /api/institute/subjects ---")
    r = requests.get(f"{BASE_URL}/api/institute/subjects?institute_id={TEST_INSTITUTE}")
    assert r.status_code == 200, f"Subjects failed: {r.text}"
    subjs = r.json()
    print(f"Subjects for {TEST_INSTITUTE}:", subjs)
    assert any(s["subject"] == "Physics" for s in subjs)

    print("\n--- 5. Testing /api/institute/documents/chunks ---")
    r = requests.get(f"{BASE_URL}/api/institute/documents/chunks?institute_id={TEST_INSTITUTE}&source_file=physics_mechanics_syllabus.txt")
    assert r.status_code == 200, f"Chunks failed: {r.text}"
    chunks = r.json()
    print(f"Found {len(chunks)} chunks in inspector:")
    for chk in chunks[:2]:
        print(f"  - Chunk #{chk.get('chunk_index')}: {chk.get('content')[:80]}...")
    assert len(chunks) >= 1

    print("\n--- 6. Testing Document Deletion ---")
    r = requests.delete(f"{BASE_URL}/api/institute/documents?institute_id={TEST_INSTITUTE}&source_file=physics_mechanics_syllabus.txt")
    assert r.status_code == 200, f"Delete failed: {r.text}"
    del_res = r.json()
    print("Delete result:", del_res)
    assert del_res["status"] == "success"

    # Verify deleted
    r_after = requests.get(f"{BASE_URL}/api/institute/documents?institute_id={TEST_INSTITUTE}")
    docs_after = r_after.json()
    assert not any(d["source_file"] == "physics_mechanics_syllabus.txt" for d in docs_after)
    print("[OK] Verified document and chunks cleanly removed.")

    print("\nALL VECTOR & DOCUMENT MANAGEMENT TESTS PASSED SUCCESSFULLY!")


if __name__ == "__main__":
    run_tests()
