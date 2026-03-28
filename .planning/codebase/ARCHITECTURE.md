# System Architecture

The environment is a hybrid of a standard Linux home directory and a software development workstation.

- **Frontend Component**: A React-based application is implied by the presence of `react-router-dom` and `package-lock.json`.
- **System Tooling Layer**: A suite of shell scripts and Python tools handles system automation (lights, browser tabs, system replication).
- **Environment Management**: Bun and Cargo are present for modern JavaScript and Rust environment management.
- **Game/App Distribution**: Integration with Steam, Lutris, and custom AppImages.
- **State Management**: Distributed across `.config`, `.local`, and various dotfiles.
