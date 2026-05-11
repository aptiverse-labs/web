Feature: Subjects
  Students pick a curriculum once, then add subjects from the canonical
  catalog. The Subjects page is the on-ramp into the rest of the dashboard.

  Scenario: First-time student picks NSC and adds Mathematics
    When I open "/dashboard/subjects"
    Then I should see "Pick your curriculum"

    Given I have picked the NSC curriculum
    When I add the "Mathematics" subject
    Then the API should report 1 subject
    And I should see a subject card for "Mathematics"

  Scenario: IEB student adds Advanced Programme Mathematics
    Given I have picked the IEB curriculum
    When I add the "Advanced Programme Mathematics" subject
    Then the API should report 1 subject
    And I should see a subject card for "Advanced Programme Mathematics"
