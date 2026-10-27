<?php

namespace App\Http\Resources;

use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EquipoResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'codigo' => $this->codigo,
            'nombre' => $this->nombre,
            'estado' => $this->estado,
            'fecha_adquisicion' => $this->fecha_adquisicion
                ? Carbon::parse($this->fecha_adquisicion)->format('Y-m-d') : null,
            'categoria' => $this->whenLoaded('categoria', fn () =>
                new CategoriaResource($this->categoria)),
        ];
    }
}
