<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\StudyGoal;
use Carbon\Carbon;

class StudyGoalSeeder extends Seeder
{
    public function run(): void
    {
        $goals = [
            [
                'name' => 'Hoàn thành khóa Laravel Advanced',
                'progress' => 65,
                'deadline' => Carbon::today()->addDays(30),
            ],
            [
                'name' => 'Học Next.js 15 & React 19',
                'progress' => 40,
                'deadline' => Carbon::today()->addDays(45),
            ],
            [
                'name' => 'PostgreSQL Performance Tuning',
                'progress' => 25,
                'deadline' => Carbon::today()->addDays(60),
            ],
            [
                'name' => 'System Design Patterns',
                'progress' => 80,
                'deadline' => Carbon::today()->addDays(15),
            ],
            [
                'name' => 'Docker & Kubernetes',
                'progress' => 50,
                'deadline' => Carbon::today()->addDays(90),
            ],
        ];

        foreach ($goals as $goal) {
            StudyGoal::create($goal);
        }
    }
}
