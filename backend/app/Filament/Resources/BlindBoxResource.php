<?php

namespace App\Filament\Resources;

use App\Filament\Resources\BlindBoxResource\Pages;
use App\Models\BlindBox;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Notifications\Notification;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class BlindBoxResource extends Resource
{
    protected static ?string $model = BlindBox::class;

    protected static ?string $navigationIcon = 'heroicon-o-gift';

    protected static ?string $navigationLabel = '盲盒管理';

    protected static ?string $modelLabel = '盲盒';

    protected static ?string $pluralModelLabel = '盲盒';

    protected static ?int $navigationSort = 4;

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\TextInput::make('title')
                    ->label('标题')
                    ->disabled(),
                Forms\Components\TextInput::make('creator.nickname')
                    ->label('创建者')
                    ->disabled(),
                Forms\Components\TextInput::make('city')
                    ->label('城市')
                    ->disabled(),
                Forms\Components\TextInput::make('location')
                    ->label('地点')
                    ->disabled(),
                Forms\Components\DateTimePicker::make('meeting_time')
                    ->label('约会时间')
                    ->disabled(),
                Forms\Components\Select::make('fee_type')
                    ->label('费用类型')
                    ->options([1 => 'AA制', 2 => '发盒者承担'])
                    ->disabled(),
                Forms\Components\Select::make('status')
                    ->label('状态')
                    ->options([1 => '进行中', 2 => '已满员', 3 => '已下架', 4 => '已过期'])
                    ->disabled(),
                Forms\Components\TextInput::make('view_count')
                    ->label('浏览量')
                    ->disabled(),
                Forms\Components\TextInput::make('apply_count')
                    ->label('报名数')
                    ->disabled(),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\ImageColumn::make('cover_image')
                    ->label('封面')
                    ->square()
                    ->defaultImageUrl('/default-cover.png'),
                Tables\Columns\TextColumn::make('title')
                    ->label('标题')
                    ->searchable()
                    ->limit(20),
                Tables\Columns\TextColumn::make('creator.nickname')
                    ->label('创建者'),
                Tables\Columns\TextColumn::make('city')
                    ->label('城市')
                    ->searchable(),
                Tables\Columns\TextColumn::make('meeting_time')
                    ->label('约会时间')
                    ->dateTime('Y-m-d H:i')
                    ->sortable(),
                Tables\Columns\BadgeColumn::make('status')
                    ->label('状态')
                    ->formatStateUsing(fn ($state) => match ($state) {
                        1 => '进行中',
                        2 => '已满员',
                        3 => '已下架',
                        4 => '已过期',
                        default => '未知',
                    })
                    ->colors([
                        'success' => 1,
                        'warning' => 2,
                        'danger' => 3,
                        'gray' => 4,
                    ]),
                Tables\Columns\TextColumn::make('view_count')
                    ->label('浏览')
                    ->sortable(),
                Tables\Columns\TextColumn::make('apply_count')
                    ->label('报名')
                    ->sortable(),
                Tables\Columns\TextColumn::make('created_at')
                    ->label('发布时间')
                    ->dateTime('Y-m-d H:i')
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('status')
                    ->label('状态')
                    ->options([
                        1 => '进行中',
                        2 => '已满员',
                        3 => '已下架',
                        4 => '已过期',
                    ]),
            ])
            ->actions([
                Tables\Actions\ViewAction::make()->label('查看'),
                Tables\Actions\Action::make('force_unpublish')
                    ->label('强制下架')
                    ->icon('heroicon-o-no-symbol')
                    ->color('danger')
                    ->requiresConfirmation()
                    ->modalHeading('确认强制下架？')
                    ->modalDescription('下架后该盲盒将从广场中消失，用户无法继续报名。')
                    ->visible(fn (BlindBox $record) => in_array($record->status, [1, 2]))
                    ->action(function (BlindBox $record): void {
                        $record->update(['status' => 3]);
                        Notification::make()->title('已强制下架该盲盒')->success()->send();
                    }),
            ])
            ->defaultSort('created_at', 'desc');
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListBlindBoxes::route('/'),
            'view' => Pages\ViewBlindBox::route('/{record}'),
        ];
    }
}
