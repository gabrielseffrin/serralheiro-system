<?php

namespace App\Modules\Products\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Products\Models\GlassType;
use App\Modules\Products\Requests\StoreGlassTypeRequest;
use App\Modules\Products\Requests\UpdateGlassTypeRequest;
use App\Modules\Products\Resources\GlassTypeResource;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class GlassTypeController extends Controller
{
    public function __construct()
    {
        $this->authorizeResource(GlassType::class, 'glass_type');
    }

    public function index(): AnonymousResourceCollection
    {
        $types = GlassType::all();

        return GlassTypeResource::collection($types);
    }

    public function show(GlassType $glassType): GlassTypeResource
    {
        return new GlassTypeResource($glassType);
    }

    public function store(StoreGlassTypeRequest $request): GlassTypeResource
    {
        $glassType = GlassType::create($request->validated());

        return new GlassTypeResource($glassType);
    }

    public function update(UpdateGlassTypeRequest $request, GlassType $glassType): GlassTypeResource
    {
        $glassType->update($request->validated());

        return new GlassTypeResource($glassType);
    }

    public function destroy(GlassType $glassType): Response
    {
        $glassType->delete();

        return response()->noContent();
    }
}
