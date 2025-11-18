<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Expense;
use Carbon\Carbon;

class ExpenseSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Clear existing expenses
        Expense::truncate();

        $expenses = [
            // Today
            [
                'amount' => 45000,
                'category' => 'Ăn uống',
                'note' => 'Cơm trưa quán cơm tấm',
                'spent_at' => Carbon::today()->setHour(12)->setMinute(30),
            ],
            [
                'amount' => 25000,
                'category' => 'Đi lại',
                'note' => 'Grab xe từ nhà đến công ty',
                'spent_at' => Carbon::today()->setHour(8)->setMinute(0),
            ],
            [
                'amount' => 80000,
                'category' => 'Ăn uống',
                'note' => 'Cà phê + bánh ngọt',
                'spent_at' => Carbon::today()->setHour(15)->setMinute(30),
            ],

            // Yesterday
            [
                'amount' => 150000,
                'category' => 'Ăn uống',
                'note' => 'Buffet lẩu tối',
                'spent_at' => Carbon::yesterday()->setHour(19)->setMinute(0),
            ],
            [
                'amount' => 50000,
                'category' => 'Đi lại',
                'note' => 'Xăng xe',
                'spent_at' => Carbon::yesterday()->setHour(18)->setMinute(0),
            ],
            [
                'amount' => 35000,
                'category' => 'Giải trí',
                'note' => 'Vé xem phim',
                'spent_at' => Carbon::yesterday()->setHour(20)->setMinute(30),
            ],

            // 2 days ago
            [
                'amount' => 200000,
                'category' => 'Mua sắm',
                'note' => 'Mua quần áo',
                'spent_at' => Carbon::now()->subDays(2)->setHour(14)->setMinute(0),
            ],
            [
                'amount' => 40000,
                'category' => 'Ăn uống',
                'note' => 'Cơm chiều',
                'spent_at' => Carbon::now()->subDays(2)->setHour(18)->setMinute(30),
            ],

            // 3 days ago
            [
                'amount' => 500000,
                'category' => 'Học tập',
                'note' => 'Khóa học online Udemy',
                'spent_at' => Carbon::now()->subDays(3)->setHour(10)->setMinute(0),
            ],
            [
                'amount' => 30000,
                'category' => 'Ăn uống',
                'note' => 'Trà sữa',
                'spent_at' => Carbon::now()->subDays(3)->setHour(16)->setMinute(0),
            ],

            // 4 days ago
            [
                'amount' => 120000,
                'category' => 'Sức khỏe',
                'note' => 'Thuốc cảm cúm',
                'spent_at' => Carbon::now()->subDays(4)->setHour(9)->setMinute(0),
            ],
            [
                'amount' => 55000,
                'category' => 'Ăn uống',
                'note' => 'Cơm trưa',
                'spent_at' => Carbon::now()->subDays(4)->setHour(12)->setMinute(0),
            ],

            // 5 days ago
            [
                'amount' => 300000,
                'category' => 'Hóa đơn',
                'note' => 'Tiền điện tháng 11',
                'spent_at' => Carbon::now()->subDays(5)->setHour(14)->setMinute(0),
            ],
            [
                'amount' => 45000,
                'category' => 'Đi lại',
                'note' => 'Grab về nhà',
                'spent_at' => Carbon::now()->subDays(5)->setHour(18)->setMinute(0),
            ],

            // 6 days ago
            [
                'amount' => 250000,
                'category' => 'Giải trí',
                'note' => 'Đi karaoke với bạn',
                'spent_at' => Carbon::now()->subDays(6)->setHour(20)->setMinute(0),
            ],
            [
                'amount' => 65000,
                'category' => 'Ăn uống',
                'note' => 'Ăn sáng + cà phê',
                'spent_at' => Carbon::now()->subDays(6)->setHour(8)->setMinute(30),
            ],
        ];

        foreach ($expenses as $expense) {
            Expense::create($expense);
        }

        $this->command->info('✅ Created ' . count($expenses) . ' sample expenses');
    }
}
