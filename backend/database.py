from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

# Get the Database URL from .env file
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

# Create the Database Engine
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# Create a SessionLocal class (each instance is a database session)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for our models (we will use this later to create User tables)
Base = declarative_base()

# Dependency to get the database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()