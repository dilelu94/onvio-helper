import fs from 'fs';

class ConfigManager {
  constructor() {
    this.config = {
      user: null,
      password: null,
      companies: []
    };
  }

  setUser(user) { this.config.user = user; }
  getUser() { return this.config.user; }
  setPassword(password) { this.config.password = password; }
  getPassword() { return this.config.password; }
  getCompanies() { return this.config.companies || []; }

  addCompany(companyName, alias = '') {
    if (!this.config.companies) this.config.companies = [];
    const newCompany = {
      name: companyName,
      alias: alias || companyName, // Si no hay alias, usa el nombre
      id: `id-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    };
    this.config.companies.push(newCompany);
    return newCompany;
  }

  updateCompany(id, newData) {
    this.config.companies = this.config.companies.map(c => 
      c.id === id ? { ...c, ...newData } : c
    );
  }

  removeCompany(id) {
    this.config.companies = this.config.companies.filter(company => company.id !== id);
  }

  save(filePath, config = this.config) {
    fs.writeFileSync(filePath, JSON.stringify(config, null, 2));
  }

  load(filePath) {
    if (!fs.existsSync(filePath)) return this.config;
    const data = fs.readFileSync(filePath, 'utf8');
    this.config = JSON.parse(data);
    return this.config;
  }
}

export default new ConfigManager();
