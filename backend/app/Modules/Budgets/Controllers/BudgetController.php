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

class BudgetController extends Controller
{
    protected BudgetService $budgetService;

    public function __construct(BudgetService $budgetService)
    {
        $this->budgetService = $budgetService;
    }

    public function index(Request $request): AnonymousResourceCollection
    {
        // Paginate budgets, eager loading customer
        $budgets = Budget::with('customer')
            ->orderBy('number', 'desc')
            ->orderBy('version', 'desc')
            ->paginate(15);

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
        $budget->delete();

        return response()->noContent();
    }

    public function duplicate(Request $request, Budget $budget): BudgetResource
    {
        $duplicated = $this->budgetService->duplicate($budget, $request->user()->id);

        return new BudgetResource($duplicated->load(['customer', 'items']));
    }

    public function createVersion(Request $request, Budget $budget): BudgetResource
    {
        $newVersion = $this->budgetService->createVersion($budget, $request->user()->id);

        return new BudgetResource($newVersion->load(['customer', 'items']));
    }

    public function changeStatus(Request $request, Budget $budget): BudgetResource
    {
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
