<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropUnique('students_register_number_unique');
            $table->dropColumn(['register_number', 'year']);

            $table->date('date_of_birth')->after('phone');
            $table->string('course')->after('date_of_birth');
            $table->text('address')->after('department');
        });
    }

    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropColumn([
                'date_of_birth',
                'course',
                'address',
            ]);

            $table->string('register_number')->unique();
            $table->unsignedTinyInteger('year');
        });
    }
};
