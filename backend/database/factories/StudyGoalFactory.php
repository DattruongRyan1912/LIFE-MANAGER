<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\StudyGoal>
 */
class StudyGoalFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $subjects = [
            'Laravel Advanced',
            'React & Next.js',
            'PostgreSQL Optimization',
            'System Design',
            'Docker & DevOps',
            'TypeScript',
            'Data Structures',
            'AI & Machine Learning',
        ];

        return [
            'name' => fake()->randomElement($subjects),
            'progress' => fake()->numberBetween(0, 100),
            'deadline' => fake()->dateTimeBetween('now', '+3 months'),
        ];
    }
}
