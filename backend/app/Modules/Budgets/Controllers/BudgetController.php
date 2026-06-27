<?php

namespace App\Modules\Budgets\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Budgets\Models\Budget;
use App\Modules\Budgets\Requests\StoreBudgetRequest;
use App\Modules\Budgets\Requests\UpdateBudgetRequest;
use App\Modules\Budgets\Resources\BudgetResource;
use App\Modules\Budgets\Services\BudgetService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Validation\Rule;
use Spatie\Browsershot\Browsershot;

use Illuminate\Validation\ValidationException;

class BudgetController extends Controller
{
    protected BudgetService $budgetService;

    public function __construct(BudgetService $budgetService)
    {
        $this->budgetService = $budgetService;
        $this->authorizeResource(Budget::class, 'budget');
    }

    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Budget::with('customer')->withCount('items');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('customer_id')) {
            $query->where('customer_id', $request->customer_id);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('number', 'like', "%{$search}%")
                  ->orWhereHas('customer', fn ($c) =>
                      $c->where('name', 'like', "%{$search}%")
                  );
            });
        }

        if ($request->filled('from_date')) {
            $query->whereDate('created_at', '>=', $request->from_date);
        }

        if ($request->filled('to_date')) {
            $query->whereDate('created_at', '<=', $request->to_date);
        }

        $perPage = min((int) $request->input('per_page', 15), 100);

        $budgets = $query
            ->orderBy('number', 'desc')
            ->orderBy('version', 'desc')
            ->paginate($perPage);

        return BudgetResource::collection($budgets);
    }

    public function show(Budget $budget): BudgetResource
    {
        $budget->load([
            'customer',
            'items.product',
            'items.line',
            'items.profileColor',
            'items.glassType',
            'items.accessoryColor',
            'statusHistories',
        ]);

        return new BudgetResource($budget);
    }

    public function store(StoreBudgetRequest $request): BudgetResource
    {
        $budget = $this->budgetService->create(
            $request->validated(),
            $request->input('items'),
            $request->user()->company_id,
            $request->user()->id
        );

        return new BudgetResource($budget->load(['customer', 'items']));
    }

    public function update(UpdateBudgetRequest $request, Budget $budget): BudgetResource
    {
        if ($budget->status !== 'draft') {
            throw ValidationException::withMessages([
                'status' => ['Apenas orçamentos com status Rascunho podem ser editados.'],
            ]);
        }

        $updatedBudget = $this->budgetService->update(
            $budget,
            $request->validated(),
            $request->input('items'),
            $request->user()->id
        );

        return new BudgetResource($updatedBudget->load(['customer', 'items']));
    }

    public function destroy(Budget $budget): Response
    {
        if ($budget->status !== 'draft') {
            throw ValidationException::withMessages([
                'status' => ['Apenas orçamentos com status Rascunho podem ser excluídos.'],
            ]);
        }

        $budget->delete();

        return response()->noContent();
    }


    public function duplicate(Request $request, Budget $budget): BudgetResource
    {
        $this->authorize('duplicate', $budget);

        $duplicated = $this->budgetService->duplicate($budget, $request->user()->id);

        return new BudgetResource($duplicated->load(['customer', 'items']));
    }

    public function createVersion(Request $request, Budget $budget): BudgetResource
    {
        $this->authorize('createVersion', $budget);

        $newVersion = $this->budgetService->createVersion($budget, $request->user()->id);

        return new BudgetResource($newVersion->load(['customer', 'items']));
    }

    public function changeStatus(Request $request, Budget $budget): BudgetResource
    {
        $this->authorize('changeStatus', $budget);

        $request->validate([
            'status' => ['required', 'string', Rule::in(['draft', 'sent', 'viewed', 'negotiating', 'approved', 'rejected', 'expired'])],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $updatedBudget = $this->budgetService->changeStatus(
            $budget,
            $request->input('status'),
            $request->user()->id,
            $request->input('notes')
        );

        return new BudgetResource($updatedBudget);
    }

    public function downloadPdf(Budget $budget): Response
    {
        $this->authorize('downloadPdf', $budget);

        $budget->load([
            'company',
            'customer',
            'items.product',
            'items.line',
            'items.profileColor',
            'items.glassType',
            'items.accessoryColor',
        ]);

        $html = view('pdf.budget', compact('budget'))->render();

        $pdfContent = Browsershot::html($html)
            ->setChromePath('/usr/bin/chromium')
            ->noSandbox()
            ->pdf();

        $filename = 'orcamento_'.str_pad((string) $budget->number, 6, '0', STR_PAD_LEFT).'_v'.$budget->version.'.pdf';

        return response($pdfContent, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="'.$filename.'"',
        ]);
    }
}
