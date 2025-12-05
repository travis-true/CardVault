import React, { useState, useEffect, useMemo } from 'react';
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Plus, LayoutGrid, Search, TrendingUp, Layers, Filter, RotateCw } from 'lucide-react';
import { CardFormModal } from './components/CardFormModal';
import { StatsChart } from './components/StatsChart';
import { getCards, saveCard, getPortfolioValue, getSportDistribution, deleteCard } from './services/storageService';
import { Card, SortOption, CardStatus } from './types';

// Helper for nav links
const NavLink = ({ to, icon: Icon, label }: { to: string; icon: any; label: string }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return (
    <Link 
      to={to} 
      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
        isActive 
          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
      }`}
    >
      <Icon size={20} />
      <span className="font-medium">{label}</span>
    </Link>
  );
};

const Dashboard = ({ cards, portfolioValue, sportData }: { cards: Card[], portfolioValue: number, sportData: any[] }) => {
  return (
    <div className="space-y-6">
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-xl">
            <h3 className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-2">Portfolio Value</h3>
            <p className="text-3xl font-bold text-white">${portfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            <div className="mt-4 text-emerald-400 text-sm flex items-center gap-1">
              <TrendingUp size={16} />
              <span>+0% today (static demo)</span>
            </div>
          </div>
          
          <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-xl">
            <h3 className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-2">Total Cards</h3>
            <p className="text-3xl font-bold text-white">{cards.length}</p>
             <div className="mt-4 text-slate-500 text-sm flex items-center gap-1">
              <Layers size={16} />
              <span>Across {sportData.length} categories</span>
            </div>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-6 opacity-10">
                <LayoutGrid size={100} className="text-white" />
             </div>
             <h3 className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-2">Latest Add</h3>
             {cards.length > 0 ? (
                <div>
                   <p className="text-xl font-bold text-white truncate">{cards[0].first_name} {cards[0].last_name}</p>
                   <p className="text-slate-400 text-sm">{cards[0].year} {cards[0].brand}</p>
                </div>
             ) : (
                <p className="text-slate-500">No cards yet</p>
             )}
          </div>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-slate-800/50 border border-slate-700 p-6 rounded-xl">
             <h3 className="text-white font-semibold mb-6">Recent Inventory</h3>
             <div className="space-y-4">
               {cards.slice(0, 5).map(card => (
                 <div key={card.id} className="flex items-center gap-4 p-3 hover:bg-slate-800 rounded-lg transition-colors group">
                    <img src={card.image_url} alt={`${card.first_name} ${card.last_name}`} className="w-12 h-16 object-cover rounded bg-slate-900" />
                    <div className="flex-1 min-w-0">
                       <h4 className="text-white font-medium truncate">{card.first_name} {card.last_name}</h4>
                       <p className="text-sm text-slate-400 truncate">{card.year} {card.brand} #{card.card_number}</p>
                    </div>
                    <div className="text-right">
                       <p className="text-white font-medium">${card.estimated_value}</p>
                       <span className="text-xs text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                        {card.status === CardStatus.Raw ? (card.condition || 'RAW') : `${card.grading_company} ${card.grade}`}
                       </span>
                    </div>
                 </div>
               ))}
               {cards.length === 0 && <p className="text-slate-500 text-center py-8">No cards found. Add one!</p>}
             </div>
          </div>
          
          <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-xl">
            <h3 className="text-white font-semibold mb-6">Sport Distribution</h3>
            <StatsChart data={sportData} />
          </div>
       </div>
    </div>
  );
};

// Simple Flip Card Component for Inventory
const InventoryCard = ({ card, onDelete }: { card: Card; onDelete: (id: string) => void }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden hover:border-emerald-500/50 transition-all group flex flex-col h-full">
          <div 
              className="relative aspect-[3/4] bg-slate-900 overflow-hidden cursor-pointer perspective-1000"
              onClick={() => card.image_url_back && setIsFlipped(!isFlipped)}
          >
              <div className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`} style={{ transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}>
                  {/* Front */}
                  <div className="absolute w-full h-full backface-hidden">
                      <img src={card.image_url} alt="Front" className="w-full h-full object-cover" />
                      <div className="absolute top-2 right-2">
                           <span className={`text-xs font-bold px-2 py-1 rounded shadow-lg backdrop-blur-md ${card.estimated_value > 100 ? 'bg-amber-500/90 text-black' : 'bg-slate-900/80 text-white border border-slate-700'}`}>
                          ${card.estimated_value}
                          </span>
                      </div>
                       {card.image_url_back && (
                          <div className="absolute bottom-2 right-2 bg-slate-900/50 p-1.5 rounded-full backdrop-blur-sm text-white/70 hover:text-white">
                              <RotateCw size={14} />
                          </div>
                      )}
                  </div>
                  {/* Back */}
                  <div className="absolute w-full h-full backface-hidden rotate-y-180 bg-slate-800 flex items-center justify-center" style={{ transform: 'rotateY(180deg)', backfaceVisibility: 'hidden' }}>
                      {card.image_url_back ? (
                          <img src={card.image_url_back} alt="Back" className="w-full h-full object-cover" />
                      ) : (
                          <p className="text-slate-500 text-sm">No back image</p>
                      )}
                  </div>
              </div>
          </div>

          <div className="p-4 flex-1 flex flex-col">
             <div className="flex justify-between items-start mb-1">
               <h3 className="font-bold text-white text-lg leading-tight line-clamp-1">{card.first_name} {card.last_name}</h3>
             </div>
             <p className="text-slate-400 text-sm mb-3">{card.year} {card.brand} #{card.card_number}</p>
             
             <div className="mt-auto pt-3 border-t border-slate-700 flex justify-between items-center">
                <span className="text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-400/20">
                  {card.status === CardStatus.Raw ? (card.condition || 'RAW') : `${card.grading_company} ${card.grade}`}
                </span>
                <button 
                  onClick={(e) => { e.stopPropagation(); onDelete(card.id); }}
                  className="text-slate-600 hover:text-red-400 text-xs transition-colors"
                >
                  Remove
                </button>
             </div>
          </div>
        </div>
  );
};

const Inventory = ({ cards, onDelete }: { cards: Card[], onDelete: (id: string) => void }) => {
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortOption>('date_desc');
  const [filterSport, setFilterSport] = useState<string>('All');

  const filteredCards = useMemo(() => {
    let result = [...cards];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(c => 
        c.first_name.toLowerCase().includes(q) || 
        c.last_name.toLowerCase().includes(q) ||
        c.team.toLowerCase().includes(q) ||
        c.brand.toLowerCase().includes(q)
      );
    }

    if (filterSport !== 'All') {
      result = result.filter(c => c.sport === filterSport);
    }

    result.sort((a, b) => {
      switch (sort) {
        case 'date_desc': return new Date(b.date_added).getTime() - new Date(a.date_added).getTime();
        case 'date_asc': return new Date(a.date_added).getTime() - new Date(b.date_added).getTime();
        case 'value_desc': return b.estimated_value - a.estimated_value;
        case 'value_asc': return a.estimated_value - b.estimated_value;
        default: return 0;
      }
    });

    return result;
  }, [cards, search, sort, filterSport]);

  const sports = ['All', ...Array.from(new Set(cards.map(c => c.sport)))];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-800/50 p-4 rounded-xl border border-slate-700">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search player, team, set..." 
            className="w-full bg-slate-900 border border-slate-700 text-white pl-10 pr-4 py-2.5 rounded-lg focus:outline-none focus:border-emerald-500 transition-colors"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative">
             <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
             <select 
              className="bg-slate-900 border border-slate-700 text-white pl-9 pr-8 py-2.5 rounded-lg focus:outline-none focus:border-emerald-500 appearance-none cursor-pointer"
              value={filterSport}
              onChange={e => setFilterSport(e.target.value)}
             >
                {sports.map(s => <option key={s} value={s}>{s}</option>)}
             </select>
          </div>

          <select 
            className="bg-slate-900 border border-slate-700 text-white px-4 py-2.5 rounded-lg focus:outline-none focus:border-emerald-500 cursor-pointer"
            value={sort}
            onChange={e => setSort(e.target.value as SortOption)}
          >
            <option value="date_desc">Newest First</option>
            <option value="date_asc">Oldest First</option>
            <option value="value_desc">Highest Value</option>
            <option value="value_asc">Lowest Value</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredCards.map(card => (
            <InventoryCard key={card.id} card={card} onDelete={onDelete} />
        ))}
      </div>
      
      {filteredCards.length === 0 && (
         <div className="text-center py-20">
            <div className="bg-slate-800/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
               <Search className="text-slate-500" size={32} />
            </div>
            <h3 className="text-white font-medium text-lg">No cards found</h3>
            <p className="text-slate-500 mt-1">Try adjusting your search or filters</p>
         </div>
      )}
    </div>
  );
};

export default function App() {
  const [cards, setCards] = useState<Card[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Initial Load
  useEffect(() => {
    setCards(getCards());
  }, []);

  const handleSaveCard = (card: Card) => {
    saveCard(card);
    setCards(getCards()); // Refresh state
  };

  const handleDeleteCard = (id: string) => {
    if (window.confirm('Are you sure you want to delete this card?')) {
        deleteCard(id);
        setCards(getCards());
    }
  }

  const portfolioValue = useMemo(() => getPortfolioValue(), [cards]);
  const sportData = useMemo(() => getSportDistribution(), [cards]);

  return (
    <HashRouter>
      <div className="min-h-screen bg-slate-950 flex text-slate-300 font-sans">
        {/* Sidebar */}
        <aside className="w-64 border-r border-slate-800 hidden md:flex flex-col bg-slate-900/50 fixed h-full z-20">
          <div className="p-6">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <span className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-slate-900 shadow-lg shadow-emerald-500/20">
                <Layers size={20} />
              </span>
              CardVault
            </h1>
          </div>
          
          <nav className="flex-1 px-4 space-y-2 mt-4">
            <NavLink to="/" icon={LayoutGrid} label="Dashboard" />
            <NavLink to="/inventory" icon={Layers} label="Inventory" />
          </nav>

          <div className="p-4 border-t border-slate-800">
             <button 
               onClick={() => setIsModalOpen(true)}
               className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-900/20 active:scale-95"
             >
               <Plus size={20} />
               Add Card
             </button>
          </div>
        </aside>

        {/* Mobile Nav Header */}
        <div className="md:hidden fixed top-0 left-0 right-0 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 p-4 z-40 flex justify-between items-center">
            <h1 className="font-bold text-white text-lg flex items-center gap-2">
              <span className="w-6 h-6 bg-emerald-500 rounded flex items-center justify-center text-slate-900">
                <Layers size={14} />
              </span>
              CardVault
            </h1>
            <button 
               onClick={() => setIsModalOpen(true)}
               className="bg-emerald-600 text-white p-2 rounded-lg"
             >
               <Plus size={20} />
             </button>
        </div>
        
        {/* Mobile Bottom Bar */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 z-40 flex justify-around p-3">
             <Link to="/" className="p-2 text-slate-400 hover:text-white"><LayoutGrid size={24}/></Link>
             <Link to="/inventory" className="p-2 text-slate-400 hover:text-white"><Layers size={24}/></Link>
        </div>

        {/* Main Content */}
        <main className="flex-1 md:ml-64 p-6 md:p-8 pt-20 md:pt-8 min-h-screen overflow-x-hidden">
          <Routes>
            <Route path="/" element={<Dashboard cards={cards} portfolioValue={portfolioValue} sportData={sportData} />} />
            <Route path="/inventory" element={<Inventory cards={cards} onDelete={handleDeleteCard} />} />
          </Routes>
        </main>

        <CardFormModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          onSave={handleSaveCard} 
        />
      </div>
    </HashRouter>
  );
}