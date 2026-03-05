import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ConfigForm from '../../src/components/ConfigForm';

describe('ConfigForm', () => {
  it('should render username and password inputs', () => {
    render(<ConfigForm />);
    
    expect(screen.getByLabelText(/usuario/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /guardar/i })).toBeInTheDocument();
  });
});
