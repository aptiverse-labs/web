@student
Feature: Goals
  Students set personal goals (academic, wellbeing, habit, career) and
  track progress towards them. Each user's goals are scoped to their
  account.

  Scenario: Empty goals page shows the add-first-goal CTA
    When I open "/dashboard/goals"
    Then I should see "No goals yet"
    And I should see "Add your first goal"

  Scenario: Create an academic goal via the dialog
    When I open "/dashboard/goals"
    And I create a goal titled "Lift Calculus to 75%" with category academic due in 30 days
    Then the API should report 1 goal
    And I should see a goal card for "Lift Calculus to 75%"

  Scenario: Academic-profile reset does not touch goals
    Given I have a goal titled "Eat better"
    When I reset my academic profile
    Then the API should still report 1 goal
