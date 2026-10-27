<?php

use App\Models\Categoria;
use App\Models\Equipo;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed();
    Sanctum::actingAs(User::factory()->create());
});

it('crea un equipo con 201 y encabezado Location', function () {
    $categoria = Categoria::query()->firstOrFail();

    $respuesta = $this->postJson('/api/equipos', [
        'codigo' => 'EQ-9999',
        'nombre' => 'Laptop para prueba',
        'categoria_id' => $categoria->getKey(),
        'estado' => 'disponible',
        'fecha_adquisicion' => '2025-01-10',
        'costo_interno' => 150000,
    ]);

    $respuesta->assertCreated()
        ->assertHeader('Location', url('/api/equipos/' . $respuesta->json('data.id')))
        ->assertJsonPath('data.codigo', 'EQ-9999')
        ->assertJsonPath('data.categoria.id', $categoria->getKey());
    expect(Equipo::where('codigo', 'EQ-9999')->exists())->toBeTrue();
});

it('rechaza un equipo inválido con 422 y errores asociados a los campos', function () {
    $respuesta = $this->postJson('/api/equipos', [
        'codigo' => 'NO-1',
        'nombre' => 'a',
        'categoria_id' => 999999,
        'estado' => 'prestado',
        'fecha_adquisicion' => '2999-01-01',
        'costo_interno' => -5,
    ]);

    $respuesta->assertUnprocessable()
        ->assertJsonValidationErrors([
            'codigo', 'nombre', 'categoria_id', 'estado',
            'fecha_adquisicion', 'costo_interno',
        ]);
});

it('rechaza con 409 la eliminación de un equipo prestado y lo conserva', function () {
    $equipo = Equipo::query()->firstOrFail();
    $equipo->update(['estado' => 'prestado']);

    $this->deleteJson('/api/equipos/' . $equipo->getKey())
        ->assertStatus(409)
        ->assertJsonPath('codigo', 'REGLA_NEGOCIO')
        ->assertJsonPath('mensaje', 'No se puede eliminar un equipo prestado.');

    $this->assertDatabaseHas('equipos', [
        'id' => $equipo->getKey(), 'estado' => 'prestado',
    ]);
});
