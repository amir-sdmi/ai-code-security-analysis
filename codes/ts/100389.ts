// WRITTEN WITH CHATGPT!

describe('JobCard Bookmark Functionality', () => {
  beforeEach(() => {
    // Mock API responses for bookmark and unbookmark actions
    cy.intercept('POST', '**/bookmarks/*', { fixture: 'bookmark.json' }).as('bookmark');
    cy.intercept('DELETE', '**/bookmarks/*', { fixture: 'unbookmark.json' }).as('unbookmark');

    // Set a mock token in cookies
    cy.setCookie('hireHubAccessToken', 'sampleToken');

    // Visit the page where JobCard is rendered
    cy.visit('/'); // Update this with the correct path
  });

  it('should bookmark a job', () => {
    // Ensure the bookmark button is visible before clicking
    cy.get('[data-id="bookmark"]').first().should('be.visible').click();

    // Wait for the API call and verify the request
    cy.wait('@bookmark').its('request.headers.authorization').should('include', 'Bearer sampleToken');

    // Check if the bookmark icon has changed to the filled icon (indicating the job is bookmarked)
    cy.get('[data-id="unbookmark"]').should('exist');
  });

  it('should unbookmark a job', () => {
    // First, bookmark the job
    cy.get('[data-id="bookmark"]').first().should('be.visible').click();
    cy.wait('@bookmark');

    // Then, unbookmark the job
    cy.get('[data-id="unbookmark"]').first().should('be.visible').click();

    // Wait for the API call and verify the request
    cy.wait('@unbookmark').its('request.headers.authorization').should('include', 'Bearer sampleToken');

    // Check if the bookmark icon has reverted to the empty icon (indicating the job is unbookmarked)
    cy.get('[data-id="bookmark"]').should('exist');
  });
});
