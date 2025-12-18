# Git Workflow Guide

## Branch Structure
- **`main`** - Protected branch (production-ready code)
- **`dev`** - Development branch (all new work happens here)

## Daily Workflow

### 1. Make sure you're on dev branch
```bash
git checkout dev
```

### 2. Pull latest changes (if working with team)
```bash
git pull origin dev
```

### 3. Make your changes to files

### 4. Stage and commit your changes
```bash
git add .
git commit -m "Description of your changes"
```

### 5. Push to dev branch
```bash
git push origin dev
```

### 6. Create Pull Request on GitHub
- Go to: https://github.com/AlmutairiAhmed/h3-poc/pulls
- Click "New Pull Request"
- Select: `dev` → `main`
- Add description
- Click "Create Pull Request"
- Review and merge when ready

## Quick Commands Reference

**Check current branch:**
```bash
git branch
```

**Switch to dev:**
```bash
git checkout dev
```

**See what files changed:**
```bash
git status
```

**See commit history:**
```bash
git log --oneline
```

## Important Notes
- ✅ Always work on `dev` branch
- ✅ Never commit directly to `main` (it's protected)
- ✅ Use Pull Requests to merge `dev` → `main`
- ✅ Write clear commit messages

