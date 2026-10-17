from pathlib import Path
import sqlite3
from typing import Optional
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "landguard_synthetic.db"

app = FastAPI(
    title="LandGuard AI API",
    description="Synthetic-data demo API for P2 DeedVerify, P3 LandGuard AI, and P5 LandCheck AI.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_conn():
    if not DB_PATH.exists():
        raise HTTPException(status_code=500, detail="Database not found. Put landguard_synthetic.db in backend/ and restart.")
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys=ON")
    return conn

def rows_to_dicts(rows):
    return [dict(row) for row in rows]

@app.get("/")
def root():
    return {"app": "LandGuard AI", "status": "running", "data": "synthetic demo only"}

@app.get("/api/summary")
def summary():
    tables = ["owners", "land_parcels", "deeds", "ownership_history", "mutation_records",
              "legal_cases", "acquisition_records", "risk_alerts"]
    conn = get_conn()
    try:
        counts = {}
        for table in tables:
            counts[table] = conn.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0]
        by_module = rows_to_dicts(conn.execute(
            "SELECT module, COUNT(*) AS count FROM risk_alerts GROUP BY module ORDER BY module"
        ).fetchall())
        by_severity = rows_to_dicts(conn.execute(
            "SELECT severity, COUNT(*) AS count FROM risk_alerts GROUP BY severity ORDER BY severity"
        ).fetchall())
        return {"counts": counts, "alerts_by_module": by_module, "alerts_by_severity": by_severity}
    finally:
        conn.close()

@app.get("/api/parcels")
def parcels(q: Optional[str] = Query(default=None), limit: int = Query(default=100, ge=1, le=500)):
    conn = get_conn()
    try:
        sql = """
        SELECT p.parcel_id, p.district, p.upazila, p.mouza, p.jl_number, p.khatian_number,
               p.dag_number, p.area_decimal, p.land_type, p.current_owner_id, o.full_name AS current_owner,
               p.record_status,
               (SELECT COUNT(*) FROM risk_alerts r WHERE r.parcel_id=p.parcel_id) AS alert_count
        FROM land_parcels p JOIN owners o ON o.owner_id=p.current_owner_id
        """
        params = []
        if q:
            sql += """ WHERE p.parcel_id LIKE ? OR p.dag_number LIKE ? OR p.khatian_number LIKE ?
                       OR p.mouza LIKE ? OR o.full_name LIKE ? """
            term = f"%{q}%"
            params = [term] * 5
        sql += " ORDER BY p.parcel_id LIMIT ?"
        params.append(limit)
        return rows_to_dicts(conn.execute(sql, params).fetchall())
    finally:
        conn.close()

@app.get("/api/parcels/{parcel_id}")
def parcel_detail(parcel_id: str):
    conn = get_conn()
    try:
        parcel = conn.execute("""
            SELECT p.*, o.full_name AS current_owner
            FROM land_parcels p JOIN owners o ON o.owner_id=p.current_owner_id
            WHERE p.parcel_id=?
        """, (parcel_id,)).fetchone()
        if not parcel:
            raise HTTPException(status_code=404, detail="Parcel not found")
        deeds = conn.execute("""
            SELECT d.*, s.full_name AS seller_name, b.full_name AS buyer_name
            FROM deeds d
            JOIN owners s ON s.owner_id=d.seller_owner_id
            JOIN owners b ON b.owner_id=d.buyer_owner_id
            WHERE d.parcel_id=? ORDER BY d.deed_date DESC
        """, (parcel_id,)).fetchall()
        mutations = conn.execute("SELECT * FROM mutation_records WHERE parcel_id=? ORDER BY application_date DESC", (parcel_id,)).fetchall()
        cases = conn.execute("SELECT * FROM legal_cases WHERE parcel_id=? ORDER BY filed_date DESC", (parcel_id,)).fetchall()
        acquisition = conn.execute("SELECT * FROM acquisition_records WHERE parcel_id=?", (parcel_id,)).fetchall()
        alerts = conn.execute("SELECT * FROM risk_alerts WHERE parcel_id=? ORDER BY severity='high' DESC, created_at DESC", (parcel_id,)).fetchall()
        history = conn.execute("""
            SELECT h.*, o.full_name FROM ownership_history h JOIN owners o ON o.owner_id=h.owner_id
            WHERE h.parcel_id=? ORDER BY h.start_date DESC
        """, (parcel_id,)).fetchall()
        return {
            "parcel": dict(parcel), "deeds": rows_to_dicts(deeds), "mutations": rows_to_dicts(mutations),
            "cases": rows_to_dicts(cases), "acquisition": rows_to_dicts(acquisition),
            "alerts": rows_to_dicts(alerts), "history": rows_to_dicts(history)
        }
    finally:
        conn.close()

@app.get("/api/alerts")
def alerts(module: Optional[str] = None, severity: Optional[str] = None, limit: int = Query(default=100, ge=1, le=500)):
    conn = get_conn()
    try:
        sql = """
        SELECT r.*, p.district, p.dag_number, p.khatian_number
        FROM risk_alerts r JOIN land_parcels p ON p.parcel_id=r.parcel_id WHERE 1=1
        """
        params = []
        if module:
            sql += " AND r.module=?"
            params.append(module.upper())
        if severity:
            sql += " AND r.severity=?"
            params.append(severity.lower())
        sql += " ORDER BY CASE r.severity WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END, r.alert_id DESC LIMIT ?"
        params.append(limit)
        return rows_to_dicts(conn.execute(sql, params).fetchall())
    finally:
        conn.close()

class CheckRequest(BaseModel):
    parcel_id: str

@app.post("/api/check")
def check_parcel(payload: CheckRequest):
    # Read-only check based on existing synthetic records; this endpoint does not assert legal findings.
    conn = get_conn()
    try:
        parcel = conn.execute("SELECT * FROM land_parcels WHERE parcel_id=?", (payload.parcel_id,)).fetchone()
        if not parcel:
            raise HTTPException(status_code=404, detail="Parcel ID not found in synthetic demo dataset")
        alerts = conn.execute("SELECT * FROM risk_alerts WHERE parcel_id=?", (payload.parcel_id,)).fetchall()
        severity_rank = {"high": 3, "medium": 2, "low": 1}
        highest = max((a["severity"] for a in alerts), key=lambda x: severity_rank.get(x, 0), default="low")
        return {
            "parcel_id": payload.parcel_id,
            "overall_risk": highest,
            "alert_count": len(alerts),
            "alerts": rows_to_dicts(alerts),
            "disclaimer": "Synthetic demo result only. Not an official verification or legal opinion."
        }
    finally:
        conn.close()
