<?php

namespace Database\Seeders;

use App\Models\Admin;
use Illuminate\Database\Seeder;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        Admin::query()->updateOrCreate(
            ['username' => 'admin'],
            [
                'password' => 'admin123',
                'real_name' => '超级管理员',
                'role' => 'super_admin',
                'permissions' => [],
                'status' => 1,
            ]
        );
    }
}
