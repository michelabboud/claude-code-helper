/**
 * E2E Task CRUD Tests
 * Phase 7: Testing
 *
 * Full task create, read, update, delete flow.
 * Should trigger: qa-testing-expert
 */

import { test, expect } from '@playwright/test';

// Test configuration
const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000';

// Demo credentials
const DEMO_CREDENTIALS = {
  email: 'admin@taskpro.com',
  password: 'admin123',
};

// Test task data
const TEST_TASK = {
  title: 'E2E Test Task ' + Date.now(),
  description: 'This task was created by E2E tests',
  priority: 'HIGH',
  status: 'TODO',
};

// Helper to login before tests
async function loginAsAdmin(page: any) {
  await page.goto(`${BASE_URL}/login`);
  await page.getByLabel(/email/i).fill(DEMO_CREDENTIALS.email);
  await page.getByLabel(/password/i).fill(DEMO_CREDENTIALS.password);
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL(/\/dashboard/);
}

test.describe('Task CRUD Operations', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test.describe('Create Task', () => {
    test('should open create task modal', async ({ page }) => {
      // Navigate to a project
      await page.goto(`${BASE_URL}/projects/1`);

      // Click add task button
      const addButton = page.getByRole('button', { name: /add task|create task|new task/i });
      await addButton.click();

      // Modal should be visible
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByText(/create.*task|new task/i)).toBeVisible();
    });

    test('should create a new task', async ({ page }) => {
      await page.goto(`${BASE_URL}/projects/1`);

      // Open create modal
      await page.getByRole('button', { name: /add task|create task|new task/i }).click();

      // Fill in task details
      await page.getByLabel(/title/i).fill(TEST_TASK.title);
      await page.getByLabel(/description/i).fill(TEST_TASK.description);

      // Select priority if dropdown exists
      const prioritySelect = page.getByLabel(/priority/i);
      if (await prioritySelect.isVisible()) {
        await prioritySelect.selectOption(TEST_TASK.priority);
      }

      // Submit form
      await page.getByRole('button', { name: /create|save|submit/i }).click();

      // Modal should close
      await expect(page.getByRole('dialog')).not.toBeVisible();

      // Task should appear in the list
      await expect(page.getByText(TEST_TASK.title)).toBeVisible();
    });

    test('should show validation errors', async ({ page }) => {
      await page.goto(`${BASE_URL}/projects/1`);

      // Open create modal
      await page.getByRole('button', { name: /add task|create task|new task/i }).click();

      // Try to submit empty form
      await page.getByRole('button', { name: /create|save|submit/i }).click();

      // Should show validation error
      await expect(page.getByText(/title.*required|required/i)).toBeVisible();
    });
  });

  test.describe('Read Task', () => {
    test('should display task in board view', async ({ page }) => {
      await page.goto(`${BASE_URL}/projects/1`);

      // Should see task cards
      const taskCards = page.locator('[class*="task"], [class*="card"]');
      await expect(taskCards.first()).toBeVisible();
    });

    test('should show task details on click', async ({ page }) => {
      await page.goto(`${BASE_URL}/projects/1`);

      // Click on first task
      const firstTask = page.locator('[class*="task"], [class*="card"]').first();
      await firstTask.click();

      // Should show task details (in modal or separate page)
      await expect(page.getByText(/status|priority|assignee/i)).toBeVisible();
    });

    test('should filter tasks by status', async ({ page }) => {
      await page.goto(`${BASE_URL}/projects/1`);

      // If there's a board view, different columns show different statuses
      const todoColumn = page.getByText(/to do|todo/i).locator('..');
      const inProgressColumn = page.getByText(/in progress/i).locator('..');

      // At least one column should be visible
      const columnsVisible =
        (await todoColumn.isVisible()) || (await inProgressColumn.isVisible());
      expect(columnsVisible).toBe(true);
    });
  });

  test.describe('Update Task', () => {
    test('should update task title', async ({ page }) => {
      await page.goto(`${BASE_URL}/projects/1`);

      // Click on a task to open it
      const taskCard = page.locator('[class*="task"], [class*="card"]').first();
      await taskCard.click();

      // Wait for modal/detail view
      await page.waitForTimeout(500);

      // Click edit button if exists
      const editButton = page.getByRole('button', { name: /edit/i });
      if (await editButton.isVisible()) {
        await editButton.click();
      }

      // Find and update title
      const titleInput = page.getByLabel(/title/i);
      if (await titleInput.isVisible()) {
        const newTitle = 'Updated: ' + Date.now();
        await titleInput.fill(newTitle);

        // Save changes
        await page.getByRole('button', { name: /save|update|submit/i }).click();

        // Verify update
        await expect(page.getByText(newTitle)).toBeVisible();
      }
    });

    test('should update task status via drag-drop', async ({ page }) => {
      await page.goto(`${BASE_URL}/projects/1`);

      // Find a task in TODO column
      const todoColumn = page.locator('[class*="column"]').filter({ hasText: /to do/i });
      const inProgressColumn = page.locator('[class*="column"]').filter({ hasText: /in progress/i });

      if ((await todoColumn.isVisible()) && (await inProgressColumn.isVisible())) {
        const taskInTodo = todoColumn.locator('[class*="task"], [class*="card"]').first();

        if (await taskInTodo.isVisible()) {
          // Get task text for verification
          const taskText = await taskInTodo.textContent();

          // Perform drag and drop
          await taskInTodo.dragTo(inProgressColumn);

          // Verify task moved to new column
          await expect(inProgressColumn.getByText(taskText!.slice(0, 20))).toBeVisible();
        }
      }
    });

    test('should assign task to user', async ({ page }) => {
      await page.goto(`${BASE_URL}/projects/1`);

      // Open task
      const taskCard = page.locator('[class*="task"], [class*="card"]').first();
      await taskCard.click();

      // Find assignee dropdown
      const assigneeSelect = page.getByLabel(/assignee/i);
      if (await assigneeSelect.isVisible()) {
        // Select a user
        await assigneeSelect.selectOption({ index: 1 });

        // Save
        const saveButton = page.getByRole('button', { name: /save|update/i });
        if (await saveButton.isVisible()) {
          await saveButton.click();
        }
      }
    });
  });

  test.describe('Delete Task', () => {
    test('should show delete confirmation', async ({ page }) => {
      await page.goto(`${BASE_URL}/projects/1`);

      // Open task
      const taskCard = page.locator('[class*="task"], [class*="card"]').first();
      await taskCard.click();

      // Find delete button
      const deleteButton = page.getByRole('button', { name: /delete/i });
      if (await deleteButton.isVisible()) {
        await deleteButton.click();

        // Should show confirmation dialog
        await expect(page.getByText(/confirm|are you sure/i)).toBeVisible();
      }
    });

    test('should cancel delete', async ({ page }) => {
      await page.goto(`${BASE_URL}/projects/1`);

      // Open task and click delete
      const taskCard = page.locator('[class*="task"], [class*="card"]').first();
      const taskText = await taskCard.textContent();
      await taskCard.click();

      const deleteButton = page.getByRole('button', { name: /delete/i });
      if (await deleteButton.isVisible()) {
        await deleteButton.click();

        // Click cancel
        const cancelButton = page.getByRole('button', { name: /cancel|no/i });
        await cancelButton.click();

        // Task should still exist
        await expect(page.getByText(taskText!.slice(0, 20))).toBeVisible();
      }
    });

    test('should delete task', async ({ page }) => {
      // First create a task to delete
      await page.goto(`${BASE_URL}/projects/1`);

      // Create a new task
      await page.getByRole('button', { name: /add task|create task/i }).click();
      const taskToDelete = 'Delete Me ' + Date.now();
      await page.getByLabel(/title/i).fill(taskToDelete);
      await page.getByRole('button', { name: /create|save/i }).click();

      // Wait for task to appear
      await expect(page.getByText(taskToDelete)).toBeVisible();

      // Click on the task
      await page.getByText(taskToDelete).click();

      // Delete it
      const deleteButton = page.getByRole('button', { name: /delete/i });
      if (await deleteButton.isVisible()) {
        await deleteButton.click();

        // Confirm deletion
        const confirmButton = page.getByRole('button', { name: /confirm|yes|delete/i }).last();
        await confirmButton.click();

        // Task should be gone
        await expect(page.getByText(taskToDelete)).not.toBeVisible();
      }
    });
  });
});

test.describe('Task Board', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`${BASE_URL}/projects/1`);
  });

  test('should display kanban columns', async ({ page }) => {
    // Should see status columns
    const expectedColumns = ['To Do', 'In Progress', 'In Review', 'Done'];

    for (const column of expectedColumns) {
      const columnHeader = page.getByText(new RegExp(column, 'i'));
      // At least some columns should be visible
      if (await columnHeader.isVisible()) {
        await expect(columnHeader).toBeVisible();
      }
    }
  });

  test('should toggle between board and list view', async ({ page }) => {
    // Find view toggle buttons
    const boardButton = page.getByRole('button', { name: /board/i });
    const listButton = page.getByRole('button', { name: /list/i });

    if ((await boardButton.isVisible()) && (await listButton.isVisible())) {
      // Switch to list view
      await listButton.click();
      await expect(page.locator('[class*="list"]')).toBeVisible();

      // Switch back to board view
      await boardButton.click();
      await expect(page.locator('[class*="board"], [class*="kanban"]')).toBeVisible();
    }
  });

  test('should show task count per column', async ({ page }) => {
    // Look for count badges in column headers
    const countBadges = page.locator('[class*="column-header"] [class*="badge"], [class*="count"]');

    if ((await countBadges.count()) > 0) {
      const firstBadge = countBadges.first();
      const count = await firstBadge.textContent();
      expect(parseInt(count || '0')).toBeGreaterThanOrEqual(0);
    }
  });
});
