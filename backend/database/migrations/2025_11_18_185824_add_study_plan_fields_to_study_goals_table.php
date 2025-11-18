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
        Schema::table('study_goals', function (Blueprint $table) {
            $table->json('chapters')->nullable(); // Weekly chapter breakdown: [{week: 1, title: "Chapter 1", completed: false}]
            $table->json('weekly_plan')->nullable(); // AI-generated weekly plan with daily recommendations
            $table->text('ai_feedback')->nullable(); // Latest AI evaluation and suggestions
            $table->integer('total_chapters')->nullable(); // Total number of chapters/modules
            $table->string('study_type')->default('general'); // general, language, technical, etc.
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('study_goals', function (Blueprint $table) {
            $table->dropColumn(['chapters', 'weekly_plan', 'ai_feedback', 'total_chapters', 'study_type']);
        });
    }
};
