<?php

namespace App\Services;

use App\Exceptions\ReglaNegocioException;
use App\Models\Equipo;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class EquipoService
{
    public function listar(?string $q, ?string $estado, int $porPagina = 10): LengthAwarePaginator
    {
        return Equipo::query()
            ->with('categoria')
            ->when($q !== null && trim($q) !== '', function ($consulta) use ($q) {
                $texto = trim($q);
                $consulta->where(function ($filtro) use ($texto) {
                    $filtro->where('codigo', 'like', "%{$texto}%")
                        ->orWhere('nombre', 'like', "%{$texto}%");
                });
            })
            ->when($estado !== null && $estado !== '', fn ($consulta) => $consulta->where('estado', $estado))
            ->orderBy('codigo')
            ->paginate(max(1, min(50, $porPagina)));
    }

    public function crear(array $datos): Equipo
    {
        return Equipo::create($datos)->load('categoria');
    }

    public function actualizar(Equipo $equipo, array $datos): Equipo
    {
        $equipo->update($datos);
        return $equipo->load('categoria');
    }

    public function eliminar(Equipo $equipo): void
    {
        DB::transaction(function () use ($equipo) {
            $actual = Equipo::query()->lockForUpdate()->findOrFail($equipo->getKey());
            if ($actual->estado === 'prestado') {
                throw new ReglaNegocioException('No se puede eliminar un equipo prestado.');
            }
            $actual->delete();
        });
    }

    public function prestar(Equipo $equipo): Equipo
    {
        return DB::transaction(function () use ($equipo) {
            $actual = Equipo::query()->lockForUpdate()->findOrFail($equipo->getKey());
            if ($actual->estado === 'mantenimiento') {
                throw new ReglaNegocioException('No se puede prestar un equipo en mantenimiento.');
            }
            if ($actual->estado === 'prestado') {
                throw new ReglaNegocioException('El equipo ya se encuentra prestado.');
            }
            $actual->update(['estado' => 'prestado']);
            return $actual->load('categoria');
        });
    }
}
