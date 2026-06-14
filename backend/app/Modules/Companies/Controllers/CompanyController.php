<?php

namespace App\Modules\Companies\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Companies\Requests\UpdateCompanyRequest;
use App\Modules\Companies\Resources\CompanyResource;
use Illuminate\Http\Request;

class CompanyController extends Controller
{
    public function show(Request $request): CompanyResource
    {
        $company = $request->user()->company;

        return new CompanyResource($company);
    }

    public function update(UpdateCompanyRequest $request): CompanyResource
    {
        $company = $request->user()->company;
        $company->update($request->validated());

        return new CompanyResource($company);
    }
}
