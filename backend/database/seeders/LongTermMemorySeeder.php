<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\LongTermMemory;
use Carbon\Carbon;

class LongTermMemorySeeder extends Seeder
{
    public function run(): void
    {
        $memories = [
            [
                'key' => 'user_preferences',
                'value' => [
                    [
                        'message' => 'Thích code vào buổi sáng, năng suất cao',
                        'timestamp' => Carbon::now()->subDays(10)->toDateTimeString(),
                    ],
                    [
                        'message' => 'Prefer coffee over tea',
                        'timestamp' => Carbon::now()->subDays(8)->toDateTimeString(),
                    ],
                    [
                        'message' => 'Mục tiêu giảm chi tiêu ăn uống xuống 3 triệu/tháng',
                        'timestamp' => Carbon::now()->subDays(5)->toDateTimeString(),
                    ],
                    [
                        'message' => 'Like to exercise at 6 AM',
                        'timestamp' => Carbon::now()->subDays(3)->toDateTimeString(),
                    ],
                ],
            ],
            [
                'key' => 'habit_patterns',
                'value' => [
                    [
                        'category' => 'Ăn uống',
                        'frequency' => 'Daily',
                        'avg_amount' => 85000,
                        'trend' => 'increasing',
                        'detected_at' => Carbon::now()->subDays(7)->toDateString(),
                    ],
                    [
                        'category' => 'Đi lại',
                        'frequency' => 'Daily',
                        'avg_amount' => 45000,
                        'trend' => 'stable',
                        'detected_at' => Carbon::now()->subDays(7)->toDateString(),
                    ],
                    [
                        'category' => 'Cafe',
                        'frequency' => '4-5 days/week',
                        'avg_amount' => 55000,
                        'trend' => 'stable',
                        'detected_at' => Carbon::now()->subDays(7)->toDateString(),
                    ],
                ],
            ],
            [
                'key' => 'important_goals',
                'value' => [
                    [
                        'goal' => 'Hoàn thành Life Manager MVP trong 7 ngày',
                        'status' => 'in_progress',
                        'deadline' => Carbon::now()->addDays(2)->toDateString(),
                        'created_at' => Carbon::now()->subDays(5)->toDateTimeString(),
                    ],
                    [
                        'goal' => 'Học Laravel advanced concepts',
                        'status' => 'ongoing',
                        'deadline' => null,
                        'created_at' => Carbon::now()->subDays(12)->toDateTimeString(),
                    ],
                    [
                        'goal' => 'Chi tiêu không quá 5 triệu/tháng',
                        'status' => 'ongoing',
                        'deadline' => null,
                        'created_at' => Carbon::now()->subDays(20)->toDateTimeString(),
                    ],
                ],
            ],
            [
                'key' => 'productivity_insights',
                'value' => [
                    [
                        'insight' => 'Hoàn thành nhiều tasks nhất vào buổi sáng (6-10 AM)',
                        'confidence' => 'high',
                        'detected_at' => Carbon::now()->subDays(15)->toDateTimeString(),
                    ],
                    [
                        'insight' => 'Năng suất giảm sau 8 PM',
                        'confidence' => 'medium',
                        'detected_at' => Carbon::now()->subDays(10)->toDateTimeString(),
                    ],
                    [
                        'insight' => 'Ngày có tập thể dục thường hoàn thành nhiều tasks hơn',
                        'confidence' => 'high',
                        'detected_at' => Carbon::now()->subDays(5)->toDateTimeString(),
                    ],
                ],
            ],
        ];

        foreach ($memories as $memory) {
            LongTermMemory::create($memory);
        }
    }
}
