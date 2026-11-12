from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.job_category import JobCategory
from app.models.skill import Skill

router = APIRouter()


@router.get("/categories")
def get_categories(db: Session = Depends(get_db)):
    categories = db.scalars(
        select(JobCategory).order_by(JobCategory.name.asc())
    ).all()

    return [
        {
            "id": str(item.id),
            "name": item.name,
            "slug": item.slug,
            "description": item.description,
        }
        for item in categories
    ]


@router.get("/skills")
def get_skills(db: Session = Depends(get_db)):
    skills = db.scalars(
        select(Skill).order_by(Skill.name.asc())
    ).all()

    return [
        {
            "id": str(item.id),
            "name": item.name,
        }
        for item in skills
    ]
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.job_category import JobCategory
from app.models.skill import Skill

router = APIRouter()


@router.get("/categories")
def get_categories(db: Session = Depends(get_db)):
    categories = db.scalars(
        select(JobCategory).order_by(JobCategory.name.asc())
    ).all()

    return [
        {
            "id": str(item.id),
            "name": item.name,
            "slug": item.slug,
            "description": item.description,
        }
        for item in categories
    ]


@router.get("/skills")
def get_skills(db: Session = Depends(get_db)):
    skills = db.scalars(
        select(Skill).order_by(Skill.name.asc())
    ).all()

    return [
        {
            "id": str(item.id),
            "name": item.name,
        }
        for item in skills
    ]