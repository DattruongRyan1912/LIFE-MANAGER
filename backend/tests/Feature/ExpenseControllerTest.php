<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Expense;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Carbon\Carbon;

class ExpenseControllerTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function it_can_create_an_expense()
    {
        $data = [
            'amount' => 50000,
            'category' => 'Ăn uống',
            'note' => 'Test expense',
            'spent_at' => Carbon::now()->toDateTimeString(),
        ];

        $response = $this->postJson('/api/expenses', $data);

        $response->assertStatus(201)
            ->assertJson([
                'amount' => 50000,
                'category' => 'Ăn uống',
                'note' => 'Test expense',
            ]);

        $this->assertDatabaseHas('expenses', [
            'amount' => 50000,
            'category' => 'Ăn uống',
        ]);
    }

    /** @test */
    public function it_validates_required_fields()
    {
        $response = $this->postJson('/api/expenses', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['amount', 'category', 'spent_at']);
    }

    /** @test */
    public function it_can_get_last_7_days_expenses()
    {
        // Create expenses
        Expense::factory()->create([
            'spent_at' => Carbon::now()->subDays(2),
            'amount' => 100000,
        ]);

        Expense::factory()->create([
            'spent_at' => Carbon::now()->subDays(10), // Outside 7 days
            'amount' => 50000,
        ]);

        $response = $this->getJson('/api/expenses/7days');

        $response->assertStatus(200);
        $data = $response->json();

        // Should only return expense within 7 days
        $this->assertCount(1, $data);
        $this->assertEquals(100000, $data[0]['amount']);
    }

    /** @test */
    public function it_can_update_an_expense()
    {
        $expense = Expense::factory()->create([
            'amount' => 100000,
            'category' => 'Ăn uống',
        ]);

        $response = $this->putJson("/api/expenses/{$expense->id}", [
            'amount' => 150000,
            'category' => 'Giải trí',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'amount' => 150000,
                'category' => 'Giải trí',
            ]);

        $this->assertDatabaseHas('expenses', [
            'id' => $expense->id,
            'amount' => 150000,
            'category' => 'Giải trí',
        ]);
    }

    /** @test */
    public function it_can_delete_an_expense()
    {
        $expense = Expense::factory()->create();

        $response = $this->deleteJson("/api/expenses/{$expense->id}");

        $response->assertStatus(200)
            ->assertJson(['message' => 'Expense deleted successfully']);

        $this->assertDatabaseMissing('expenses', [
            'id' => $expense->id,
        ]);
    }

    /** @test */
    public function it_can_get_all_expenses()
    {
        Expense::factory()->count(5)->create();

        $response = $this->getJson('/api/expenses');

        $response->assertStatus(200);
        $data = $response->json();

        $this->assertCount(5, $data);
    }
}
