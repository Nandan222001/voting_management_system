import React, { useState } from 'react';
import { 
  ChevronRight, 
  ChevronDown, 
  Edit3, 
  Trash2, 
  User, 
  MapPin, 
  Layers, 
  Globe, 
  Users, 
  Hash,
  Shield,
  Building2,
  MoreVertical
} from 'lucide-react';

const COMMITTEE_TYPE_CONFIG = {
  country: { 
    label: 'Working Committee', 
    icon: Globe, 
    bgColor: 'bg-indigo-50', 
    textColor: 'text-indigo-700', 
    borderColor: 'border-indigo-100',
    iconColor: 'text-indigo-600'
  },
  state: { 
    label: 'Pradesh Committee', 
    icon: MapPin, 
    bgColor: 'bg-blue-50', 
    textColor: 'text-blue-700', 
    borderColor: 'border-blue-100',
    iconColor: 'text-blue-600'
  },
  district: { 
    label: 'District Committee', 
    icon: Layers, 
    bgColor: 'bg-emerald-50', 
    textColor: 'text-emerald-700', 
    borderColor: 'border-emerald-100',
    iconColor: 'text-emerald-600'
  },
  block: { 
    label: 'Block Committee', 
    icon: Users, 
    bgColor: 'bg-amber-50', 
    textColor: 'text-amber-700', 
    borderColor: 'border-amber-100',
    iconColor: 'text-amber-600'
  },
  booth: { 
    label: 'Booth Committee', 
    icon: Hash, 
    bgColor: 'bg-rose-50', 
    textColor: 'text-rose-700', 
    borderColor: 'border-rose-100',
    iconColor: 'text-rose-600'
  },
  default: {
    label: 'Committee',
    icon: Shield,
    bgColor: 'bg-gray-50',
    textColor: 'text-gray-700',
    borderColor: 'border-gray-100',
    iconColor: 'text-gray-600'
  }
};

const TreeNode = ({ node, childrenMap, onEdit, onDelete, level = 0 }) => {
  const [isExpanded, setIsExpanded] = useState(level < 1);
  const children = childrenMap[node.id] || [];
  const hasChildren = children.length > 0;
  
  const config = COMMITTEE_TYPE_CONFIG[node.type] || COMMITTEE_TYPE_CONFIG.default;
  const Icon = config.icon;

  const toggleExpand = (e) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="mb-2">
      <div 
        className={`group flex items-center justify-between p-3 rounded-2xl border transition-all duration-200 cursor-pointer shadow-sm
          ${isExpanded && hasChildren ? 'bg-white border-gray-200 ring-1 ring-gray-100' : 'bg-white border-gray-100 hover:border-gray-300 hover:shadow-md'}
        `}
        onClick={hasChildren ? toggleExpand : undefined}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Expand Icon */}
          <div className="w-6 flex justify-center">
            {hasChildren ? (
              <button 
                onClick={toggleExpand}
                className={`p-1 rounded-md transition-colors ${isExpanded ? 'text-gray-900 bg-gray-100' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
              >
                {isExpanded ? <ChevronDown size={14} strokeWidth={3} /> : <ChevronRight size={14} strokeWidth={3} />}
              </button>
            ) : (
              <div className="w-1.5 h-1.5 rounded-full bg-gray-200 ml-1" />
            )}
          </div>

          {/* Committee Icon */}
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${config.bgColor} ${config.borderColor} shadow-sm group-hover:scale-105 transition-transform`}>
            <Icon size={18} className={config.iconColor} strokeWidth={2.5} />
          </div>

          {/* Details */}
          <div className="flex flex-col min-w-0">
            <h4 className="text-sm font-bold text-gray-900 truncate leading-tight tracking-tight">
              {node.name}
            </h4>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md ${config.bgColor} ${config.textColor}`}>
                {config.label}
              </span>
              {node.president && (
                <div className="flex items-center gap-1.5 text-gray-400">
                  <span className="text-gray-200 text-xs">•</span>
                  <div className="flex items-center gap-1">
                    <User size={10} className="text-indigo-500" />
                    <span className="text-[9px] font-bold text-gray-600 uppercase tracking-wider truncate max-w-[120px]">
                      {node.president.full_name}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={(e) => { e.stopPropagation(); onEdit(node); }}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
            title="Edit Unit"
          >
            <Edit3 size={14} />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(node); }}
            className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
            title="Delete Unit"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Children Section */}
      {isExpanded && hasChildren && (
        <div className="ml-6 mt-1.5 pl-4 border-l-2 border-dashed border-gray-100 space-y-1">
          {children.map(child => (
            <TreeNode 
              key={child.id} 
              node={child} 
              childrenMap={childrenMap} 
              onEdit={onEdit} 
              onDelete={onDelete} 
              level={level + 1} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

const OrganizationTree = ({ data, onEdit, onDelete, loading }) => {
  // Build a children map for efficient lookups
  const childrenMap = React.useMemo(() => {
    const map = {};
    data.forEach(item => {
      if (item.parent_id) {
        if (!map[item.parent_id]) map[item.parent_id] = [];
        map[item.parent_id].push(item);
      }
    });
    return map;
  }, [data]);

  // Root nodes are those without a parent_id
  const rootNodes = React.useMemo(() => {
    return data.filter(item => !item.parent_id);
  }, [data]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">Syncing Hierarchy...</p>
      </div>
    );
  }

  if (rootNodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-20 h-20 bg-white rounded-[2rem] shadow-sm border border-gray-100 flex items-center justify-center mb-6">
          <Building2 className="w-10 h-10 text-gray-200" />
        </div>
        <h3 className="text-gray-400 font-black uppercase tracking-[0.15em] text-sm">Empty Structure</h3>
        <p className="text-xs text-gray-400 mt-2 max-w-[200px] font-medium leading-relaxed">
          The organizational registry is empty. Add your first committee node to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1 py-2">
      {rootNodes.map(node => (
        <TreeNode 
          key={node.id} 
          node={node} 
          childrenMap={childrenMap} 
          onEdit={onEdit} 
          onDelete={onDelete} 
        />
      ))}
    </div>
  );
};

export default OrganizationTree;
