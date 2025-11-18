<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Task;
use App\Models\Expense;
use App\Models\DailyLog;
use App\Models\LongTermMemory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Carbon\Carbon;

class DashboardControllerTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function it_can_get_dashboard_summary()
    {
        // Create sample data
        Task::factory()->count(5)->create(['done' => true]);
        Task::factory()->count(3)->create(['done' => false]);
        
        Expense::factory()->count(5)->create([
            'spent_at' => Carbon::today(),
        ]);

        DailyLog::create([
            'date' => Carbon::today(),
            'summary' => 'Today summary',
        ]);

        $response = $this->getJson('/api/dashboard/summary');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'tasks' => ['total', 'completed', 'completion_rate', 'today', 'pending'],
            'expenses' => ['total_7_days', 'by_category', 'items'],
            'memory' => ['recent_logs', 'preferences', 'habits'],
        ]);
    }

    /** @test */
    public function it_calculates_task_completion_rate_correctly()
    {
        Task::factory()->count(8)->create(['done' => true]);
        Task::factory()->count(2)->create(['done' => false]);

        $response = $this->getJson('/api/dashboard/summary');

        $response->assertStatus(200);
        $response->assertJson([
            'tasks' => [
                'total' => 10,
                'completed' => 8,
                'completion_rate' => 80.0,
            ],
        ]);
    }

    /** @test */
    public function it_shows_zero_completion_rate_when_no_tasks()
    {
        $response = $this->getJson('/api/dashboard/summary');

        $response->assertStatus(200);
        $response->assertJson([
            'tasks' => [
                'total' => 0,
                'completed' => 0,
                'completion_rate' => 0,
            ],
        ]);
    }

    /** @test */
    public function it_only_includes_last_7_days_expenses()
    {
        // Create expenses within last 7 days
        Expense::factory()->count(5)->create([
            'spent_at' => Carbon::today()->subDays(3),
            'amount' => 100000,
        ]);

        // Create old expense (should not be included)
        Expense::factory()->create([
            'spent_at' => Carbon::today()->subDays(10),
            'amount' => 999999,
        ]);

        $response = $this->getJson('/api/dashboard/summary');

        $response->assertStatus(200);
        
        $data = $response->json();
        $this->assertEquals(500000, $data['expenses']['total_7_days']);
        $this->assertCount(5, $data['expenses']['items']);
    }

    /** @test */
    public function it_groups_expenses_by_category()
    {
        Expense::factory()->create([
            'category' => 'Ăn uống',
            'amount' => 100000,
            'spent_at' => Carbon::today(),
        ]);

        Expense::factory()->create([
            'category' => 'Ăn uống',
            'amount' => 50000,
            'spent_at' => Carbon::today(),
        ]);

        Expense::factory()->create([
            'category' => 'Đi lại',
            'amount' => 30000,
            'spent_at' => Carbon::today(),
        ]);

        $response = $this->getJson('/api/dashboard/summary');

        $response->assertStatus(200);
        
        $data = $response->json();
        $this->assertEquals(150000, $data['expenses']['by_category']['Ăn uống']);
        $this->assertEquals(30000, $data['expenses']['by_category']['Đi lại']);
    }

    /** @test */
    public function it_includes_recent_memory_logs()
    {
        DailyLog::create([
            'date' => Carbon::today(),
            'summary' => 'Today log',
            'ai_feedback' => 'Great day!',
        ]);

        DailyLog::create([
            'date' => Carbon::today()->subDay(),
            'summary' => 'Yesterday log',
        ]);

        $response = $this->getJson('/api/dashboard/summary');

        $response->assertStatus(200);
        
        $data = $response->json();
        $this->assertCount(2, $data['memory']['recent_logs']);
    }

    /** @test */
    public function it_includes_user_preferences_if_exist()
    {
        LongTermMemory::create([
            'key' => 'user_preferences',
            'value' => [
                ['message' => 'I like coffee'],
            ],
        ]);

        $response = $this->getJson('/api/dashboard/summary');

        $response->assertStatus(200);
        
        $data = $response->json();
        $this->assertNotNull($data['memory']['preferences']);
        $this->assertCount(1, $data['memory']['preferences']);
    }
}
