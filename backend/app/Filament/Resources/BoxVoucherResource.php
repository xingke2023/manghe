<?php

namespace App\Filament\Resources;

use App\Filament\Resources\BoxVoucherResource\Pages;
use App\Models\BoxVoucher;
use App\Models\SystemConfig;
use App\Models\User;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Notifications\Notification;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class BoxVoucherResource extends Resource
{
    protected static ?string $model = BoxVoucher::class;

    protected static ?string $navigationIcon = 'heroicon-o-ticket';

    protected static ?string $navigationLabel = '发盒凭证';

    protected static ?string $modelLabel = '凭证';

    protected static ?string $pluralModelLabel = '凭证';

    protected static ?int $navigationSort = 3;

    public static function form(Form $form): Form
    {
        return $form->schema([]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('voucher_code')
                    ->label('凭证码')
                    ->copyable()
                    ->badge()
                    ->color('primary'),
                Tables\Columns\TextColumn::make('owner.nickname')
                    ->label('归属用户')
                    ->searchable(query: fn ($query, $search) => $query->whereHas(
                        'owner',
                        fn ($q) => $q->where('nickname', 'like', "%{$search}%")
                    )),
                Tables\Columns\TextColumn::make('usedByUser.nickname')
                    ->label('使用者'),
                Tables\Columns\BadgeColumn::make('status')
                    ->label('状态')
                    ->formatStateUsing(fn ($state) => match ($state) {
                        1 => '未使用',
                        2 => '已核销',
                        3 => '已过期',
                        default => '未知',
                    })
                    ->colors([
                        'success' => 1,
                        'gray' => 2,
                        'danger' => 3,
                    ]),
                Tables\Columns\TextColumn::make('valid_until')
                    ->label('有效期')
                    ->dateTime('Y-m-d H:i')
                    ->sortable(),
                Tables\Columns\TextColumn::make('used_at')
                    ->label('使用时间')
                    ->dateTime('Y-m-d H:i')
                    ->toggleable(isToggledHiddenByDefault: true),
                Tables\Columns\TextColumn::make('created_at')
                    ->label('生成时间')
                    ->dateTime('Y-m-d H:i')
                    ->sortable(),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('status')
                    ->label('状态')
                    ->options([
                        1 => '未使用',
                        2 => '已核销',
                        3 => '已过期',
                    ]),
            ])
            ->headerActions([
                Tables\Actions\Action::make('batch_generate')
                    ->label('批量生成凭证')
                    ->icon('heroicon-o-plus-circle')
                    ->color('success')
                    ->form([
                        Forms\Components\Select::make('owner_user_id')
                            ->label('归属用户')
                            ->required()
                            ->searchable()
                            ->getSearchResultsUsing(fn (string $search) => User::query()
                                ->where('nickname', 'like', "%{$search}%")
                                ->orWhere('phone', 'like', "%{$search}%")
                                ->limit(20)
                                ->pluck('nickname', 'id'))
                            ->getOptionLabelUsing(fn ($value) => User::find($value)?->nickname),
                        Forms\Components\TextInput::make('quantity')
                            ->label('生成数量')
                            ->required()
                            ->numeric()
                            ->minValue(1)
                            ->maxValue(50)
                            ->default(1),
                    ])
                    ->action(function (array $data): void {
                        $validDays = (int) SystemConfig::getValue('voucher_valid_days', 7);
                        $validUntil = now()->addDays($validDays);
                        $adminId = Auth::id();

                        $vouchers = [];
                        $generated = 0;
                        $attempts = 0;

                        while ($generated < $data['quantity'] && $attempts < $data['quantity'] * 10) {
                            $code = strtoupper(Str::random(6));
                            if (! BoxVoucher::query()->where('voucher_code', $code)->exists()) {
                                $vouchers[] = [
                                    'voucher_code' => $code,
                                    'owner_user_id' => $data['owner_user_id'],
                                    'created_by' => $adminId,
                                    'status' => 1,
                                    'valid_until' => $validUntil,
                                    'created_at' => now(),
                                ];
                                $generated++;
                            }
                            $attempts++;
                        }

                        BoxVoucher::query()->insert($vouchers);

                        Notification::make()
                            ->title("已生成 {$generated} 张凭证")
                            ->success()
                            ->send();
                    }),
            ])
            ->actions([
                Tables\Actions\DeleteAction::make()
                    ->label('删除')
                    ->visible(fn (BoxVoucher $record) => $record->status === 1),
            ])
            ->defaultSort('created_at', 'desc');
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListBoxVouchers::route('/'),
        ];
    }
}
