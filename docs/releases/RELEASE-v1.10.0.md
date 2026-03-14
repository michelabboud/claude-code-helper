# Release v1.10.0 - RAG MCP v1.3.0: Dynamic Model Variants

**User-selectable embedding models and Transformers v3.x upgrade for the RAG MCP server.**

---

## What's New

### Model Variant Selection

The RAG MCP server now supports multiple embedding model variants, letting users choose between accuracy and resource efficiency:

| Variant | Size | Speed | Accuracy | Use Case |
|---------|------|-------|----------|----------|
| **Default** | 90.4 MB | 8.5ms | Best | Production, accuracy-critical workloads |
| **Quantized INT8** | 23 MB | 6.8ms | ~99% of default | Resource-constrained environments, faster startup |

Configure via the `MODEL_VARIANT` environment variable:

```bash
# Use default (highest accuracy)
MODEL_VARIANT=default node build/index.js

# Use quantized (75% smaller, 20% faster)
MODEL_VARIANT=quantized node build/index.js
```

### Transformers Library Upgrade

Upgraded from `@xenova/transformers@2.17.2` to `@huggingface/transformers@3.8.1`:

- Official Hugging Face package with active maintenance
- Improved model loading and inference performance
- Better compatibility with newer embedding models
- Reduced memory footprint during inference

### Management Script

New `rag-server.sh` management script for simplified server operations:

```bash
# Start the RAG server with default model
./rag-server.sh start

# Start with quantized model
./rag-server.sh start --quantized

# Check server status
./rag-server.sh status
```

---

## Performance Comparison

Benchmarks comparing default vs quantized model variants:

| Metric | Default | Quantized INT8 | Difference |
|--------|---------|----------------|------------|
| Model size | 90.4 MB | 23 MB | 75% smaller |
| Embedding latency | 8.5ms | 6.8ms | 20% faster |
| Quality (cosine similarity) | 1.000 | ~0.990 | Zero practical loss |
| Memory usage | Higher | Lower | Significant reduction |

---

## Files Changed

### Added
| File | Description |
|------|-------------|
| `mcp-servers/rag-mcp/MODEL-VARIANTS.md` | Documentation for model variant selection |
| `mcp-servers/rag-mcp/.env.template` | Environment variable template with `MODEL_VARIANT` |
| `mcp-servers/rag-mcp/rag-server.sh` | Server management script |
| `mcp-servers/rag-mcp/TEST-RESULTS-V3.md` | Benchmark results for Transformers v3.x |
| `docs/releases/RELEASE-v1.10.0.md` | This release notes file |

### Modified
| File | Change |
|------|--------|
| `mcp-servers/rag-mcp/package.json` | Updated to `@huggingface/transformers@3.8.1` |
| `mcp-servers/rag-mcp/src/` | Updated import paths and model loading logic |

---

## Version History

| Version | Date | Focus |
|---------|------|-------|
| v1.3.0 | 2026-01-10 | Complete MCP ecosystem |
| v1.3.1 | 2026-01-11 | Documentation suite |
| v1.3.2 | 2026-01-11 | Test automation |
| v1.4.0 | 2026-01-11 | MCP configuration modernization |
| v1.5.0 | 2026-01-11 | Agent loop prevention |
| v1.6.0 | 2026-01-11 | Solving AI coding problems |
| v1.7.0 | 2026-01-11 | RAG MCP Server |
| v1.8.0 | 2026-01-30 | CLI v2.1.22 compatibility update |
| v1.9.0 | 2026-02-20 | CLI v2.1.47 compatibility update |
| v1.9.2 | — | Standardized credits & attribution |
| v1.10.0 | — | **RAG MCP v1.3.0: Dynamic Model Variants** |

---

## Credits

**Author:** [Michel Abboud](https://github.com/michelabboud)
**AI Assistance:** Claude (Anthropic)
**License:** Apache-2.0

---

**"Smaller models, faster embeddings, same quality"**
