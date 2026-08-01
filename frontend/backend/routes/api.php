<?php

use App\Http\Controllers\Api\Admin\StoreController as AdminStoreController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ClientController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\FinancialTransactionController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\ServiceOrderController;
use App\Http\Controllers\Api\StoreController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:3,10')->name('api.register');
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:login')->name('api.login');

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout'])->name('api.logout');
    Route::get('/me', [AuthController::class, 'me'])->name('api.me');

    Route::get('/store/limits', [StoreController::class, 'limits'])->name('api.store.limits');

    Route::get('/dashboard', [DashboardController::class, 'index'])->name('api.dashboard.index');

    Route::get('/users', [UserController::class, 'index'])
        ->name('api.users.index')
        ->middleware('role:admin,atendente');
    Route::post('/users', [UserController::class, 'store'])
        ->name('api.users.store')
        ->middleware('role:admin');
    Route::patch('/users/{user}', [UserController::class, 'update'])
        ->name('api.users.update')
        ->middleware('role:admin');
    Route::delete('/users/{user}', [UserController::class, 'destroy'])
        ->name('api.users.destroy')
        ->middleware('role:admin');

    Route::get('/clients/options', [ClientController::class, 'options'])
        ->name('api.clients.options')
        ->middleware('role:admin,atendente');
    Route::get('/clients', [ClientController::class, 'index'])
        ->name('api.clients.index')
        ->middleware('role:admin,atendente');
    Route::post('/clients', [ClientController::class, 'store'])
        ->name('api.clients.store')
        ->middleware('role:admin,atendente', 'limits:client');
    Route::get('/clients/{client}', [ClientController::class, 'show'])
        ->name('api.clients.show')
        ->middleware('role:admin,atendente');
    Route::patch('/clients/{client}', [ClientController::class, 'update'])
        ->name('api.clients.update')
        ->middleware('role:admin,atendente');
    Route::delete('/clients/{client}', [ClientController::class, 'destroy'])
        ->name('api.clients.destroy')
        ->middleware('role:admin');

    Route::get('/products/options', [ProductController::class, 'options'])
        ->name('api.products.options')
        ->middleware('role:admin,atendente');
    Route::get('/products', [ProductController::class, 'index'])
        ->name('api.products.index')
        ->middleware('role:admin,atendente');
    Route::post('/products', [ProductController::class, 'store'])
        ->name('api.products.store')
        ->middleware('role:admin,atendente', 'limits:product');
    Route::get('/products/{product}', [ProductController::class, 'show'])
        ->name('api.products.show')
        ->middleware('role:admin,atendente');
    Route::patch('/products/{product}', [ProductController::class, 'update'])
        ->name('api.products.update')
        ->middleware('role:admin,atendente');
    Route::delete('/products/{product}', [ProductController::class, 'destroy'])
        ->name('api.products.destroy')
        ->middleware('role:admin,atendente');

    Route::get('/service-orders/kanban', [ServiceOrderController::class, 'kanban'])
        ->name('api.service-orders.kanban');

    Route::get('/service-orders', [ServiceOrderController::class, 'index'])
        ->name('api.service-orders.index');
    Route::post('/service-orders', [ServiceOrderController::class, 'store'])
        ->name('api.service-orders.store')
        ->middleware('role:admin,atendente', 'limits:os');
    Route::get('/service-orders/{serviceOrder}', [ServiceOrderController::class, 'show'])
        ->name('api.service-orders.show');
    Route::patch('/service-orders/{serviceOrder}', [ServiceOrderController::class, 'update'])
        ->name('api.service-orders.update')
        ->middleware('role:admin,atendente');
    Route::delete('/service-orders/{serviceOrder}', [ServiceOrderController::class, 'destroy'])
        ->name('api.service-orders.destroy')
        ->middleware('role:admin');

    Route::patch('/service-orders/{serviceOrder}/status', [ServiceOrderController::class, 'updateStatus'])
        ->name('api.service-orders.status');
    Route::post('/service-orders/{serviceOrder}/items', [ServiceOrderController::class, 'addItem'])
        ->name('api.service-orders.items.store');
    Route::delete('/service-orders/{serviceOrder}/items/{item}', [ServiceOrderController::class, 'removeItem'])
        ->name('api.service-orders.items.destroy');
    Route::post('/service-orders/{serviceOrder}/comments', [ServiceOrderController::class, 'addComment'])
        ->name('api.service-orders.comments.store');

    Route::get('/financial-transactions', [FinancialTransactionController::class, 'index'])
        ->name('api.financial-transactions.index')
        ->middleware('role:admin', 'limits:financial');
    Route::post('/financial-transactions', [FinancialTransactionController::class, 'store'])
        ->name('api.financial-transactions.store')
        ->middleware('role:admin', 'limits:financial');
    Route::get('/financial-transactions/{financialTransaction}', [FinancialTransactionController::class, 'show'])
        ->name('api.financial-transactions.show')
        ->middleware('role:admin', 'limits:financial');
    Route::patch('/financial-transactions/{financialTransaction}', [FinancialTransactionController::class, 'update'])
        ->name('api.financial-transactions.update')
        ->middleware('role:admin', 'limits:financial');
    Route::delete('/financial-transactions/{financialTransaction}', [FinancialTransactionController::class, 'destroy'])
        ->name('api.financial-transactions.destroy')
        ->middleware('role:admin', 'limits:financial');
    Route::get('/financial/report', [FinancialTransactionController::class, 'report'])
        ->name('api.financial.report')
        ->middleware('role:admin', 'limits:financial');

    Route::prefix('admin')->middleware('role:super_admin')->group(function () {
        Route::get('/stores', [AdminStoreController::class, 'index'])->name('api.admin.stores.index');
        Route::patch('/stores/{store}/status', [AdminStoreController::class, 'updateStatus'])
            ->name('api.admin.stores.status');
        Route::delete('/stores/{store}', [AdminStoreController::class, 'destroy'])
            ->name('api.admin.stores.destroy');
    });
});
