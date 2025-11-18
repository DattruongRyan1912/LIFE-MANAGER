<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\DailyLog;
use App\Models\LongTermMemory;
use Illuminate\Foundation\Testing\RefreshDatabase;

class MemoryControllerTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function it_can_get_daily_logs()
    {
        // Create 10 logs
        for ($i = 0; $i < 10; $i++) {
            DailyLog::create([
                'date' => today()->subDays($i),
                'summary' => "Summary for day {$i}",
            ]);
        }

        $response = $this->getJson('/api/memories/daily-logs');

        $response->assertStatus(200);
        $response->assertJsonCount(7); // Should only return 7 most recent
    }

    /** @test */
    public function it_can_get_all_long_term_memories()
    {
        LongTermMemory::create([
            'key' => 'test_key_1',
            'value' => ['data' => 'value1'],
        ]);

        LongTermMemory::create([
            'key' => 'test_key_2',
            'value' => ['data' => 'value2'],
        ]);

        $response = $this->getJson('/api/memories/long-term');

        $response->assertStatus(200);
        $response->assertJsonCount(2);
    }

    /** @test */
    public function it_can_get_specific_memory_by_key()
    {
        LongTermMemory::create([
            'key' => 'user_preferences',
            'value' => ['likes' => ['coffee', 'coding']],
        ]);

        $response = $this->getJson('/api/memories/long-term/user_preferences');

        $response->assertStatus(200);
        $response->assertJson([
            'key' => 'user_preferences',
            'value' => ['likes' => ['coffee', 'coding']],
        ]);
    }

    /** @test */
    public function it_returns_404_for_non_existent_memory()
    {
        $response = $this->getJson('/api/memories/long-term/non_existent_key');

        $response->assertStatus(404);
        $response->assertJson(['message' => 'Memory not found']);
    }
}
