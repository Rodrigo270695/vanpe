<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tourist_interest_groups', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('slug', 80)->unique();
            $table->string('name_es', 120);
            $table->string('name_en', 120);
            $table->string('icon', 120)->nullable();
            $table->string('target_entity', 20); // restaurant | tour_spot
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->boolean('active')->default(true);
            $table->timestampsTz();
        });

        Schema::create('tourist_interest_categories', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('group_id')->constrained('tourist_interest_groups')->cascadeOnDelete();
            $table->string('slug', 80);
            $table->string('name_es', 120);
            $table->string('name_en', 120);
            $table->string('icon', 120)->nullable();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->boolean('active')->default(true);
            $table->timestampsTz();

            $table->unique(['group_id', 'slug']);
        });

        Schema::create('tourist_interest_category_catalog_item', function (Blueprint $table) {
            $table->foreignUuid('interest_category_id')
                ->constrained('tourist_interest_categories')
                ->cascadeOnDelete();
            $table->foreignUuid('catalog_item_id')
                ->constrained('ref_catalog_items')
                ->cascadeOnDelete();

            $table->primary(['interest_category_id', 'catalog_item_id'], 'tic_catalog_pk');
        });

        Schema::create('tourist_interest_category_tour_category', function (Blueprint $table) {
            $table->foreignUuid('interest_category_id')
                ->constrained('tourist_interest_categories')
                ->cascadeOnDelete();
            $table->foreignUuid('tour_category_id')
                ->constrained('tour_categories')
                ->cascadeOnDelete();

            $table->primary(['interest_category_id', 'tour_category_id'], 'tic_tour_cat_pk');
        });

        Schema::create('customer_interest_group_preferences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained('customers')->cascadeOnDelete();
            $table->foreignUuid('interest_group_id')
                ->constrained('tourist_interest_groups')
                ->cascadeOnDelete();
            $table->timestampsTz();

            $table->unique(['customer_id', 'interest_group_id'], 'customer_interest_group_uq');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customer_interest_group_preferences');
        Schema::dropIfExists('tourist_interest_category_tour_category');
        Schema::dropIfExists('tourist_interest_category_catalog_item');
        Schema::dropIfExists('tourist_interest_categories');
        Schema::dropIfExists('tourist_interest_groups');
    }
};
