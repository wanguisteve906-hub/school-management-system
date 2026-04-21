"""Ensure tables exist. Use Sign up in the app to create staff — no demo accounts."""

from database import Base, engine


def seed():
    Base.metadata.create_all(bind=engine)
    print("Database tables ready. Register staff in the app (Sign up). No demo users are seeded.")


if __name__ == "__main__":
    seed()
