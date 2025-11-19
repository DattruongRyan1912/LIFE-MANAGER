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
        Schema::create('task_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('task_id')->constrained('tasks')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->enum('event_type', [
                'created',
                'updated',
                'status_changed',
                'priority_changed',
                'assigned',
                'completed',
                'reopened',
                'deleted',
                'label_added',
                'label_removed',
                'dependency_added',
                'dependency_removed',
                'comment_added'
            ]);
            $table->json('changes')->nullable(); // Store what changed (old_value, new_value)
            $table->text('comment')->nullable();
            $table->timestamp('created_at');
            
            // Indexes
            $table->index('task_id');
            $table->index('event_type');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('task_logs');
    }
};
