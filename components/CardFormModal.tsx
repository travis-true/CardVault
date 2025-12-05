import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, Sparkles, Loader2, Camera } from 'lucide-react';
import { Sport, GradingCompany, Card } from '../types';
import { analyzeCardImage } from '../services/geminiService';
import { v4 as uuidv4 } from 'uuid';

interface CardFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (card: Card) => void;
}

export const CardFormModal: React.FC<CardFormModalProps> = ({ isOpen, onClose, onSave }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<Partial<Card>>({
    player: '',
    year: '',
    brand: '',
    card_number: '',
    sport: Sport.Baseball,
    team: '',
    grading_company: GradingCompany.Raw,
    grade: '',
    estimated_value: 0,
    notes: '',
  });

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
        setFormData({
            player: '',
            year: '',
            brand: '',
            card_number: '',
            sport: Sport.Baseball,
            team: '',
            grading_company: GradingCompany.Raw,
            grade: '',
            estimated_value: 0,
            notes: '',
        });
        setPreview(null);
    }
  }, [isOpen]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Convert to Base64
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      setPreview(base64String);
      
      // Auto-analyze
      setIsAnalyzing(true);
      try {
        const analysis = await analyzeCardImage(base64String);
        setFormData(prev => ({
          ...prev,
          player: analysis.player,
          year: analysis.year,
          brand: analysis.brand,
          card_number: analysis.card_number,
          team: analysis.team,
          notes: analysis.description,
          sport: mapSportString(analysis.sport)
        }));
      } catch (err) {
        console.error("Failed to analyze", err);
        // We allow the user to continue manually if AI fails
      } finally {
        setIsAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const mapSportString = (str: string): Sport => {
    const s = str.toLowerCase();
    if (s.includes('base')) return Sport.Baseball;
    if (s.includes('basket')) return Sport.Basketball;
    if (s.includes('foot')) return Sport.Football;
    if (s.includes('hock')) return Sport.Hockey;
    if (s.includes('socc')) return Sport.Soccer;
    if (s.includes('pok') || s.includes('magic') || s.includes('tcg')) return Sport.TCG;
    return Sport.Other;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newCard: Card = {
      id: uuidv4(),
      player: formData.player || 'Unknown Player',
      year: formData.year || '',
      brand: formData.brand || '',
      card_number: formData.card_number || '',
      sport: formData.sport || Sport.Other,
      team: formData.team || '',
      grading_company: formData.grading_company || GradingCompany.Raw,
      grade: formData.grade || '',
      estimated_value: Number(formData.estimated_value) || 0,
      image_url: preview || 'https://picsum.photos/300/400', // Fallback
      notes: formData.notes || '',
      date_added: new Date().toISOString()
    };
    onSave(newCard);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center sticky top-0 bg-slate-900 z-10">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-emerald-400">+</span> Add New Card
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Image Section */}
          <div className="space-y-4">
            <div 
              className={`aspect-[3/4] rounded-lg border-2 border-dashed flex flex-col items-center justify-center relative overflow-hidden group transition-colors ${
                preview ? 'border-emerald-500/50 bg-slate-950' : 'border-slate-700 bg-slate-800 hover:bg-slate-800/80 hover:border-slate-600'
              }`}
            >
              {preview ? (
                <img src={preview} alt="Card preview" className="w-full h-full object-contain" />
              ) : (
                <div className="text-center p-6" onClick={() => fileInputRef.current?.click()}>
                  <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center mx-auto mb-4 group-hover:bg-slate-600 transition-colors cursor-pointer">
                    <Camera className="text-slate-400" size={32} />
                  </div>
                  <p className="text-sm text-slate-400 font-medium">Click to upload card image</p>
                  <p className="text-xs text-slate-500 mt-2">AI will auto-detect details</p>
                </div>
              )}
              
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileChange}
              />

              {preview && (
                 <button 
                   onClick={() => fileInputRef.current?.click()}
                   className="absolute bottom-4 right-4 bg-slate-800 text-white p-2 rounded-full shadow-lg hover:bg-slate-700 border border-slate-600"
                 >
                   <Upload size={16} />
                 </button>
              )}
            </div>

            {isAnalyzing && (
              <div className="flex items-center gap-3 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-indigo-400 animate-pulse">
                <Sparkles size={18} />
                <span className="text-sm font-medium">Analyzing with Gemini AI...</span>
                <Loader2 size={16} className="animate-spin ml-auto" />
              </div>
            )}
            {!isAnalyzing && preview && formData.player && (
               <div className="flex items-center gap-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400">
                <Sparkles size={18} />
                <span className="text-sm font-medium">Details extracted successfully!</span>
              </div>
            )}
          </div>

          {/* Form Section */}
          <form id="cardForm" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Player / Subject</label>
              <input 
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                value={formData.player}
                onChange={e => setFormData({...formData, player: e.target.value})}
                placeholder="e.g. Michael Jordan"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Year</label>
                <input 
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                    value={formData.year}
                    onChange={e => setFormData({...formData, year: e.target.value})}
                    placeholder="1986"
                />
               </div>
               <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Sport</label>
                <select 
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                    value={formData.sport}
                    onChange={e => setFormData({...formData, sport: e.target.value as Sport})}
                >
                    {Object.values(Sport).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Brand / Set</label>
                  <input 
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                    value={formData.brand}
                    onChange={e => setFormData({...formData, brand: e.target.value})}
                    placeholder="Fleer"
                  />
                </div>
                 <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Card #</label>
                  <input 
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                    value={formData.card_number}
                    onChange={e => setFormData({...formData, card_number: e.target.value})}
                    placeholder="57"
                  />
                </div>
            </div>

             <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Team</label>
                <input 
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                value={formData.team}
                onChange={e => setFormData({...formData, team: e.target.value})}
                placeholder="Chicago Bulls"
                />
            </div>

            <div className="grid grid-cols-3 gap-4">
                 <div className="col-span-1">
                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Grader</label>
                    <select 
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                        value={formData.grading_company}
                        onChange={e => setFormData({...formData, grading_company: e.target.value as GradingCompany})}
                    >
                        {Object.values(GradingCompany).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                 </div>
                 <div className="col-span-1">
                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Grade</label>
                    <input 
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                        value={formData.grade}
                        onChange={e => setFormData({...formData, grade: e.target.value})}
                        placeholder="10"
                        disabled={formData.grading_company === GradingCompany.Raw}
                    />
                 </div>
                  <div className="col-span-1">
                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Value ($)</label>
                    <input 
                        type="number"
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                        value={formData.estimated_value}
                        onChange={e => setFormData({...formData, estimated_value: parseFloat(e.target.value)})}
                        placeholder="0.00"
                    />
                 </div>
            </div>
            
            <div>
                 <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Notes</label>
                 <textarea 
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500 transition-colors h-20 text-sm"
                    value={formData.notes}
                    onChange={e => setFormData({...formData, notes: e.target.value})}
                 />
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-slate-800 flex justify-end gap-4 bg-slate-900 sticky bottom-0 z-10">
          <button 
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-lg text-slate-300 font-medium hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit"
            form="cardForm"
            className="px-6 py-2.5 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-900/20 active:scale-95"
          >
            Save Card
          </button>
        </div>
      </div>
    </div>
  );
};
