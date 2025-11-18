<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Task>
 */
class TaskFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $priorities = ['low', 'medium', 'high'];
        
        return [
            'title' => fake()->sentence(4),
            'priority' => fake()->randomElement($priorities),
            'due_at' => fake()->dateTimeBetween('now', '+7 days'),
            'estimated_minutes' => fake()->numberBetween(15, 240),
            'done' => false,
        ];
    }
}
