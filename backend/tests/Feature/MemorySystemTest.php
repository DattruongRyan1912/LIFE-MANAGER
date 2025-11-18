<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\DailyLog;
use App\Models\LongTermMemory;
use App\Services\MemoryUpdater;
use Illuminate\Foundation\Testing\RefreshDatabase;

class MemorySystemTest extends TestCase
{
    use RefreshDatabase;

    protected $memoryUpdater;

    protected function setUp(): void
    {
        parent::setUp();
        $this->memoryUpdater = new MemoryUpdater();
    }

    /** @test */
    public function it_can_save_daily_summary()
    {
        $summary = 'Completed 5 tasks today, spent 200k VND';

        $this->memoryUpdater->saveDailySummary($summary);

        $this->assertDatabaseHas('daily_logs', [
            'date' => today()->toDateString(),
            'summary' => $summary,
        ]);
    }

    /** @test */
    public function it_updates_existing_daily_log()
    {
        // Create initial log
        DailyLog::create([
            'date' => today(),
            'summary' => 'First summary',
        ]);

        // Update with new summary
        $this->memoryUpdater->saveDailySummary('Updated summary');

        $this->assertDatabaseHas('daily_logs', [
            'date' => today()->toDateString(),
            'summary' => 'Updated summary',
        ]);

        // Should only have one record for today
        $this->assertEquals(1, DailyLog::where('date', today())->count());
    }

    /** @test */
    public function it_can_save_insights()
    {
        $insight = [
            'message' => 'I prefer coffee in the morning',
            'timestamp' => now()->toDateTimeString(),
        ];

        $this->memoryUpdater->saveInsight('user_preferences', $insight);

        $this->assertDatabaseHas('long_term_memories', [
            'key' => 'user_preferences',
        ]);

        $memory = LongTermMemory::where('key', 'user_preferences')->first();
        $this->assertIsArray($memory->value);
        $this->assertCount(1, $memory->value);
    }

    /** @test */
    public function it_appends_multiple_insights_to_same_key()
    {
        $insight1 = ['message' => 'First insight'];
        $insight2 = ['message' => 'Second insight'];

        $this->memoryUpdater->saveInsight('test_key', $insight1);
        $this->memoryUpdater->saveInsight('test_key', $insight2);

        $memory = LongTermMemory::where('key', 'test_key')->first();
        $this->assertCount(2, $memory->value);
    }

    /** @test */
    public function it_extracts_preferences_from_conversation()
    {
        $userMessage = 'I like to exercise in the morning';
        $aiResponse = 'That\'s great! Morning exercise is healthy.';

        $this->memoryUpdater->updateFromConversation($userMessage, $aiResponse);

        $this->assertDatabaseHas('long_term_memories', [
            'key' => 'user_preferences',
        ]);
    }

    /** @test */
    public function it_does_not_save_for_irrelevant_messages()
    {
        $userMessage = 'What is the weather today?';
        $aiResponse = 'I don\'t have weather information.';

        $this->memoryUpdater->updateFromConversation($userMessage, $aiResponse);

        // Should not create user_preferences for weather questions
        $count = LongTermMemory::where('key', 'user_preferences')->count();
        $this->assertEquals(0, $count);
    }

    /** @test */
    public function daily_log_has_correct_date_format()
    {
        $this->memoryUpdater->saveDailySummary('Test summary');

        $log = DailyLog::first();
        $this->assertInstanceOf(\Carbon\Carbon::class, $log->date);
    }
}
