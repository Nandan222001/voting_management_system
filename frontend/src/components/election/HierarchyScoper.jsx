import React, { useState, useEffect } from 'react';
import { FaChevronRight, FaCheck, FaMapMarkerAlt, FaUsers, FaLandmark, FaLayerGroup, FaArrowDown } from 'react-icons/fa';
import FancySelect from '../common/FancySelect';

const LEVELS = [
  { id: 'working', title: 'Working Committee', subtitle: 'Apex Body (National)', icon: FaLandmark, color: 'primary' },
  { id: 'pradesh', title: 'Pradesh Committee', subtitle: 'State Level', icon: FaLayerGroup, color: 'blue' },
  { id: 'district', title: 'District Committee', subtitle: 'District Level', icon: FaMapMarkerAlt, color: 'blue' },
  { id: 'block', title: 'Block Committee', subtitle: 'Block / Taluka / City', icon: FaUsers, color: 'blue' },
];

export default function HierarchyScoper({ targets = [], value, onChange }) {
  const [selectedState, setSelectedState] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedBlock, setSelectedBlock] = useState('');

  // Sync state with incoming value (for initial load and editing)
  useEffect(() => {
    if (value && targets.length > 0) {
      const current = targets.find(t => String(t.id) === String(value));
      if (!current) return;

      if (current.type === 'state') {
        setSelectedState(String(current.id));
        setSelectedDistrict('');
        setSelectedBlock('');
      } else if (current.type === 'district') {
        setSelectedDistrict(String(current.id));
        setSelectedState(String(current.parent_id));
        setSelectedBlock('');
      } else if (['taluka', 'city', 'village'].includes(current.type)) {
        setSelectedBlock(String(current.id));
        const district = targets.find(t => String(t.id) === String(current.parent_id));
        if (district) {
          setSelectedDistrict(String(district.id));
          setSelectedState(String(district.parent_id));
        }
      }
    } else if (!value) {
        // Handle Apex/Global
        setSelectedState('');
        setSelectedDistrict('');
        setSelectedBlock('');
    }
  }, [value, targets]);

  const states = targets.filter(t => t.type === 'state');
  const districts = targets.filter(t => t.type === 'district' && String(t.parent_id) === selectedState);
  const blocks = targets.filter(t => ['taluka', 'city', 'village', 'other'].includes(t.type) && String(t.parent_id) === selectedDistrict);

  const handleStateChange = (id) => {
    setSelectedState(id);
    setSelectedDistrict('');
    setSelectedBlock('');
    onChange(id || null);
  };

  const handleDistrictChange = (id) => {
    setSelectedDistrict(id);
    setSelectedBlock('');
    onChange(id || selectedState || null);
  };

  const handleBlockChange = (id) => {
    setSelectedBlock(id);
    onChange(id || selectedDistrict || selectedState || null);
  };

  const handleApexSelect = () => {
    setSelectedState('');
    setSelectedDistrict('');
    setSelectedBlock('');
    onChange(null);
  };

  const getCurrentLevel = () => {
      if (selectedBlock) return 'block';
      if (selectedDistrict) return 'district';
      if (selectedState) return 'pradesh';
      return 'working';
  };

  const currentLevelId = getCurrentLevel();

  return (
    <div className="py-2">
      <div className="space-y-4">
        {LEVELS.map((level, index) => {
          const isActive = currentLevelId === level.id;
          const isCompleted = index < LEVELS.findIndex(l => l.id === currentLevelId);
          const isDisabled = 
              (level.id === 'district' && !selectedState) || 
              (level.id === 'block' && !selectedDistrict);

          return (
            <div key={level.id} className="relative">
              {/* Vertical Line */}
              {index < LEVELS.length - 1 && (
                <div className="absolute left-7 top-14 bottom-[-16px] w-0.5 bg-gray-200 z-0" />
              )}

              <div 
                className={`relative z-10 w-full bg-white border-2 rounded-2xl p-4 transition-all duration-300 ${
                  isActive 
                    ? 'border-[#0051D5] shadow-md shadow-[#e6edfb] ring-4 ring-[#e6edfb]' 
                    : isCompleted ? 'border-green-200 bg-green-50/20' : 'border-gray-100 opacity-60'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                      isActive ? 'bg-[#0051D5] text-white' : isCompleted ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {isCompleted ? <FaCheck className="text-sm" /> : <level.icon />}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                        <h4 className={`text-sm font-bold truncate ${isActive ? 'text-gray-900' : 'text-gray-700'}`}>
                        {level.title}
                        </h4>
                        {isCompleted && (
                            <span className="text-[10px] font-bold text-green-600 uppercase bg-green-100 px-1.5 py-0.5 rounded">Scope Defined</span>
                        )}
                    </div>
                    <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-3">
                      {level.subtitle}
                    </p>

                    <div className="mt-1">
                        {level.id === 'working' && (
                            <button 
                                type="button"
                                onClick={handleApexSelect}
                                className={`w-full py-2 px-3 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-2 ${
                                    isActive 
                                    ? 'bg-gray-100 border-gray-200 text-gray-900' 
                                    : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                                }`}
                            >
                                { isActive ? <><FaCheck className="text-[10px]" /> Selected as Apex Scope</> : 'Select National Scope' }
                            </button>
                        )}

                        {level.id === 'pradesh' && (
                          <FancySelect
                            value={selectedState}
                            onChange={(e) => handleStateChange(e.target.value)}
                            placeholder="Select State"
                            options={states.map(s => ({ value: s.id, label: s.name }))}
                            className="text-xs"
                          />
                        )}

                        {level.id === 'district' && (
                          <FancySelect
                            value={selectedDistrict}
                            onChange={(e) => handleDistrictChange(e.target.value)}
                            placeholder="Select District"
                            disabled={isDisabled}
                            options={districts.map(d => ({ value: d.id, label: d.name }))}
                          />
                        )}

                        {level.id === 'block' && (
                          <FancySelect
                            value={selectedBlock}
                            onChange={(e) => handleBlockChange(e.target.value)}
                            placeholder="Select Block / Taluka"
                            disabled={isDisabled}
                            options={blocks.map(b => ({ value: b.id, label: b.name }))}
                          />
                        )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
