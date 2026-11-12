
from sqlalchemy import select, or_

from app.database.connection import SessionLocal
from app.models.job_category import JobCategory
from app.models.skill import Skill


CATEGORIES = [
    {
        "name": "Software Development",
        "slug": "software-development",
        "description": "Software engineering, application and web development roles.",
    },
    {
        "name": "Data Science and AI",
        "slug": "data-science-ai",
        "description": "Data science, machine learning and artificial intelligence roles.",
    },
    {
        "name": "Cybersecurity",
        "slug": "cybersecurity",
        "description": "Information security and cybersecurity roles.",
    },
    {
        "name": "Cloud and DevOps",
        "slug": "cloud-devops",
        "description": "Cloud infrastructure, platform engineering and DevOps roles.",
    },
    {
        "name": "UI/UX Design",
        "slug": "ui-ux-design",
        "description": "User interface and user experience design roles.",
    },
    {
        "name": "Product and Project Management",
        "slug": "product-project-management",
        "description": "Product ownership and project management roles.",
    },
    {
        "name": "Sales and Marketing",
        "slug": "sales-marketing",
        "description": "Sales, digital marketing and business development roles.",
    },
    {
        "name": "Finance and Accounting",
        "slug": "finance-accounting",
        "description": "Finance, accounting and financial analysis roles.",
    },
    {
        "name": "Human Resources",
        "slug": "human-resources",
        "description": "Recruitment and human resource management roles.",
    },
    {
        "name": "Customer Support",
        "slug": "customer-support",
        "description": "Customer service and technical support roles.",
    },
]


SKILLS = [
    "Python",
    "Java",
    "JavaScript",
    "TypeScript",
    "C",
    "C++",
    "C#",
    "React",
    "Node.js",
    "FastAPI",
    "Django",
    "HTML",
    "CSS",
    "SQL",
    "PostgreSQL",
    "MySQL",
    "MongoDB",
    "REST APIs",
    "Git",
    "GitHub",
    "Docker",
    "Kubernetes",
    "AWS",
    "Microsoft Azure",
    "Linux",
    "Machine Learning",
    "Deep Learning",
    "Artificial Intelligence",
    "Pandas",
    "NumPy",
    "Data Analysis",
    "Power BI",
    "Tableau",
    "Figma",
    "Agile",
    "Communication",
]


def seed_database():
    added_categories = 0
    added_skills = 0

    with SessionLocal() as db:
        try:
            for category_data in CATEGORIES:
                existing_category = db.scalar(
                    select(JobCategory).where(
                        or_(
                            JobCategory.slug == category_data["slug"],
                            JobCategory.name == category_data["name"],
                        )
                    )
                )

                if existing_category is None:
                    db.add(JobCategory(**category_data))
                    added_categories += 1

            for skill_name in SKILLS:
                existing_skill = db.scalar(
                    select(Skill).where(
                        Skill.name == skill_name
                    )
                )

                if existing_skill is None:
                    db.add(Skill(name=skill_name))
                    added_skills += 1

            db.commit()

            print("CareerConnect seed completed successfully!")
            print(f"New categories added: {added_categories}")
            print(f"New skills added: {added_skills}")

        except Exception:
            db.rollback()
            raise


if __name__ == "__main__":
    seed_database()
