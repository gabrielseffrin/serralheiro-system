<?php

namespace App\Modules\Products\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Products\Models\ProductCategory;
use App\Modules\Products\Requests\StoreProductCategoryRequest;
use App\Modules\Products\Requests\UpdateProductCategoryRequest;
use App\Modules\Products\Resources\ProductCategoryResource;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class ProductCategoryController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $categories = ProductCategory::paginate(50);

        return ProductCategoryResource::collection($categories);
    }

    public function show(ProductCategory $productCategory): ProductCategoryResource
    {
        return new ProductCategoryResource($productCategory);
    }

    public function store(StoreProductCategoryRequest $request): ProductCategoryResource
    {
        $category = ProductCategory::create($request->validated());

        return new ProductCategoryResource($category);
    }

    public function update(UpdateProductCategoryRequest $request, ProductCategory $productCategory): ProductCategoryResource
    {
        $productCategory->update($request->validated());

        return new ProductCategoryResource($productCategory);
    }

    public function destroy(ProductCategory $productCategory): Response
    {
        $productCategory->delete();

        return response()->noContent();
    }
}
