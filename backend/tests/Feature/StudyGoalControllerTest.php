<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\StudyGoal;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Carbon\Carbon;

class StudyGoalControllerTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function it_can_get_all_study_goals()
    {
        StudyGoal::factory()->count(3)->create();

        $response = $this->getJson('/api/study-goals');

        $response->assertStatus(200);
        $response->assertJsonCount(3);
    }

    /** @test */
    public function it_can_create_a_study_goal()
    {
        $goalData = [
            'name' => 'Learn Laravel',
            'progress' => 50,
            'deadline' => Carbon::today()->addDays(30)->toDateString(),
        ];

        $response = $this->postJson('/api/study-goals', $goalData);

        $response->assertStatus(201);
        $response->assertJson([
            'name' => 'Learn Laravel',
            'progress' => 50,
        ]);

        $this->assertDatabaseHas('study_goals', [
            'name' => 'Learn Laravel',
            'progress' => 50,
        ]);
    }

    /** @test */
    public function it_validates_required_fields()
    {
        $response = $this->postJson('/api/study-goals', []);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['name', 'progress', 'deadline']);
    }

    /** @test */
    public function it_validates_progress_range()
    {
        $goalData = [
            'name' => 'Test Goal',
            'progress' => 150, // Invalid: > 100
            'deadline' => Carbon::today()->toDateString(),
        ];

        $response = $this->postJson('/api/study-goals', $goalData);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['progress']);
    }

    /** @test */
    public function it_can_update_a_study_goal()
    {
        $goal = StudyGoal::factory()->create([
            'name' => 'Original Name',
            'progress' => 30,
        ]);

        $updateData = [
            'name' => 'Updated Name',
            'progress' => 70,
        ];

        $response = $this->putJson("/api/study-goals/{$goal->id}", $updateData);

        $response->assertStatus(200);
        $response->assertJson([
            'name' => 'Updated Name',
            'progress' => 70,
        ]);

        $this->assertDatabaseHas('study_goals', [
            'id' => $goal->id,
            'name' => 'Updated Name',
            'progress' => 70,
        ]);
    }

    /** @test */
    public function it_can_partially_update_a_study_goal()
    {
        $goal = StudyGoal::factory()->create([
            'name' => 'Original Name',
            'progress' => 30,
        ]);

        $response = $this->putJson("/api/study-goals/{$goal->id}", [
            'progress' => 80,
        ]);

        $response->assertStatus(200);
        $response->assertJson([
            'name' => 'Original Name', // Should not change
            'progress' => 80, // Should update
        ]);
    }

    /** @test */
    public function it_can_delete_a_study_goal()
    {
        $goal = StudyGoal::factory()->create();

        $response = $this->deleteJson("/api/study-goals/{$goal->id}");

        $response->assertStatus(200);

        $this->assertDatabaseMissing('study_goals', [
            'id' => $goal->id,
        ]);
    }

    /** @test */
    public function it_orders_goals_by_deadline()
    {
        StudyGoal::factory()->create([
            'name' => 'Goal 3',
            'deadline' => Carbon::today()->addDays(30),
        ]);

        StudyGoal::factory()->create([
            'name' => 'Goal 1',
            'deadline' => Carbon::today()->addDays(10),
        ]);

        StudyGoal::factory()->create([
            'name' => 'Goal 2',
            'deadline' => Carbon::today()->addDays(20),
        ]);

        $response = $this->getJson('/api/study-goals');

        $response->assertStatus(200);
        
        $goals = $response->json();
        $this->assertEquals('Goal 1', $goals[0]['name']);
        $this->assertEquals('Goal 2', $goals[1]['name']);
        $this->assertEquals('Goal 3', $goals[2]['name']);
    }
}
