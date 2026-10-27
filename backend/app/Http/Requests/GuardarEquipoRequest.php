<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class GuardarEquipoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $equipo = $this->route('equipo');
        $equipoId = $equipo instanceof \App\Models\Equipo ? $equipo->getKey() : $equipo;

        return [
            'codigo' => [
                'required', 'string', 'max:20', 'regex:/^EQ-[0-9]{4}$/',
                Rule::unique('equipos', 'codigo')->ignore($equipoId),
            ],
            'nombre' => ['required', 'string', 'min:3', 'max:120'],
            'categoria_id' => ['required', 'integer', Rule::exists('categorias', 'id')],
            'estado' => ['sometimes', 'required', Rule::in(['disponible', 'mantenimiento'])],
            'fecha_adquisicion' => ['required', 'date', 'before_or_equal:today'],
            'costo_interno' => ['required', 'numeric', 'min:0'],
        ];
    }

    public function messages(): array
    {
        return [
            'codigo.required' => 'El código es obligatorio.',
            'codigo.string' => 'El código debe ser texto.',
            'codigo.max' => 'El código no puede superar 20 caracteres.',
            'codigo.regex' => 'El código debe tener el formato EQ-0000.',
            'codigo.unique' => 'Este código ya está registrado.',
            'nombre.required' => 'El nombre es obligatorio.',
            'nombre.string' => 'El nombre debe ser texto.',
            'nombre.min' => 'El nombre debe tener al menos 3 caracteres.',
            'nombre.max' => 'El nombre no puede superar 120 caracteres.',
            'categoria_id.required' => 'La categoría es obligatoria.',
            'categoria_id.integer' => 'La categoría debe ser un número entero.',
            'categoria_id.exists' => 'La categoría seleccionada no existe.',
            'estado.required' => 'El estado no puede estar vacío.',
            'estado.in' => 'El estado debe ser disponible o mantenimiento.',
            'fecha_adquisicion.required' => 'La fecha de adquisición es obligatoria.',
            'fecha_adquisicion.date' => 'Ingrese una fecha de adquisición válida.',
            'fecha_adquisicion.before_or_equal' => 'La fecha de adquisición no puede ser futura.',
            'costo_interno.required' => 'El costo interno es obligatorio.',
            'costo_interno.numeric' => 'El costo interno debe ser numérico.',
            'costo_interno.min' => 'El costo interno no puede ser negativo.',
        ];
    }
}
