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
            // Recurring task fields
            $table->enum('recurrence_type', ['none', 'daily', 'weekly', 'monthly'])
                  ->default('none')
                  ->after('done');
            $table->integer('recurrence_interval')->default(1)->after('recurrence_type');
            $table->date('recurrence_end_date')->nullable()->after('recurrence_interval');
            $table->foreignId('parent_task_id')->nullable()->constrained('tasks')->onDelete('cascade')->after('recurrence_end_date');
            
            // Pomodoro tracking
            $table->integer('pomodoro_estimate')->nullable()->after('parent_task_id')->comment('Estimated Pomodoro sessions');
            $table->integer('pomodoro_completed')->default(0)->after('pomodoro_estimate')->comment('Completed Pomodoro sessions');
            
            // Timeline/ordering
            $table->integer('timeline_order')->nullable()->after('pomodoro_completed')->comment('Order in timeline view');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropForeign(['parent_task_id']);
            $table->dropColumn([
                'recurrence_type',
                'recurrence_interval',
                'recurrence_end_date',
                'parent_task_id',
                'pomodoro_estimate',
                'pomodoro_completed',
                'timeline_order'
            ]);
        });
    }
};
