<?php

use App\Modules\Auth\Controllers\ForgotPasswordController;
use App\Modules\Auth\Controllers\LoginController;
use App\Modules\Auth\Controllers\LogoutController;
use App\Modules\Auth\Controllers\MeController;
use App\Modules\Budgets\Controllers\BudgetController;
use App\Modules\Budgets\Controllers\DashboardController;
use App\Modules\Budgets\Controllers\PublicBudgetController;
use App\Modules\Companies\Controllers\CompanyController;
use App\Modules\Companies\Controllers\CompanyLogoController;
use App\Modules\Customers\Controllers\CustomerController;
use App\Modules\Products\Controllers\GlassTypeController;
use App\Modules\Products\Controllers\ProductColorController;
use App\Modules\Products\Controllers\ProductController;
use App\Modules\Products\Controllers\ProductLineController;
use Illuminate\Support\Facades\Route;

// Auth routes (public)
Route::prefix('auth')->group(function () {
    Route::post('/login', LoginController::class);
    Route::post('/forgot-password', ForgotPasswordController::class);
});

// Public budget routes (guest access)
Route::prefix('public')->group(function () {
    Route::get('/budgets/{token}', [PublicBudgetController::class, 'show']);
    Route::get('/budgets/{token}/pdf', [PublicBudgetController::class, 'downloadPdf']);
    Route::post('/budgets/{token}/approve', [PublicBudgetController::class, 'approve']);
    Route::post('/budgets/{token}/reject', [PublicBudgetController::class, 'reject']);
});

Route::get('/reset-password/{token}', function (string $token) {
    return response()->json(['token' => $token]);
})->name('password.reset');

// Auth routes (authenticated)
Route::middleware(['auth:sanctum', 'tenant'])->group(function () {
    Route::prefix('auth')->group(function () {
        Route::post('/logout', LogoutController::class);
        Route::get('/me', MeController::class);
    });

    // Company routes
    Route::get('/company', [CompanyController::class, 'show']);
    Route::put('/company', [CompanyController::class, 'update']);
    Route::post('/company/logo', CompanyLogoController::class);

    // Customer routes
    Route::apiResource('customers', CustomerController::class);

    // Catalog routes
    Route::apiResource('product-lines', ProductLineController::class);
    Route::apiResource('product-colors', ProductColorController::class);
    Route::apiResource('glass-types', GlassTypeController::class);

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
