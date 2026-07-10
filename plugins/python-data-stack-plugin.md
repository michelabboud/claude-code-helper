---
plugin_name: Python Data Stack Plugin
description: Python + FastAPI + PostgreSQL + Data Engineering tools for data-intensive applications
priority: P1
version: 1.0.1
author: Michel Abboud
license: Apache-2.0
repository: https://github.com/michelabboud/claude-code-helper
issues: https://github.com/michelabboud/claude-code-helper/issues
---

# Python Data Stack Plugin

A comprehensive plugin bundling Python + FastAPI + PostgreSQL + Data Engineering tools for building data-intensive applications, ETL pipelines, and API services.

## Overview

This plugin provides a complete toolkit for Python-based data engineering and API development, combining expert agents, a skill, and an MCP server for database-driven applications and data pipelines.

## Plugin Configuration

```yaml
---
plugin_name: python-data-stack
version: 1.0.1
description: Complete Python + FastAPI + PostgreSQL + Data Engineering toolkit
category: full-stack-data
priority: P1
---
```

## Components Included

### Sub-Agents (3)

#### 1. Python Backend Expert
**Location**: `agents/domain-experts/python-backend-expert.md`

**Specializations**:
- FastAPI, Django, Flask development
- Async/await patterns with asyncio
- Pydantic models and type hints
- SQLAlchemy, Django ORM, Tortoise ORM
- Testing with pytest, fixtures, mocking
- Poetry and pip-tools for dependencies

**When to use**: Building REST APIs, async services, database models

#### 2. Data Engineering Expert
**Location**: `agents/domain-experts/data-engineering-expert.md`

**Specializations**:
- ETL/ELT pipeline design (Apache Airflow, Prefect, Dagster)
- Data warehousing (Snowflake, BigQuery, Redshift)
- Streaming data (Kafka, Flink)
- Data quality and validation (Great Expectations, dbt)
- Data modeling (dimensional modeling, Data Vault)
- Workflow orchestration

**When to use**: Building data pipelines, data quality checks, ETL jobs

#### 3. Database Expert
**Location**: `agents/domain-experts/database-expert.md` (in Modern Web Stack plugin, reused here)

**Specializations**:
- PostgreSQL optimization
- Schema design and migrations
- Query optimization
- Indexing strategies
- Connection pooling
- Database performance tuning

**When to use**: Database design, query optimization, migration creation

### Skills (1)

#### 1. Database Design Patterns
**Location**: `skills/database-design-patterns/SKILL.md`

**Provides**:
- Schema design patterns (normalization, denormalization)
- Migration strategies (zero-downtime, rollback)
- Indexing strategies
- Query optimization techniques
- N+1 query prevention
- Sharding and partitioning

**Use case**: Designing scalable database schemas

### MCP Servers (1)

#### 1. Database Operations MCP
**Location**: `mcp-servers/database-operations/`

**Tools**:
- `run_query`: Execute SQL with safety checks
- `inspect_schema`: Analyze database schema
- `generate_migration`: Create migration files
- `validate_migration`: Check migration safety
- `explain_query`: Get execution plans
- `optimize_query`: Suggest optimizations
- `seed_data`: Generate test data
- `backup_database`: Create database backups with optional compression

**Use case**: Database operations from Claude

## Installation

### Prerequisites
```bash
# Python 3.11+
python --version

# Poetry
curl -sSL https://install.python-poetry.org | python3 -

# PostgreSQL
brew install postgresql@15  # macOS
# OR
sudo apt-get install postgresql-15  # Linux
```

### Setup

1. **Install the sub-agents**:
```bash
cp agents/domain-experts/python-backend-expert.md ~/.claude/agents/
cp agents/domain-experts/data-engineering-expert.md ~/.claude/agents/
cp agents/domain-experts/database-expert.md ~/.claude/agents/
```

2. **Install the skill**:
```bash
cp -r skills/database-design-patterns ~/.claude/skills/
```

3. **Build and register the MCP server**:
```bash
cd mcp-servers/database-operations && npm install && npm run build
# Add to Claude Desktop config — see mcp-servers/README.md for configuration
```

4. **(Optional) Track installed components** (`~/.claude/config/plugins.json`) — this is a local reference file only; Claude Code does not read a unified plugin config, each component above is installed independently by the steps you just ran:
```json
{
  "plugins": {
    "python-data-stack": {
      "enabled": true,
      "agents": ["python-backend-expert", "data-engineering-expert", "database-expert"],
      "skills": ["database-design-patterns"],
      "mcpServers": ["database-operations"]
    }
  }
}
```

5. **Install Python dependencies**:
```bash
pip install fastapi uvicorn sqlalchemy alembic pydantic pytest httpx
```

6. **Configure database connection** (`.env`):
```env
DATABASE_URL=postgresql://user:password@localhost:5432/mydb
REDIS_URL=redis://localhost:6379
```

## Usage Examples

### Example 1: FastAPI + PostgreSQL Application

```bash
# 1. Set up project structure
mkdir user-service && cd user-service
poetry init
poetry add fastapi uvicorn sqlalchemy alembic pydantic
poetry add --group dev pytest httpx

# 2. Design database schema (invoke Database Expert agent)
Ask: "Design a user authentication schema with email verification"

# 3. Generate migration (invoke Database Expert agent, or the database-operations MCP's generate_migration tool)
Ask: "Generate an Alembic migration for the initial schema"

# 4. Apply migration
alembic upgrade head

# 5. Generate API endpoints (invoke Python Backend Expert)
Ask: "Create REST API for user CRUD operations with JWT auth"

# 6. Run tests
pytest tests/ --cov=app --cov-report=html

# 7. Start server
uvicorn app.main:app --reload
```

### Example 2: Data Pipeline with Airflow

```bash
# 1. Set up project structure
mkdir user-analytics && cd user-analytics

# 2. Design ETL pipeline (invoke Data Engineering Expert)
Ask: "Create an ETL pipeline that:
1. Extracts user events from PostgreSQL
2. Transforms data with aggregations
3. Loads into BigQuery data warehouse
4. Runs daily at 2 AM UTC"

# 3. Validate DAG
python dags/user_analytics.py

# 4. Test pipeline
pytest tests/test_user_analytics.py

# 5. Deploy to Airflow
airflow dags test user_analytics_dag 2026-01-10
```

### Example 3: Real-Time Data Processing

```bash
# 1. Design streaming architecture (invoke Data Engineering Expert)
Ask: "Design a real-time pipeline for:
- Kafka topic: user_events
- Process with Flink
- Sink to PostgreSQL and Redis
- 1-minute windowing for aggregations"

# 2. Implement processing logic (invoke Data Engineering Expert)
Ask: "Generate the Flink job for the streaming pipeline described above"

# 3. Test with Docker
docker-compose up kafka flink postgres

# 4. Deploy
kubectl apply -f k8s/flink-deployment.yaml
```

## Typical Workflow

### API Development
```
1. Set up project structure and install dependencies
2. Invoke Database Expert → Design schema
3. Invoke Database Expert, or the database-operations MCP's generate_migration tool → Create migration
4. Invoke Python Backend Expert → Create endpoints
5. Write tests with pytest
6. Run `pytest --cov` locally before committing
7. Run integration tests before pushing
```

### Data Pipeline Development
```
1. Set up project structure
2. Invoke Data Engineering Expert → Design pipeline and generate the Airflow DAG
3. Invoke Database Expert, or the database-operations MCP's optimize_query tool → Optimize queries
4. Invoke Data Engineering Expert → Define data quality checks (e.g. Great Expectations)
5. Run pipeline tests before pushing
6. Deploy with CI/CD
```

## Best Practices

### FastAPI Application Structure
```python
# app/main.py
from fastapi import FastAPI, Depends
from app.routers import users, auth
from app.database import engine, Base

app = FastAPI(title="User Service")

# Create tables
Base.metadata.create_all(bind=engine)

# Include routers
app.include_router(auth.router, prefix="/api/v1/auth")
app.include_router(users.router, prefix="/api/v1/users")

# Health check
@app.get("/health")
async def health():
    return {"status": "healthy"}
```

### Database Models with SQLAlchemy
```python
# app/models/user.py
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
```

### Pydantic Schemas
```python
# app/schemas/user.py
from pydantic import BaseModel, EmailStr
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True  # For SQLAlchemy models
```

### API Endpoint with Dependency Injection
```python
# app/routers/users.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.user import UserCreate, UserResponse
from app.services import user_service

router = APIRouter()

@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    user: UserCreate,
    db: Session = Depends(get_db)
):
    """Create a new user"""
    existing_user = user_service.get_by_email(db, user.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    return user_service.create(db, user)
```

### Testing with pytest
```python
# tests/test_users.py
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.database import Base, get_db

# Test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture
def db():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture
def client(db):
    def override_get_db():
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)

def test_create_user(client):
    response = client.post("/api/v1/users/", json={
        "email": "test@example.com",
        "password": "testpassword123"
    })

    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "test@example.com"
    assert "id" in data
```

## Integration with Other Tools

### Alembic Migrations
```python
# alembic/versions/20260110_add_users_table.py
def upgrade():
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('hashed_password', sa.String(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=True, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)

def downgrade():
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_table('users')
```

### Data Quality with Great Expectations
```python
# expectations/user_data_quality.py
import great_expectations as ge

def validate_users_table(df):
    """Validate users table data quality"""

    # Email format validation
    df.expect_column_values_to_match_regex('email', r'^[\w\.-]+@[\w\.-]+\.\w+$')

    # Unique emails
    df.expect_column_values_to_be_unique('email')

    # No nulls in required fields
    df.expect_column_values_to_not_be_null('email')
    df.expect_column_values_to_not_be_null('hashed_password')

    # Created_at in past
    df.expect_column_values_to_be_between(
        'created_at',
        min_value='2020-01-01',
        max_value=datetime.now()
    )

    return df.validate()
```

## Performance Optimization

### Database Connection Pooling
```python
# app/database.py
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import QueuePool

engine = create_engine(
    DATABASE_URL,
    poolclass=QueuePool,
    pool_size=20,
    max_overflow=0,
    pool_pre_ping=True,  # Verify connections before use
    echo=False  # Set to True for SQL logging
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
```

### Async Endpoints
```python
from fastapi import APIRouter
from app.services import user_service
import asyncio

router = APIRouter()

@router.get("/users/{user_id}/profile")
async def get_user_profile(user_id: int):
    """Fetch user profile with related data in parallel"""

    # Run queries in parallel
    user, posts, followers = await asyncio.gather(
        user_service.get_async(user_id),
        user_service.get_posts_async(user_id),
        user_service.get_followers_async(user_id)
    )

    return {
        "user": user,
        "posts": posts,
        "followers_count": len(followers)
    }
```

## Troubleshooting

### Common Issues

**Issue**: Migration fails with "relation already exists"
```bash
# Solution: Check migration history
alembic history
alembic current
# Manually set current revision if needed
alembic stamp head
```

**Issue**: Connection pool exhausted
```python
# Solution: Increase pool size or find connection leaks
engine = create_engine(DATABASE_URL, pool_size=50, max_overflow=10)

# Check for unclosed sessions
# Ensure all routes use `with get_db() as db:` pattern
```

**Issue**: Slow queries
```bash
# Solution: Use explain_query MCP tool
await mcp.call('explain_query', {
  connection_id: 'prod',
  query: 'SELECT * FROM users WHERE email = $1'
})

# Add missing indexes
CREATE INDEX CONCURRENTLY idx_users_email ON users(email);
```

## Related Resources

- **Modern Web Stack Plugin**: Similar structure for TypeScript/Node.js
- **Database Design Patterns Skill**: Advanced schema design
- **Testing Strategy Guide**: Comprehensive testing approach
- **API Design Patterns Skill**: REST API best practices

**Last Updated**: 2026-07-10
**Status**: Production Ready ✅
**Stack**: Python + FastAPI + PostgreSQL + Airflow + Data Engineering

## Changelog

### 1.0.1 (2026-07-10)
- Removed fictional bundled components that don't exist in this repo: `/scaffold`, `/migrate`, `/data-quality` commands, the Migration Validation / Data Quality Gate / Test Coverage hooks, the "Data Pipeline Patterns" skill, and the Data Pipeline MCP server
- Removed the fictional `cp -r plugins/python-data-stack` install step (no `plugins/<name>/` bundle directory or plugin installer exists in this repo) — replaced with real `cp`/`npm run build` steps for each bundled component
- Fixed the `~/.claude/config/plugins.json` example to list only real components and added the missing `database-expert` agent; clarified it's a local reference file, not a mechanism Claude Code reads
- Reconciled Components to real, verified files only: Python Backend Expert, Data Engineering Expert, and Database Expert agents; Database Design Patterns skill; Database Operations MCP server (added the real `backup_database` tool to its tool list)
- Replaced fictional `/scaffold`, `/migrate` command examples throughout Usage Examples and Typical Workflow with `Ask:` prompts and real CLI/tool steps (Poetry, Alembic, pytest)
- Fixed "Last Updated" date, which predated this changelog's initial 1.0.0 entry

### 1.0.0 (2026-02-20)
- Initial versioned release

---

**Author**: [Michel Abboud](https://github.com/michelabboud)
**License**: Apache-2.0
**Repository**: [claude-code-helper](https://github.com/michelabboud/claude-code-helper)
**Issues & Discussions**: [GitHub Issues](https://github.com/michelabboud/claude-code-helper/issues)
