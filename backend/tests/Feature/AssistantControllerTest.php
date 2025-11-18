<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Support\Facades\Http;

class AssistantControllerTest extends TestCase
{
    /** @test */
    public function it_requires_message_field()
    {
        $response = $this->postJson('/api/assistant/chat', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['message']);
    }

    /** @test */
    public function it_can_send_chat_message()
    {
        // Mock Groq API response
        Http::fake([
            'api.groq.com/*' => Http::response([
                'choices' => [
                    [
                        'message' => [
                            'content' => 'Xin chào! Tôi là Life Manager AI.'
                        ]
                    ]
                ],
                'model' => 'llama-3.3-70b-versatile',
                'usage' => [
                    'prompt_tokens' => 10,
                    'completion_tokens' => 20,
                    'total_tokens' => 30
                ]
            ], 200)
        ]);

        $response = $this->postJson('/api/assistant/chat', [
            'message' => 'Xin chào!'
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'message'
            ]);
    }

    /** @test */
    public function it_validates_message_max_length()
    {
        $longMessage = str_repeat('a', 2001);

        $response = $this->postJson('/api/assistant/chat', [
            'message' => $longMessage
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['message']);
    }

    /** @test */
    public function it_can_get_daily_plan()
    {
        Http::fake([
            'api.groq.com/*' => Http::response([
                'choices' => [
                    [
                        'message' => [
                            'content' => 'Your daily plan...'
                        ]
                    ]
                ]
            ], 200)
        ]);

        $response = $this->getJson('/api/assistant/daily-plan');

        $response->assertStatus(200)
            ->assertJsonStructure(['plan']);
    }

    /** @test */
    public function it_can_get_daily_summary()
    {
        Http::fake([
            'api.groq.com/*' => Http::response([
                'choices' => [
                    [
                        'message' => [
                            'content' => 'Daily summary...'
                        ]
                    ]
                ]
            ], 200)
        ]);

        $response = $this->getJson('/api/assistant/daily-summary');

        $response->assertStatus(200)
            ->assertJsonStructure(['summary']);
    }
}
