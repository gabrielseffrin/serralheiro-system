<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Orçamento {{ $budget->number_formatted }} - V{{ $budget->version }}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        @media print {
            .no-print { display: none; }
            body { background: white; color: black; }
        }
        body {
            font-family: 'Inter', sans-serif;
        }
    </style>
</head>
<body class="bg-white text-gray-900 p-8 max-w-4xl mx-auto text-sm leading-relaxed">
    <!-- Header -->
    <div class="flex justify-between items-start border-b border-gray-250 pb-6 mb-8">
        <div>
            @if($budget->company->logo)
                <img src="{{ asset('storage/' . $budget->company->logo) }}" alt="Logo" class="h-16 object-contain mb-4">
            @else
                <div class="h-16 w-16 bg-blue-600 rounded-lg flex items-center justify-center text-white text-2xl font-black mb-4">
                    {{ substr($budget->company->name, 0, 1) }}
                </div>
            @endif
            <h1 class="text-xl font-bold text-gray-800">{{ $budget->company->name }}</h1>
            @if($budget->company->trade_name)
                <p class="text-xs text-gray-500 font-medium">{{ $budget->company->trade_name }}</p>
            @endif
            <div class="mt-2 text-xs text-gray-600 space-y-0.5">
                @if($budget->company->document) <p>CNPJ: {{ $budget->company->document }}</p> @endif
                @if($budget->company->phone) <p>Fone: {{ $budget->company->phone }}</p> @endif
                @if($budget->company->email) <p>E-mail: {{ $budget->company->email }}</p> @endif
                @if($budget->company->address) <p>Endereço: {{ $budget->company->address }}</p> @endif
            </div>
        </div>

        <div class="text-right">
            <span class="inline-block bg-blue-100 text-blue-800 text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider mb-3">
                Proposta Comercial
            </span>
            <h2 class="text-2xl font-black text-gray-800">{{ $budget->number_formatted }}</h2>
            <p class="text-xs text-gray-500 font-semibold mt-0.5">Versão {{ $budget->version }}</p>
            <div class="mt-4 text-xs text-gray-600 space-y-0.5">
                <p>Data de emissão: <strong>{{ $budget->created_at?->format('d/m/Y') }}</strong></p>
                @if($budget->expiration_date)
                    <p>Válido até: <strong class="text-red-600">{{ $budget->expiration_date->format('d/m/Y') }}</strong></p>
                @endif
                <p>Status: <strong class="uppercase">{{ __($budget->status) }}</strong></p>
            </div>
        </div>
    </div>

    <!-- Client / Project Info -->
    <div class="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-8 grid grid-cols-2 gap-4">
        <div>
            <h3 class="text-xs font-bold uppercase text-gray-500 tracking-wider mb-2">Destinatário / Cliente</h3>
            <p class="font-bold text-gray-800">{{ $budget->customer->name }}</p>
            <div class="mt-1.5 text-xs text-gray-650 space-y-0.5">
                @if($budget->customer->document) <p>CPF/CNPJ: {{ $budget->customer->document }}</p> @endif
                @if($budget->customer->phone) <p>Fone: {{ $budget->customer->phone }}</p> @endif
                @if($budget->customer->email) <p>E-mail: {{ $budget->customer->email }}</p> @endif
            </div>
        </div>
        <div>
            <h3 class="text-xs font-bold uppercase text-gray-500 tracking-wider mb-2">Dados da Obra / Entrega</h3>
            <div class="text-xs text-gray-650 space-y-0.5">
                @if($budget->customer->address)
                    <p>Local de Instalação: {{ $budget->customer->address }}</p>
                @else
                    <p class="text-gray-400 italic">Mesmo endereço cadastrado</p>
                @endif
            </div>
        </div>
    </div>

    <!-- Items Table -->
    <div class="mb-8">
        <h3 class="text-sm font-bold text-gray-800 mb-3 uppercase tracking-wide">Itens do Orçamento</h3>
        <table class="w-full text-left border-collapse border border-gray-200 rounded-lg overflow-hidden">
            <thead>
                <tr class="bg-gray-100 border-b border-gray-200 text-xs font-bold text-gray-600 uppercase">
                    <th class="p-3 w-12 text-center">Item</th>
                    <th class="p-3">Esquadria / Descrição Detalhada</th>
                    <th class="p-3 w-16 text-center">Qtd</th>
                    <th class="p-3 w-32 text-right">Unitário</th>
                    <th class="p-3 w-32 text-right">Subtotal</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 text-xs">
                @foreach($budget->items as $index => $item)
                    <tr class="hover:bg-gray-50">
                        <td class="p-3 text-center text-gray-500 font-bold">{{ $index + 1 }}</td>
                        <td class="p-3">
                            <p class="font-bold text-gray-800 text-sm">{{ $item->product->name }}</p>
                            @if($item->tag || $item->location)
                                <p class="text-[11px] text-gray-550 mt-0.5">
                                    @if($item->tag) <span class="bg-gray-200 text-gray-700 px-1 py-0.2 rounded font-mono font-bold">{{ $item->tag }}</span> @endif
                                    @if($item->location) <span>- Local: {{ $item->location }}</span> @endif
                                </p>
                            @endif
                            <!-- Technical specifications -->
                            <div class="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-gray-500">
                                @if($item->width && $item->height)
                                    <p>Dimensões: <strong>{{ $item->width }} x {{ $item->height }} mm</strong></p>
                                @endif
                                @if($item->line)
                                    <p>Linha: <strong>{{ $item->line->name }}</strong></p>
                                @endif
                                @if($item->profileColor)
                                    <p>Cor Perfil: <strong>{{ $item->profileColor->name }}</strong></p>
                                @endif
                                @if($item->glassType)
                                    <p>Vidro: <strong>{{ $item->glassType->name }}</strong></p>
                                @endif
                                @if($item->accessoryColor)
                                    <p>Cor Acessório: <strong>{{ $item->accessoryColor->name }}</strong></p>
                                @endif
                            </div>
                            @if($item->notes)
                                <p class="text-[11px] italic text-gray-400 mt-2 bg-gray-50 p-1.5 rounded border border-gray-150">Obs: {{ $item->notes }}</p>
                            @endif
                        </td>
                        <td class="p-3 text-center font-semibold text-gray-800">{{ $item->quantity }}</td>
                        <td class="p-3 text-right font-mono text-gray-700">R$ {{ number_format($item->unit_price, 2, ',', '.') }}</td>
                        <td class="p-3 text-right font-mono font-bold text-gray-800">R$ {{ number_format($item->total, 2, ',', '.') }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    </div>

    <!-- Financial Summary -->
    <div class="flex justify-end mb-8">
        <div class="w-72 bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2.5 font-mono text-xs text-gray-700">
            <div class="flex justify-between">
                <span>Subtotal:</span>
                <span>R$ {{ number_format($budget->subtotal, 2, ',', '.') }}</span>
            </div>
            @if((float)$budget->discount > 0)
                <div class="flex justify-between text-red-600 font-medium">
                    <span>Desconto (-) :</span>
                    <span>R$ {{ number_format($budget->discount, 2, ',', '.') }}</span>
                </div>
            @endif
            <div class="flex justify-between border-t border-gray-200 pt-2.5 text-sm font-bold text-gray-900">
                <span class="font-sans">Valor Total:</span>
                <span class="text-blue-700">R$ {{ number_format($budget->total, 2, ',', '.') }}</span>
            </div>
        </div>
    </div>

    <!-- Terms and Conditions -->
    <div class="border-t border-gray-200 pt-6 mb-12 space-y-4 text-xs text-gray-700">
        <h3 class="text-sm font-bold text-gray-800 uppercase tracking-wide">Condições Comerciais</h3>
        <div class="grid grid-cols-2 gap-4">
            @if($budget->payment_method)
                <div>
                    <span class="font-semibold text-gray-500 block">Forma de Pagamento:</span>
                    <span class="text-gray-800 font-medium">{{ $budget->payment_method }}</span>
                </div>
            @endif
            @if($budget->delivery_term)
                <div>
                    <span class="font-semibold text-gray-500 block">Prazo de Entrega:</span>
                    <span class="text-gray-800 font-medium">{{ $budget->delivery_term }}</span>
                </div>
            @endif
            @if($budget->warranty_term)
                <div>
                    <span class="font-semibold text-gray-500 block">Garantia Oferecida:</span>
                    <span class="text-gray-800 font-medium">{{ $budget->warranty_term }}</span>
                </div>
            @endif
        </div>
        @if($budget->notes)
            <div class="bg-gray-50 p-4 rounded-xl border border-gray-200 mt-2">
                <span class="font-semibold text-gray-600 block mb-1">Notas do Orçamento:</span>
                <p class="whitespace-pre-line text-gray-600 text-[11px] leading-normal">{{ $budget->notes }}</p>
            </div>
        @endif
    </div>

    <!-- Signature / Acceptance Section -->
    <div class="grid grid-cols-2 gap-8 pt-12 border-t border-gray-200 text-center text-xs text-gray-500">
        <div class="flex flex-col items-center">
            <div class="w-48 border-b border-gray-300 mb-2 h-12"></div>
            <p class="font-bold text-gray-700">{{ $budget->company->name }}</p>
            <p>Representante Comercial</p>
        </div>
        <div class="flex flex-col items-center">
            <div class="w-48 border-b border-gray-300 mb-2 h-12"></div>
            <p class="font-bold text-gray-700">{{ $budget->customer->name }}</p>
            <p>Aceite do Cliente</p>
        </div>
    </div>
</body>
</html>
