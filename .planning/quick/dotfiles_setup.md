---
phase: 06-dotfiles
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - "/var/home/dilelu/Bazzite-dotfile"
  - "/var/home/dilelu/.bashrc"
  - "/var/home/dilelu/.gitconfig"
autonomous: true
requirements: [DOTFILES-01]
must_haves:
  truths:
    - "The directory ~/Bazzite-dotfile is a Git repository on branch 'master'"
    - "The remote is set to https://github.com/dilelu94/Bazzite-dotfile"
    - "~/.bashrc and ~/.gitconfig are symbolic links pointing to the repo"
    - "The repo contains 'bash' and 'git' packages for Stow"
    - "All changes are pushed to GitHub without a .gitignore file"
  artifacts:
    - path: "/var/home/dilelu/Bazzite-dotfile/bash/.bashrc"
      provides: "Version-controlled bash configuration"
    - path: "/var/home/dilelu/Bazzite-dotfile/git/.gitconfig"
      provides: "Version-controlled git configuration"
  key_links:
    - from: "/var/home/dilelu/.bashrc"
      to: "/var/home/dilelu/Bazzite-dotfile/bash/.bashrc"
      via: "symbolic link (GNU Stow)"
    - from: "/var/home/dilelu/.gitconfig"
      to: "/var/home/dilelu/Bazzite-dotfile/git/.gitconfig"
      via: "symbolic link (GNU Stow)"
---

<objective>
Initialize a GNU Stow managed dotfiles repository in ~/Bazzite-dotfile to centralize system configuration on Bazzite. 
Purpose: Portable, version-controlled dotfiles with automated backup.
Output: A working Git repository synced to GitHub with managed symlinks.
</objective>

<execution_context>
@$HOME/.gemini/get-shit-done/workflows/execute-plan.md
@$HOME/.gemini/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/ROADMAP.md
@.planning/STATE.md
@~/.bashrc
@~/.gitconfig
</context>

<tasks>

<task type="auto">
  <name>Task 1: Initialize Dotfiles Repository</name>
  <files>/var/home/dilelu/Bazzite-dotfile</files>
  <action>
    - Create the directory `/var/home/dilelu/Bazzite-dotfile`.
    - Initialize a git repository with `git init -b master`.
    - Add the remote origin: `git remote add origin https://github.com/dilelu94/Bazzite-dotfile`.
    - Update `.planning/STATE.md` to reflect the new phase and repository initialization.
  </action>
  <verify>
    <automated>cd ~/Bazzite-dotfile && git branch --show-current && git remote -v</automated>
  </verify>
  <done>Repo is initialized on master branch with the correct remote.</done>
</task>

<task type="auto">
  <name>Task 2: Organize for Stow and Symlink</name>
  <files>/var/home/dilelu/Bazzite-dotfile/bash/.bashrc, /var/home/dilelu/Bazzite-dotfile/git/.gitconfig</files>
  <action>
    - Create directories `bash` and `git` inside `~/Bazzite-dotfile`.
    - Move `/var/home/dilelu/.bashrc` to `/var/home/dilelu/Bazzite-dotfile/bash/.bashrc`.
    - Move `/var/home/dilelu/.gitconfig` to `/var/home/dilelu/Bazzite-dotfile/git/.gitconfig`.
    - From `~/Bazzite-dotfile`, run `stow bash` and `stow git`.
  </action>
  <verify>
    <automated>ls -l ~/.bashrc ~/.gitconfig | grep "Bazzite-dotfile"</automated>
  </verify>
  <done>Files are moved to the repo and symlinked back to the home directory.</done>
</task>

<task type="auto">
  <name>Task 3: Commit and Push (No .gitignore)</name>
  <files>/var/home/dilelu/Bazzite-dotfile</files>
  <action>
    - Ensure NO `.gitignore` exists in `~/Bazzite-dotfile` (per GEMINI.md).
    - Add all files: `git add .`.
    - Create an atomic commit: `git commit -m "feat(dotfiles): initialize repo with bash and git configs"`.
    - Push to GitHub: `git push -u origin master`.
    - Update `.planning/STATE.md` to reflect the successful sync.
  </action>
  <verify>
    <automated>cd ~/Bazzite-dotfile && git log -1 && git remote show origin | grep "pushed"</automated>
  </verify>
  <done>Dotfiles are committed and pushed to GitHub. .gitignore is NOT present.</done>
</task>

</tasks>

<verification>
Check that symlinks are valid and Git status is clean in the new repo.
</verification>

<success_criteria>
- ~/Bazzite-dotfile exists and is a Git repo.
- ~/.bashrc and ~/.gitconfig are managed by Stow.
- Repo is pushed to https://github.com/dilelu94/Bazzite-dotfile.
- No .gitignore file exists in the repository.
</success_criteria>

<output>
After completion, create `.planning/phases/06-dotfiles/06-01-SUMMARY.md`
</output>
