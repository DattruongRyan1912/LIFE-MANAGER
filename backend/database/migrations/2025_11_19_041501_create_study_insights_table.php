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
        Schema::create('study_insights', function (Blueprint $table) {
            $table->id();
            $table->foreignId('related_goal_id')->nullable()->constrained('study_goals')->onDelete('cascade');
            $table->foreignId('related_module_id')->nullable()->constrained('study_modules')->onDelete('cascade');
            $table->foreignId('related_task_id')->nullable()->constrained('tasks')->onDelete('cascade');
            $table->text('content');
            $table->json('embedding_vector')->nullable(); // For vector search
            $table->timestamps();
            
            $table->index('related_goal_id');
            $table->index('related_module_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('study_insights');
    }
};
