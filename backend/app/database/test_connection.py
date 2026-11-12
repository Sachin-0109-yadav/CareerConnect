
from sqlalchemy import text

from app.database.connection import engine


def test_database_connection():
    try:
        with engine.connect() as connection:
            result = connection.execute(
                text("SELECT current_database(), version()")
            )

            database_name, version = result.fetchone()

            print("PostgreSQL connection successful!")
            print("Database:", database_name)
            print("Version:", version)

    except Exception as error:
        print("Database connection failed!")
        print(error)
        raise


if __name__ == "__main__":
    test_database_connection()
