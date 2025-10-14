type PdfJsModule = typeof import('pdfjs-dist/legacy/build/pdf.mjs');

let pdfjsModulePromise: Promise<PdfJsModule> | null = null;

export async function loadPdfJsModule(): Promise<PdfJsModule> {
    if (!pdfjsModulePromise) {
        pdfjsModulePromise = (new Function('return import("pdfjs-dist/legacy/build/pdf.mjs")'))() as Promise<PdfJsModule>;
    }

    return pdfjsModulePromise;
}
