<?php

namespace App\Modules\Budgets\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Budgets\Models\Budget;
use App\Modules\Budgets\Resources\BudgetResource;
use App\Modules\Budgets\Services\BudgetService;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Spatie\Browsershot\Browsershot;

class PublicBudgetController extends Controller
{
    protected BudgetService $budgetService;

    public function __construct(BudgetService $budgetService)
    {
        $this->budgetService = $budgetService;
    }

    public function show(string $token): BudgetResource
    {
        // Bypass TenantScope to allow public view of any budget by its secure public_token
        $budget = Budget::withoutGlobalScopes()
            ->where('public_token', $token)
            ->firstOrFail();

        // If budget is sent or negotiating, transition to viewed automatically
        if (in_array($budget->status, ['sent', 'negotiating'])) {
            $this->budgetService->changeStatus($budget, 'viewed', 'customer', 'Orçamento visualizado pelo cliente via link público');
        }

        $budget->load([
            'company',
            'customer',
            'items.product',
            'items.line',
            'items.profileColor',
            'items.glassType',
            'items.accessoryColor',
        ]);

        return new BudgetResource($budget);
    }

    public function approve(Request $request, string $token): BudgetResource
    {
        $budget = Budget::withoutGlobalScopes()
            ->where('public_token', $token)
            ->firstOrFail();

        $request->validate([
            'notes' => ['nullable', 'string', 'max:1000'],
            'signer_name' => ['nullable', 'string', 'max:255'],
        ]);

        $notes = $request->input('notes');
        $statusNotes = 'Aprovado pelo cliente via link público'.($notes ? ": {$notes}" : '');

        $updatedBudget = $this->budgetService->changeStatus($budget, 'approved', 'customer', $statusNotes);

        $updatedBudget->update([
            'approved_at' => now(),
            'approved_ip' => $request->ip(),
            'signer_name' => $request->input('signer_name') ?? $updatedBudget->signer_name,
        ]);

        return new BudgetResource($updatedBudget->load(['company', 'customer', 'items']));
    }

    public function reject(Request $request, string $token): BudgetResource
    {
        $budget = Budget::withoutGlobalScopes()
            ->where('public_token', $token)
            ->firstOrFail();

        $request->validate([
            'notes' => ['nullable', 'string', 'max:1000'],
            'signer_name' => ['nullable', 'string', 'max:255'],
        ]);

        $notes = $request->input('notes');
        $statusNotes = 'Rejeitado pelo cliente via link público'.($notes ? ": {$notes}" : '');

        $updatedBudget = $this->budgetService->changeStatus($budget, 'rejected', 'customer', $statusNotes);

        $updatedBudget->update([
            'rejected_at' => now(),
            'rejected_ip' => $request->ip(),
            'signer_name' => $request->input('signer_name') ?? $updatedBudget->signer_name,
        ]);

        return new BudgetResource($updatedBudget->load(['company', 'customer', 'items']));
    }

    public function downloadPdf(string $token): Response
    {
        $budget = Budget::withoutGlobalScopes()
            ->where('public_token', $token)
            ->firstOrFail();

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
