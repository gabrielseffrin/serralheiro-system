<?php

namespace App\Modules\Products\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Products\Models\ProductColor;
use App\Modules\Products\Requests\StoreProductColorRequest;
use App\Modules\Products\Requests\UpdateProductColorRequest;
use App\Modules\Products\Resources\ProductColorResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class ProductColorController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = ProductColor::query();
        if ($request->has('type')) {
            $query->where('type', $request->query('type'));
        }
        $colors = $query->get();

        return ProductColorResource::collection($colors);
    }

    public function show(ProductColor $productColor): ProductColorResource
    {
        return new ProductColorResource($productColor);
    }

    public function store(StoreProductColorRequest $request): ProductColorResource
    {
        $productColor = ProductColor::create($request->validated());

        return new ProductColorResource($productColor);
    }

    public function update(UpdateProductColorRequest $request, ProductColor $productColor): ProductColorResource
    {
        $productColor->update($request->validated());

        return new ProductColorResource($productColor);
    }

    public function destroy(ProductColor $productColor): Response
    {
        $productColor->delete();

        return response()->noContent();
    }
}
