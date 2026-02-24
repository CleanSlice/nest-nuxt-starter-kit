---
name: setup
description: Install required development skills for the CleanSlice starter kit. Run this when setting up Claude Code for the first time in this project.
---

# Setup Development Skills

Install the required agent skills for CleanSlice development.

## Required Skills

| Skill | Purpose | Install Command |
|-------|---------|-----------------|
| **shadcn-vue** | UI component library guidance (Reka UI, Tailwind, dark mode) | `npx playbooks add skill noartem/skills --skill shadcn-vue` |
| **cleanslice** | Architecture patterns (vertical slices, gateway, Provider.vue) | `npx skills add CleanSlice/skills --skill cleanslice` |
| **conventional-commits** | Conventional Commits standard for git messages | `npx skillfish add bbgnsurftech/claude-skills-collection conventional-commits` |

## Instructions

Run these commands in order:

```bash
npx playbooks add skill noartem/skills --skill shadcn-vue
```

```bash
npx skills add CleanSlice/skills --skill cleanslice
```

```bash
npx skillfish add bbgnsurftech/claude-skills-collection conventional-commits
```

After all commands complete, inform the user that the skills have been installed and they need to **restart the Claude Code session** to activate them.
