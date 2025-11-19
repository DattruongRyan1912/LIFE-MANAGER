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
        Schema::create('study_resources', function (Blueprint $table) {
            $table->id();
            $table->foreignId('goal_id')->nullable()->constrained('study_goals')->onDelete('cascade');
            $table->foreignId('module_id')->nullable()->constrained('study_modules')->onDelete('cascade');
            $table->string('title');
            $table->text('url');
            $table->text('reason')->nullable(); // Why AI recommends this
            $table->timestamps();
            
            $table->index('goal_id');
            $table->index('module_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('study_resources');
    }
};
