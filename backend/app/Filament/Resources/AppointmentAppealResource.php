<?php

namespace App\Filament\Resources;

use App\Filament\Resources\AppointmentAppealResource\Pages;
use App\Models\AppointmentAppeal;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Notifications\Notification;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Support\Facades\Auth;

class AppointmentAppealResource extends Resource
{
    protected static ?string $model = AppointmentAppeal::class;

    protected static ?string $navigationIcon = 'heroicon-o-megaphone';

    protected static ?string $navigationLabel = '申诉处理';

    protected static ?string $modelLabel = '申诉';

    protected static ?string $pluralModelLabel = '申诉';

    protected static ?int $navigationSort = 5;

    public static function form(Form $form): Form
    {
        return $form->schema([]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('appellant.nickname')
                    ->label('申诉者'),
                Tables\Columns\TextColumn::make('respondent.nickname')
                    ->label('被申诉者'),
                Tables\Columns\TextColumn::make('blindBox.title')
                    ->label('关联盲盒')
                    ->limit(20),
                Tables\Columns\TextColumn::make('reason')
                    ->label('申诉原因')
                    ->limit(40)
                    ->tooltip(fn ($record) => $record->reason),
                Tables\Columns\BadgeColumn::make('status')
                    ->label('状态')
                    ->formatStateUsing(fn ($state) => match ($state) {
                        1 => '待处理',
                        2 => '已处理',
                        default => '未知',
                    })
                    ->colors(['warning' => 1, 'success' => 2]),
                Tables\Columns\BadgeColumn::make('review_result')
                    ->label('处理结果')
                    ->formatStateUsing(fn ($state) => match ($state) {
                        1 => '申诉成功',
                        2 => '申诉失败',
                        3 => '维持原判',
                        null => '-',
                        default => '未知',
                    })
                    ->colors([
                        'success' => 1,
                        'danger' => 2,
                        'gray' => 3,
                    ]),
                Tables\Columns\TextColumn::make('created_at')
                    ->label('提交时间')
                    ->dateTime('Y-m-d H:i')
                    ->sortable(),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('status')
                    ->label('状态')
                    ->options([1 => '待处理', 2 => '已处理']),
            ])
            ->actions([
                Tables\Actions\Action::make('view_detail')
                    ->label('查看详情')
                    ->icon('heroicon-o-eye')
                    ->color('info')
                    ->modalHeading('申诉详情')
                    ->modalContent(fn (AppointmentAppeal $record) => view(
                        'filament.modals.appeal-detail',
                        ['record' => $record]
                    ))
                    ->modalSubmitAction(false)
                    ->modalCancelActionLabel('关闭'),
                Tables\Actions\Action::make('resolve')
                    ->label('处理')
                    ->icon('heroicon-o-check-badge')
                    ->color('warning')
                    ->visible(fn (AppointmentAppeal $record) => $record->status === 1)
                    ->form([
                        Forms\Components\Select::make('review_result')
                            ->label('处理结果')
                            ->required()
                            ->options([
                                1 => '申诉成功（撤销处罚）',
                                2 => '申诉失败（维持处罚）',
                                3 => '维持原判',
                            ]),
                        Forms\Components\Textarea::make('review_note')
                            ->label('处理说明')
                            ->required()
                            ->rows(3),
                    ])
                    ->action(function (AppointmentAppeal $record, array $data): void {
                        $record->update([
                            'status' => 2,
                            'review_result' => $data['review_result'],
                            'review_note' => $data['review_note'],
                            'reviewer_id' => Auth::id(),
                            'reviewed_at' => now(),
                        ]);
                        Notification::make()->title('申诉已处理')->success()->send();
                    }),
            ])
            ->defaultSort(function ($query) {
                return $query->orderByRaw('CASE WHEN status = 1 THEN 0 ELSE 1 END')
                    ->orderBy('created_at', 'asc');
            });
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListAppointmentAppeals::route('/'),
        ];
    }
}
