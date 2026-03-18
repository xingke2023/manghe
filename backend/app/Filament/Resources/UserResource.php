<?php

namespace App\Filament\Resources;

use App\Filament\Resources\UserResource\Pages;
use App\Models\User;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Notifications\Notification;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class UserResource extends Resource
{
    protected static ?string $model = User::class;

    protected static ?string $navigationIcon = 'heroicon-o-users';

    protected static ?string $navigationLabel = '用户管理';

    protected static ?string $modelLabel = '用户';

    protected static ?string $pluralModelLabel = '用户';

    protected static ?int $navigationSort = 1;

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\TextInput::make('nickname')
                    ->label('昵称')
                    ->disabled(),
                Forms\Components\TextInput::make('phone')
                    ->label('手机号')
                    ->disabled(),
                Forms\Components\Select::make('gender')
                    ->label('性别')
                    ->options([1 => '男', 2 => '女'])
                    ->disabled(),
                Forms\Components\TextInput::make('city')
                    ->label('城市')
                    ->disabled(),
                Forms\Components\Select::make('account_status')
                    ->label('账户状态')
                    ->options([1 => '正常', 2 => '冻结'])
                    ->required(),
                Forms\Components\Toggle::make('is_member')
                    ->label('会员')
                    ->disabled(),
                Forms\Components\TextInput::make('credit_score')
                    ->label('信用分')
                    ->disabled(),
                Forms\Components\DateTimePicker::make('created_at')
                    ->label('注册时间')
                    ->disabled(),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\ImageColumn::make('avatar_url')
                    ->label('头像')
                    ->circular()
                    ->defaultImageUrl(fn ($record) => 'https://ui-avatars.com/api/?name='.urlencode($record->nickname ?? '?').'&color=ffffff&background=E8373F&size=64')
                    ->extraImgAttributes(['referrerpolicy' => 'no-referrer']),
                Tables\Columns\TextColumn::make('nickname')
                    ->label('昵称')
                    ->searchable(),
                Tables\Columns\TextColumn::make('phone')
                    ->label('手机号')
                    ->searchable(),
                Tables\Columns\BadgeColumn::make('gender')
                    ->label('性别')
                    ->formatStateUsing(fn ($state) => match ($state) {
                        1 => '男',
                        2 => '女',
                        default => '未知',
                    })
                    ->colors(['primary' => 1, 'danger' => 2]),
                Tables\Columns\TextColumn::make('city')
                    ->label('城市'),
                Tables\Columns\IconColumn::make('is_member')
                    ->label('会员')
                    ->boolean(),
                Tables\Columns\BadgeColumn::make('account_status')
                    ->label('状态')
                    ->formatStateUsing(fn ($state) => match ($state) {
                        1 => '正常',
                        2 => '冻结',
                        default => '未知',
                    })
                    ->colors(['success' => 1, 'danger' => 2]),
                Tables\Columns\TextColumn::make('credit_score')
                    ->label('信用分')
                    ->sortable(),
                Tables\Columns\TextColumn::make('created_at')
                    ->label('注册时间')
                    ->dateTime('Y-m-d H:i')
                    ->sortable(),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('account_status')
                    ->label('账户状态')
                    ->options([1 => '正常', 2 => '冻结']),
                Tables\Filters\TernaryFilter::make('is_member')
                    ->label('是否会员'),
            ])
            ->actions([
                Tables\Actions\ViewAction::make()->label('查看'),
                Tables\Actions\Action::make('freeze')
                    ->label('冻结')
                    ->icon('heroicon-o-lock-closed')
                    ->color('danger')
                    ->requiresConfirmation()
                    ->modalHeading('确认冻结该用户？')
                    ->modalDescription('冻结后该用户将无法登录和使用所有功能。')
                    ->visible(fn (User $record) => $record->account_status === 1)
                    ->action(function (User $record): void {
                        $record->update(['account_status' => 2]);
                        Notification::make()->title('已冻结用户')->success()->send();
                    }),
                Tables\Actions\Action::make('unfreeze')
                    ->label('解冻')
                    ->icon('heroicon-o-lock-open')
                    ->color('success')
                    ->requiresConfirmation()
                    ->modalHeading('确认解冻该用户？')
                    ->visible(fn (User $record) => $record->account_status === 2)
                    ->action(function (User $record): void {
                        $record->update(['account_status' => 1]);
                        Notification::make()->title('已解冻用户')->success()->send();
                    }),
            ])
            ->defaultSort('created_at', 'desc');
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListUsers::route('/'),
            'view' => Pages\ViewUser::route('/{record}'),
        ];
    }
}
