<?php

namespace App\Services;

use App\Models\Product;
use Illuminate\Support\Facades\Auth;

class ProductService
{
    public function getAll()
    {
        return Product::latest()->get();
    }

    public function create(array $data)
    {
        $user = Auth::user();
        $company = $user->company;
        $plan = $company->plan;

        // Enforce max_products when the plan has a limit.
        if ($plan->max_products !== null) {
            $currentProducts = Product::count();

            if ($currentProducts >= $plan->max_products) {
                throw new \Exception("Product limit reached for your subscription plan.");
            }
        }

        return Product::create($data);
    }

    public function update(Product $product, array $data): Product
    {
        $product->update($data);

        return $product->fresh();
    }

    public function delete(Product $product): void
    {
        $product->delete();
    }
}
