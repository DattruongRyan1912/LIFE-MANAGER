<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "Updating tasks with missing start_date...\n";

$tasks = App\Models\Task::whereNull('start_date')
    ->whereNotNull('due_at')
    ->get();

echo "Found {$tasks->count()} tasks without start_date\n";

foreach ($tasks as $task) {
    $task->start_date = $task->created_at;
    $task->save();
    echo "Updated task #{$task->id}: {$task->title}\n";
}

echo "\nDone! Updated {$tasks->count()} tasks.\n";
