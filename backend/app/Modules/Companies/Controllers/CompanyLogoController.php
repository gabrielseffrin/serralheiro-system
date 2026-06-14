<?php

namespace App\Modules\Companies\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Companies\Models\Company;
use App\Modules\Companies\Requests\UploadLogoRequest;
use App\Modules\Companies\Resources\CompanyResource;
use Illuminate\Support\Facades\Storage;

class CompanyLogoController extends Controller
{
    public function __invoke(UploadLogoRequest $request): CompanyResource
    {
        /** @var Company $company */
        $company = $request->user()->company;

        if ($company->logo) {
            Storage::disk('public')->delete($company->logo);
        }

        $path = $request->file('logo')->store('logos', 'public');
        $company->update(['logo' => $path]);

        return new CompanyResource($company);
    }
}
