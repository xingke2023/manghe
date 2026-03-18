<?php

namespace App\Filament\Resources;

use App\Filament\Resources\SystemConfigResource\Pages;
use App\Models\SystemConfig;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Notifications\Notification;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class SystemConfigResource extends Resource
{
    protected static ?string $model = SystemConfig::class;

    protected static ?string $navigationIcon = 'heroicon-o-cog-6-tooth';

    protected static ?string $navigationLabel = '系统配置';

    protected static ?string $modelLabel = '配置项';

    protected static ?string $pluralModelLabel = '配置项';

    protected static ?int $navigationSort = 6;

    /** 配置键中文名映射 */
    protected const KEY_LABELS = [
        'daily_box_view_limit' => '每日拆盒次数（普通用户）',
        'daily_box_view_limit_vip' => '每日拆盒次数（会员）',
        'box_deposit_amount' => '发盒保证金（元）',
        'box_anti_flake_fee' => '防鸽费（元）',
        'checkin_radius_meters' => '打卡范围（米）',
        'checkin_before_hours' => '打卡开始提前（小时）',
        'checkin_after_hours' => '打卡结束延后（小时）',
        'qrcode_valid_hours' => '见面码有效时长（小时）',
        'chat_destroy_hours' => '聊天记录保留（小时）',
        'max_follow_count' => '最大关注人数',
        'voucher_valid_days' => '凭证有效天数',
        'appeal_timeout_hours' => '申诉超时时间（小时）',
        'profile_view_cooldown_hours' => '相册查看冷却时间（小时）',
    ];

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\TextInput::make('config_key')
                    ->label('配置键')
                    ->disabled(),
                Forms\Components\TextInput::make('config_value')
                    ->label('配置值')
                    ->required(),
                Forms\Components\TextInput::make('config_type')
                    ->label('数据类型')
                    ->disabled(),
                Forms\Components\Textarea::make('description')
                    ->label('说明')
                    ->disabled()
                    ->rows(2),
                Forms\Components\Toggle::make('is_public')
                    ->label('是否公开')
                    ->disabled(),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('config_key')
                    ->label('配置键')
                    ->fontFamily('mono'),
                Tables\Columns\TextColumn::make('config_key')
                    ->label('中文说明')
                    ->formatStateUsing(fn ($state) => self::KEY_LABELS[$state] ?? $state),
                Tables\Columns\TextColumn::make('config_value')
                    ->label('当前值')
                    ->badge()
                    ->color('primary'),
                Tables\Columns\TextColumn::make('config_type')
                    ->label('类型')
                    ->badge()
                    ->color('gray'),
                Tables\Columns\IconColumn::make('is_public')
                    ->label('公开')
                    ->boolean(),
                Tables\Columns\TextColumn::make('description')
                    ->label('说明')
                    ->limit(30)
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->actions([
                Tables\Actions\Action::make('edit_value')
                    ->label('修改值')
                    ->icon('heroicon-o-pencil')
                    ->color('warning')
                    ->form(fn (SystemConfig $record) => [
                        Forms\Components\TextInput::make('config_value')
                            ->label(self::KEY_LABELS[$record->config_key] ?? $record->config_key)
                            ->default($record->config_value)
                            ->required()
                            ->helperText("类型：{$record->config_type}，说明：{$record->description}"),
                    ])
                    ->action(function (SystemConfig $record, array $data): void {
                        $record->update(['config_value' => $data['config_value']]);
                        Notification::make()
                            ->title('配置已更新')
                            ->body("`{$record->config_key}` → {$data['config_value']}")
                            ->success()
                            ->send();
                    }),
            ])
            ->paginated(false);
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListSystemConfigs::route('/'),
        ];
    }
}
