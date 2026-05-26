import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { createAvatar } from '@dicebear/core';
import { avataaars } from '@dicebear/collection';
import { X, Check, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';

export interface AvatarOptions {
  skinColor?: string[];
  top?: string[];
  hairColor?: string[];
  clothing?: string[];
  clothesColor?: string[];
  eyes?: string[];
  mouth?: string[];
  eyebrows?: string[];
}

interface AvatarCreatorProps {
  initialOptions?: AvatarOptions;
  onSave: (options: AvatarOptions, svg: string) => void;
  onClose: () => void;
}

const TABS = [
  { id: 'skin', icon: '👤' },
  { id: 'hair', icon: '💇' },
  { id: 'clothes', icon: '👕' },
  { id: 'eyes', icon: '👁️' },
  { id: 'mouth', icon: '👄' },
];

const PRESET_SKIN_COLORS = ['614335', 'd08b5b', 'ae5d29', 'edb98a', 'ffdbb4', 'fd9841', 'f8d25c'];
const PRESET_HAIR_STYLES = [
  'hat', 'hijab', 'turban', 'winterHat1', 'winterHat02', 'winterHat03', 'winterHat04', 
  'bob', 'bun', 'curly', 'curvy', 'dreads', 'frida', 'fro', 'froBand', 
  'longButNotTooLong', 'miaWallace', 'shavedSides', 'straight01', 'straight02', 
  'straightAndStrand', 'dreads01', 'dreads02', 'frizzle', 'shaggy', 'shaggyMullet', 
  'shortCurly', 'shortFlat', 'shortRound', 'shortWaved', 'sides', 'theCaesar', 
  'theCaesarAndSidePart', 'bigHair'
];
const PRESET_HAIR_COLORS = ['a55728', '2c1b18', 'b58143', 'd6b370', '724133', '4a312c', 'f59797', 'ecdcbf', 'c93305', 'e8e1e1'];
const PRESET_CLOTHES = ['blazerAndShirt', 'blazerAndSweater', 'collarAndSweater', 'graphicShirt', 'hoodie', 'overall', 'shirtCrewNeck', 'shirtScoopNeck', 'shirtVNeck'];
const PRESET_CLOTHES_COLORS = ['262e33', '65c9ff', '5199e4', '25557c', 'e6e6e6', '929598', '3c4f5c', 'b1e2ff', 'a7ffc4', 'ffafb9', 'ffffb1', 'ff488e', 'ff5c5c', 'ffffff'];
const PRESET_EYES = ['closed', 'cry', 'default', 'eyeRoll', 'happy', 'hearts', 'side', 'squint', 'surprised', 'winkWacky', 'wink', 'xDizzy'];
const PRESET_MOUTH = ['concerned', 'default', 'disbelief', 'eating', 'grimace', 'sad', 'screamOpen', 'serious', 'smile', 'tongue', 'twinkle', 'vomit'];

const PreviewOption = ({ optionKey, optionValue, isActive, onClick, currentOptions }: any) => {
  const svg = useMemo(() => {
    const base: any = {
      skinColor: ['ffdbb4'], // default pale skin
      top: ['noHair'], // falls back to bald which is perfect for eyes/mouth
      clothing: ['shirtScoopNeck'],
      clothesColor: ['e6e6e6'],
      eyes: ['default'],
      mouth: ['default'],
      eyebrows: ['default'],
      backgroundColor: ['transparent'],
    };

    if (optionKey === 'top') {
      base.top = [optionValue];
      base.hairColor = currentOptions.hairColor || ['2c1b18'];
    } else if (optionKey === 'clothing') {
      base.clothing = [optionValue];
      base.clothesColor = currentOptions.clothesColor || ['ff5c5c'];
    } else if (optionKey === 'eyes') {
      base.eyes = [optionValue];
    } else if (optionKey === 'mouth') {
      base.mouth = [optionValue];
    }

    return createAvatar(avataaars, base).toString();
  }, [optionKey, optionValue, currentOptions.hairColor, currentOptions.clothesColor]);

  return (
    <button
      onClick={onClick}
      className={`aspect-square rounded-xl border-[2px] transition-all flex items-center justify-center p-1 relative overflow-hidden ${
        isActive 
          ? 'bg-[#d9f4f1] border-[#3ed8c9] z-10 scale-105 shadow-sm' 
          : 'bg-[#e9e1f5] border-[#d3c5ed] hover:bg-white'
      }`}
    >
      <div 
        className="w-[120%] h-[120%] object-contain -mt-2"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    </button>
  );
};

export function AvatarCreator({ initialOptions, onSave, onClose }: AvatarCreatorProps) {
  const [activeTab, setActiveTab] = useState('skin');
  const [options, setOptions] = useState<AvatarOptions>(initialOptions || {
    skinColor: ['f8d25c'],
    top: ['dreads01'],
    hairColor: ['2c1b18'],
    clothing: ['hoodie'],
    clothesColor: ['ffc1b2'],
    eyes: ['squint'],
    mouth: ['smile'],
    eyebrows: ['default']
  });

  const avatar = useMemo(() => {
    return createAvatar(avataaars, {
      ...options,
      backgroundColor: ['transparent'],
    }).toString();
  }, [options]);

  const randomize = () => {
    setOptions({
      skinColor: [PRESET_SKIN_COLORS[Math.floor(Math.random() * PRESET_SKIN_COLORS.length)]],
      top: [PRESET_HAIR_STYLES[Math.floor(Math.random() * PRESET_HAIR_STYLES.length)]],
      hairColor: [PRESET_HAIR_COLORS[Math.floor(Math.random() * PRESET_HAIR_COLORS.length)]],
      clothing: [PRESET_CLOTHES[Math.floor(Math.random() * PRESET_CLOTHES.length)]],
      clothesColor: [PRESET_CLOTHES_COLORS[Math.floor(Math.random() * PRESET_CLOTHES_COLORS.length)]],
      eyes: [PRESET_EYES[Math.floor(Math.random() * PRESET_EYES.length)]],
      mouth: [PRESET_MOUTH[Math.floor(Math.random() * PRESET_MOUTH.length)]],
      eyebrows: ['default']
    });
  };

  const updateOption = (key: keyof AvatarOptions, value: string) => {
    setOptions(prev => ({ ...prev, [key]: [value] }));
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="bg-[#ede8f5] w-full max-w-[700px] max-h-[90vh] rounded-[32px] p-6 shadow-2xl relative flex flex-col">
        {/* Header */}
        <div className="flex justify-center items-center mb-6 relative">
          <h2 className="text-[#3a2c7a] text-[28px] font-black tracking-wide uppercase">Criar Avatar</h2>
          <button 
            onClick={onClose}
            className="absolute right-0 top-0 text-[#3a2c7a] hover:bg-black/10 rounded-full p-2 transition-colors"
          >
            <X size={32} strokeWidth={4} />
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-6 items-stretch flex-1 min-h-0 h-[380px]">
          {/* Preview Panel */}
          <div className="w-full md:w-[240px] flex flex-col items-center justify-center relative shrink-0">
            <div className="w-56 h-56 rounded-full bg-gradient-to-b from-[#f05cf0] to-[#f782f7] border-[6px] border-white shadow-[0_0_0_3px_#3a2c7a] relative p-1 flex items-center justify-center">
              <div 
                className="w-[120%] h-[120%] mt-8 object-contain drop-shadow-md"
                dangerouslySetInnerHTML={{ __html: avatar }}
              />
            </div>
            
            {/* Refresh Button Hexagon */}
            <button 
              onClick={randomize}
              className="absolute bottom-2 right-4 bg-[#3a2c7a] text-white w-14 h-14 rounded-2xl shadow-lg hover:scale-105 transition-transform border-[3px] border-white flex items-center justify-center rotate-[30deg] hover:rotate-[60deg] duration-300"
            >
              <RefreshCw size={28} strokeWidth={3} className="-rotate-[30deg]" />
            </button>
          </div>

          {/* Options Panel */}
          <div className="flex-1 w-full flex flex-col h-full bg-[#ede8f5]">
            {/* Tabs */}
            <div className="flex rounded-xl overflow-hidden border-[2px] border-[#3a2c7a] mb-4">
              {TABS.map(tab => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 py-3 text-2xl transition-colors border-r-[2px] border-[#3a2c7a] last:border-r-0 flex items-center justify-center ${
                      isActive 
                        ? 'bg-white text-[#3a2c7a]' 
                        : 'bg-[#cfc2e8] opacity-80 hover:bg-[#dcd1ef] text-[#3a2c7a]'
                    }`}
                  >
                    <span className={isActive ? 'opacity-100' : 'opacity-60 grayscale-[50%]'}>{tab.icon}</span>
                  </button>
                )
              })}
            </div>

            {/* Content grid */}
            <div className="flex-1 bg-white rounded-xl border-[2px] border-[#3a2c7a] shadow-inner min-h-0 relative overflow-hidden">
              <div className="h-full overflow-y-auto custom-scrollbar p-3">
                <div className="grid grid-cols-4 gap-2 content-start pb-4">
                  {activeTab === 'skin' && PRESET_SKIN_COLORS.map(color => (
                    <button
                      key={color}
                      onClick={() => updateOption('skinColor', color)}
                      className={`aspect-square rounded-xl border-[2px] shadow-sm transition-transform flex items-center justify-center ${
                        options.skinColor?.[0] === color ? 'bg-[#d9f4f1] border-[#3ed8c9] scale-105 z-10' : 'bg-[#e9e1f5] border-[#d3c5ed] hover:bg-white'
                      }`}
                    >
                       <div className="w-10 h-10 rounded-full border-2 border-black/10" style={{ backgroundColor: `#${color}` }} />
                    </button>
                  ))}

                  {activeTab === 'hair' && (
                    <>
                      <div className="col-span-4 flex items-center gap-2 mb-2 bg-[#f4f0fa] p-2 rounded-lg">
                        <span className="text-xs font-bold text-[#3a2c7a] uppercase tracking-wider">Cores:</span>
                        <div className="flex gap-2 flex-wrap flex-1">
                          {PRESET_HAIR_COLORS.map(color => (
                            <button
                              key={color}
                              onClick={() => updateOption('hairColor', color)}
                              className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${
                                options.hairColor?.[0] === color ? 'border-[#3a2c7a] scale-110 shadow-sm' : 'border-black/10'
                              }`}
                              style={{ backgroundColor: `#${color}` }}
                            />
                          ))}
                        </div>
                      </div>
                      {PRESET_HAIR_STYLES.map(style => (
                        <PreviewOption 
                          key={style}
                          optionKey="top"
                          optionValue={style}
                          currentOptions={options}
                          isActive={options.top?.[0] === style}
                          onClick={() => updateOption('top', style)}
                        />
                      ))}
                    </>
                  )}

                  {activeTab === 'clothes' && (
                    <>
                      <div className="col-span-4 flex items-center gap-2 mb-2 bg-[#f4f0fa] p-2 rounded-lg">
                        <span className="text-xs font-bold text-[#3a2c7a] uppercase tracking-wider">Cores:</span>
                        <div className="flex gap-2 flex-wrap flex-1">
                          {PRESET_CLOTHES_COLORS.map(color => (
                            <button
                              key={color}
                              onClick={() => updateOption('clothesColor', color)}
                              className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${
                                options.clothesColor?.[0] === color ? 'border-[#3a2c7a] scale-110 shadow-sm' : 'border-black/10'
                              }`}
                              style={{ backgroundColor: `#${color}` }}
                            />
                          ))}
                        </div>
                      </div>
                      {PRESET_CLOTHES.map(style => (
                        <PreviewOption 
                          key={style}
                          optionKey="clothing"
                          optionValue={style}
                          currentOptions={options}
                          isActive={options.clothing?.[0] === style}
                          onClick={() => updateOption('clothing', style)}
                        />
                      ))}
                    </>
                  )}

                  {activeTab === 'eyes' && PRESET_EYES.map(style => (
                     <PreviewOption 
                        key={style}
                        optionKey="eyes"
                        optionValue={style}
                        currentOptions={options}
                        isActive={options.eyes?.[0] === style}
                        onClick={() => updateOption('eyes', style)}
                      />
                  ))}

                  {activeTab === 'mouth' && PRESET_MOUTH.map(style => (
                     <PreviewOption 
                        key={style}
                        optionKey="mouth"
                        optionValue={style}
                        currentOptions={options}
                        isActive={options.mouth?.[0] === style}
                        onClick={() => updateOption('mouth', style)}
                      />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-center">
          <Button 
            onClick={() => onSave(options, createAvatar(avataaars, { ...options, backgroundColor: ['transparent'] }).toString())}
            className="bg-[#2e2366] hover:bg-[#1a143b] text-white px-16 py-6 rounded-3xl text-xl font-black flex items-center gap-2 shadow-lg transition-transform hover:scale-105"
          >
            <Check size={28} strokeWidth={4} />
            OK
          </Button>
        </div>
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f4f0fa;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #3a2c7a;
          border-radius: 4px;
        }
      `}</style>
    </div>,
    document.body
  );
}
