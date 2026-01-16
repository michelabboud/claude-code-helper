---
skill_name: BDD Framework Examples
description: Behavior-Driven Development using Cucumber, Behave, SpecFlow with Gherkin syntax
category: Testing
priority: P1
agent: qa-testing-expert
---

# BDD Framework Examples Skill

Comprehensive guide to Behavior-Driven Development (BDD) using Cucumber, Behave, SpecFlow, and other BDD frameworks with Gherkin syntax and practical patterns.

## Overview

BDD frameworks enable writing tests in natural language (Gherkin) that describe system behavior from a user's perspective, bridging the gap between technical and non-technical stakeholders.


## 📦 Installation

Copy this skill to your Claude Code skills directory:

```bash
# Global installation (available to all projects)
mkdir -p ~/.claude/skills/bdd-framework-examples
cp bdd-framework-examples.md ~/.claude/skills/bdd-framework-examples/SKILL.md

# Or project-specific installation
mkdir -p .claude/skills/bdd-framework-examples
cp bdd-framework-examples.md .claude/skills/bdd-framework-examples/SKILL.md
```

The skill will be automatically detected and hot-reloaded by Claude Code.

**Usage**: Once installed, Claude Code will use this skill automatically when relevant to your requests.

## Core Concepts

### Given-When-Then Pattern

```gherkin
Given [Initial Context/Precondition]
When [Event/Action]
Then [Expected Outcome]
And [Additional Steps]
But [Negative Conditions]
```

### BDD Workflow

```
1. Discover → Collaborate on examples
2. Formulate → Write scenarios in Gherkin
3. Automate → Implement step definitions
4. Run → Execute tests
5. Refine → Improve based on feedback
```

---

## 1. Cucumber (JavaScript/TypeScript)

### Installation

```bash
npm install --save-dev @cucumber/cucumber @cucumber/pretty-formatter
npm install --save-dev typescript ts-node
```

### Configuration

```javascript
// cucumber.js
module.exports = {
  default: {
    require: ['features/step_definitions/**/*.ts'],
    requireModule: ['ts-node/register'],
    format: [
      'progress-bar',
      'html:reports/cucumber-report.html',
      'json:reports/cucumber-report.json'
    ],
    formatOptions: {
      snippetInterface: 'async-await'
    },
    parallel: 2
  }
}
```

### Feature File Examples

```gherkin
# features/authentication.feature
Feature: User Authentication
  As a user
  I want to log in to the application
  So that I can access my account

  Background:
    Given the application is running
    And the database is clean

  Scenario: Successful login with valid credentials
    Given a user exists with email "john@example.com" and password "Password123"
    When I navigate to the login page
    And I enter email "john@example.com"
    And I enter password "Password123"
    And I click the login button
    Then I should be redirected to the dashboard
    And I should see a welcome message "Welcome, John!"

  Scenario: Failed login with invalid password
    Given a user exists with email "john@example.com" and password "Password123"
    When I navigate to the login page
    And I enter email "john@example.com"
    And I enter password "WrongPassword"
    And I click the login button
    Then I should remain on the login page
    And I should see an error message "Invalid email or password"

  Scenario Outline: Login attempts with various invalid credentials
    When I attempt to login with email "<email>" and password "<password>"
    Then I should see error "<error>"

    Examples:
      | email             | password    | error                     |
      | invalid@email     | Password123 | Invalid email or password |
      | john@example.com  |             | Password is required      |
      |                   | Password123 | Email is required         |
      | not-an-email      | Password123 | Invalid email format      |

  Scenario: Account lockout after multiple failed attempts
    Given a user exists with email "john@example.com"
    When I fail to login 5 times with incorrect password
    Then the account should be locked
    And I should see message "Account locked due to multiple failed attempts"
    And I should not be able to login even with correct credentials
```

### Step Definitions

```typescript
// features/step_definitions/authentication.steps.ts
import { Given, When, Then, Before, After } from '@cucumber/cucumber'
import { expect } from '@playwright/test'
import { UserService } from '../../src/services/user-service'
import { AuthPage } from '../page-objects/auth-page'

// World (shared context)
class AuthWorld {
  userService: UserService
  authPage: AuthPage
  currentUser: any
  loginAttempts: number = 0

  constructor() {
    this.userService = new UserService()
    this.authPage = new AuthPage()
  }
}

// Hooks
Before(async function(this: AuthWorld) {
  await this.authPage.initialize()
})

After(async function(this: AuthWorld) {
  await this.authPage.cleanup()
})

// Background steps
Given('the application is running', async function(this: AuthWorld) {
  await this.authPage.navigate()
  expect(await this.authPage.isVisible()).toBe(true)
})

Given('the database is clean', async function(this: AuthWorld) {
  await this.userService.clearDatabase()
})

// Given steps
Given('a user exists with email {string} and password {string}',
  async function(this: AuthWorld, email: string, password: string) {
    this.currentUser = await this.userService.createUser({
      email,
      password,
      name: 'John Doe'
    })
  }
)

Given('a user exists with email {string}',
  async function(this: AuthWorld, email: string) {
    this.currentUser = await this.userService.createUser({
      email,
      password: 'DefaultPassword123',
      name: 'Test User'
    })
  }
)

// When steps
When('I navigate to the login page', async function(this: AuthWorld) {
  await this.authPage.navigateToLogin()
})

When('I enter email {string}', async function(this: AuthWorld, email: string) {
  await this.authPage.enterEmail(email)
})

When('I enter password {string}', async function(this: AuthWorld, password: string) {
  await this.authPage.enterPassword(password)
})

When('I click the login button', async function(this: AuthWorld) {
  await this.authPage.clickLogin()
})

When('I attempt to login with email {string} and password {string}',
  async function(this: AuthWorld, email: string, password: string) {
    await this.authPage.navigateToLogin()
    await this.authPage.enterEmail(email)
    await this.authPage.enterPassword(password)
    await this.authPage.clickLogin()
  }
)

When('I fail to login {int} times with incorrect password',
  async function(this: AuthWorld, attempts: number) {
    for (let i = 0; i < attempts; i++) {
      await this.authPage.attemptLogin(
        this.currentUser.email,
        'WrongPassword'
      )
      this.loginAttempts++
    }
  }
)

// Then steps
Then('I should be redirected to the dashboard',
  async function(this: AuthWorld) {
    await this.authPage.waitForNavigation()
    expect(await this.authPage.getCurrentUrl()).toContain('/dashboard')
  }
)

Then('I should see a welcome message {string}',
  async function(this: AuthWorld, message: string) {
    const welcomeText = await this.authPage.getWelcomeMessage()
    expect(welcomeText).toContain(message)
  }
)

Then('I should remain on the login page',
  async function(this: AuthWorld) {
    expect(await this.authPage.getCurrentUrl()).toContain('/login')
  }
)

Then('I should see an error message {string}',
  async function(this: AuthWorld, message: string) {
    const errorText = await this.authPage.getErrorMessage()
    expect(errorText).toBe(message)
  }
)

Then('I should see error {string}',
  async function(this: AuthWorld, error: string) {
    const errorText = await this.authPage.getErrorMessage()
    expect(errorText).toBe(error)
  }
)

Then('the account should be locked', async function(this: AuthWorld) {
  const user = await this.userService.getUser(this.currentUser.id)
  expect(user.locked).toBe(true)
})

Then('I should see message {string}',
  async function(this: AuthWorld, message: string) {
    const displayedMessage = await this.authPage.getMessage()
    expect(displayedMessage).toBe(message)
  }
)

Then('I should not be able to login even with correct credentials',
  async function(this: AuthWorld) {
    await this.authPage.attemptLogin(
      this.currentUser.email,
      'Password123'
    )
    expect(await this.authPage.getCurrentUrl()).toContain('/login')
  }
)
```

### Complex Feature Example

```gherkin
# features/shopping-cart.feature
Feature: Shopping Cart Management
  As a customer
  I want to manage items in my shopping cart
  So that I can purchase products

  Background:
    Given I am logged in as a customer
    And the following products exist:
      | id | name          | price | stock |
      | 1  | Laptop        | 999   | 5     |
      | 2  | Mouse         | 29    | 10    |
      | 3  | Keyboard      | 79    | 8     |

  Scenario: Add single item to cart
    When I add product "Laptop" to my cart
    Then my cart should contain 1 item
    And the cart total should be $999

  Scenario: Add multiple items to cart
    When I add product "Laptop" to my cart
    And I add product "Mouse" to my cart
    And I add product "Keyboard" to my cart
    Then my cart should contain 3 items
    And the cart total should be $1107

  Scenario: Update item quantity
    Given I have "Mouse" with quantity 2 in my cart
    When I update "Mouse" quantity to 5
    Then "Mouse" should have quantity 5 in my cart
    And the cart total should be $145

  Scenario: Remove item from cart
    Given I have the following items in my cart:
      | product  | quantity |
      | Laptop   | 1        |
      | Mouse    | 2        |
    When I remove "Mouse" from my cart
    Then my cart should contain 1 item
    And the cart total should be $999

  Scenario: Apply discount code
    Given I have "Laptop" in my cart
    When I apply discount code "SAVE10"
    Then the discount should be $99.90
    And the cart total should be $899.10

  Scenario: Prevent adding out-of-stock items
    Given product "Laptop" has 0 stock
    When I try to add "Laptop" to my cart
    Then I should see error "Product is out of stock"
    And my cart should be empty
```

---

## 2. Behave (Python)

### Installation

```bash
pip install behave selenium
```

### Feature Example

```gherkin
# features/user_registration.feature
Feature: User Registration
  As a visitor
  I want to register an account
  So that I can use the application

  Scenario: Successful registration with valid data
    Given I am on the registration page
    When I fill in the following:
      | field           | value              |
      | Name            | John Doe           |
      | Email           | john@example.com   |
      | Password        | SecurePass123!     |
      | Confirm Password| SecurePass123!     |
    And I accept the terms and conditions
    And I click the register button
    Then I should see a success message
    And I should receive a verification email
    And my account should be created but inactive

  Scenario Outline: Registration validation errors
    Given I am on the registration page
    When I enter "<name>" as name
    And I enter "<email>" as email
    And I enter "<password>" as password
    Then I should see error "<error_message>"

    Examples:
      | name    | email             | password      | error_message                |
      |         | john@example.com  | Pass123!      | Name is required             |
      | John    | invalid-email     | Pass123!      | Invalid email format         |
      | John    | john@example.com  | short         | Password must be at least 8  |
      | John    | john@example.com  | nouppercas1!  | Password must contain uppercase|
      | John    | john@example.com  | NOLOWERCASE1! | Password must contain lowercase|
      | John    | john@example.com  | NoNumbers!    | Password must contain a digit  |
```

### Step Definitions (Python)

```python
# features/steps/registration_steps.py
from behave import given, when, then
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

@given('I am on the registration page')
def step_navigate_to_registration(context):
    context.browser = webdriver.Chrome()
    context.browser.get('http://localhost:3000/register')
    context.wait = WebDriverWait(context.browser, 10)

@when('I fill in the following')
def step_fill_form(context):
    for row in context.table:
        field = row['field']
        value = row['value']

        # Map field names to input IDs
        field_map = {
            'Name': 'name',
            'Email': 'email',
            'Password': 'password',
            'Confirm Password': 'confirm-password'
        }

        input_element = context.browser.find_element(
            By.ID, field_map[field]
        )
        input_element.clear()
        input_element.send_keys(value)

@when('I accept the terms and conditions')
def step_accept_terms(context):
    checkbox = context.browser.find_element(By.ID, 'terms')
    checkbox.click()

@when('I click the register button')
def step_click_register(context):
    button = context.browser.find_element(By.ID, 'register-btn')
    button.click()

@when('I enter "{value}" as {field}')
def step_enter_field(context, value, field):
    field_map = {
        'name': 'name',
        'email': 'email',
        'password': 'password'
    }
    input_element = context.browser.find_element(
        By.ID, field_map[field]
    )
    input_element.clear()
    input_element.send_keys(value)

@then('I should see a success message')
def step_verify_success(context):
    success_msg = context.wait.until(
        EC.visibility_of_element_located((By.CLASS_NAME, 'success'))
    )
    assert 'Registration successful' in success_msg.text

@then('I should receive a verification email')
def step_verify_email_sent(context):
    # Check email was sent (mock or actual)
    from email_service import get_last_sent_email
    email = get_last_sent_email()
    assert email['to'] == 'john@example.com'
    assert 'Verify your account' in email['subject']

@then('my account should be created but inactive')
def step_verify_account_inactive(context):
    from database import get_user_by_email
    user = get_user_by_email('john@example.com')
    assert user is not None
    assert user['active'] is False

@then('I should see error "{error_message}"')
def step_verify_error(context, error_message):
    error_element = context.wait.until(
        EC.visibility_of_element_located((By.CLASS_NAME, 'error'))
    )
    assert error_message in error_element.text

# Hook for cleanup
def after_scenario(context, scenario):
    if hasattr(context, 'browser'):
        context.browser.quit()
```

---

## 3. SpecFlow (.NET/C#)

### Feature Example

```gherkin
# Features/OrderProcessing.feature
Feature: Order Processing
  As a customer
  I want to place orders
  So that I can purchase products

  Background:
    Given the following products are available:
      | ProductId | Name      | Price | Stock |
      | 1         | Widget    | 10.00 | 100   |
      | 2         | Gadget    | 25.00 | 50    |
    And I am logged in as "customer@example.com"

  Scenario: Place order with single item
    When I add product 1 with quantity 2 to cart
    And I proceed to checkout
    And I select payment method "Credit Card"
    And I confirm the order
    Then the order should be created successfully
    And the order total should be 20.00
    And product 1 stock should be reduced by 2

  Scenario: Apply coupon to order
    Given I have a coupon "SAVE20" with 20% discount
    When I add product 2 with quantity 1 to cart
    And I apply coupon "SAVE20"
    And I proceed to checkout
    And I confirm the order
    Then the discount should be 5.00
    And the order total should be 20.00

  @negative
  Scenario: Reject order with insufficient stock
    When I add product 1 with quantity 200 to cart
    And I proceed to checkout
    Then I should see error "Insufficient stock for Widget"
    And the order should not be created
```

### Step Definitions (C#)

```csharp
// Steps/OrderProcessingSteps.cs
using TechTalk.SpecFlow;
using TechTalk.SpecFlow.Assist;
using Xunit;
using MyApp.Models;
using MyApp.Services;

[Binding]
public class OrderProcessingSteps
{
    private readonly ScenarioContext _scenarioContext;
    private readonly IProductService _productService;
    private readonly IOrderService _orderService;
    private Order _currentOrder;
    private string _errorMessage;

    public OrderProcessingSteps(
        ScenarioContext scenarioContext,
        IProductService productService,
        IOrderService orderService)
    {
        _scenarioContext = scenarioContext;
        _productService = productService;
        _orderService = orderService;
    }

    [Given(@"the following products are available:")]
    public void GivenTheFollowingProductsAreAvailable(Table table)
    {
        var products = table.CreateSet<Product>();
        foreach (var product in products)
        {
            _productService.AddProduct(product);
        }
    }

    [Given(@"I am logged in as ""(.*)""")]
    public void GivenIAmLoggedInAs(string email)
    {
        var user = _productService.GetUserByEmail(email);
        _scenarioContext["CurrentUser"] = user;
    }

    [Given(@"I have a coupon ""(.*)"" with (.*)% discount")]
    public void GivenIHaveACouponWithDiscount(string code, decimal percent)
    {
        var coupon = new Coupon
        {
            Code = code,
            DiscountPercent = percent,
            Active = true
        };
        _orderService.AddCoupon(coupon);
    }

    [When(@"I add product (.*) with quantity (.*) to cart")]
    public void WhenIAddProductWithQuantityToCart(int productId, int quantity)
    {
        _currentOrder = _currentOrder ?? new Order();
        _currentOrder.AddItem(productId, quantity);
    }

    [When(@"I proceed to checkout")]
    public void WhenIProceedToCheckout()
    {
        _currentOrder.Status = OrderStatus.CheckingOut;
    }

    [When(@"I select payment method ""(.*)""")]
    public void WhenISelectPaymentMethod(string paymentMethod)
    {
        _currentOrder.PaymentMethod = paymentMethod;
    }

    [When(@"I apply coupon ""(.*)""")]
    public void WhenIApplyCoupon(string code)
    {
        try
        {
            _orderService.ApplyCoupon(_currentOrder, code);
        }
        catch (Exception ex)
        {
            _errorMessage = ex.Message;
        }
    }

    [When(@"I confirm the order")]
    public void WhenIConfirmTheOrder()
    {
        try
        {
            _orderService.CreateOrder(_currentOrder);
        }
        catch (Exception ex)
        {
            _errorMessage = ex.Message;
        }
    }

    [Then(@"the order should be created successfully")]
    public void ThenTheOrderShouldBeCreatedSuccessfully()
    {
        Assert.NotNull(_currentOrder.Id);
        Assert.Equal(OrderStatus.Confirmed, _currentOrder.Status);
    }

    [Then(@"the order total should be (.*)")]
    public void ThenTheOrderTotalShouldBe(decimal expectedTotal)
    {
        Assert.Equal(expectedTotal, _currentOrder.Total);
    }

    [Then(@"product (.*) stock should be reduced by (.*)")]
    public void ThenProductStockShouldBeReducedBy(int productId, int quantity)
    {
        var product = _productService.GetProduct(productId);
        var originalStock = _scenarioContext.Get<int>($"OriginalStock_{productId}");
        Assert.Equal(originalStock - quantity, product.Stock);
    }

    [Then(@"the discount should be (.*)")]
    public void ThenTheDiscountShouldBe(decimal expectedDiscount)
    {
        Assert.Equal(expectedDiscount, _currentOrder.Discount);
    }

    [Then(@"I should see error ""(.*)""")]
    public void ThenIShouldSeeError(string expectedError)
    {
        Assert.Contains(expectedError, _errorMessage);
    }

    [Then(@"the order should not be created")]
    public void ThenTheOrderShouldNotBeCreated()
    {
        Assert.Null(_currentOrder.Id);
    }
}
```

---

## 4. Best Practices

### 1. Write Declarative Scenarios

```gherkin
# ❌ Bad (Imperative - UI-focused)
Scenario: User login
  When I click on the "Login" button
  And I type "john@example.com" in the "Email" field
  And I type "password123" in the "Password" field
  And I click the "Submit" button
  Then I should see the text "Welcome"

# ✅ Good (Declarative - Behavior-focused)
Scenario: User login
  When I login with valid credentials
  Then I should be on the dashboard
  And I should see a welcome message
```

### 2. Use Background Wisely

```gherkin
# ✅ Good use of Background
Feature: Product Management

  Background:
    Given I am logged in as an admin
    And I am on the products page

  Scenario: Create new product
    When I create a product with name "Widget"
    Then the product should be saved

  Scenario: Edit existing product
    Given a product "Widget" exists
    When I edit the product name to "Super Widget"
    Then the product should be updated
```

### 3. Use Tags for Organization

```gherkin
@smoke @authentication
Feature: User Authentication

@critical @regression
Scenario: Login with valid credentials
  # ...

@slow @integration
Scenario: Password reset flow
  # ...

@skip @wip
Scenario: OAuth login
  # Work in progress
```

Run specific tags:
```bash
# Run only smoke tests
npx cucumber-js --tags "@smoke"

# Run regression but not slow tests
npx cucumber-js --tags "@regression and not @slow"
```

### 4. Data Tables for Complex Input

```gherkin
Scenario: Bulk create users
  When I create the following users:
    | name      | email            | role  |
    | Alice     | alice@email.com  | admin |
    | Bob       | bob@email.com    | user  |
    | Charlie   | charlie@email.com| user  |
  Then all 3 users should be created
```

### 5. Scenario Outline for Multiple Cases

```gherkin
Scenario Outline: Validate email format
  When I enter email "<email>"
  Then validation should be "<result>"

  Examples: Valid emails
    | email              | result |
    | user@example.com   | valid  |
    | test.user@test.co  | valid  |

  Examples: Invalid emails
    | email        | result  |
    | invalid      | invalid |
    | @example.com | invalid |
    | user@        | invalid |
```

---

## 5. CI/CD Integration

```yaml
# .github/workflows/bdd-tests.yml
name: BDD Tests

on: [push, pull_request]

jobs:
  cucumber-tests:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - run: npm ci

      - name: Run Cucumber tests
        run: npm run test:bdd

      - name: Generate Cucumber Report
        if: always()
        run: node generate-report.js

      - name: Upload BDD Report
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: cucumber-report
          path: reports/

      - name: Publish Test Results
        if: always()
        uses: EnricoMi/publish-unit-test-result-action@v2
        with:
          files: reports/*.xml
```

---

## When to Use This Skill

Invoke the BDD Framework skill when:

1. **Collaborating with non-technical stakeholders** on requirements
2. **Writing acceptance criteria** in natural language
3. **Testing from user's perspective** with realistic scenarios
4. **Living documentation** that stays in sync with code
5. **Bridging communication** between business and development
6. **Testing complex user journeys** end-to-end
7. **Specification by example** approach to development
8. **Regression testing** with readable scenarios

---

## Related Resources

- **E2E Testing**: `skills/advanced-e2e-testing.md`
- **Testing Strategy**: `guides/advanced-patterns/testing-strategy.md`
- **TDD Workflow**: `skills/tdd-workflow.md`

---

**Version**: 1.0.0
**Last Updated**: 2026-01-10
**Status**: Production Ready ✅

---

## Credits

**Author:** [Michel Abboud](https://github.com/michelabboud)
**AI Assistance:** Created with the help of Claude Code (Anthropic)
**License:** MIT

💡 **Want more?** Explore [claude-code-helper](https://github.com/michelabboud/claude-code-helper) for 30+ agents, 13+ skills, 9 MCP servers, and comprehensive guides.
