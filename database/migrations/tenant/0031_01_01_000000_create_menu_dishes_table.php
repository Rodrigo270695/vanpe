<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('menu_dishes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('category_id')->constrained('menu_categories')->cascadeOnDelete();

            $table->string('name', 150);
            $table->string('description', 400)->nullable();
            $table->decimal('price', 10, 2);
            $table->string('image_url', 500)->nullable();

            $table->boolean('available')->default(true);
            $table->boolean('publish_in_app')->default(false);
            $table->boolean('featured')->default(false);

            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestampsTz();
            $table->softDeletesTz();

            $table->index('category_id');
            $table->index(['publish_in_app', 'available']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('menu_dishes');
    }
};
