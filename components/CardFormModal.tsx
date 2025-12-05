import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, Sparkles, Loader2, Camera, Search, DollarSign, Image as ImageIcon, RotateCw } from 'lucide-react';
import { Sport, Card, CardStatus, GradingCompany, RawCondition } from '../types';
import { analyzeCardImage, lookupCardInfo, findCardValue, findCardImage } from '../services/geminiService';
import { v4 as uuidv4 } from 'uuid';

interface CardFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (card: Card) => void;
}

export const CardFormModal: React.FC<CardFormModalProps> = ({ isOpen, onClose, onSave }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [isValuating, setIsValuating] = useState(false);
  const [isFindingImage, setIsFindingImage] = useState(false);
  
  const [previewFront, setPreviewFront] = useState<string | null>(null);
  const [previewBack, setPreviewBack] = useState<string | null>(null);
  const [activeSide, setActiveSide] = useState<'front' | 'back'>('front');

  const fileInputRefFront = useRef<HTMLInputElement>(null);
  const fileInputRefBack = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<Partial<Card>>({
    first_name: '',
    last_name: '',
    year: '',
    brand: '',
    card_number: '',
    sport: Sport.Baseball,
    team: '',
    status: CardStatus.Raw,
    grading_company: GradingCompany.PSA,
    grade: '',
    condition: RawCondition.NearMint,
    estimated_value: 0,
    notes: '',
  });

  useEffect(() => {
    if (!isOpen) {
        setFormData({
            first_name: '',
            last_name: '',
            year: '',
            brand: '',
            card_number: '',
            sport: Sport.Baseball,
            team: '',
            status: CardStatus.Raw,
            grading_company: GradingCompany.PSA,
            grade: '',
            condition: RawCondition.NearMint,
            estimated_value: 0,
            notes: '',
        });
        setPreviewFront(null);
        setPreviewBack(null);
        setActiveSide('front');
    }
  }, [isOpen]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      
      if (side === 'front') {
          setPreviewFront(base64String);
          // Only analyze if it's the front
          setIsAnalyzing(true);
          try {
            const analysis = await analyzeCardImage(base64String);
            setFormData(prev => ({
              ...prev,
              first_name: analysis.first_name,
              last_name: analysis.last_name,
              year: analysis.year,
              brand: analysis.brand,
              card_number: analysis.card_number,
              team: analysis.team,
              notes: prev.notes || analysis.description,
              sport: mapSportString(analysis.sport)
            }));
          } catch (err) {
            console.error("Failed to analyze", err);
          } finally {
            setIsAnalyzing(false);
          }
      } else {
          setPreviewBack(base64String);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleTextLookup = async () => {
    if (!formData.year || !formData.brand || !formData.card_number) {
        alert("Please enter Year, Brand, and Card # first.");
        return;
    }
    
    setIsLookingUp(true);
    try {
        const info = await lookupCardInfo(formData.year, formData.brand, formData.card_number);
        setFormData(prev => ({
            ...prev,
            first_name: info.first_name || prev.first_name,
            last_name: info.last_name || prev.last_name,
            team: info.team || prev.team,
            sport: info.sport ? mapSportString(info.sport) : prev.sport
        }));
    } catch (err) {
        console.error("Lookup failed", err);
    } finally {
        setIsLookingUp(false);
    }
  };

  const handleFindValue = async () => {
     if (!formData.year || !formData.brand || !formData.card_number || !formData.first_name) {
        alert("Please fill in card details (Year, Brand, Card #, Name) first.");
        return;
    }
    setIsValuating(true);
    try {
        const statusDetails = formData.status === CardStatus.Graded 
            ? `Graded ${formData.grading_company} ${formData.grade}` 
            : `Raw Condition ${formData.condition}`;
            
        const query = `${formData.year} ${formData.brand} ${formData.card_number} ${formData.first_name} ${formData.last_name} ${statusDetails}`;
        const value = await findCardValue(query);
        setFormData(prev => ({ ...prev, estimated_value: value }));
    } catch (err) {
        console.error("Valuation failed", err);
    } finally {
        setIsValuating(false);
    }
  };

  const handleFindImage = async () => {
    if (!formData.year || !formData.brand || !formData.card_number || !formData.first_name) {
       alert("Please fill in card details first to search for an image.");
       return;
   }
   setIsFindingImage(true);
   try {
       const query = `${formData.year} ${formData.brand} #${formData.card_number} ${formData.first_name} ${formData.last_name} card`;
       const url = await findCardImage(query);
       if (url) {
           setPreviewFront(url);
       } else {
           alert("No suitable image found via AI search.");
       }
   } catch (err) {
       console.error("Image search failed", err);
   } finally {
       setIsFindingImage(false);
   }
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
      first_name: formData.first_name || 'Unknown',
      last_name: formData.last_name || '',
      year: formData.year || '',
      brand: formData.brand || '',
      card_number: formData.card_number || '',
      sport: formData.sport || Sport.Other,
      team: formData.team || '',
      status: formData.status || CardStatus.Raw,
      grading_company: formData.status === CardStatus.Graded ? formData.grading_company : undefined,
      grade: formData.status === CardStatus.Graded ? formData.grade : undefined,
      condition: formData.status === CardStatus.Raw ? formData.condition : undefined,
      estimated_value: Number(formData.estimated_value) || 0,
      image_url: previewFront || 'https://picsum.photos/300/400',
      image_url_back: previewBack || undefined,
      notes: formData.notes || '',
      date_added: new Date().toISOString()
    };
    onSave(newCard);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center sticky top-0 bg-slate-900 z-10">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-emerald-400">+</span> Add New Card
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Images */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Tabs for Front/Back */}
            <div className="flex bg-slate-800 p-1 rounded-lg">
                <button 
                    type="button"
                    onClick={() => setActiveSide('front')}
                    className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${activeSide === 'front' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                >
                    Front Image
                </button>
                <button 
                    type="button"
                    onClick={() => setActiveSide('back')}
                    className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${activeSide === 'back' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                >
                    Back Image
                </button>
            </div>

            {/* Front Image Area */}
            <div className={`relative ${activeSide === 'front' ? 'block' : 'hidden'}`}>
                <div 
                className={`aspect-[3/4] rounded-lg border-2 border-dashed flex flex-col items-center justify-center relative overflow-hidden group transition-colors ${
                    previewFront ? 'border-emerald-500/50 bg-slate-950' : 'border-slate-700 bg-slate-800 hover:bg-slate-800/80 hover:border-slate-600'
                }`}
                >
                {previewFront ? (
                    <img src={previewFront} alt="Card Front" className="w-full h-full object-contain" />
                ) : (
                    <div className="text-center p-6" onClick={() => fileInputRefFront.current?.click()}>
                    <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center mx-auto mb-4 group-hover:bg-slate-600 transition-colors cursor-pointer">
                        <Camera className="text-slate-400" size={32} />
                    </div>
                    <p className="text-sm text-slate-400 font-medium">Upload Front Image</p>
                    <p className="text-xs text-slate-500 mt-2">AI Analysis Enabled</p>
                    </div>
                )}
                
                <input 
                    type="file" 
                    ref={fileInputRefFront} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={(e) => handleFileChange(e, 'front')}
                />

                {previewFront && (
                    <button 
                    onClick={() => fileInputRefFront.current?.click()}
                    className="absolute bottom-4 right-4 bg-slate-800 text-white p-2 rounded-full shadow-lg hover:bg-slate-700 border border-slate-600"
                    >
                    <Upload size={16} />
                    </button>
                )}
                </div>

                {!previewFront && (
                    <button
                        type="button"
                        onClick={handleFindImage}
                        disabled={isFindingImage}
                        className="mt-3 w-full py-2 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-lg flex items-center justify-center gap-2 text-sm transition-colors"
                    >
                        {isFindingImage ? <Loader2 size={14} className="animate-spin" /> : <ImageIcon size={14} />}
                        Use AI to find image
                    </button>
                )}

                {isAnalyzing && (
                    <div className="mt-3 flex items-center gap-3 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-indigo-400 animate-pulse">
                        <Sparkles size={18} />
                        <span className="text-sm font-medium">Analyzing card details...</span>
                        <Loader2 size={16} className="animate-spin ml-auto" />
                    </div>
                )}
            </div>

            {/* Back Image Area */}
            <div className={`relative ${activeSide === 'back' ? 'block' : 'hidden'}`}>
                <div 
                className={`aspect-[3/4] rounded-lg border-2 border-dashed flex flex-col items-center justify-center relative overflow-hidden group transition-colors ${
                    previewBack ? 'border-emerald-500/50 bg-slate-950' : 'border-slate-700 bg-slate-800 hover:bg-slate-800/80 hover:border-slate-600'
                }`}
                >
                {previewBack ? (
                    <img src={previewBack} alt="Card Back" className="w-full h-full object-contain" />
                ) : (
                    <div className="text-center p-6" onClick={() => fileInputRefBack.current?.click()}>
                    <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center mx-auto mb-4 group-hover:bg-slate-600 transition-colors cursor-pointer">
                        <RotateCw className="text-slate-400" size={32} />
                    </div>
                    <p className="text-sm text-slate-400 font-medium">Upload Back Image</p>
                    <p className="text-xs text-slate-500 mt-2">Optional</p>
                    </div>
                )}
                
                <input 
                    type="file" 
                    ref={fileInputRefBack} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={(e) => handleFileChange(e, 'back')}
                />

                 {previewBack && (
                    <button 
                    onClick={() => fileInputRefBack.current?.click()}
                    className="absolute bottom-4 right-4 bg-slate-800 text-white p-2 rounded-full shadow-lg hover:bg-slate-700 border border-slate-600"
                    >
                    <Upload size={16} />
                    </button>
                )}
                </div>
            </div>

          </div>

          {/* Right Column: Form */}
          <div className="lg:col-span-7">
            <form id="cardForm" onSubmit={handleSubmit} className="space-y-4">
                
                <div className="grid grid-cols-2 gap-4">
                    <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">First Name</label>
                    <input 
                        required
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                        value={formData.first_name}
                        onChange={e => setFormData({...formData, first_name: e.target.value})}
                        placeholder="Michael"
                    />
                    </div>
                    <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Last Name</label>
                    <input 
                        required
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                        value={formData.last_name}
                        onChange={e => setFormData({...formData, last_name: e.target.value})}
                        placeholder="Jordan"
                    />
                    </div>
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

                {(formData.year && formData.brand && formData.card_number && !formData.first_name) && (
                    <button
                        type="button"
                        onClick={handleTextLookup}
                        disabled={isLookingUp}
                        className="w-full py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-lg flex items-center justify-center gap-2 text-sm transition-colors"
                    >
                        {isLookingUp ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                        Auto-fill info from details
                    </button>
                )}

                <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Team</label>
                    <input 
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                    value={formData.team}
                    onChange={e => setFormData({...formData, team: e.target.value})}
                    placeholder="Chicago Bulls"
                    />
                </div>

                {/* Grading / Condition Section */}
                <div className="border-t border-slate-800 pt-4 mt-4 bg-slate-800/30 p-4 rounded-lg">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Card Status</label>
                            <select 
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                                value={formData.status}
                                onChange={e => setFormData({...formData, status: e.target.value as CardStatus})}
                            >
                                {Object.values(CardStatus).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                             <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Estimated Value ($)</label>
                             <div className="flex gap-2">
                                <input 
                                    type="number"
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                                    value={formData.estimated_value}
                                    onChange={e => setFormData({...formData, estimated_value: parseFloat(e.target.value)})}
                                    placeholder="0.00"
                                />
                                <button
                                    type="button"
                                    onClick={handleFindValue}
                                    disabled={isValuating}
                                    className="px-3 bg-emerald-600/20 text-emerald-400 border border-emerald-600/30 rounded-lg hover:bg-emerald-600/30 transition-colors"
                                    title="Find Fair Market Value via AI"
                                >
                                    {isValuating ? <Loader2 size={16} className="animate-spin" /> : <DollarSign size={16} />}
                                </button>
                             </div>
                        </div>
                    </div>

                    {formData.status === CardStatus.Raw ? (
                        <div>
                            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Condition</label>
                            <select 
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                                value={formData.condition}
                                onChange={e => setFormData({...formData, condition: e.target.value as RawCondition})}
                            >
                                {Object.values(RawCondition).map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Grader</label>
                                <select 
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                                    value={formData.grading_company}
                                    onChange={e => setFormData({...formData, grading_company: e.target.value as GradingCompany})}
                                >
                                    {Object.values(GradingCompany).map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Grade</label>
                                <input 
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                                    value={formData.grade}
                                    onChange={e => setFormData({...formData, grade: e.target.value})}
                                    placeholder="10"
                                />
                            </div>
                        </div>
                    )}
                </div>
                
                <div className="pt-2">
                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Notes</label>
                    <textarea 
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500 transition-colors h-20 text-sm"
                        value={formData.notes}
                        onChange={e => setFormData({...formData, notes: e.target.value})}
                    />
                </div>
            </form>
          </div>
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