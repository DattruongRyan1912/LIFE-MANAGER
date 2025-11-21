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
            $table->enum('previous_status', ['backlog', 'next', 'in_progress', 'blocked', 'done'])
                  ->nullable()
                  ->after('status')
                  ->comment('Store the previous status before marking as done');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropColumn('previous_status');
        });
    }
};
