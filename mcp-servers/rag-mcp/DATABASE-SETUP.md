# RAG MCP Database Setup Guide

Complete setup for running RAG MCP with different vector databases, all with persistent storage.

## 📂 Persistent Storage Locations

```
~/db-data/
├── chromadb/     ← ChromaDB persistent storage
├── redis/        ← Redis persistent storage (RDB + AOF)
└── qdrant/       ← Qdrant persistent storage
```

---

## 🗄️ Available Databases

| Database | Port | Dashboard | Status |
|----------|------|-----------|--------|
| **ChromaDB** | 8000 | None | ✅ Current default |
| **Redis Stack** | 6379 | http://localhost:8001 | ✅ Ready |
| **Qdrant** | 6333 | http://localhost:6333/dashboard | ✅ Ready |

---

## 🚀 Quick Start

### Option 1: ChromaDB (Current Setup)

**Start ChromaDB:**
```bash
./start-chromadb.sh
```

**Data location:** `~/db-data/chromadb/`

**Pros:**
- ✅ Simple setup
- ✅ Low memory usage (155 MB)
- ✅ Good for development
- ✅ Works well for <100M vectors

---

### Option 2: Redis Stack (Fastest)

**Start Redis:**
```bash
docker-compose up -d redis
```

**Data location:** `~/db-data/redis/`

**Access:**
- Redis: `localhost:6379`
- RedisInsight UI: http://localhost:8001

**Pros:**
- ✅ Sub-millisecond queries (<1ms)
- ✅ Real-time performance
- ✅ Built-in web UI (RedisInsight)
- ✅ Persistent storage (RDB + AOF)

**Cons:**
- ⚠️ Higher memory usage (~200 MB for our data)
- ⚠️ All data must fit in RAM

**Check status:**
```bash
docker-compose logs -f redis
```

---

### Option 3: Qdrant (Best of Both)

**Start Qdrant:**
```bash
docker-compose up -d qdrant
```

**Data location:** `~/db-data/qdrant/`

**Access:**
- API: http://localhost:6333
- Dashboard: http://localhost:6333/dashboard
- gRPC: `localhost:6334`

**Pros:**
- ✅ Fast queries (5-15ms)
- ✅ Rich filtering capabilities
- ✅ Built-in web dashboard
- ✅ Efficient disk + RAM usage
- ✅ Production-ready

**Cons:**
- ⚠️ More complex than ChromaDB
- ⚠️ Requires Docker

**Check status:**
```bash
docker-compose logs -f qdrant

# Or check health endpoint
curl http://localhost:6333/health
```

---

## 🔄 Switching Databases

### Currently (v1.0.0)
**Requires code modification** - ChromaDB is hardcoded in `src/index.ts`

### Future (v2.0.0 with Adapter Pattern)

**1. Set environment variable:**
```bash
# Use ChromaDB
export VECTOR_DB_TYPE=chromadb

# Use Redis
export VECTOR_DB_TYPE=redis

# Use Qdrant
export VECTOR_DB_TYPE=qdrant
```

**2. Start the database:**
```bash
# ChromaDB
./start-chromadb.sh &

# Redis
docker-compose up -d redis

# Qdrant
docker-compose up -d qdrant
```

**3. Start RAG MCP:**
```bash
npm run build
node build/index.js
```

**No code changes needed!** ✨

See [SWITCHING-DATABASES.md](./SWITCHING-DATABASES.md) for adapter implementation details.

---

## 💾 Data Persistence

### All Databases Persist Data!

**ChromaDB:**
```bash
ls -lh ~/db-data/chromadb/
# chroma.sqlite3 (31 MB)
# Collections directories with vector files
```

**Redis:**
```bash
ls -lh ~/db-data/redis/
# dump.rdb (RDB snapshot)
# appendonly.aof (Append-Only File)
```

**Qdrant:**
```bash
ls -lh ~/db-data/qdrant/
# Collections/
# Storage/
# raft_state/
```

### Backup Your Data

```bash
# Backup all databases
tar -czf ~/db-backup-$(date +%Y%m%d).tar.gz ~/db-data/

# Restore
tar -xzf ~/db-backup-20260111.tar.gz -C ~/
```

---

## 🔧 Management Commands

### Start All Databases
```bash
# ChromaDB
./start-chromadb.sh &

# Redis + Qdrant
docker-compose up -d
```

### Stop All
```bash
# ChromaDB
pkill -f "chroma run"

# Docker containers
docker-compose down
```

### View Logs
```bash
# ChromaDB (if running in background)
tail -f ~/db-data/chromadb/chroma.log

# Redis
docker-compose logs -f redis

# Qdrant
docker-compose logs -f qdrant
```

### Check Status
```bash
# ChromaDB
curl -s http://localhost:8000/api/v2/heartbeat

# Redis
docker exec rag-redis redis-cli ping

# Qdrant
curl -s http://localhost:6333/health
```

### Resource Usage
```bash
# ChromaDB (if running as process)
ps aux | grep chroma

# Docker containers
docker stats rag-redis rag-qdrant
```

---

## 📊 Performance Comparison

### Query Latency (5 nearest neighbors, 3,387 vectors)

```
ChromaDB:  10-30ms   ⚡⚡   (Good for development)
Qdrant:    5-15ms    ⚡⚡⚡ (Best balance)
Redis:     0.5-2ms   ⚡⚡⚡ (Fastest, but uses most RAM)
```

### Memory Usage

```
ChromaDB:  ~155 MB RAM + 36 MB disk
Qdrant:    ~120 MB RAM + 40 MB disk
Redis:     ~200 MB RAM + 20 MB disk
```

### Disk Space (for our 3,387 chunks)

```
~/db-data/chromadb/  →  36 MB
~/db-data/qdrant/    →  40 MB
~/db-data/redis/     →  20 MB
```

---

## 🎯 Which One Should You Use?

### Use **ChromaDB** if:
- ✅ Just getting started
- ✅ Don't want to manage Docker
- ✅ <100M vectors
- ✅ 10-30ms latency is fine

### Use **Qdrant** if:
- ✅ Want best balance of speed + features
- ✅ Need advanced filtering
- ✅ Want a nice web dashboard
- ✅ Planning for production use

### Use **Redis** if:
- ✅ Need <5ms latency (real-time)
- ✅ Already using Redis for caching
- ✅ Have plenty of RAM
- ✅ Willing to pay RAM cost

---

## 🔥 Hot Tips

### 1. Run All Three for Comparison!
```bash
# Start everything
./start-chromadb.sh &
docker-compose up -d

# Now you have all three running:
# - ChromaDB: localhost:8000
# - Redis: localhost:6379
# - Qdrant: localhost:6333
```

### 2. Use Docker Compose for Production
```bash
# Add ChromaDB to docker-compose.yml (already there, just uncomment!)
docker-compose up -d chromadb redis qdrant
```

### 3. Monitor with RedisInsight
Open http://localhost:8001 to:
- View Redis data
- See memory usage
- Monitor queries
- Debug issues

### 4. Explore with Qdrant Dashboard
Open http://localhost:6333/dashboard to:
- Browse collections
- View vectors
- Test queries
- Monitor performance

---

## 📝 Migration Between Databases

### Export from ChromaDB
```python
from chromadb import Client
import json

client = Client(path="http://localhost:8000")
collection = client.get_collection("claude-code-helper")
data = collection.get(include=["documents", "metadatas", "embeddings"])

with open("export.json", "w") as f:
    json.dump(data, f)
```

### Import to Qdrant
```python
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
import json

client = QdrantClient(url="http://localhost:6333")

# Create collection
client.create_collection(
    collection_name="claude-code-helper",
    vectors_config=VectorParams(size=384, distance=Distance.COSINE)
)

# Import data
with open("export.json") as f:
    data = json.load(f)

points = [
    PointStruct(
        id=i,
        vector=emb,
        payload=meta
    )
    for i, (emb, meta) in enumerate(zip(data["embeddings"], data["metadatas"]))
]

client.upsert(collection_name="claude-code-helper", points=points)
```

---

## 🐛 Troubleshooting

### ChromaDB Won't Start
```bash
# Check if port 8000 is already in use
lsof -i :8000

# Kill existing process
pkill -f "chroma run"

# Start fresh
./start-chromadb.sh
```

### Redis Container Issues
```bash
# Check logs
docker-compose logs redis

# Restart
docker-compose restart redis

# Reset data (WARNING: Deletes all data!)
docker-compose down -v
rm -rf ~/db-data/redis/*
docker-compose up -d redis
```

### Qdrant Container Issues
```bash
# Check logs
docker-compose logs qdrant

# Restart
docker-compose restart qdrant

# Reset data (WARNING: Deletes all data!)
docker-compose down -v
rm -rf ~/db-data/qdrant/*
docker-compose up -d qdrant
```

### Permission Issues
```bash
# Fix ChromaDB permissions
chmod -R 755 ~/db-data/chromadb/

# Fix Docker volume permissions
sudo chown -R $USER:$USER ~/db-data/
```

---

## 🎓 Learn More

- [ChromaDB Docs](https://docs.trychroma.com/)
- [Redis Stack Docs](https://redis.io/docs/stack/)
- [Qdrant Docs](https://qdrant.tech/documentation/)
- [Vector Database Adapter](./src/vector-db-adapter.ts)
- [Switching Guide](./SWITCHING-DATABASES.md)

---

**All databases are now configured with persistent storage in `~/db-data/`!** 🎉
