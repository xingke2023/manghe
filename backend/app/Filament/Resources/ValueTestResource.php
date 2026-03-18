<?php

namespace App\Filament\Resources;

use App\Filament\Resources\ValueTestResource\Pages;
use App\Models\ValueTest;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Notifications\Notification;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Support\Facades\Auth;

class ValueTestResource extends Resource
{
    protected static ?string $model = ValueTest::class;

    protected static ?string $navigationIcon = 'heroicon-o-clipboard-document-check';

    protected static ?string $navigationLabel = '价值观审核';

    protected static ?string $modelLabel = '价值观测试';

    protected static ?string $pluralModelLabel = '价值观测试';

    protected static ?int $navigationSort = 2;

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\TextInput::make('user.nickname')
                    ->label('用户昵称')
                    ->disabled(),
                Forms\Components\TextInput::make('risk_count')
                    ->label('风险题数')
                    ->disabled(),
                Forms\Components\Textarea::make('review_note')
                    ->label('审核备注')
                    ->rows(3),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('user.nickname')
                    ->label('用户昵称')
                    ->searchable()
                    ->url(fn ($record) => $record->user_id ? UserResource::getUrl('view', ['record' => $record->user_id]) : null),
                Tables\Columns\TextColumn::make('user.phone')
                    ->label('手机号'),
                Tables\Columns\TextColumn::make('risk_count')
                    ->label('风险题数')
                    ->sortable()
                    ->badge()
                    ->color(fn ($state) => $state >= 3 ? 'danger' : 'warning'),
                Tables\Columns\BadgeColumn::make('status')
                    ->label('状态')
                    ->formatStateUsing(fn ($state) => match ($state) {
                        1 => '自动通过',
                        2 => '待审核',
                        3 => '已通过',
                        4 => '已拒绝',
                        default => '未知',
                    })
                    ->colors([
                        'success' => fn ($state) => in_array($state, [1, 3]),
                        'warning' => 2,
                        'danger' => 4,
                    ]),
                Tables\Columns\TextColumn::make('created_at')
                    ->label('提交时间')
                    ->dateTime('Y-m-d H:i')
                    ->sortable(),
                Tables\Columns\TextColumn::make('reviewed_at')
                    ->label('审核时间')
                    ->dateTime('Y-m-d H:i')
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('status')
                    ->label('状态')
                    ->options([
                        1 => '自动通过',
                        2 => '待审核',
                        3 => '已通过',
                        4 => '已拒绝',
                    ]),
            ])
            ->actions([
                Tables\Actions\Action::make('view_answers')
                    ->label('查看答案')
                    ->icon('heroicon-o-eye')
                    ->color('info')
                    ->modalHeading('测试答案')
                    ->modalContent(fn (ValueTest $record) => view('filament.modals.value-test-answers', ['record' => $record]))
                    ->modalSubmitAction(false)
                    ->modalCancelActionLabel('关闭'),
                Tables\Actions\Action::make('approve')
                    ->label('通过')
                    ->icon('heroicon-o-check-circle')
                    ->color('success')
                    ->requiresConfirmation()
                    ->modalHeading('确认通过审核？')
                    ->visible(fn (ValueTest $record) => $record->status === 2)
                    ->action(function (ValueTest $record): void {
                        $record->update([
                            'status' => 3,
                            'reviewer_id' => Auth::id(),
                            'reviewed_at' => now(),
                        ]);
                        $record->user?->update(['has_box_permission' => 1]);
                        Notification::make()->title('已通过审核')->success()->send();
                    }),
                Tables\Actions\Action::make('reject')
                    ->label('拒绝')
                    ->icon('heroicon-o-x-circle')
                    ->color('danger')
                    ->visible(fn (ValueTest $record) => $record->status === 2)
                    ->form([
                        Forms\Components\Textarea::make('review_note')
                            ->label('拒绝原因')
                            ->required()
                            ->rows(3),
                    ])
                    ->action(function (ValueTest $record, array $data): void {
                        $record->update([
                            'status' => 4,
                            'reviewer_id' => Auth::id(),
                            'reviewed_at' => now(),
                            'review_note' => $data['review_note'],
                        ]);
                        $record->user?->update(['has_box_permission' => 0]);
                        Notification::make()->title('已拒绝审核')->warning()->send();
                    }),
            ])
            ->defaultSort(function ($query) {
                return $query->orderByRaw('CASE WHEN status = 2 THEN 0 ELSE 1 END')
                    ->orderBy('created_at', 'asc');
            });
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListValueTests::route('/'),
        ];
    }
}
