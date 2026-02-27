import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import App from '../renderer/App';

window.electron = {
  ipcRenderer: {
    sendMessage: jest.fn(),
    on: jest.fn(() => () => {}),
    once: jest.fn(),
  },
} as any;

describe('App', () => {
  it('renders template metadata', () => {
    render(<App />);
    expect(screen.getByText('$${name_pretty}')).toBeInTheDocument();
    expect(screen.getByText('$${description}')).toBeInTheDocument();
  });
});
