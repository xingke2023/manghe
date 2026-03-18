<?php

namespace App\Filament\Resources\BlindBoxResource\Pages;

use App\Filament\Resources\BlindBoxResource;
use Filament\Resources\Pages\ViewRecord;

class ViewBlindBox extends ViewRecord
{
    protected static string $resource = BlindBoxResource::class;

    protected static ?string $title = '盲盒详情';
}
