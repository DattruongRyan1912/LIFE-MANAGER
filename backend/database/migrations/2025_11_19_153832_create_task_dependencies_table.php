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
        Schema::create('task_dependencies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('task_id')->constrained('tasks')->onDelete('cascade'); // The dependent task
            $table->foreignId('blocked_by_task_id')->constrained('tasks')->onDelete('cascade'); // The blocking task
            $table->timestamps();
            
            // Prevent duplicate dependencies
            $table->unique(['task_id', 'blocked_by_task_id']);
            
            // Indexes for performance
            $table->index('task_id');
            $table->index('blocked_by_task_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('task_dependencies');
    }
};
