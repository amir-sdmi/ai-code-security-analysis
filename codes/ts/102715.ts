import { test, expect } from '@playwright/test';

// ✅ PROFESSIONAL API TESTING EXAMPLES
// Demonstrates best practices for API testing with Playwright

interface Post {
  id?: number;
  userId: number;
  title: string;
  body: string;
}

test.describe('JSONPlaceholder API Tests - Professional Examples', () => {
  
  test('GET /posts - should retrieve all posts', async ({ request }) => {
    const response = await request.get('https://jsonplaceholder.typicode.com/posts');
    
    expect(response.status()).toBe(200);
    
    const posts: Post[] = await response.json();
    expect(posts).toHaveLength(100);
    
    // Validate schema
    posts.slice(0, 3).forEach(post => {
      expect(post).toHaveProperty('id');
      expect(post).toHaveProperty('userId');
      expect(post).toHaveProperty('title');
      expect(post).toHaveProperty('body');
    });
  });

  test('POST /posts - should create new post', async ({ request }) => {
    const newPost = {
      userId: 1,
      title: 'Test Post Created by Cursor AI',
      body: 'This is a test post for API automation'
    };

    const response = await request.post('https://jsonplaceholder.typicode.com/posts', {
      data: newPost
    });

    expect(response.status()).toBe(201);
    
    const createdPost: Post = await response.json();
    expect(createdPost.title).toBe(newPost.title);
    expect(createdPost.userId).toBe(newPost.userId);
  });
});
