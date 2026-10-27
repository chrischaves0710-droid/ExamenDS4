<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\GuardarEquipoRequest;
use App\Http\Resources\EquipoResource;
use App\Models\Equipo;
use App\Services\EquipoService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class EquipoController extends Controller
{
    public function index(Request $request, EquipoService $servicio): AnonymousResourceCollection
    {
        return EquipoResource::collection($servicio->listar(
            $request->query('q'), $request->query('estado'),
            (int) $request->query('per_page', 10)
        ));
    }

    public function show(Equipo $equipo): EquipoResource
    {
        return new EquipoResource($equipo->load('categoria'));
    }

    public function store(GuardarEquipoRequest $request, EquipoService $servicio): JsonResponse
    {
        $equipo = $servicio->crear($request->validated());
        return (new EquipoResource($equipo))->response()
            ->setStatusCode(201)
            ->header('Location', url('/api/equipos/' . $equipo->getKey()));
    }

    public function update(GuardarEquipoRequest $request, Equipo $equipo, EquipoService $servicio): EquipoResource
    {
        return new EquipoResource($servicio->actualizar($equipo, $request->validated()));
    }

    public function destroy(Equipo $equipo, EquipoService $servicio): Response
    {
        $servicio->eliminar($equipo);
        return response()->noContent();
    }

    public function prestar(Equipo $equipo, EquipoService $servicio): EquipoResource
    {
        return new EquipoResource($servicio->prestar($equipo));
    }
}
