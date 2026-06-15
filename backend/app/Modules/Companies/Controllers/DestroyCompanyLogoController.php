<?php

namespace App\Modules\Companies\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Companies\Models\Company;
use App\Modules\Companies\Resources\CompanyResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class DestroyCompanyLogoController extends Controller
{
    public function __invoke(Request $request): CompanyResource
    {
        /** @var Company $company */
        $company = $request->user()->company;

        if ($company->logo) {
            Storage::disk('public')->delete($company->logo);
            $company->update(['logo' => null]);
        }

        return new CompanyResource($company);
    }
}
