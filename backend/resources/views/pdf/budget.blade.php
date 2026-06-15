<!DOCTYPE html>
<html lang="pt-BR">

<head>
    <meta charset="UTF-8">
    <title>Orçamento {{ '#'.str_pad((string) $budget->number, 6, '0', STR_PAD_LEFT) }} - V{{ $budget->version }}</title>

    <script src="https://cdn.tailwindcss.com"></script>

    <style>
        @page {
            size: A4;
            margin: 16mm 18mm;
        }

        body {
            font-family: Arial, Helvetica, sans-serif;
            color: #111827;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }

        @media print {
            .no-print { display: none; }
            body { background: white; }
        }

        .page-break {
            page-break-before: always;
        }
    </style>
</head>

<body class="bg-white text-sm leading-relaxed">

<div class="max-w-5xl mx-auto p-8">


    {{-- ═══════════════════════════════════════════════════════════════
         HEADER — Empresa + Número do Orçamento
    ═══════════════════════════════════════════════════════════════ --}}

    <header class="border-b-2 border-gray-800 pb-6 mb-8 flex justify-between items-start">

        {{-- Dados da empresa --}}
        <div>
            @if($budget->company->logo)
                <img
                    src="{{ asset('storage/' . $budget->company->logo) }}"
                    alt="Logo {{ $budget->company->name }}"
                    class="h-20 object-contain mb-3"
                >
            @else
                <div class="h-16 w-16 bg-gray-900 rounded-lg flex items-center justify-center text-white text-2xl font-black mb-3">
                    {{ mb_substr($budget->company->name, 0, 1) }}
                </div>
            @endif

            <h1 class="text-2xl font-black uppercase tracking-tight">
                {{ $budget->company->name }}
            </h1>

            @if($budget->company->trade_name)
                <p class="text-gray-500 font-semibold text-sm">
                    {{ $budget->company->trade_name }}
                </p>
            @endif

            <div class="text-xs mt-3 text-gray-600 space-y-0.5">
                @if($budget->company->document)
                    <p>CNPJ: <strong>{{ $budget->company->document }}</strong></p>
                @endif
                @if($budget->company->phone)
                    <p>Telefone: <strong>{{ $budget->company->phone }}</strong></p>
                @endif
                @if($budget->company->email)
                    <p>E-mail: <strong>{{ $budget->company->email }}</strong></p>
                @endif
                @if($budget->company->address)
                    <p>Endereço: <strong>{{ $budget->company->address }}</strong></p>
                @endif
            </div>
        </div>

        {{-- Badge do orçamento --}}
        <div class="text-right">
            <div class="bg-gray-900 text-white rounded-lg px-5 py-3 inline-block">
                <p class="text-[10px] tracking-[0.2em] uppercase font-bold">Proposta Comercial</p>
                <p class="text-3xl font-black leading-tight">
                    {{ '#'.str_pad((string) $budget->number, 6, '0', STR_PAD_LEFT) }}
                </p>
                <p class="text-xs font-semibold text-gray-400">
                    Versão {{ $budget->version }}
                </p>
            </div>

            <div class="mt-4 text-xs text-gray-600 space-y-0.5">
                <p>
                    Emissão:
                    <strong>{{ $budget->created_at?->format('d/m/Y') }}</strong>
                </p>
                @if($budget->expiration_date)
                    <p>
                        Válido até:
                        <strong class="text-red-600">{{ $budget->expiration_date->format('d/m/Y') }}</strong>
                    </p>
                @endif
            </div>
        </div>

    </header>


    {{-- ═══════════════════════════════════════════════════════════════
         CLIENTE — Dados do destinatário
    ═══════════════════════════════════════════════════════════════ --}}

    <section class="border border-gray-200 rounded-xl p-5 mb-8">

        <div class="grid grid-cols-2 gap-6">

            {{-- Coluna 1: Dados cadastrais --}}
            <div>
                <h2 class="text-xs font-bold uppercase text-gray-500 tracking-wider mb-3">
                    Destinatário / Cliente
                </h2>

                <p class="font-bold text-gray-800 text-base">
                    {{ $budget->customer->name }}
                </p>

                <div class="mt-2 text-xs text-gray-600 space-y-0.5">
                    @if($budget->customer->document)
                        <p>CPF/CNPJ: <strong>{{ $budget->customer->document }}</strong></p>
                    @endif
                    @if($budget->customer->phone)
                        <p>Telefone: <strong>{{ $budget->customer->phone }}</strong></p>
                    @endif
                    @if($budget->customer->email)
                        <p>E-mail: <strong>{{ $budget->customer->email }}</strong></p>
                    @endif
                </div>
            </div>

            {{-- Coluna 2: Dados da obra --}}
            <div>
                <h2 class="text-xs font-bold uppercase text-gray-500 tracking-wider mb-3">
                    Dados da Obra / Entrega
                </h2>

                <div class="text-xs text-gray-600 space-y-0.5">
                    @if($budget->customer->address)
                        <p>Local: <strong>{{ $budget->customer->address }}</strong></p>
                    @else
                        <p class="text-gray-400 italic">Mesmo endereço cadastrado</p>
                    @endif
                </div>
            </div>

        </div>

    </section>


    {{-- ═══════════════════════════════════════════════════════════════
         ITENS — Cards individuais por esquadria
    ═══════════════════════════════════════════════════════════════ --}}

    <h2 class="font-black uppercase mb-4 tracking-wide">
        Itens do Orçamento
    </h2>

    @foreach($budget->items as $index => $item)

        <div class="border border-gray-200 rounded-xl p-5 mb-4">

            {{-- Cabeçalho do item --}}
            <div class="flex justify-between items-start border-b border-gray-100 pb-3 mb-4">

                <div>
                    <span class="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                        Item {{ $index + 1 }}
                    </span>

                    <h3 class="text-base font-bold text-gray-800">
                        {{ $item->product->name }}
                    </h3>

                    @if($item->tag || $item->location)
                        <p class="text-[11px] text-gray-500 mt-0.5">
                            @if($item->tag)
                                <span class="bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded font-mono font-bold text-[10px]">{{ $item->tag }}</span>
                            @endif
                            @if($item->location)
                                <span class="ml-1">Local: {{ $item->location }}</span>
                            @endif
                        </p>
                    @endif
                </div>

                <div class="text-right">
                    <p class="text-[10px] text-gray-400 uppercase font-bold">Quantidade</p>
                    <p class="text-lg font-black text-gray-800">{{ $item->quantity }}</p>
                </div>

            </div>

            {{-- Especificações técnicas --}}
            <div class="grid grid-cols-3 gap-4 text-xs">

                @if($item->width && $item->height)
                    <div>
                        <p class="text-gray-400 text-[10px] uppercase font-semibold">Dimensão</p>
                        <p class="font-bold text-gray-700">{{ $item->width }} x {{ $item->height }} mm</p>
                    </div>
                @endif

                @if($item->line)
                    <div>
                        <p class="text-gray-400 text-[10px] uppercase font-semibold">Linha</p>
                        <p class="font-bold text-gray-700">{{ $item->line->name }}</p>
                    </div>
                @endif

                @if($item->profileColor)
                    <div>
                        <p class="text-gray-400 text-[10px] uppercase font-semibold">Cor Perfil</p>
                        <p class="font-bold text-gray-700">{{ $item->profileColor->name }}</p>
                    </div>
                @endif

                @if($item->glassType)
                    <div>
                        <p class="text-gray-400 text-[10px] uppercase font-semibold">Vidro</p>
                        <p class="font-bold text-gray-700">{{ $item->glassType->name }}</p>
                    </div>
                @endif

                @if($item->accessoryColor)
                    <div>
                        <p class="text-gray-400 text-[10px] uppercase font-semibold">Cor Acessório</p>
                        <p class="font-bold text-gray-700">{{ $item->accessoryColor->name }}</p>
                    </div>
                @endif

            </div>

            {{-- Observação do item --}}
            @if($item->notes)
                <div class="mt-4 bg-gray-50 rounded-lg p-3 text-xs text-gray-600 border border-gray-100">
                    <strong class="text-gray-700">Observação:</strong> {{ $item->notes }}
                </div>
            @endif

            {{-- Valores --}}
            <div class="mt-4 pt-3 border-t border-gray-100 flex justify-end gap-8 text-right">
                <div>
                    <p class="text-[10px] text-gray-400 uppercase font-semibold">Valor Unitário</p>
                    <p class="font-mono text-gray-700">R$ {{ number_format($item->unit_price, 2, ',', '.') }}</p>
                </div>
                <div>
                    <p class="text-[10px] text-gray-400 uppercase font-semibold">Total do Item</p>
                    <p class="font-mono font-black text-gray-900 text-base">R$ {{ number_format($item->total, 2, ',', '.') }}</p>
                </div>
            </div>

        </div>

    @endforeach


    {{-- ═══════════════════════════════════════════════════════════════
         RESUMO FINANCEIRO
    ═══════════════════════════════════════════════════════════════ --}}

    <div class="flex justify-end mt-6 mb-8">
        <div class="w-80 border border-gray-200 rounded-xl overflow-hidden">

            <div class="px-5 py-3 space-y-2 text-xs font-mono text-gray-700">
                <div class="flex justify-between">
                    <span class="font-sans">Subtotal:</span>
                    <span>R$ {{ number_format($budget->subtotal, 2, ',', '.') }}</span>
                </div>
                @if((float) $budget->discount > 0)
                    <div class="flex justify-between text-red-600 font-medium">
                        <span class="font-sans">Desconto (−):</span>
                        <span>R$ {{ number_format($budget->discount, 2, ',', '.') }}</span>
                    </div>
                @endif
            </div>

            <div class="bg-gray-900 text-white px-5 py-4 flex justify-between items-center">
                <span class="font-bold uppercase text-sm">Total Geral</span>
                <span class="text-2xl font-black">R$ {{ number_format($budget->total, 2, ',', '.') }}</span>
            </div>

        </div>
    </div>


    {{-- ═══════════════════════════════════════════════════════════════
         CONDIÇÕES COMERCIAIS
    ═══════════════════════════════════════════════════════════════ --}}

    <section class="border-t-2 border-gray-200 pt-6 mb-10">

        <h2 class="font-black uppercase mb-4 tracking-wide text-sm">
            Condições Comerciais
        </h2>

        <div class="grid grid-cols-3 gap-5 text-xs">

            @if($budget->payment_method)
                <div class="bg-gray-50 rounded-lg p-3 border border-gray-100">
                    <p class="text-gray-400 text-[10px] uppercase font-bold mb-1">Forma de Pagamento</p>
                    <p class="font-bold text-gray-800">{{ $budget->payment_method }}</p>
                </div>
            @endif

            @if($budget->delivery_term)
                <div class="bg-gray-50 rounded-lg p-3 border border-gray-100">
                    <p class="text-gray-400 text-[10px] uppercase font-bold mb-1">Prazo de Entrega</p>
                    <p class="font-bold text-gray-800">{{ $budget->delivery_term }}</p>
                </div>
            @endif

            @if($budget->warranty_term)
                <div class="bg-gray-50 rounded-lg p-3 border border-gray-100">
                    <p class="text-gray-400 text-[10px] uppercase font-bold mb-1">Garantia</p>
                    <p class="font-bold text-gray-800">{{ $budget->warranty_term }}</p>
                </div>
            @endif

        </div>

        @if($budget->notes)
            <div class="mt-4 bg-gray-50 rounded-lg p-4 text-xs border border-gray-100">
                <p class="font-bold text-gray-600 mb-1">Observações Gerais:</p>
                <p class="whitespace-pre-line text-gray-600 leading-relaxed">{{ $budget->notes }}</p>
            </div>
        @endif

    </section>


    {{-- ═══════════════════════════════════════════════════════════════
         ASSINATURAS
    ═══════════════════════════════════════════════════════════════ --}}

    <div class="grid grid-cols-2 gap-20 mt-16 text-center text-xs">

        <div>
            <div class="border-t border-gray-400 pt-3 mx-8">
                <p class="font-bold text-gray-800">{{ $budget->company->name }}</p>
                <p class="text-gray-500">Responsável Comercial</p>
            </div>
        </div>

        <div>
            <div class="border-t border-gray-400 pt-3 mx-8">
                <p class="font-bold text-gray-800">{{ $budget->customer->name }}</p>
                <p class="text-gray-500">Aceite do Cliente</p>
            </div>
        </div>

    </div>


    {{-- ═══════════════════════════════════════════════════════════════
         FOOTER
    ═══════════════════════════════════════════════════════════════ --}}

    <footer class="mt-12 text-center text-[10px] text-gray-400 border-t border-gray-100 pt-4">
        Orçamento válido conforme condições descritas neste documento.
        <br>
        Gerado em {{ now()->format('d/m/Y \à\s H:i') }}
    </footer>

</div>

</body>
</html>
