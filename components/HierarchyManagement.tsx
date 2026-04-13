import React, { useState, useMemo } from 'react';
import { Icons } from '../constants';
import { TaxonomyNode, ExtendedTaxonomyItem, Competency } from '../types';

interface HierarchyManagementProps {
  taxonomyNodes: TaxonomyNode[];
  setTaxonomyNodes: React.Dispatch<React.SetStateAction<TaxonomyNode[]>>;
  skills: ExtendedTaxonomyItem[];
  competencies: Competency[];
}

const HierarchyManagement: React.FC<HierarchyManagementProps> = ({
  taxonomyNodes, setTaxonomyNodes, skills, competencies
}) => {
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'delete' | null>(null);
  const [currentNode, setCurrentNode] = useState<TaxonomyNode | null>(null);
  const [parentNodeId, setParentNodeId] = useState<string | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['root']));
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form States
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [errors, setErrors] = useState<{ name?: string; desc?: string }>({});

  // Toast State
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 5000);
  };

  const validate = () => {
    const newErrors: { name?: string; desc?: string } = {};
    
    if (!formName.trim()) {
      newErrors.name = "Title is required.";
    }
    
    if (!formDesc.trim()) {
      newErrors.desc = "Description is required.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleOpenAdd = (parentId: string) => {
    setModalMode('add');
    setParentNodeId(parentId);
    setCurrentNode(null);
    setFormName('');
    setFormDesc('');
    setErrors({});
  };

  const handleOpenEdit = (node: TaxonomyNode) => {
    if (node.id === 'root') {
      showToast("Cannot edit the root node.", "error");
      return;
    }
    setModalMode('edit');
    setCurrentNode(node);
    setFormName(node.name);
    setFormDesc(node.description);
    setErrors({});
  };

  const handleOpenDelete = (node: TaxonomyNode) => {
    if (node.id === 'root') {
      showToast("Cannot delete the root node.", "error");
      return;
    }
    // Check if node has children
    const hasChildren = taxonomyNodes.some(n => n.parentId === node.id);
    if (hasChildren) {
      showToast("Cannot delete node with children. Delete children first.", "error");
      return;
    }

    // Check if skills or competencies are mapped
    const mappedSkills = skills.filter(s => s.taxonomyNodeId === node.id);
    const mappedCompetencies = competencies.filter(c => c.taxonomyNodeId === node.id);
    
    if (mappedSkills.length > 0 || mappedCompetencies.length > 0) {
      showToast("Cannot delete node with mapped skills or competencies.", "error");
      return;
    }

    setModalMode('delete');
    setCurrentNode(node);
  };

  const handleSave = () => {
    if (!validate()) return;

    if (modalMode === 'add' && parentNodeId) {
      const newNode: TaxonomyNode = {
        id: Math.random().toString(36).substr(2, 9),
        name: formName.trim(),
        description: formDesc.trim(),
        parentId: parentNodeId
      };
      setTaxonomyNodes([...taxonomyNodes, newNode]);
      showToast("Node added successfully.");
    } else if (modalMode === 'edit' && currentNode) {
      setTaxonomyNodes(taxonomyNodes.map(n => n.id === currentNode.id ? { ...n, name: formName.trim(), description: formDesc.trim() } : n));
      showToast("Node updated successfully.");
    }

    setModalMode(null);
  };

  const handleDeleteConfirm = () => {
    if (currentNode) {
      setTaxonomyNodes(taxonomyNodes.filter(n => n.id !== currentNode.id));
      showToast("Node deleted successfully.");
      setModalMode(null);
    }
  };

  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const filteredNodes = useMemo(() => {
    if (!searchTerm.trim()) return taxonomyNodes;
    
    const term = searchTerm.toLowerCase();
    const matchingNodeIds = new Set<string>();
    
    // Find all nodes that match
    taxonomyNodes.forEach(node => {
      if (node.name.toLowerCase().includes(term) || node.description.toLowerCase().includes(term)) {
        matchingNodeIds.add(node.id);
        
        // Add all ancestors to ensure they are visible
        let parentId = node.parentId;
        while (parentId) {
          matchingNodeIds.add(parentId);
          const parent = taxonomyNodes.find(n => n.id === parentId);
          parentId = parent ? parent.parentId : null;
        }
      }
    });
    
    return taxonomyNodes.filter(node => matchingNodeIds.has(node.id));
  }, [taxonomyNodes, searchTerm]);

  const renderNode = (node: TaxonomyNode, depth: number = 0) => {
    const children = filteredNodes.filter(n => n.parentId === node.id);
    const mappedSkillsCount = skills.filter(s => s.taxonomyNodeId === node.id).length;
    const mappedCompetenciesCount = competencies.filter(c => c.taxonomyNodeId === node.id).length;
    const isRoot = node.id === 'root';
    const isExpanded = expandedNodes.has(node.id);

    return (
      <div key={node.id} className="space-y-2">
        <div className={`flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all group ml-${depth * 8}`}>
          <div className="flex items-center space-x-4">
            {children.length > 0 ? (
              <button 
                onClick={() => toggleNode(node.id)}
                className="p-1 hover:bg-gray-100 rounded-md transition-colors text-gray-400"
              >
                {isExpanded ? <Icons.ChevronDown /> : <Icons.ChevronRight />}
              </button>
            ) : (
              <div className="w-7"></div> // Spacer for alignment
            )}
            <div className={`p-2 ${isRoot ? 'bg-indigo-50 text-indigo-600' : 'bg-blue-50 text-blue-600'} rounded-lg`}>
              {isRoot ? <Icons.Home size={20} /> : <Icons.Folder />}
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-gray-900">
                {node.name}
                {isRoot && <span className="ml-2 text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full uppercase tracking-wider">System Root</span>}
              </h4>
              <p className="text-xs text-gray-500 font-medium">{node.description}</p>
              <div className="flex space-x-2 mt-1">
                {mappedSkillsCount > 0 && (
                  <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-bold">
                    {mappedSkillsCount} Skills
                  </span>
                )}
                {mappedCompetenciesCount > 0 && (
                  <span className="text-[10px] bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full font-bold">
                    {mappedCompetenciesCount} Competencies
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={() => handleOpenAdd(node.id)}
              className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-full transition"
              title="Add Child"
            >
              <Icons.Plus size={16} />
            </button>
            {!isRoot && (
              <>
                <button 
                  onClick={() => handleOpenEdit(node)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition"
                  title="Edit"
                >
                  <Icons.Edit size={16} />
                </button>
                <button 
                  onClick={() => handleOpenDelete(node)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-full transition"
                  title="Delete"
                >
                  <Icons.Delete size={16} />
                </button>
              </>
            )}
          </div>
        </div>
        {isExpanded && children.length > 0 && (
          <div className="pl-8 border-l-2 border-gray-100 ml-10 space-y-2">
            {children.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const rootNode = taxonomyNodes.find(n => n.id === 'root');

  return (
    <div className="p-8 space-y-8 animate-fadeIn min-h-full bg-[#f8fafc]">
      <header className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900">Hierarchy Management</h2>
          <p className="text-gray-600 text-sm font-medium mt-1">Manage hierarchical structure for skills and competencies</p>
        </div>
        <div className="relative w-72">
          <input 
            type="text" 
            placeholder="Search hierarchy..." 
            className="w-full px-5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-blue-50 transition-all shadow-sm"
            value={searchTerm}
            onChange={e => {
              setSearchTerm(e.target.value);
              // Auto-expand all nodes when searching
              if (e.target.value.trim()) {
                setExpandedNodes(new Set(taxonomyNodes.map(n => n.id)));
              } else {
                setExpandedNodes(new Set(['root']));
              }
            }}
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
            <Icons.Search size={18} />
          </div>
        </div>
      </header>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
        {!rootNode ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 text-red-300">
              <Icons.AlertCircle size={40} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">System Root Missing</h3>
            <p className="text-gray-500 max-w-xs mx-auto">The pre-defined taxonomy root is missing. Please contact support.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {renderNode(rootNode)}
          </div>
        )}
      </div>

      {/* Modal */}
      {(modalMode === 'add' || modalMode === 'edit') && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setModalMode(null)}></div>
          <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg animate-scaleIn overflow-hidden">
            <div className="p-10">
              <h3 className="text-2xl font-extrabold text-gray-900 mb-2">
                {modalMode === 'add' ? 'Add Hierarchy Node' : 'Edit Hierarchy Node'}
              </h3>
              <p className="text-gray-500 text-sm font-medium mb-8">
                {parentNodeId ? 'Adding a child node to the hierarchy' : 'Defining a new root node'}
              </p>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">Title *</label>
                  <input 
                    type="text" 
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    className={`w-full px-4 py-3.5 bg-white text-black border-2 rounded-xl outline-none focus:ring-4 transition-all duration-200 ${errors.name ? 'border-red-400 ring-red-50' : 'border-gray-100 focus:ring-blue-50 focus:border-blue-500'}`}
                    placeholder="e.g. Technical Skills"
                  />
                  {errors.name && <p className="mt-2 text-xs text-red-500 font-semibold">{errors.name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">Description *</label>
                  <textarea 
                    rows={4}
                    value={formDesc}
                    onChange={e => setFormDesc(e.target.value)}
                    className={`w-full px-4 py-3.5 bg-white text-black border-2 rounded-xl outline-none focus:ring-4 transition-all duration-200 ${errors.desc ? 'border-red-400 ring-red-50' : 'border-gray-100 focus:ring-blue-50 focus:border-blue-500'}`}
                    placeholder="Describe the purpose of this node..."
                  />
                  {errors.desc && <p className="mt-2 text-xs text-red-500 font-semibold">{errors.desc}</p>}
                </div>
              </div>

              <div className="flex justify-end items-center space-x-4 mt-10">
                <button onClick={() => setModalMode(null)} className="px-8 py-3 rounded-full text-sm font-bold text-blue-900 border border-blue-900 hover:bg-gray-50 transition duration-200">Cancel</button>
                <button onClick={handleSave} className="px-10 py-3 bg-[#1e3a8a] text-white rounded-full text-sm font-bold hover:bg-blue-900 transition-all shadow-xl active:scale-95">
                  {modalMode === 'add' ? 'Add Node' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {modalMode === 'delete' && currentNode && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setModalMode(null)}></div>
          <div className="relative bg-white rounded-[1.5rem] shadow-2xl w-full max-w-md animate-scaleIn">
            <div className="p-10 text-center">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 text-red-600">
                <Icons.Delete />
              </div>
              <h3 className="text-2xl font-extrabold text-gray-900 mb-3">Delete Hierarchy Node?</h3>
              <p className="text-gray-500 text-[15px] leading-relaxed font-medium">
                Are you sure you want to delete <span className="text-gray-900 font-bold">"{currentNode.name}"</span>? This action is permanent.
              </p>
              
              <div className="flex justify-center items-center space-x-4 mt-10">
                <button onClick={() => setModalMode(null)} className="px-8 py-2.5 rounded-lg text-sm font-bold text-blue-900 border border-blue-900 hover:bg-gray-100 transition duration-200">Cancel</button>
                <button onClick={handleDeleteConfirm} className="px-8 py-2.5 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 transition duration-200 shadow-xl">Confirm Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast.show && (
        <div className="fixed bottom-12 left-12 z-[300] animate-slideInRight">
          <div className={`${toast.type === 'success' ? 'bg-[#eefcf4] border-green-500' : 'bg-[#fff1f1] border-red-500'} border-l-4 p-6 rounded-xl shadow-2xl flex items-start space-x-5 min-w-[400px]`}>
            <div className={`flex-shrink-0 ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'} rounded-full p-2.5`}>
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d={toast.type === 'success' ? "M5 13l4 4L19 7" : "M6 18L18 6M6 6l12 12"} /></svg>
            </div>
            <div className="flex-1">
              <h4 className={`text-xl font-bold ${toast.type === 'success' ? 'text-green-600' : 'text-red-600'} mb-1`}>{toast.type === 'success' ? 'Success' : 'Error'}</h4>
              <p className={`${toast.type === 'success' ? 'text-green-500' : 'text-red-500'} text-[15px] font-medium leading-snug`}>{toast.message}</p>
            </div>
            <button onClick={() => setToast({ show: false, message: '', type: 'success' })} className="text-gray-400 hover:text-gray-600 p-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes slideInRight { from { transform: translateX(-40px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out; }
        .animate-scaleIn { animation: scaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-slideInRight { animation: slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
      `}</style>
    </div>
  );
};

export default HierarchyManagement;
