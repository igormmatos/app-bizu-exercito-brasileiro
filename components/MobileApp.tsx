import React, { useState, useEffect } from 'react';
import { DataService } from '../services/dataService';
import { Category, ContentItem, ContentType } from '../types';
import { 
  ChevronLeft, 
  Search, 
  WifiOff, 
  PlayCircle, 
  PauseCircle, 
  FileText, 
  DownloadCloud, 
  BookOpen,
  Music,
  Image as ImageIcon,
  Home,
  Star,
  MessageSquarePlus,
  Send,
  CheckCircle2
} from 'lucide-react';

interface MobileAppProps {
  onExit: () => void;
}

type Screen = 'HOME' | 'CATEGORY' | 'DETAIL' | 'FAVORITES' | 'SUGGESTION';

export const MobileApp: React.FC<MobileAppProps> = ({ onExit }) => {
  // Navigation State
  const [screen, setScreen] = useState<Screen>('HOME');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);

  // Data State
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<ContentItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // User Preferences State
  const [favorites, setFavorites] = useState<string[]>([]);

  // Simulation State
  const [isPlaying, setIsPlaying] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<Record<string, number>>({});

  useEffect(() => {
    const load = async () => {
      const c = await DataService.getCategories();
      const i = await DataService.getContentItems();
      // Filter only published content for the app
      setCategories(c.filter(cat => cat.isPublished));
      setItems(i.filter(item => item.isPublished));
    };
    load();
  }, []);

  const handleCategorySelect = (cat: Category) => {
    setSelectedCategory(cat);
    setScreen('CATEGORY');
    setSearchQuery('');
  };

  const handleItemSelect = (item: ContentItem) => {
    setSelectedItem(item);
    setScreen('DETAIL');
    setIsPlaying(false);
  };

  const toggleFavorite = (itemId: string) => {
    setFavorites(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId) 
        : [...prev, itemId]
    );
  };

  const goBack = () => {
    if (screen === 'DETAIL') {
       if (selectedCategory && items.some(i => i.id === selectedItem?.id && i.categoryId === selectedCategory.id)) {
           setScreen('CATEGORY');
       } else {
           setScreen('FAVORITES'); 
           if (!selectedCategory) setScreen('HOME'); 
       }
    }
    else if (screen === 'CATEGORY' || screen === 'FAVORITES' || screen === 'SUGGESTION') setScreen('HOME');
  };

  const simulateDownload = (itemId: string) => {
    if (downloadProgress[itemId] === 100) return;
    
    setDownloadProgress(prev => ({ ...prev, [itemId]: 10 }));
    let progress = 10;
    const interval = setInterval(() => {
        progress += 20;
        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
        }
        setDownloadProgress(prev => ({ ...prev, [itemId]: progress }));
    }, 300);
  };

  // --- SUB-COMPONENTS ---

  const Header = ({ title, showBack = false }: { title: string, showBack?: boolean }) => (
    <div className="bg-army-900 text-white p-4 sticky top-0 z-20 shadow-md flex items-center justify-between h-16">
      <div className="flex items-center">
        {showBack && (
          <button onClick={goBack} className="mr-3 p-1 rounded-full hover:bg-army-800">
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}
        <h1 className="font-bold text-lg tracking-wide truncate max-w-[200px]">{title}</h1>
      </div>
      <div className="flex items-center space-x-3">
        <div className="flex items-center bg-army-800 px-2 py-1 rounded text-xs text-army-200">
            <WifiOff className="w-3 h-3 mr-1" />
            <span>Offline</span>
        </div>
        {!showBack && (
            <button onClick={onExit} className="text-xs bg-red-900 px-2 py-1 rounded hover:bg-red-800">
                Sair
            </button>
        )}
      </div>
    </div>
  );

  const HomeScreen = () => (
    <div className="p-4 pb-20">
      <div className="mb-6 relative">
         <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
         </div>
         <input 
            type="text"
            placeholder="Buscar bizu, canção..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-xl shadow-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-army-500"
         />
      </div>

      <h2 className="text-army-900 font-bold mb-4 px-1">Categorias</h2>
      <div className="grid grid-cols-2 gap-4">
        {categories.map(cat => (
            <button 
                key={cat.id}
                onClick={() => handleCategorySelect(cat)}
                className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center h-32 text-center active:scale-95 transition-transform"
            >
                <div className="w-12 h-12 bg-army-50 text-army-600 rounded-full flex items-center justify-center mb-3">
                    <BookOpen className="w-6 h-6" />
                </div>
                <span className="font-semibold text-gray-800 text-sm leading-tight">{cat.name}</span>
                <span className="text-xs text-gray-400 mt-1">{cat.itemCount} itens</span>
            </button>
        ))}
      </div>

      <div className="mt-8 bg-gradient-to-r from-army-800 to-army-700 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
            <h3 className="font-bold text-lg mb-1">Bizu do Dia</h3>
            <p className="text-army-100 text-sm mb-3">Aprenda a dobrar seu fardamento corretamente para a inspeção.</p>
            <button className="bg-white text-army-900 text-xs font-bold px-3 py-2 rounded-lg">Ler Agora</button>
        </div>
        <div className="absolute -right-4 -bottom-4 opacity-10">
            <FileText className="w-32 h-32" />
        </div>
      </div>
    </div>
  );

  const ItemList = ({ itemsToRender, emptyMessage }: { itemsToRender: ContentItem[], emptyMessage: string }) => (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {itemsToRender.map(item => (
            <div 
                key={item.id} 
                onClick={() => handleItemSelect(item)}
                className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex items-center space-x-4 active:bg-gray-50"
            >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 
                    ${item.type === ContentType.AUDIO ? 'bg-purple-100 text-purple-600' : 
                      item.type === ContentType.IMAGE ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'}`}>
                    {item.type === ContentType.AUDIO ? <Music className="w-5 h-5" /> : 
                     item.type === ContentType.IMAGE ? <ImageIcon className="w-5 h-5" /> : 
                     <FileText className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 truncate">{item.title}</h4>
                    <p className="text-xs text-gray-500 truncate">{item.description}</p>
                </div>
                {favorites.includes(item.id) && (
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 flex-shrink-0" />
                )}
            </div>
        ))}
        {itemsToRender.length === 0 && (
            <div className="text-center py-10 text-gray-500 flex flex-col items-center">
                <p>{emptyMessage}</p>
            </div>
        )}
    </div>
  );

  const CategoryScreen = () => {
    const categoryItems = items.filter(i => 
        i.categoryId === selectedCategory?.id && 
        (i.title.toLowerCase().includes(searchQuery.toLowerCase()) || i.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
      <div className="flex flex-col h-full bg-gray-50">
        <div className="p-4 bg-white border-b border-gray-200">
             <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input 
                    autoFocus
                    type="text"
                    placeholder={`Buscar em ${selectedCategory?.name}...`}
                    className="w-full pl-9 pr-4 py-2 bg-gray-100 border-none rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-army-500"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
             </div>
        </div>
        <ItemList itemsToRender={categoryItems} emptyMessage="Nenhum item encontrado nesta categoria." />
      </div>
    );
  };

  const FavoritesScreen = () => {
    const favoriteItems = items.filter(i => favorites.includes(i.id));

    return (
      <div className="flex flex-col h-full bg-gray-50">
        <ItemList itemsToRender={favoriteItems} emptyMessage="Você ainda não favoritou nenhum item." />
      </div>
    );
  };

  const SuggestionScreen = () => {
    const [sent, setSent] = useState(false);
    const [text, setText] = useState('');
    const [name, setName] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSent(true);
        // Reset after 3 seconds
        setTimeout(() => {
            setSent(false);
            setText('');
            setName('');
            setScreen('HOME');
        }, 3000);
    };

    if (sent) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-gray-50">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 animate-bounce">
                    <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Sugestão Enviada!</h3>
                <p className="text-gray-500">Obrigado por contribuir com o Bizus do Exército. Analisaremos sua sugestão em breve.</p>
            </div>
        );
    }

    return (
        <div className="p-6 h-full bg-gray-50 overflow-y-auto">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="text-center mb-6">
                    <div className="w-12 h-12 bg-army-50 rounded-full flex items-center justify-center mx-auto mb-3">
                        <MessageSquarePlus className="w-6 h-6 text-army-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800">Enviar Sugestão</h3>
                    <p className="text-sm text-gray-500">Encontrou um erro ou tem uma ideia de bizu? Envie para nós.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Seu Nome (Opcional)</label>
                        <input 
                            type="text" 
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-army-500"
                            placeholder="Recruta Zero"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>
                    
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Sua Sugestão</label>
                        <textarea 
                            required
                            rows={5}
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-army-500"
                            placeholder="Descreva sua sugestão, correção ou novo bizu..."
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                        />
                    </div>

                    <button 
                        type="submit" 
                        disabled={!text}
                        className="w-full py-3 bg-army-600 text-white font-bold rounded-lg shadow-md hover:bg-army-700 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Send className="w-4 h-4 mr-2" />
                        Enviar Colaboração
                    </button>
                </form>
                <p className="text-xs text-center text-gray-400 mt-4">
                    Sua sugestão será revisada pela administração antes de ser publicada.
                </p>
            </div>
        </div>
    );
  };

  const DetailScreen = () => {
    if (!selectedItem) return null;

    const isDownloaded = downloadProgress[selectedItem.id] === 100;
    const progress = downloadProgress[selectedItem.id] || 0;
    const isFav = favorites.includes(selectedItem.id);

    return (
      <div className="p-4 flex flex-col items-center">
        {/* Favorite Action */}
        <div className="w-full flex justify-end mb-2">
            <button 
                onClick={() => toggleFavorite(selectedItem.id)}
                className="flex items-center space-x-1 text-sm font-medium focus:outline-none"
            >
                {isFav ? (
                    <>
                        <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                        <span className="text-yellow-600">Favoritado</span>
                    </>
                ) : (
                    <>
                        <Star className="w-6 h-6 text-gray-400" />
                        <span className="text-gray-500">Favoritar</span>
                    </>
                )}
            </button>
        </div>

        {/* Content Preview Mock */}
        <div className="w-full h-48 bg-gray-200 rounded-xl mb-6 flex items-center justify-center relative overflow-hidden shadow-inner">
            {selectedItem.type === ContentType.IMAGE && selectedItem.url ? (
                <img src={selectedItem.url} alt="" className="w-full h-full object-cover" />
            ) : (
                <div className="flex flex-col items-center text-gray-400">
                    {selectedItem.type === ContentType.AUDIO ? <Music className="w-16 h-16 mb-2" /> : <FileText className="w-16 h-16 mb-2" />}
                    <span className="text-sm font-medium uppercase tracking-widest">{selectedItem.type} Preview</span>
                </div>
            )}
        </div>

        <h2 className="text-xl font-bold text-center text-gray-900 mb-2">{selectedItem.title}</h2>
        <p className="text-sm text-center text-gray-500 mb-6 max-w-xs">{selectedItem.description}</p>

        {/* Action Area */}
        {selectedItem.type === ContentType.AUDIO ? (
            <div className="w-full bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6">
                <div className="flex items-center justify-center mb-6">
                    <button 
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="w-16 h-16 bg-army-600 rounded-full flex items-center justify-center text-white hover:bg-army-700 shadow-lg transform active:scale-95 transition-all"
                    >
                        {isPlaying ? <PauseCircle className="w-10 h-10" /> : <PlayCircle className="w-10 h-10 ml-1" />}
                    </button>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
                    <div className="bg-army-500 h-1.5 rounded-full transition-all duration-1000" style={{ width: isPlaying ? '60%' : '0%' }}></div>
                </div>
                <div className="flex justify-between text-xs text-gray-400 font-mono">
                    <span>{isPlaying ? '1:45' : '0:00'}</span>
                    <span>3:30</span>
                </div>
                {/* Mock Lyrics */}
                <div className="mt-6 border-t border-gray-100 pt-4">
                    <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Letra</h4>
                    <p className="text-sm text-gray-600 italic leading-relaxed text-center">
                        "Nós somos da Pátria a guarda,<br/>
                        Fiéis soldados,<br/>
                        Por ela amados..."
                    </p>
                </div>
            </div>
        ) : (
            <button className="w-full py-4 bg-army-600 text-white rounded-xl font-bold shadow-md hover:bg-army-700 flex items-center justify-center mb-6">
                <BookOpen className="w-5 h-5 mr-2" />
                {selectedItem.type === ContentType.PDF ? 'Ler Documento (PDF)' : 'Visualizar Imagem'}
            </button>
        )}

        {/* Download Section */}
        <div className="w-full bg-gray-50 p-4 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Disponibilidade Offline</span>
                {isDownloaded ? (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-bold">Baixado</span>
                ) : (
                    <span className="text-xs text-gray-400">{selectedItem.fileSize}</span>
                )}
            </div>
            
            {!isDownloaded && (
                <button 
                    onClick={() => simulateDownload(selectedItem.id)}
                    disabled={progress > 0}
                    className="w-full py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50"
                >
                    {progress > 0 && progress < 100 ? (
                        <div className="w-full h-5 bg-gray-200 rounded-full overflow-hidden relative">
                             <div className="bg-green-500 h-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                             <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-700">{progress}%</span>
                        </div>
                    ) : (
                        <>
                            <DownloadCloud className="w-4 h-4 mr-2" />
                            Baixar para Offline
                        </>
                    )}
                </button>
            )}
        </div>
      </div>
    );
  };

  // --- MOBILE FRAME MOCK ---
  return (
    <div className="min-h-screen bg-gray-200 flex items-center justify-center p-4">
        {/* Phone Case Mockup */}
        <div className="w-full max-w-sm h-[800px] bg-white rounded-[3rem] shadow-2xl border-[8px] border-gray-800 overflow-hidden relative flex flex-col">
            {/* Dynamic Content */}
            <Header 
                title={
                    screen === 'HOME' ? 'Bizus EB' : 
                    screen === 'CATEGORY' ? (selectedCategory?.name || 'Categoria') : 
                    screen === 'FAVORITES' ? 'Meus Favoritos' :
                    screen === 'SUGGESTION' ? 'Colaboração' :
                    'Detalhes'
                } 
                showBack={screen !== 'HOME'}
            />
            
            <div className="flex-1 overflow-y-auto scrollbar-hide bg-gray-50">
                {screen === 'HOME' && <HomeScreen />}
                {screen === 'CATEGORY' && <CategoryScreen />}
                {screen === 'FAVORITES' && <FavoritesScreen />}
                {screen === 'SUGGESTION' && <SuggestionScreen />}
                {screen === 'DETAIL' && <DetailScreen />}
            </div>

            {/* Bottom Tab Bar Mock */}
            {(screen === 'HOME' || screen === 'FAVORITES' || screen === 'SUGGESTION') && (
                <div className="bg-white border-t border-gray-200 h-16 flex items-center justify-around pb-2">
                    <button 
                        onClick={() => setScreen('HOME')}
                        className={`flex flex-col items-center ${screen === 'HOME' ? 'text-army-600' : 'text-gray-400'}`}
                    >
                        <Home className="w-6 h-6" />
                        <span className="text-[10px] font-medium">Início</span>
                    </button>
                    <button 
                        onClick={() => setScreen('FAVORITES')}
                        className={`flex flex-col items-center ${screen === 'FAVORITES' ? 'text-army-600' : 'text-gray-400'}`}
                    >
                        <Star className="w-6 h-6" />
                        <span className="text-[10px] font-medium">Favoritos</span>
                    </button>
                    <button 
                        onClick={() => setScreen('SUGGESTION')}
                        className={`flex flex-col items-center ${screen === 'SUGGESTION' ? 'text-army-600' : 'text-gray-400'}`}
                    >
                        <MessageSquarePlus className="w-6 h-6" />
                        <span className="text-[10px] font-medium">Sugestão</span>
                    </button>
                </div>
            )}
            
            {/* iOS Home Indicator */}
            <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gray-800 rounded-full opacity-20"></div>
        </div>
    </div>
  );
};