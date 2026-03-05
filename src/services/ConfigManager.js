import fs from 'fs';

class ConfigManager {
  constructor() {
    this.config = {
      user: null
    };
  }

  setUser(user) {
    this.config.user = user;
  }

  getUser() {
    return this.config.user;
  }

  save(filePath, config) {
    fs.writeFileSync(filePath, JSON.stringify(config, null, 2));
  }

  load(filePath) {
    if (!fs.existsSync(filePath)) {
      return {};
    }
    const data = fs.readFileSync(filePath, 'utf8');
    this.config = JSON.parse(data);
    return this.config;
  }
}

export default new ConfigManager();
