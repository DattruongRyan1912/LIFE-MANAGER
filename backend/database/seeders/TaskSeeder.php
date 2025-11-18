<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Task;
use Carbon\Carbon;

class TaskSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Clear existing tasks
        Task::truncate();

        $tasks = [
            // Today's tasks
            [
                'title' => 'Họp team buổi sáng',
                'priority' => 'high',
                'due_at' => Carbon::today()->setHour(9)->setMinute(0),
                'estimated_minutes' => 30,
                'done' => false,
            ],
            [
                'title' => 'Review code của đồng nghiệp',
                'priority' => 'medium',
                'due_at' => Carbon::today()->setHour(10)->setMinute(30),
                'estimated_minutes' => 60,
                'done' => false,
            ],
            [
                'title' => 'Viết báo cáo tuần',
                'priority' => 'high',
                'due_at' => Carbon::today()->setHour(14)->setMinute(0),
                'estimated_minutes' => 90,
                'done' => false,
            ],
            [
                'title' => 'Học tiếng Anh',
                'priority' => 'medium',
                'due_at' => Carbon::today()->setHour(19)->setMinute(0),
                'estimated_minutes' => 45,
                'done' => false,
            ],
            [
                'title' => 'Tập thể dục',
                'priority' => 'low',
                'due_at' => Carbon::today()->setHour(20)->setMinute(0),
                'estimated_minutes' => 30,
                'done' => true,
            ],

            // Tomorrow's tasks
            [
                'title' => 'Phỏng vấn ứng viên mới',
                'priority' => 'high',
                'due_at' => Carbon::tomorrow()->setHour(10)->setMinute(0),
                'estimated_minutes' => 60,
                'done' => false,
            ],
            [
                'title' => 'Deploy feature mới lên production',
                'priority' => 'high',
                'due_at' => Carbon::tomorrow()->setHour(15)->setMinute(0),
                'estimated_minutes' => 120,
                'done' => false,
            ],
            [
                'title' => 'Gọi điện cho khách hàng',
                'priority' => 'medium',
                'due_at' => Carbon::tomorrow()->setHour(11)->setMinute(0),
                'estimated_minutes' => 20,
                'done' => false,
            ],

            // Next week's tasks
            [
                'title' => 'Lập kế hoạch sprint mới',
                'priority' => 'high',
                'due_at' => Carbon::now()->addDays(3)->setHour(9)->setMinute(0),
                'estimated_minutes' => 90,
                'done' => false,
            ],
            [
                'title' => 'Nghiên cứu công nghệ mới',
                'priority' => 'low',
                'due_at' => Carbon::now()->addDays(5)->setHour(14)->setMinute(0),
                'estimated_minutes' => 120,
                'done' => false,
            ],
            [
                'title' => 'Refactor legacy code',
                'priority' => 'medium',
                'due_at' => Carbon::now()->addDays(7)->setHour(10)->setMinute(0),
                'estimated_minutes' => 180,
                'done' => false,
            ],

            // Yesterday's tasks (for testing)
            [
                'title' => 'Fix bug khẩn cấp',
                'priority' => 'high',
                'due_at' => Carbon::yesterday()->setHour(16)->setMinute(0),
                'estimated_minutes' => 45,
                'done' => true,
            ],
            [
                'title' => 'Đọc tài liệu API',
                'priority' => 'low',
                'due_at' => Carbon::yesterday()->setHour(11)->setMinute(0),
                'estimated_minutes' => 30,
                'done' => true,
            ],
        ];

        foreach ($tasks as $task) {
            Task::create($task);
        }

        $this->command->info('✅ Created ' . count($tasks) . ' sample tasks');
    }
}
