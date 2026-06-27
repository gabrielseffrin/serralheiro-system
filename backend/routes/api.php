<?php

use App\Modules\Auth\Controllers\ForgotPasswordController;
use App\Modules\Auth\Controllers\LoginController;
use App\Modules\Auth\Controllers\LogoutController;
use App\Modules\Auth\Controllers\MeController;
use App\Modules\Auth\Controllers\ResetPasswordController;
use App\Modules\Budgets\Controllers\BudgetController;
use App\Modules\Budgets\Controllers\DashboardController;
use App\Modules\Budgets\Controllers\PublicBudgetController;
use App\Modules\Companies\Controllers\CompanyController;
use App\Modules\Companies\Controllers\CompanyLogoController;
use App\Modules\Companies\Controllers\DestroyCompanyLogoController;
use App\Modules\Customers\Controllers\CustomerController;
use App\Modules\Products\Controllers\GlassTypeController;
use App\Modules\Products\Controllers\ProductCategoryController;
use App\Modules\Products\Controllers\ProductColorController;
use App\Modules\Products\Controllers\ProductController;
use App\Modules\Products\Controllers\ProductLineController;
use Illuminate\Support\Facades\Route;

// Auth routes (public)
Route::prefix('auth')->group(function () {
    Route::post('/login', LoginController::class)->middleware('throttle:login');
    Route::post('/forgot-password', ForgotPasswordController::class)->middleware('throttle:forgot-password');
    Route::post('/reset-password', ResetPasswordController::class)->middleware('throttle:forgot-password');
});

// Public budget routes (guest access)
Route::prefix('public')->middleware('throttle:public-budget')->group(function () {
    Route::get('/budgets/{token}', [PublicBudgetController::class, 'show']);
    Route::get('/budgets/{token}/pdf', [PublicBudgetController::class, 'downloadPdf']);
    Route::post('/budgets/{token}/approve', [PublicBudgetController::class, 'approve'])->middleware('throttle:public-budget-action');
    Route::post('/budgets/{token}/reject', [PublicBudgetController::class, 'reject'])->middleware('throttle:public-budget-action');
});

Route::get('/reset-password/{token}', function (string $token) {
    return response()->json(['token' => $token]);
})->name('password.reset');

// Auth routes (authenticated)
Route::middleware(['auth:sanctum', 'tenant', 'throttle:api'])->group(function () {
    Route::prefix('auth')->group(function () {
        Route::post('/logout', LogoutController::class);
        Route::get('/me', MeController::class);
    });

    // Company routes
    Route::get('/company', [CompanyController::class, 'show']);
    Route::put('/company', [CompanyController::class, 'update']);
    Route::post('/company/logo', CompanyLogoController::class);
    Route::delete('/company/logo', DestroyCompanyLogoController::class);

    // Customer routes
    Route::apiResource('customers', CustomerController::class);
    Route::get('/customers/{customer}/budgets', [CustomerController::class, 'budgets']);

    // Catalog routes
    Route::apiResource('product-lines', ProductLineController::class);
    Route::apiResource('product-colors', ProductColorController::class);
    Route::apiResource('glass-types', GlassTypeController::class);
    Route::apiResource('product-categories', ProductCategoryController::class);

    // Product routes
    Route::apiResource('products', ProductController::class);

    // Budget routes
    Route::post('/budgets/{budget}/duplicate', [BudgetController::class, 'duplicate']);
    Route::post('/budgets/{budget}/version', [BudgetController::class, 'createVersion']);
    Route::patch('/budgets/{budget}/status', [BudgetController::class, 'changeStatus']);
    Route::get('/budgets/{budget}/pdf', [BudgetController::class, 'downloadPdf']);
    Route::apiResource('budgets', BudgetController::class);

    // Dashboard routes
    Route::get('/dashboard/stats', [DashboardController::class, 'stats']);
});
