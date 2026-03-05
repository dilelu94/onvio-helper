import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import ConfigManager from '../../src/services/ConfigManager';
import fs from 'fs';
import path from 'path';

describe('ConfigManager', () => {
  const testConfigPath = path.join(__dirname, 'test-config.json');

  beforeEach(() => {
    if (fs.existsSync(testConfigPath)) {
      fs.unlinkSync(testConfigPath);
    }
  });

  afterEach(() => {
    if (fs.existsSync(testConfigPath)) {
      fs.unlinkSync(testConfigPath);
    }
  });

  it('should store and retrieve the onvio user without hardcoding', () => {
    const user = 'test-user@example.com';
    ConfigManager.setUser(user);
    expect(ConfigManager.getUser()).toBe(user);
  });

  it('should save and load config from a file', () => {
    const config = { user: 'persisted-user@example.com', password: 'secret-password' };
    ConfigManager.save(testConfigPath, config);
    
    const loadedConfig = ConfigManager.load(testConfigPath);
    expect(loadedConfig.user).toBe(config.user);
    expect(loadedConfig.password).toBe(config.password);
  });

  describe('Companies CRUD', () => {
    it('should return an empty array by default for getCompanies', () => {
      expect(ConfigManager.getCompanies()).toEqual([]);
    });

    it('should add a company to the list', () => {
      const company = { name: 'Test Company', id: '123' };
      ConfigManager.addCompany(company);
      expect(ConfigManager.getCompanies()).toContainEqual(company);
    });

    it('should remove a company by its ID', () => {
      const company1 = { name: 'Company 1', id: '1' };
      const company2 = { name: 'Company 2', id: '2' };
      ConfigManager.addCompany(company1);
      ConfigManager.addCompany(company2);
      
      ConfigManager.removeCompany('1');
      const companies = ConfigManager.getCompanies();
      expect(companies).not.toContainEqual(company1);
      expect(companies).toContainEqual(company2);
    });

    it('should return the updated list of companies', () => {
      const company = { name: 'New Company', id: 'new-id' };
      ConfigManager.addCompany(company);
      expect(ConfigManager.getCompanies()).toContainEqual(company);
    });
  });
});
