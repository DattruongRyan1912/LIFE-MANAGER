<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            // Task v3 columns
            $table->enum('status', ['backlog', 'next', 'in_progress', 'blocked', 'done'])->default('backlog')->after('done');
            $table->dateTime('start_date')->nullable()->after('due_at');
            $table->integer('actual_minutes')->default(0)->after('estimated_minutes');
            $table->string('task_type', 50)->default('work')->after('priority'); // work, personal, study, etc.
            $table->text('description')->nullable()->after('title');
            
            // Add indexes for better query performance
            $table->index('status');
            $table->index('task_type');
            $table->index(['status', 'priority']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropIndex(['status', 'priority']);
            $table->dropIndex(['task_type']);
            $table->dropIndex(['status']);
            
            $table->dropColumn([
                'status',
                'start_date',
                'actual_minutes',
                'task_type',
                'description',
            ]);
        });
    }
};
