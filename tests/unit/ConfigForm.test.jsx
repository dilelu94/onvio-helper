import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ConfigForm from '../../src/components/ConfigForm';
import ConfigManager from '../../src/services/ConfigManager';

// Mock de fs para evitar escrituras reales durante tests de UI si fuera necesario
// Pero como ConfigManager ya funciona, probaremos la integración real o mockearemos el save.

describe('ConfigForm', () => {
  it('should render username and password inputs', () => {
    render(<ConfigForm />);
    
    expect(screen.getByLabelText(/usuario/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /guardar/i })).toBeInTheDocument();
  });

  it('should update ConfigManager when form is submitted', () => {
    const saveSpy = vi.spyOn(ConfigManager, 'setUser');
    const passSpy = vi.spyOn(ConfigManager, 'setPassword');
    
    render(<ConfigForm />);
    
    const userInput = screen.getByLabelText(/usuario/i);
    const passInput = screen.getByLabelText(/contraseña/i);
    const saveButton = screen.getByRole('button', { name: /guardar/i });

    fireEvent.change(userInput, { target: { value: 'new-user@onvio.com' } });
    fireEvent.change(passInput, { target: { value: 'secure-pass' } });
    fireEvent.click(saveButton);

    expect(saveSpy).toHaveBeenCalledWith('new-user@onvio.com');
    expect(passSpy).toHaveBeenCalledWith('secure-pass');
  });

  it('should allow selecting companies via checkboxes', () => {
    // Primero agregamos un par de empresas al ConfigManager directamente para el test
    ConfigManager.addCompany({ name: 'Empresa A', id: 'A1' });
    ConfigManager.addCompany({ name: 'Empresa B', id: 'B2' });
    
    render(<ConfigForm />);
    
    expect(screen.getByLabelText(/Empresa A/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Empresa B/i)).toBeInTheDocument();
    
    const checkboxA = screen.getByLabelText(/Empresa A/i);
    fireEvent.click(checkboxA);
    expect(checkboxA.checked).toBe(true);
  });

  it('should have a button to run downloads for selected companies', () => {
    render(<ConfigForm />);
    expect(screen.getByRole('button', { name: /descargar seleccionadas/i })).toBeInTheDocument();
  });
});
