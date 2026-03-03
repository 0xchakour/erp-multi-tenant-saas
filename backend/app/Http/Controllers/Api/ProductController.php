<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Product\StoreProductRequest;
use App\Http\Requests\Product\UpdateProductRequest;
use App\Models\Product;
use App\Services\ProductService;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class ProductController extends Controller
{
    use AuthorizesRequests;

    protected $productService;

    public function __construct(ProductService $productService)
    {
        $this->productService = $productService;
    }

    public function index()
    {
        $this->authorize('viewAny', Product::class);

        $products = $this->productService->getAll();

        return response()->json([
            'data' => $products,
        ]);
    }

    public function show(Product $product)
    {
        $this->authorize('view', $product);

        return response()->json([
            'data' => $product,
        ]);
    }

    public function store(StoreProductRequest $request)
    {
        $this->authorize('create', Product::class);

        try {
            $product = $this->productService->create($request->validated());

            return response()->json($product, 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
                'code' => 'PRODUCT_CREATE_FAILED',
            ], 403);
        }
    }

    public function update(UpdateProductRequest $request, Product $product)
    {
        $this->authorize('update', $product);

        try {
            $updatedProduct = $this->productService->update($product, $request->validated());

            return response()->json($updatedProduct);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
                'code' => 'PRODUCT_UPDATE_FAILED',
            ], 403);
        }
    }

    public function destroy(Product $product)
    {
        $this->authorize('delete', $product);

        try {
            $this->productService->delete($product);

            return response()->json([], 204);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
                'code' => 'PRODUCT_DELETE_FAILED',
            ], 403);
        }
    }
}
