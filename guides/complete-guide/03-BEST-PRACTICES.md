# Best Practices Guide

## General Principles

1. **Start Simple**: Master basics before advanced features
2. **Iterate**: Build incrementally, test frequently
3. **Document**: Explain your custom tools for future use
4. **Version Control**: Track changes to configurations
5. **Security First**: Never commit secrets, use environment variables

## Skills Best Practices

### ✅ DO
- Write specific, trigger-word-rich descriptions
- Use progressive disclosure
- Include concrete examples
- Test thoroughly before sharing
- Document dependencies

### ❌ DON'T
- Make descriptions too vague
- Include everything in SKILL.md
- Forget to test activation
- Hardcode sensitive data
- Mix multiple concerns

## Sub-agents Best Practices

### ✅ DO
- Give single, clear responsibility
- Restrict tools to minimum needed
- Use skills for detailed knowledge
- Test in isolation
- Document when to use

### ❌ DON'T
- Give too many responsibilities
- Grant all tools by default
- Duplicate content in prompt
- Create circular dependencies
- Forget error handling

## MCP Best Practices

### ✅ DO
- Use environment variables for secrets
- Choose appropriate scope (user/project/local)
- Monitor performance
- Test connections
- Document setup steps

### ❌ DON'T
- Commit API keys
- Over-grant permissions
- Install untrusted servers
- Ignore connection errors
- Skip documentation

## Hooks Best Practices

### ✅ DO
- Start with simple hooks
- Test commands manually first
- Handle errors gracefully
- Keep hooks fast
- Document purpose

### ❌ DON'T
- Create complex hooks initially
- Block main workflow
- Ignore failures silently
- Run expensive operations
- Leave hooks undocumented

## Performance Tips

1. **Context Management**
   - Use `/compact` regularly
   - Keep CLAUDE.md concise
   - Disable unused MCP servers

2. **Token Optimization**
   - Reference skills for details
   - Use sub-agents for isolation
   - Keep prompts focused

3. **Speed Improvements**
   - Enable only needed tools
   - Use appropriate models
   - Minimize hook operations

## Security Guidelines

1. **Never Commit**
   - API keys
   - Passwords
   - Tokens
   - Personal data

2. **Use Environment Variables**
   ```json
   {
     "env": {
       "API_KEY": "${MY_API_KEY}"
     }
   }
   ```

3. **Review Before Installing**
   - Check skill code
   - Verify MCP servers
   - Inspect plugin contents

4. **Minimum Permissions**
   - Grant least access needed
   - Use read-only when possible
   - Scope appropriately

## Team Collaboration

1. **Share via Plugins**
   - Bundle related tools
   - Version properly
   - Document thoroughly

2. **Use Project Scope**
   - Project skills for team
   - Project MCP configs
   - Shared commands

3. **Document Workflows**
   - How to set up
   - When to use what
   - Common patterns

4. **Maintain Consistency**
   - Code standards in skills
   - Naming conventions
   - File organization
