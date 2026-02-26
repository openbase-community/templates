import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import App from '../renderer/App';

// Mock the electron preload API
window.electron = {
  repoService: {
    getRepos: jest.fn().mockResolvedValue([]),
    getRepoStatus: jest.fn().mockResolvedValue('clean'),
    getConfigPath: jest.fn().mockResolvedValue(''),
    setConfigPath: jest.fn().mockResolvedValue(undefined),
  },
  onNavigateToRepo: jest.fn(() => () => {}),
  onNavigateToSettings: jest.fn(() => () => {}),
} as any;

describe('App', () => {
  it('should render', () => {
    expect(render(<App />)).toBeTruthy();
  });
});
