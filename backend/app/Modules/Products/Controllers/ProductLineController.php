<?php

namespace App\Modules\Products\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Products\Models\ProductLine;
use App\Modules\Products\Requests\StoreProductLineRequest;
use App\Modules\Products\Requests\UpdateProductLineRequest;
use App\Modules\Products\Resources\ProductLineResource;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class ProductLineController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $lines = ProductLine::all();

        return ProductLineResource::collection($lines);
    }

    public function show(ProductLine $productLine): ProductLineResource
    {
        return new ProductLineResource($productLine);
    }

    public function store(StoreProductLineRequest $request): ProductLineResource
    {
        $productLine = ProductLine::create($request->validated());

        return new ProductLineResource($productLine);
    }

    public function update(UpdateProductLineRequest $request, ProductLine $productLine): ProductLineResource
    {
        $productLine->update($request->validated());

        return new ProductLineResource($productLine);
    }

    public function destroy(ProductLine $productLine): Response
    {
        $productLine->delete();

        return response()->noContent();
    }
}
