import { Handle, Position } from '@xyflow/react';

type NodeData = {
  label: string;
  gender: 'male' | 'female';
};

interface CustomNodeProps {
  data: NodeData;
}

export function CustomNode({ data }: CustomNodeProps) {
  const nodeColor = data.gender === 'male' ? '#3b82f6' : '#ec4899'; // blue for male, pink for female
  
  return (
    <div 
      className="px-4 py-2 shadow-md rounded-md border-2 min-w-[120px]"
      style={{ 
        backgroundColor: nodeColor,
        borderColor: nodeColor,
        color: 'white'
      }}
    >
      <Handle type="target" position={Position.Top} />
      <div className="text-center font-medium">
        {data.label}
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
