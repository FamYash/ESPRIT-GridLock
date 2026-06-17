from fastapi import APIRouter
from sqlalchemy import text
from app.core.database import engine

router = APIRouter()

@router.get("/test-db")
def test_db():

    with engine.connect() as conn:

        result = conn.execute(
            text("SELECT COUNT(*) FROM parking_violations")
        )

        count = result.scalar()

    return {
        "database": "connected",
        "records": count
    }