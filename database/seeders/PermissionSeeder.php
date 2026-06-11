<?php

namespace Database\Seeders;

use App\Models\Permission;
use Illuminate\Database\Seeder;

class PermissionSeeder extends Seeder
{
    /**
     * Permission keys seeded on first migrate. The 4 default roles (owner, admin, moderator,
     * member) and their role_permission rows are created per server in PR2's ServerController;
     * this seeder only registers the lookup table plus a static matrix the controller reads.
     */
    public const PERMISSIONS = [
        'SEND_MESSAGES' => 'Send messages in channels',
        'DELETE_MESSAGES' => 'Delete own or others messages',
        'MANAGE_CHANNELS' => 'Create, edit, and delete channels',
        'MANAGE_ROLES' => 'Create, edit, and assign roles',
        'KICK_MEMBERS' => 'Remove members from the server',
        'BAN_MEMBERS' => 'Ban members from the server',
        'INVITE_MEMBERS' => 'Generate and share invite links',
        'MANAGE_SERVER' => 'Edit server settings and transfer ownership',
        'MENTION_EVERYONE' => 'Use @everyone and @here mentions',
    ];

    /**
     * Role-level to permission-keys map. Higher-level roles do not auto-inherit; explicit
     * assignment keeps PermissionResolver simple.
     */
    public const ROLE_MATRIX = [
        100 => [ // owner
            'SEND_MESSAGES', 'DELETE_MESSAGES', 'MANAGE_CHANNELS', 'MANAGE_ROLES',
            'KICK_MEMBERS', 'BAN_MEMBERS', 'INVITE_MEMBERS', 'MANAGE_SERVER', 'MENTION_EVERYONE',
        ],
        80 => [ // admin
            'SEND_MESSAGES', 'DELETE_MESSAGES', 'MANAGE_CHANNELS',
            'KICK_MEMBERS', 'INVITE_MEMBERS', 'MENTION_EVERYONE',
        ],
        60 => [ // moderator
            'SEND_MESSAGES', 'DELETE_MESSAGES', 'KICK_MEMBERS', 'MENTION_EVERYONE',
        ],
        40 => [ // member
            'SEND_MESSAGES',
        ],
    ];

    public function run(): void
    {
        foreach (self::PERMISSIONS as $key => $description) {
            Permission::updateOrCreate(['key' => $key], ['description' => $description]);
        }
    }
}
