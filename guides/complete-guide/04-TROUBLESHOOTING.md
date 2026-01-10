# Troubleshooting Guide

## Common Issues

### Installation Issues

**Problem:** `command not found: claude`

**Solutions:**
```bash
# Check PATH
echo $PATH

# Reinstall
curl -fsSL https://cli.claude.ai/install.sh | sh

# Add to PATH manually
export PATH="$HOME/.claude/bin:$PATH"
```

### Authentication Issues

**Problem:** "Authentication failed"

**Solutions:**
1. Re-login: `/login`
2. Check account status at claude.ai
3. Clear credentials and re-authenticate

### Skill Not Loading

**Problem:** Skill doesn't activate

**Checklist:**
- [ ] File in correct location
- [ ] Valid YAML frontmatter
- [ ] Clear description with triggers
- [ ] Restarted Claude Code

**Debug:**
```bash
claude
> What skills are available?
> Use the [skill-name] skill explicitly
```

### Sub-agent Not Available

**Problem:** Can't invoke sub-agent

**Checklist:**
- [ ] File in `.claude/agents/`
- [ ] Valid YAML frontmatter
- [ ] Used `/agents` to verify

**Solution:**
```bash
# List available agents
/agents

# Check file location
ls -la .claude/agents/

# Restart Claude Code
```

### MCP Connection Failed

**Problem:** MCP server won't connect

**Debug Steps:**
1. Test command manually:
   ```bash
   npx @modelcontextprotocol/server-github
   ```

2. Check configuration:
   ```bash
   claude mcp get server-name
   ```

3. Verify environment variables:
   ```bash
   echo $GITHUB_TOKEN
   ```

4. Check logs:
   ```bash
   claude --debug
   ```

### Hook Not Triggering

**Problem:** Hook doesn't run

**Checklist:**
- [ ] Valid JSON in settings.json
- [ ] Correct matcher pattern
- [ ] Command works manually
- [ ] File permissions correct

**Test:**
```bash
# Run command manually
npm run lint:fix src/file.ts

# Check hooks config
cat .claude/settings.json

# Enable debug mode
claude --debug
```

### Performance Issues

**Problem:** Claude Code is slow

**Solutions:**
1. Reduce MCP servers:
   ```bash
   # Disable unused
   /mcp
   ```

2. Compact context:
   ```bash
   /compact
   ```

3. Clear old sessions

4. Reduce skill complexity

5. Monitor tokens:
   ```bash
   /stats
   ```

## Error Messages

### "Permission denied"

**Cause:** Tool permissions issue

**Solution:**
- Check allowed-tools in command/agent
- Grant necessary permissions
- Use appropriate permission mode

### "Tool not found"

**Cause:** Tool not available

**Solution:**
- Check tool spelling
- Verify tool is supported
- Check MCP server status

### "Context limit exceeded"

**Cause:** Too much conversation history

**Solution:**
- Use `/compact`
- Start new session: `/clear`
- Reduce CLAUDE.md size
- Use sub-agents for isolation

### "Invalid YAML"

**Cause:** Frontmatter syntax error

**Solution:**
```yaml
# ❌ Wrong
---
name: test
description: Test  # Missing quotes with special chars
---

# ✅ Correct
---
name: test
description: "Test: with special chars"
---
```

## Getting Help

1. **Check Official Docs**
   - https://code.claude.com/docs
   - https://docs.claude.com

2. **Enable Debug Mode**
   ```bash
   claude --debug
   ```

3. **Community Support**
   - r/ClaudeAI subreddit
   - Discord communities
   - GitHub discussions

4. **Report Bugs**
   - GitHub issues
   - Support tickets
   - Feedback in Claude.ai
