<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Carbon\Carbon;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Expense>
 */
class ExpenseFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $categories = [
            'Ăn uống',
            'Đi lại',
            'Giải trí',
            'Hóa đơn',
            'Mua sắm',
            'Sức khỏe',
            'Học tập',
        ];

        return [
            'amount' => fake()->numberBetween(10000, 500000),
            'category' => fake()->randomElement($categories),
            'note' => fake()->optional()->sentence(),
            'spent_at' => Carbon::now()->subDays(fake()->numberBetween(0, 30)),
        ];
    }
}
