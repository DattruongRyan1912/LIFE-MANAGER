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
        Schema::table('long_term_memories', function (Blueprint $table) {
            $table->string('category')->default('general')->after('key'); // preferences, habits, goals, insights, conversations
            $table->text('content')->nullable()->after('category'); // Full text content for embedding
            $table->json('embedding')->nullable()->after('content'); // Vector embedding (simple array)
            $table->float('relevance_score')->default(0)->after('embedding'); // Dynamic relevance score
            $table->timestamp('last_accessed_at')->nullable()->after('relevance_score'); // Track usage
            $table->json('metadata')->nullable()->after('last_accessed_at'); // Additional context
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('long_term_memories', function (Blueprint $table) {
            $table->dropColumn(['category', 'content', 'embedding', 'relevance_score', 'last_accessed_at', 'metadata']);
        });
    }
};
