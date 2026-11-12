
from getpass import getpass

from sqlalchemy import func, select, text

from app.core.security import hash_password
from app.database.connection import SessionLocal
from app.models.enums import UserRole
from app.models.user import User


def create_first_admin():
    email = input("Enter administrator email: ").strip().lower()

    if not email or "@" not in email:
        print("Invalid email address.")
        return

    password = getpass("Enter administrator password: ")
    confirm_password = getpass("Confirm administrator password: ")

    if len(password) < 8:
        print("Password must contain at least 8 characters.")
        return

    if password != confirm_password:
        print("Passwords do not match.")
        return

    db = SessionLocal()

    try:
        with db.begin():
            # PostgreSQL transaction-level lock prevents simultaneous bootstraps.
            db.execute(
                text("SELECT pg_advisory_xact_lock(hashtext('careerconnect_admin_bootstrap'))")
            )

            existing_admin = db.scalar(
                select(User.id).where(User.role == UserRole.ADMIN).limit(1)
            )

            if existing_admin:
                print("An administrator already exists. Bootstrap refused.")
                return

            existing_user = db.scalar(
                select(User.id).where(func.lower(User.email) == email)
            )

            if existing_user:
                print("This email is already registered. Bootstrap refused.")
                return

            admin = User(
                email=email,
                hashed_password=hash_password(password),
                role=UserRole.ADMIN,
                is_active=True,
                is_verified=True,
            )

            db.add(admin)
            db.flush()

            print("Administrator account created successfully.")
            print(f"Admin email: {email}")
            print("You can now log in using the normal login API.")

    except Exception as error:
        print(f"Could not create administrator: {error}")

    finally:
        db.close()


if __name__ == "__main__":
    create_first_admin()
