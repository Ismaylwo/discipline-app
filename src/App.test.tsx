import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders login page by default', () => {
  render(<App />);
  const heading = screen.getByText(/Вход в аккаунт/i);
  expect(heading).toBeInTheDocument();
});
