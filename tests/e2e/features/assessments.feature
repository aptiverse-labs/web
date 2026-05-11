@student
Feature: Assessments
  Students log their own SBA tasks. The Assessments page lists what's
  upcoming and graded; the /new form is the create flow.

  Scenario: Student logs a Maths SBA test
    Given I have a subject "Mathematics" in grade 12 on the NSC curriculum
    When I create an assessment titled "Calculus & Trig Test" with type test weight 15% due in 14 days
    Then the API should report an assessment titled "Calculus & Trig Test"

  Scenario: Cannot reach New assessment form without subjects
    When I open "/dashboard/assessments/new"
    Then I should see "You need at least one subject"
