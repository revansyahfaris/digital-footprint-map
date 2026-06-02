import { Handle, Position } from '@xyflow/react';

// 1. Declare specific data types for node content
export type CustomNodeData = {
  label: string;
  risk?: 'HIGH' | 'MEDIUM' | 'LOW'; // Restrict risk values to these 3 options
  desc?: string;
  [key: string]: unknown;
}

// 2. Declare type for node component properties (props)
interface CustomNodeProps {
  data: CustomNodeData;
}

// 3. CORE NODE: Center Node (User Account)
export function CoreNode({ data }: CustomNodeProps) {
  return (
    <div className="bg-[#FF0000] text-white p-4 border-4 border-black shadow-[4px_4px_0_0_#000] font-black uppercase text-center min-w-[160px]">
      <div className="text-[10px] bg-black text-yellow-300 inline-block px-1 mb-1 font-mono tracking-widest">
        CORE_RADAR
      </div>
      <div className="text-base tracking-tight">{data.label}</div>
      <Handle type="source" position={Position.Bottom} className="!bg-black !w-3 !h-3 !border-2 !border-white" />
    </div>
  );
}

// 4. CATEGORY NODE: Level 1 Branch (Application Category)
export function CategoryNode({ data }: CustomNodeProps) {
  return (
    <div className="bg-yellow-300 text-black p-3 border-4 border-black shadow-[4px_4px_0_0_#000] font-black uppercase text-center min-w-[140px]">
      <Handle type="target" position={Position.Top} className="!bg-black !w-3 !h-3 !border-2 !border-white" />
      <div className="text-sm tracking-wide">{data.label}</div>
      <Handle type="source" position={Position.Bottom} className="!bg-black !w-3 !h-3 !border-2 !border-white" />
    </div>
  );
}

// 5. PLATFORM NODE: Leaf Branch (Platform Name & Risk Level)
export function PlatformNode({ data }: CustomNodeProps) {
  const riskClass = 
    data.risk === 'HIGH' ? 'bg-[#FF0000] text-white' : 
    data.risk === 'MEDIUM' ? 'bg-orange-400 text-black' : 
    'bg-green-400 text-black';

  return (
    <div className="bg-white text-black p-3 border-4 border-black shadow-[4px_4px_0_0_#000] font-bold uppercase min-w-[150px] relative text-left">
      <Handle type="target" position={Position.Top} className="!bg-black !w-3 !h-3 !border-2 !border-white" />
      <div className="text-[9px] opacity-50 font-mono tracking-wider">PLATFORM_FOUND</div>
      <div className="text-base font-black mb-1 tracking-tight">{data.label}</div>
      <div className={`text-[9px] font-black px-1.5 py-0.5 inline-block border-2 border-black ${riskClass}`}>
        {data.risk}_RISK
      </div>
    </div>
  );
}