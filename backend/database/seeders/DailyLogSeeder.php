<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\DailyLog;
use Carbon\Carbon;

class DailyLogSeeder extends Seeder
{
    public function run(): void
    {
        $logs = [
            [
                'date' => Carbon::today(),
                'summary' => 'Hoàn thành 3 tasks quan trọng, chi tiêu 250k cho ăn uống.',
                'ai_feedback' => 'Bạn đang làm tốt! Hãy duy trì nhịp độ này.',
            ],
            [
                'date' => Carbon::today()->subDay(1),
                'summary' => 'Làm việc 6 giờ, tập gym 1 giờ, chi tiêu tổng 320k.',
                'ai_feedback' => 'Cân bằng tốt giữa công việc và sức khỏe.',
            ],
            [
                'date' => Carbon::today()->subDays(2),
                'summary' => 'Hoàn thành báo cáo dự án, gặp khách hàng, chi 180k.',
                'ai_feedback' => 'Ngày hiệu quả! Task quan trọng đã xong.',
            ],
            [
                'date' => Carbon::today()->subDays(3),
                'summary' => 'Học Laravel 3 giờ, chi tiêu 450k cho mua sách.',
                'ai_feedback' => 'Tuyệt vời! Đầu tư vào bản thân là quan trọng.',
            ],
            [
                'date' => Carbon::today()->subDays(4),
                'summary' => 'Nghỉ ngơi, đọc sách, chi tiêu ít (120k).',
                'ai_feedback' => 'Ngày nghỉ hợp lý, cơ thể cần thời gian phục hồi.',
            ],
            [
                'date' => Carbon::today()->subDays(5),
                'summary' => 'Meeting cả ngày, stress cao, chi 280k ăn ngoài.',
                'ai_feedback' => 'Hãy chú ý quản lý stress, nghỉ ngơi đủ giấc.',
            ],
            [
                'date' => Carbon::today()->subDays(6),
                'summary' => 'Code dự án side 8 giờ, rất tập trung, chi 150k.',
                'ai_feedback' => 'Năng suất cao! Nhưng đừng quên nghỉ ngơi.',
            ],
        ];

        foreach ($logs as $log) {
            DailyLog::create($log);
        }
    }
}
