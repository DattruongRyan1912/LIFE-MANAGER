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
        Schema::create('study_modules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('goal_id')->constrained('study_goals')->onDelete('cascade');
            $table->string('title');
            $table->text('description')->nullable();
            $table->integer('order_index')->default(0);
            $table->float('progress')->default(0);
            $table->integer('estimated_hours')->nullable();
            $table->timestamps();
            
            $table->index(['goal_id', 'order_index']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('study_modules');
    }
};
