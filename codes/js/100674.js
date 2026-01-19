import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';
import Help from './Help';
import SearchBar from './SearchBar';
import HelpContent from './HelpContent';

jest.mock('./SearchBar', () => (props) => (
  <input placeholder="Search" onChange={(e) => props.onSearchChange(e.target.value)} />
));
jest.mock('./HelpContent', () => () => <div>Help Content</div>);
jest.mock('./UserGuide', () => () => <div>User Guide</div>);

describe('Help Component', () => {
  beforeEach(() => {
    // Mock local storage
    Storage.prototype.getItem = jest.fn((key) => {
      if (key === "isLoggedIn") return "true";
      return null;
    });
    // Reset window.location to prevent test leakage
    delete window.location;
    window.location = { assign: jest.fn() };
  });

  it('redirects to login if user is not logged in', () => {
    Storage.prototype.getItem.mockReturnValueOnce(null); // User is not logged in
    render(<Help />, { wrapper: Router });
    expect(window.location.assign).toHaveBeenCalledWith(expect.stringContaining('/login'));
  });

  it('renders Help components when user is logged in', () => {
    render(<Help />, { wrapper: Router });
    expect(screen.getByText('codeCraft Help Center')).toBeInTheDocument();
    expect(screen.getByText('Help Content')).toBeInTheDocument();
    expect(screen.getByText('User Guide')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search')).toBeInTheDocument();
  });

  it('updates searchQuery on input change', () => {
    render(<Help />, { wrapper: Router });
    fireEvent.change(screen.getByPlaceholderText('Search'), { target: { value: 'new query' } });
    expect(screen.getByDisplayValue('new query')).toBeInTheDocument();
  });

  it('displays links and contact information correctly', () => {
    render(<Help />, { wrapper: Router });
    expect(screen.getByText('Using chatGPT for effective code translation')).toBeInTheDocument();
    expect(screen.getByText('How does it work')).toBeInTheDocument();
    expect(screen.getByText('support@codeCraft.com')).toBeInTheDocument();
    expect(screen.getByText('+1 973-000-0000')).toBeInTheDocument();
  });
});
