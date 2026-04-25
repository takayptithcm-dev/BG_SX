import { useState, useRef, DragEvent, ChangeEvent, useEffect } from 'react';
import { Upload, FileImage, X, Loader2, Calculator, AlertCircle, FileText, Printer, ImagePlus, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { marked } from 'marked';
// @ts-ignore
import html2pdf from 'html2pdf.js';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || process.env.GEMINI_API_KEY });

const SYSTEM_PROMPT = `Bạn là Giám đốc Sản xuất (Production Manager) kiêm Chuyên gia Bóc tách Bản vẽ & Dự toán Ngân sách (Estimator) có 10 năm kinh nghiệm chuyên thi công Booth Activation, POSM, Decor TTTM và Event BTL tại Việt Nam.

Nhiệm vụ chính:
Đọc và bóc tách tự động file BVKT (PDF, hình ảnh 2D/3D, layout, render) + Manual bốc tách mà người dùng upload.
Ưu tiên tuyệt đối Rate Card để tính đơn giá chính xác.
Nếu người dùng upload thêm Rate Card mới → Dùng Rate Card mới thay thế.
Xuất báo giá theo đúng 4 nhóm hạng mục bắt buộc.

RATE CARD CHÍNH THỨC (ƯU TIÊN TUYỆT ĐỐI - PHẦN SẢN XUẤT)
I. SÀN
Sàn dán AW (Ván MDF hệ xương gỗ dán AW): Ván nguyên = 500.000 đ/m² | Ván cắt = 550.000 đ/m²
Khung sắt tải trọng lót ván MDF (Sàn nguyên): Cao 0.1m = 750.000 đ/m² | Cao 0.2m→1.1m = 850.000 đ/m²
Khung sắt tải trọng lót ván MDF (Sàn cắt): Cao 0.1m = 750.000 đ/m² | Cao 0.2m→1m = 1.100.000 đ/m²
Thảm nỉ gân mỏng trải sàn sân khấu (có gim) = 65.000 đ/m²
Thảm nỉ trải sàn KS có keo 3M = 75.000 đ/m²
MDF 9li dán Decal: cao 0.1m = 50.000 đ/md | cao 0.2–0.6m = 140.000 đ/md | cao ≥0.7m = 320.000 đ/m²

II. BACKDROP
Vách gỗ (Khung sắt ốp MDF 9ly dán decal/PP): 1 mặt = 550.000 đ/m² | 2 mặt = 850.000 đ/m²
Vách gỗ sơn nước: 1 mặt = 600.000 đ/m² | 2 mặt = 900.000 đ/m²
Vách Formex 9ly dán decal: 1 mặt = 650.000 đ/m² | 2 mặt = 950.000 đ/m²
Khung sắt căng Hiflex 2 da in: 1 mặt = 280.000 đ/m² | 2 mặt = 450.000 đ/m²
Khung sắt căng Hiflex in UV (bạt UV Korea): 1 mặt = 550.000 đ/m²
Khung sắt căng vải đen: 1 mặt = 300.000 đ/m²
Vải đen che hậu = 50.000 đ/m²
In Canvas (chưa khung) = 200.000 đ/m² (khổ 1.5m)

III. STANDEE
Standee chân tụ đứng (Khung sắt ốp foamex 9ly dán PP in KTS)
KT 2mH × 0.8mL × 1 mặt = 1.400.000 đ/bộ
KT 1.8mH × 0.8mL × 2 mặt = 1.800.000 đ/bộ

IV. LED NEON & ĐÈN
LED Neon (nẹp chỉ 1 phân hoặc nẹp U sơn màu) = 320.000 đ/md
LED dán theo màu = 150.000 đ/md
Spotlight 20W (sơn màu + cần) = 350.000 đ/bộ
Đèn pha LED 20W = 350.000 đ/bộ | 30W = 400.000 đ/bộ | 50W = 500.000 đ/bộ

V. HỘP ĐÈN & DIECUT
Hộp đèn Mica (CNC + LED siêu sáng): ≤0.6m = 3.200.000 đ/md | ≥0.7m = 3.800.000 đ/m²
Hộp đèn Hiflex 3M (chip LED Samsung) = 1.200.000 đ/m²
Diecut Foamex 9ly (hình) = 1.000.000 đ/m² | (chữ) = 1.300.000 đ/m²
Diecut MDF mặt trước (hình) = 900.000 đ/m² | (chữ) = 1.150.000 đ/m²
Foamex 18mm cắt CNC dán AW = 1.200.000 đ/m²
MDF 18mm cắt CNC dán AW = 550.000 đ/m²

CẤU TRÚC BÁO GIÁ BẮT BUỘC
Luôn trả lời bằng 4 bảng Markdown theo thứ tự:
1. HẠNG MỤC SẢN XUẤT (Production & Fabrication) ← Dùng Rate Card trên
2. HẠNG MỤC PHỤ TRỢ MỸ THUẬT (Deco & Lighting)
3. HẠNG MỤC VẬN HÀNH & THI CÔNG (Operation & Setup)
4. PHÍ QUẢN LÝ TÒA NHÀ & THUẾ

Mỗi bảng có cột: Hạng mục | Quy cách / Kích thước | Số lượng | Đơn vị | Đơn giá (VND) | Thành tiền (VND)
Sau báo giá luôn đưa:
- Tổng giá (chưa VAT & đã VAT 10%)
- 2 option: Gói Tiết kiệm & Gói Chất lượng Cao
- Đề xuất tối ưu vật liệu (tiết kiệm ≥10% nếu có)
- Cảnh báo chi phí ẩn (overtime đêm, kí quỹ TTTM, tháo dỡ, vận chuyển hầm…)
- Contingency 8% + Agency Margin 25%

Bắt đầu trả lời bằng:
"✅ Tôi đã bóc tách xong file BVKT và Manual theo Rate Card. Dưới đây là báo giá chi tiết theo 4 nhóm:"`;

async function fileToGenerativePart(file: File) {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
}

export default function App() {
  const [view, setView] = useState<'input' | 'loading' | 'result'>('input');
  const [files, setFiles] = useState<File[]>([]);
  const [renderImages, setRenderImages] = useState<File[]>([]);
  const [renderImageUrls, setRenderImageUrls] = useState<string[]>([]);
  const [manualInput, setManualInput] = useState('');
  const [htmlResult, setHtmlResult] = useState('');
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const renderInputRef = useRef<HTMLInputElement>(null);
  const contentEditableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const urls = renderImages.map(file => URL.createObjectURL(file));
    setRenderImageUrls(urls);
    return () => urls.forEach(url => URL.revokeObjectURL(url));
  }, [renderImages]);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files).filter(f => 
        f.type.startsWith('image/') || f.type === 'application/pdf'
      );
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).filter(f => 
        f.type.startsWith('image/') || f.type === 'application/pdf'
      );
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const handleRenderImageSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).filter(f => f.type.startsWith('image/'));
      setRenderImages(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeRenderImage = (index: number) => {
    setRenderImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleExportPDF = () => {
    const element = document.getElementById('pdf-content');
    if (!element) return;

    // Add a temporary class to hide UI elements during export
    element.classList.add('exporting-pdf');

    const opt = {
      margin:       [15, 15, 15, 15],
      filename:     'Bao_Gia_Du_Toan.pdf',
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, logging: false },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
    };
    
    html2pdf().set(opt).from(element).save().then(() => {
      element.classList.remove('exporting-pdf');
    });
  };

  const generateQuotation = async () => {
    if (files.length === 0 && !manualInput.trim()) {
      setError('Vui lòng tải lên bản vẽ hoặc nhập thông tin bóc tách thủ công.');
      return;
    }

    setView('loading');
    setError('');

    try {
      const parts: any[] = [];
      
      for (const file of files) {
        const part = await fileToGenerativePart(file);
        parts.push(part);
      }

      const promptText = manualInput.trim() 
        ? `Yêu cầu bóc tách bổ sung (Manual Input):\n${manualInput}`
        : 'Hãy phân tích các bản vẽ đính kèm và lập dự toán.';
      parts.push({ text: promptText });

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: [
          { role: 'user', parts: [{ text: SYSTEM_PROMPT }] },
          { role: 'model', parts: [{ text: 'Đã rõ. Tôi đã sẵn sàng nhận bản vẽ và yêu cầu bóc tách.' }] },
          { role: 'user', parts }
        ],
        config: {
          temperature: 0.2,
        }
      });

      if (response.text) {
        const parsedHtml = await marked.parse(response.text);
        setHtmlResult(parsedHtml);
        setView('result');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        throw new Error('Không nhận được phản hồi từ AI.');
      }
    } catch (err: any) {
      console.error('Error generating quotation:', err);
      setError(err.message || 'Đã xảy ra lỗi trong quá trình xử lý.');
      setView('input');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 text-slate-900 font-sans selection:bg-blue-200">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 no-print shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-2 rounded-xl text-white shadow-md shadow-blue-500/20">
              <Calculator size={22} />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight text-slate-800">Event Estimator Pro</h1>
              <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">Production Manager AI</p>
            </div>
          </div>
          
          {view === 'result' && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setView('input')}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
              >
                <ArrowLeft size={16} />
                Quay lại
              </button>
              <button
                onClick={handleExportPDF}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-all shadow-md shadow-blue-500/20 active:scale-95"
              >
                <Printer size={16} />
                Xuất PDF
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 print-area">
        
        {/* VIEW: INPUT */}
        {view === 'input' && (
          <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight mb-3">Lập Dự Toán Tự Động</h2>
              <p className="text-slate-500 text-sm max-w-xl mx-auto">
                Tải lên bản vẽ kỹ thuật và hình ảnh minh họa. Hệ thống sẽ tự động bóc tách khối lượng và áp dụng Rate Card chuẩn xác.
              </p>
            </div>

            {/* File Upload Area */}
            <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/40 border border-slate-100 p-6 transition-all hover:shadow-2xl hover:shadow-slate-200/50">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-4 flex items-center gap-2">
                <FileImage size={18} className="text-blue-500" />
                1. Bản vẽ kỹ thuật (Bắt buộc)
              </h3>
              
              <div 
                className={cn(
                  "border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer",
                  isDragging ? "border-blue-500 bg-blue-50 scale-[1.02]" : "border-slate-200 hover:border-blue-400 hover:bg-slate-50"
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  multiple 
                  accept="image/*,application/pdf"
                  onChange={handleFileSelect}
                />
                <div className="bg-white w-12 h-12 rounded-full shadow-sm border border-slate-100 flex items-center justify-center mx-auto mb-4">
                  <Upload className="h-5 w-5 text-blue-500" />
                </div>
                <p className="text-sm text-slate-700 font-semibold mb-1">Kéo thả file vào đây hoặc Click để chọn</p>
                <p className="text-xs text-slate-400">Hỗ trợ: JPG, PNG, PDF</p>
              </div>

              {files.length > 0 && (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200 group">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="bg-white p-1.5 rounded shadow-sm">
                          <FileText size={16} className="text-blue-500 flex-shrink-0" />
                        </div>
                        <span className="text-sm font-medium text-slate-700 truncate">{file.name}</span>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); removeFile(index); }}
                        className="text-slate-400 hover:text-red-500 p-1.5 rounded-md hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Render Images Upload */}
            <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/40 border border-slate-100 p-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-2">
                <ImagePlus size={18} className="text-blue-500" />
                2. Hình ảnh minh họa (Tùy chọn)
              </h3>
              <p className="text-sm text-slate-500 mb-4">Tải lên các hình ảnh render 3D để đính kèm vào đầu báo giá PDF.</p>
              
              <button 
                onClick={() => renderInputRef.current?.click()}
                className="w-full py-3 px-4 border-2 border-dashed border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:border-blue-400 hover:text-blue-600 transition-all flex items-center justify-center gap-2"
              >
                <ImagePlus size={18} />
                Thêm hình ảnh Render
              </button>
              <input 
                type="file" 
                ref={renderInputRef} 
                className="hidden" 
                multiple 
                accept="image/*"
                onChange={handleRenderImageSelect}
              />

              {renderImages.length > 0 && (
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {renderImageUrls.map((url, index) => (
                    <div key={index} className="relative group aspect-video rounded-lg overflow-hidden border border-slate-200 shadow-sm">
                      <img src={url} alt="Render" className="w-full h-full object-cover" />
                      <button 
                        onClick={() => removeRenderImage(index)}
                        className="absolute top-2 right-2 bg-black/60 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:scale-110"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Manual Input Area */}
            <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/40 border border-slate-100 p-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-4 flex items-center gap-2">
                <FileText size={18} className="text-blue-500" />
                3. Ghi chú bổ sung (Tùy chọn)
              </h3>
              <textarea
                className="w-full h-32 p-4 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-sm resize-none transition-all bg-slate-50 focus:bg-white"
                placeholder="Nhập thêm yêu cầu, kích thước cụ thể, hoặc Rate Card bổ sung (nếu có)..."
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm flex items-start gap-3 border border-red-100 animate-in fade-in">
                <AlertCircle size={18} className="mt-0.5 flex-shrink-0 text-red-500" />
                <p className="font-medium">{error}</p>
              </div>
            )}

            {/* Action Button */}
            <button
              onClick={generateQuotation}
              disabled={files.length === 0 && !manualInput.trim()}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-slate-300 disabled:to-slate-400 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-2xl shadow-xl shadow-blue-500/30 disabled:shadow-none transition-all flex items-center justify-center gap-3 text-lg active:scale-[0.98]"
            >
              <Calculator size={24} />
              Bắt Đầu Lập Dự Toán
            </button>
          </div>
        )}

        {/* VIEW: LOADING */}
        {view === 'loading' && (
          <div className="flex flex-col items-center justify-center py-32 animate-in fade-in duration-500">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 rounded-full animate-pulse"></div>
              <div className="bg-white p-6 rounded-2xl shadow-2xl shadow-slate-200 border border-slate-100 relative z-10">
                <Loader2 size={48} className="animate-spin text-blue-600" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-slate-800 mt-8 mb-2">Đang phân tích dữ liệu...</h3>
            <p className="text-slate-500 text-sm font-medium animate-pulse">AI đang đọc bản vẽ và áp dụng Rate Card chuẩn</p>
          </div>
        )}

        {/* VIEW: RESULT */}
        {view === 'result' && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 print-area">
            <div className="bg-white rounded-2xl shadow-2xl shadow-slate-200/50 border border-slate-100 print-area overflow-hidden">
              
              <div className="p-8 sm:p-12 print-area" id="pdf-content" style={{ backgroundColor: '#ffffff', color: '#0f172a' }}>
                
                {/* Render Images in PDF/Preview */}
                {renderImageUrls.length > 0 && (
                  <div className="mb-10 print-only">
                    <div className="flex items-center gap-3 mb-6 pb-4" style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <ImagePlus size={24} style={{ color: '#2563eb' }} />
                      <h3 className="text-xl font-bold" style={{ color: '#1e293b' }}>Hình ảnh minh họa</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      {renderImageUrls.map((url, index) => (
                        <div key={index} className="rounded-xl overflow-hidden" style={{ border: '1px solid #e2e8f0' }}>
                          <img src={url} alt="Render" className="w-full h-auto object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Editable HTML Content */}
                <div className="relative group">
                  <div className="absolute -top-4 right-0 text-xs font-bold px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 no-print pointer-events-none" style={{ backgroundColor: '#dbeafe', color: '#1d4ed8' }}>
                    <CheckCircle2 size={12} />
                    Nhấp vào văn bản để chỉnh sửa trực tiếp
                  </div>
                  <div 
                    ref={contentEditableRef}
                    className="editable-content"
                    contentEditable={true}
                    suppressContentEditableWarning={true}
                    dangerouslySetInnerHTML={{ __html: htmlResult }}
                  />
                </div>

              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
